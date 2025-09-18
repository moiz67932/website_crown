// src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import { getBucket } from "@/lib/ab";
import { linkifyHtml } from "@/lib/linkify";
import FeaturedProperties from "@/components/blog/featured-properties";
import RelatedPosts from "@/components/blog/related-posts";
import Comments from "@/components/blog/comments";
import NewsletterInline from "@/components/blog/newsletter-inline";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = await params
  const supa = getSupabase()
  if (!supa) return {}
  const { data: post } = await supa
    .from('posts')
    .select('title_primary, meta_description, hero_image_url, slug')
    .ilike('slug', resolved.slug)
    .maybeSingle()
  if (!post) return {}
  const title = post.title_primary
  const description = (post.meta_description || '').slice(0, 160)
  const ogImages = post.hero_image_url ? [{ url: post.hero_image_url }] : undefined
  return {
    title,
    description,
    openGraph: { title, description, images: ogImages },
    alternates: { canonical: `/blog/${post.slug}` },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js (v15+) expects params to be a Promise in app router pages. Await it.
  const resolvedParams = await params

  const supa = getSupabase();
  if (!supa) {
    console.warn("[blog] getSupabase() returned null/undefined");
    notFound();
  }

  const bucket = getBucket();

  // Normalize slug (fix fancy dashes, trim, lowercase)
  const rawSlug = resolvedParams?.slug ?? "";
  const slug = decodeURIComponent(String(rawSlug))
    .trim()
    .replace(/\u2013|\u2014/g, "-")
    .toLowerCase();

  const baseSelect =
    "id, slug, title_primary, content_md, published_at, status, hero_image_url, city, meta_description";

  // Exact (case-insensitive) match
  let { data: post, error } = await supa
    .from("posts")
    .select(baseSelect)
    .ilike("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  // Fallback: partial match in case of stray characters
  if (!post) {
    const fb = await supa
      .from("posts")
      .select(baseSelect)
      .ilike("slug", `%${slug}%`)
      .eq("status", "published")
      .limit(1)
      .maybeSingle();
    post = fb.data || null;
    error = error ?? fb.error ?? null;
  }

  if (error) console.error("[blog] Supabase error:", error);
  if (!post) {
    console.warn("[blog] No post found for slug:", slug);
    notFound();
  }

  // Optional title variant by bucket
  const { data: variants } = await supa
    .from("post_title_variants")
    .select("label,title")
    .eq("post_id", post.id);
  const chosen = variants?.find((v: any) => v.label === bucket) || null;
  const titleVariant = chosen?.title || post.title_primary;
  const variantLabel: 'A'|'B' = (chosen?.label === 'A' || chosen?.label === 'B') ? chosen.label : 'A';

  // Derive a lede (prefer meta_description; else first sentence of content)
  const lede = deriveLede(post.meta_description, post.content_md);

  // Extract and remove JSON-LD from body
  const jsonLdMatch =
    post.content_md &&
    post.content_md.match(
      /<script type="application\/ld\+json">([\s\S]+?)<\/script>/
    );
  const jsonLd = jsonLdMatch ? jsonLdMatch[1] : null;
  const bodyMd = post.content_md
    ? post.content_md
        .replace(
          /<script type="application\/ld\+json">[\s\S]+?<\/script>/,
          ""
        )
        .trim()
    : "";

  let html = mdToHtml(bodyMd);

  // Track page view on server (include AB variant)
  try {
    const variant: 'A'|'B' = variantLabel
    await supa.from('page_views').insert({ post_id: post.id, path: `/blog/${post.slug}`, variant, referrer: null, ua: null })
  } catch (e) { console.warn('[blog] track view failed', e) }

  // Linkify and append further reading (we render RelatedPosts below visually too)
  html = linkifyHtml(html, post.city, [])

  // Fetch inline images
  const { data: postImages } = await supa
    .from("post_images")
    .select("url,prompt,position")
    .eq("post_id", post.id);

  const imagesByPosition: Record<string, any> = {};
  (postImages || []).forEach((pi: any) => {
    imagesByPosition[pi.position] = pi;
  });

  console.log("[blog] render slug =", post.slug, "id =", post.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Hero */}
      <header className="mb-8">
        {imagesByPosition["hero"]?.url || post.hero_image_url ? (
          <div className="relative w-full h-[60vh] sm:h-[60vh] rounded-lg overflow-hidden shadow-lg mb-6">
            <Image
              src={imagesByPosition["hero"]?.url || post.hero_image_url}
              alt={titleVariant}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-44 sm:h-64 rounded-lg bg-gradient-to-r from-sky-400 to-indigo-600 mb-6 flex items-center justify-center text-white text-2xl font-semibold">
            {post.city ? `${post.city} — ${titleVariant}` : titleVariant}
          </div>
        )}

        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-2">
            {titleVariant}
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            {formatDate(post.published_at)} • {post.city || "Crown Coastal Homes"}
          </p>
          {lede && <p className="text-lg text-slate-700 mb-6">{lede}</p>}
          {post.meta_description && (
            <p className="text-sm text-slate-500 mb-6">{post.meta_description}</p>
          )}
        </div>
      </header>

      <main className="prose prose-slate max-w-none dark:prose-invert">
        <article dangerouslySetInnerHTML={{ __html: html }} />

        {/* Inline images */}
        <div className="mt-8 space-y-10">
          {["inline_1", "inline_2", "inline_3", "inline_4"].map(
            (pos, idx) => {
              const img = imagesByPosition[pos];
              if (!img) return null;
              const flip = idx % 2 === 1;
              return (
                <div
                  key={pos}
                  className={`flex flex-col md:flex-row items-center ${
                    flip ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="md:w-1/2 md:pr-6">
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="rounded-lg shadow-lg w-full h-auto object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 prose prose-slate p-4">
                    <p className="text-base">
                      Suggested image: <strong>{img.prompt}</strong>
                    </p>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </main>

      {/* Featured listings */}
      <section className="mt-12">
        <FeaturedProperties postId={post.id} city={post.city} />
      </section>

      {/* Related Reading */}
      <section className="mt-12">
        <RelatedPosts postId={post.id} city={post.city} />
      </section>

      {/* Comments */}
      <section className="mt-12">
        <Comments slug={post.slug} />
      </section>

      {/* Newsletter */}
      <section className="mt-12">
        <NewsletterInline city={post.city} />
      </section>

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function deriveLede(meta: string | null, md: string | null | undefined) {
  if (meta && meta.trim()) return meta.trim();
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>\-!\[\]\(\)]/g, "");
  const para = text.split(/\n\s*\n/).map((s) => s.trim()).find(Boolean) || "";
  const sentence = (para.match(/.*?[.!?](\s|$)/) || [para])[0].trim();
  return sentence;
}

function mdToHtml(md: string) {
  if (!md) return "";
  let html = md;

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="rounded-lg shadow" />'
  );

  // Headings
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");

  // Bold / Italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-sky-600 hover:underline">$1</a>'
  );

  // Lists
  html = html.replace(/(^|\n)(?:- )((?:.*)(?:\n- .*)*)/g, (m, p1, p2) => {
    const items = p2
      .split(/\n- /)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((i: string) => `<li>${i}</li>`)
      .join("");
    return `${p1}<ul class="list-disc pl-6">${items}</ul>`;
  });

  // Paragraphs
  const parts = html.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  html = parts
    .map((part) => {
      if (/^<(h[1-6]|ul|ol|pre|blockquote|img)/i.test(part)) return part;
      return `<p>${part}</p>`;
    })
    .join("");

  return html;
}

function formatDate(d: string | null) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d as string;
  }
}
