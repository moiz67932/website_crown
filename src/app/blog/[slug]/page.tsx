// src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { headers } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { getBucket } from "@/lib/ab";
import { linkifyHtml } from "@/lib/linkify";
import FeaturedProperties from "../../../components/blog/featured-properties";
import RelatedPosts from "../../../components/blog/related-posts";
import Comments from "../../../components/blog/comments";
import NewsletterInline from "../../../components/blog/newsletter-inline";
import ShareBar from "../../../components/blog/share-bar";
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
  const { slug: rawSlug } = await params;
  const supa = getSupabase();
  if (!supa) notFound();

  const bucket = getBucket();
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

  // Lede (we show this, not the raw metaDescription line in body)
  const lede = deriveLede(post.meta_description, post.content_md);

  // Extract & strip JSON-LD from content
  const jsonLdMatch = post.content_md?.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
  const jsonLd = jsonLdMatch ? jsonLdMatch[1] : null;
  const bodyMdRaw = post.content_md
    ? post.content_md.replace(/<script type="application\/ld\+json">[\s\S]+?<\/script>/, "").trim()
    : "";

  // Sanitize model slips (e.g., "Meta description:")
  const bodyMd = sanitizeModelArtifacts(bodyMdRaw);

  // MD → HTML → linkify
  let html = mdToHtml(bodyMd);
  html = linkifyHtml(html, post.city, []);
  // Ensure a paragraph precedes any list that appears immediately after a subheading
  html = ensureParagraphBeforeList(html);

  // Ensure hero/inline images exist (idempotent)
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
      console.warn("[blog] attachImagesToPost failed (continuing):", e?.message ?? e);
    }
  }

  const { data: postImages } = await supa
    .from("post_images")
    .select("url,prompt,position")
    .eq("post_id", post.id);

  const imagesByPosition: Record<string, any> = {};
  (postImages || []).forEach((pi: any) => (imagesByPosition[pi.position] = pi));

  // Inject inline images into article HTML (shorter height)
  html = injectInlineImages(html, imagesByPosition);


  // Track page view (best-effort)
  try {
    const h = await headers();
    await supa.from("page_views").insert({
      post_id: post.id,
      path: `/blog/${post.slug}`,
      variant: variantLabel,
      referrer: h.get("referer")?.slice(0, 500) ?? null,
      ua: h.get("user-agent")?.slice(0, 500) ?? null,
    });
  } catch (e) {
    console.warn("[blog] track view failed", e);
  }

  // Absolute canonical URL for share links
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (!siteUrl) {
    try {
      const h = await headers();
      const host = h.get("x-forwarded-host") || h.get("host") || "";
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      if (host) siteUrl = `${proto}://${host}`;
    } catch {}
  }
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Hero */}
      <header className="mb-10">
        {imagesByPosition["hero"]?.url || post.hero_image_url ? (
          <div className="relative w-full h-[300px] sm:h-[360px] md:h-[420px] rounded-2xl overflow-hidden shadow-xl mb-6">
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
          <div className="flex items-center justify-between gap-3 text-sm text-slate-500 mb-4">
            <span>{formatDate(post.published_at)} • {post.city?.replace(/-/g, " ") || "Crown Coastal Homes"}</span>
            <ShareBar url={canonicalUrl} title={titleVariant} />
          </div>
          {lede && <p className="text-lg sm:text-xl text-slate-700">{lede}</p>}
          {/* intentionally NOT rendering post.meta_description in the UI */}
        </div>
      </header>

      {/* Body */}
      <main
        className="prose prose-lg md:prose-xl prose-slate max-w-none dark:prose-invert leading-relaxed
                   prose-headings:font-bold prose-h2:mt-12 prose-h2:mb-5 prose-h2:text-2xl md:prose-h2:text-3xl
                   prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-xl md:prose-h3:text-2xl
                   prose-p:my-6 md:prose-p:my-7 prose-ul:my-6 prose-ol:my-6 prose-li:my-1 prose-ul:pl-7 md:prose-ul:pl-8
                   prose-a:text-sky-600 prose-a:underline"
        >
        <article dangerouslySetInnerHTML={{ __html: html }} />
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

      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
    </div>
  );
}

/* ---------- helpers ---------- */

function sanitizeModelArtifacts(md: string) {
  // remove any stray "Meta description:" lines emitted in the body
  return md
    .split("\n")
    .filter((line) => !/^meta description\s*:/i.test(line.trim()))
    .join("\n");
}

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

  // images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="" class="rounded-xl shadow my-6 w-full h-auto object-cover" />'
  );
  // headings (tolerate leading spaces and add explicit weight/spacing)
  html = html.replace(/^\s*#\s+(.*)$/gm, '<h1 class="font-extrabold mt-10 mb-4 text-3xl md:text-4xl">$1</h1>');
  html = html.replace(/^\s*##\s+(.*)$/gm, '<h2 class="font-bold mt-12 mb-5 text-2xl md:text-3xl">$1</h2>');
  html = html.replace(/^\s*###\s+(.*)$/gm, '<h3 class="font-semibold mt-10 mb-4 text-xl md:text-2xl">$1</h3>');
  html = html.replace(/^\s*####\s+(.*)$/gm, '<h4 class="font-semibold mt-8 mb-3 text-lg md:text-xl">$1</h4>');
  // emphasis
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-sky-600 hover:underline">$1</a>');
  // lists (- )
  html = html.replace(/(^|\n)(?:- )((?:.*)(?:\n- .*)*)/g, (m, p1, p2) => {
    const items = p2.split(/\n- /).map((s: string) => s.trim()).filter(Boolean).map((i: string) => `<li>${i}</li>`).join("");
    return `${p1}<ul class="list-disc pl-7 ml-1 md:pl-8 md:ml-2">${items}</ul>`;
  });

  // paragraphs
  const parts = html.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  html = parts.map((part) => (/^<(h[1-6]|ul|ol|pre|blockquote|img|figure)/i.test(part) ? part : `<p>${part}</p>`)).join("");
  return html;
}

function extractH2sFromHtml(html: string) {
  const matches = Array.from(html.matchAll(/<h2>(.*?)<\/h2>/g));
  return matches.map((m) => m[1]).filter(Boolean);
}

function formatDate(d: string | null) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  } catch { return d as string; }
}

// If a list appears immediately after an H2/H3, ensure there's at least one brief paragraph
// This preserves the desired flow: heading → short intro paragraph → list
function ensureParagraphBeforeList(html: string) {
  // Pattern: </h2> or </h3> followed by optional whitespace and then a <ul>/<ol>
  const re = new RegExp('(</h2>|</h3>)\\s*(<(ul|ol)[^>]*>)', 'gi');
  return html.replace(re as any, (_m, closingH: string, listTag: string) => {
    return `${closingH}<p class="mt-3 mb-3"></p>${listTag}`;
  });
}

// Inject inline images after selected paragraph indexes; small height
function injectInlineImages(html: string, imagesByPosition: Record<string, any>) {
  const order = ["inline_1", "inline_2", "inline_3", "inline_4"];
  const urls: string[] = order.map((p) => imagesByPosition[p]?.url).filter(Boolean);
  if (!urls.length) return html;

  const targets = [2, 5, 8, 11]; // after these paragraph indices (1-based)
  let out = "";
  let last = 0;
  let pIdx = 0;
  let used = 0;
  const re = /<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    pIdx++;
    out += html.slice(last, m.index) + "</p>";
    last = m.index + 4;
    if (used < urls.length && pIdx === targets[used]) {
      const url = urls[used++];
      out += `<img src="${escapeAttr(url)}" alt="" class="rounded-xl shadow my-6 w-full h-56 md:h-64 object-cover" loading="lazy" />`;
    }
  }
  out += html.slice(last);

  // If any images remain, insert after h2s
  if (used < urls.length) {
    out = out.replace(/<\/h2>/g, (match) => {
      if (used >= urls.length) return match;
      const url = urls[used++];
      return `</h2><img src="${escapeAttr(url)}" alt="" class="rounded-xl shadow my-6 w-full h-56 md:h-64 object-cover" loading="lazy" />`;
    });
  }

  // If still remain, append at end
  while (used < urls.length) {
    const url = urls[used++];
    out += `<img src="${escapeAttr(url)}" alt="" class="rounded-xl shadow my-6 w-full h-56 md:h-64 object-cover" loading="lazy" />`;
  }
  return out;
}

function escapeAttr(str: string) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
