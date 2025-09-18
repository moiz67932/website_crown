// src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { getBucket } from "@/lib/ab";
import { linkifyHtml } from "@/lib/linkify";
import FeaturedProperties from "@/components/blog/featured-properties";
import RelatedPosts from "@/components/blog/related-posts";
import Comments from "@/components/blog/comments";
import NewsletterInline from "@/components/blog/newsletter-inline";
import { attachImagesToPost, deriveImagePromptsFromPost } from "@/lib/unsplash";
import type { ReactElement } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = await params;
  const supa = getSupabase();
  if (!supa) return {};
  const { data: post } = await supa
    .from("posts")
    .select("title_primary, meta_description, hero_image_url, slug")
    .ilike("slug", resolved.slug)
    .maybeSingle();
  if (!post) return {};
  const title = post.title_primary;
  const description = (post.meta_description || "").slice(0, 160);
  const ogImages = post.hero_image_url ? [{ url: post.hero_image_url }] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: ogImages },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }): Promise<ReactElement> {
  const resolvedParams = await params;

  const supa = getSupabase();
  if (!supa) notFound();

  const bucket = getBucket();

  // Normalize slug
  const rawSlug = resolvedParams?.slug ?? "";
  const slug = decodeURIComponent(String(rawSlug)).trim().replace(/\u2013|\u2014/g, "-").toLowerCase();

  const baseSelect =
    "id, slug, title_primary, content_md, published_at, status, hero_image_url, city, meta_description";

  let { data: post, error } = await supa
    .from("posts")
    .select(baseSelect)
    .ilike("slug", slug)
    .eq("status", "published")
    .maybeSingle();

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
  if (!post) notFound();

  // Title variant A/B
  const { data: variants } = await supa
    .from("post_title_variants")
    .select("label,title")
    .eq("post_id", post.id);
  const chosen = variants?.find((v: any) => v.label === bucket) || null;
  const titleVariant = chosen?.title || post.title_primary;
  const variantLabel: "A" | "B" = chosen?.label === "B" ? "B" : "A";

  // Lede from meta/first sentence
  const lede = deriveLede(post.meta_description, post.content_md);

  // Strip JSON-LD if present
  const jsonLdMatch =
    post.content_md &&
    post.content_md.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
  const jsonLd = jsonLdMatch ? jsonLdMatch[1] : null;
  const bodyMd = post.content_md
    ? post.content_md.replace(/<script type="application\/ld\+json">[\s\S]+?<\/script>/, "").trim()
    : "";

  // Convert MD → HTML then linkify
  let html = mdToHtml(bodyMd);
  html = linkifyHtml(html, post.city, []);

  // *** IMAGES: ensure hero + inline images exist (idempotent) ***
  const { data: existingImages } = await supa
    .from("post_images")
    .select("url,prompt,position")
    .eq("post_id", post.id);

  const positions = ["hero", "inline_1", "inline_2", "inline_3", "inline_4"] as const;
  const haveByPosition = new Set((existingImages || []).map((i: any) => i.position));
  if (post.hero_image_url) haveByPosition.add("hero");
  const missing = positions.filter((p) => !haveByPosition.has(p));

  const headings = extractH2sFromHtml(html);
  if (missing.length) {
    try {
      const { heroPrompt, imagePrompts } = deriveImagePromptsFromPost({
        city: post.city,
        title: titleVariant,
        headings,
      });
      await attachImagesToPost?.(supa, post.id, heroPrompt, imagePrompts || []);
    } catch (e: any) {
      console.warn('[blog] attachImagesToPost failed (continuing):', e?.message ?? e);
    }
  }

  // Re-read images after potential attachment
  const { data: postImages } = await supa
    .from("post_images")
    .select("url,prompt,position")
    .eq("post_id", post.id);

  const imagesByPosition: Record<string, any> = {};
  (postImages || []).forEach((pi: any) => {
    imagesByPosition[pi.position] = pi;
  });

  // Track page view with variant + referrer/ua
  try {
    const h = await headers();
    const referrer = h.get('referer') ?? null;
    const ua = h.get('user-agent') ?? null;
    await supa.from('page_views').insert({
      post_id: post.id,
      path: `/blog/${post.slug}`,
      variant: variantLabel,
      referrer: referrer?.slice(0, 500) ?? null,
      ua: ua?.slice(0, 500) ?? null,
    });
  } catch (e) {
    console.warn('[blog] track view failed', e);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Hero */}
      <header className="mb-10">
        {imagesByPosition["hero"]?.url || post.hero_image_url ? (
          <div className="relative w-full h-[44vh] sm:h-[56vh] rounded-2xl overflow-hidden shadow-xl mb-6">
            <Image
              src={imagesByPosition["hero"]?.url || post.hero_image_url || ""}
              alt={`${post.city?.replace(/-/g, " ")} hero image`}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-60 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 mb-6 flex items-center justify-center text-white text-2xl sm:text-3xl font-semibold">
            {post.city ? `${post.city.replace(/-/g, " ")} — ${titleVariant}` : titleVariant}
          </div>
        )}

        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-900 mb-3">
            {titleVariant}
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            {formatDate(post.published_at)} • {post.city?.replace(/-/g, " ") || "Crown Coastal Homes"}
          </p>
          {lede && <p className="text-lg sm:text-xl text-slate-700 mb-4">{lede}</p>}
          {post.meta_description && (
            <p className="text-sm text-slate-500">{post.meta_description}</p>
          )}
        </div>
      </header>

      <main className="prose prose-lg md:prose-xl prose-slate max-w-none dark:prose-invert leading-relaxed prose-headings:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl md:prose-h3:text-2xl prose-p:my-5 prose-a:text-sky-600 prose-a:underline">
        <article dangerouslySetInnerHTML={{ __html: html }} />

        {/* Inline images (balanced left/right) */}
        <div className="mt-10 space-y-12">
          {["inline_1", "inline_2", "inline_3", "inline_4"].map((pos, idx) => {
            const img = imagesByPosition[pos];
            if (!img) return null;
            const flip = idx % 2 === 1;
            return (
              <figure
                key={pos}
                className={`flex flex-col md:flex-row items-center ${flip ? "md:flex-row-reverse" : ""}`}
              >
                <div className="md:w-1/2 md:pr-6">
                  <img
                    src={img.url}
                    alt={img.prompt || `${post.city?.replace(/-/g, " ")} neighborhood`}
                    className="rounded-xl shadow-lg w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="md:w-1/2 prose prose-slate p-4 text-slate-600">
                  <em>{img.prompt}</em>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </main>

      {/* Featured listings */}
      <section className="mt-14">
        <FeaturedProperties postId={post.id} city={post.city} />
      </section>

      {/* Related reading */}
      <section className="mt-14">
        <RelatedPosts postId={post.id} city={post.city} />
      </section>

      {/* Comments */}
      <section className="mt-14">
        <Comments slug={post.slug} />
      </section>

      {/* Newsletter */}
      <section className="mt-14">
        <NewsletterInline city={post.city} />
      </section>

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function deriveLede(meta: string | null, md: string | null | undefined) {
  if (meta && meta.trim()) return meta.trim();
  if (!md) return "";
  const text = md.replace(/```[\s\S]*?```/g, "").replace(/[#*_>\-!\[\]\(\)]/g, "");
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
    '<img src="$2" alt="$1" class="rounded-xl shadow" />'
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
      if (/^<(h[1-6]|ul|ol|pre|blockquote|img|figure)/i.test(part)) return part;
      return `<p>${part}</p>`;
    })
    .join("");

  return html;
}

// Pull H2s for deriving image prompts
function extractH2sFromHtml(html: string) {
  const matches = Array.from(html.matchAll(/<h2>(.*?)<\/h2>/g));
  return matches.map((m) => m[1]).filter(Boolean);
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
