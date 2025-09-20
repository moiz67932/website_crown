import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

import { buildCityContext, retrieveCityBlurbs } from '@/lib/blog/context';
import BLOG_PROMPT_VIA_FILE from '@/lib/blog-prompt';
import { interpolate } from '@/lib/string-utils';
import { getSupabase } from '@/lib/supabase';
import { attachImagesToPost } from '@/lib/unsplash';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const Payload = z.object({
  type: z.enum(['top10', 'moving', 'predictions', 'schools', 'why_demographic']),
  city: z.string(),
  county: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  nearby: z.array(z.string()).default([]),
  options: z.object({
    makeAB: z.boolean().default(true),
    linkPropertiesLimit: z.number().int().min(0).max(16).default(8),
    demographic: z.string().optional(),
  }).default({}),
});

// Relaxed raw schema (html OR content; faqs optional; jsonLd string or object)
const RawLlmResponse = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  h1: z.string().optional(),
  sections: z.array(
    z.object({
      heading: z.string().optional(),
      html: z.string().optional(),
      content: z.string().optional(),
    })
  ).optional(),
  faqs: z.array(
    z.object({
      q: z.string().optional(),
      a: z.string().optional(),
      question: z.string().optional(),
      answer: z.string().optional(),
    })
  ).optional(),
  cta: z.string().optional(),
  jsonLd: z.union([z.string(), z.record(z.any())]).optional(),
  titleVariantA: z.string().optional(),
  titleVariantB: z.string().optional(),
  title: z.string().optional(),
});

// Final strict schema after normalization
const LlmResponse = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  h1: z.string(),
  sections: z.array(z.object({ heading: z.string(), html: z.string() })).min(1),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })),
  cta: z.string(),
  jsonLd: z.string(),
  titleVariantA: z.string().optional(),
  titleVariantB: z.string().optional(),
});

function normalize(raw: any) {
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  const normSections = sections
    .map((s: any, i: number) => ({
      heading: s.heading || s.title || `Section ${i + 1}`,
      html: (s.html || s.content || '').trim(),
    }))
    .filter((s: any) => s.html);

  const faqsSrc = Array.isArray(raw.faqs) ? raw.faqs : [];
  const faqs = faqsSrc
    .map((f: any) => ({ q: f.q || f.question, a: f.a || f.answer }))
    .filter((f: any) => f.q && f.a)
    .slice(0, 10);

  let jsonLd = raw.jsonLd;
  if (jsonLd && typeof jsonLd === 'object') {
    try {
      jsonLd = JSON.stringify(jsonLd);
    } catch {
      jsonLd = '{}';
    }
  }
  if (!jsonLd) jsonLd = '{}';

  // Simple CTA fallback
  const cta = raw.cta || 'Contact us to explore properties in this area today.';

  return {
    metaTitle: raw.metaTitle || raw.title || (raw.h1 ? `${raw.h1} | Crown Coastal Homes` : 'Untitled Post'),
    metaDescription: raw.metaDescription || 'Learn more about this area.',
    h1: raw.h1 || raw.title || 'Untitled',
    sections: normSections.length ? normSections : [{ heading: 'Overview', html: '<p>Content coming soon.</p>' }],
    faqs,
    cta,
    jsonLd: typeof jsonLd === 'string' ? jsonLd : '{}',
    titleVariantA: raw.titleVariantA,
    titleVariantB: raw.titleVariantB,
  };
}

export async function POST(req: NextRequest) {
  const supa = getSupabase();
  if (!supa) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });

  try {
    const bodyText = await req.text();
    let body: any;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const input = Payload.parse(body);

    // Optional: local context retrieval
    const ctx = await buildCityContext(input.city);
    const enableVector = process.env.ENABLE_VECTOR_CONTEXT === 'true';
    let blurbs: any[] = [];
    if (enableVector) {
      try {
        blurbs = (await retrieveCityBlurbs(input.city, 12)) as any[];
      } catch (e: any) {
        console.warn('[generate] retrieveCityBlurbs error fallback empty:', e?.message || e);
      }
    }

    // Build prompts
    const system = "You are a helpful blog post generator. Follow the template strictly.";
    const user = interpolate(BLOG_PROMPT_VIA_FILE(), {
      topic: input.type,
      city: input.city,
      county: input.county || '',
      region: input.region || '',
      nearbyCities: (input.nearby || []).join(', '),
      audience: 'home buyers',
      focusKeywords: [],
      brand: process.env.BRAND_NAME || 'Crown Coastal Homes',
      agent: process.env.BRAND_AGENT || 'Reza Barghlameno',
      // extra vars – safe if template ignores them
      contextNeighborhoods: JSON.stringify(ctx.neighborhoods || []),
      contextPropertyTypes: JSON.stringify(ctx.property_types || []),
      contextExamples: JSON.stringify(ctx.example_listings || []),
      retrievedBlurbs: JSON.stringify(blurbs || []),
    });

    const res = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    let rawFirst: any = {};
    try {
      rawFirst = RawLlmResponse.parse(JSON.parse(res.choices[0].message.content ?? '{}'));
    } catch (e: any) {
      console.warn('[generate] raw parse failed, will attempt fix:', e.message);
    }

    let normalized = normalize(rawFirst);
    let validated = LlmResponse.safeParse(normalized);

    if (!validated.success) {
      const errMsg = validated.error.message.slice(0, 800);
      const fix = await openai.chat.completions.create({
        model: process.env.LLM_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
          { role: 'user', content: `The previous output did not meet schema. Issues: ${errMsg}. Return fully corrected JSON with only the required fields.` },
        ],
      });

      let rawFix: any = {};
      try {
        rawFix = RawLlmResponse.parse(JSON.parse(fix.choices[0].message.content ?? '{}'));
      } catch {
        console.warn('[generate] fix raw parse still failed, using original normalization fallback.');
      }
      normalized = normalize(rawFix);
      validated = LlmResponse.safeParse(normalized);

      if (!validated.success) {
        return NextResponse.json(
          { ok: false, error: 'Model output invalid after retry', details: validated.error.issues.slice(0, 5) },
          { status: 400 }
        );
      }
    }

    return await persistPost(supa, input, validated.data);
  } catch (e: any) {
    console.error('[generate] error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

async function persistPost(supa: any, input: z.infer<typeof Payload>, out: z.infer<typeof LlmResponse>) {
  const baseMd = serializeSectionsToMarkdown(out.sections);

  const { data: post, error } = await supa
    .from('posts')
    .insert({
      slug: slugify(out.h1),
      status: 'draft',
      city: input.city,
      title_primary: out.h1,
      meta_description: out.metaDescription,
      content_md: appendJsonLd(out.jsonLd, baseMd),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (input.options.makeAB && out.titleVariantA && out.titleVariantB) {
    await supa.from('post_title_variants').insert([
      { post_id: post.id, label: 'A', title: out.titleVariantA },
      { post_id: post.id, label: 'B', title: out.titleVariantB },
    ]);
  }

  if (input.options.linkPropertiesLimit! > 0) {
    const { data: props } = await supa.from('properties').select('id').eq('city', input.city).limit(input.options.linkPropertiesLimit!);
    const links = (props ?? []).map((p: any) => ({ post_id: post.id, property_id: p.id }));
    if (links.length) await supa.from('post_properties').insert(links);
  }

  // Best-effort Unsplash hero/inline images using model prompts if present
  try {
    const heroPrompt = (out as any).heroImagePrompt || null;
    const imagePrompts = (out as any).imagePrompts || null;
    attachImagesToPost(supa, post.id, heroPrompt, imagePrompts).catch((e) => console.warn('[generate] attachImagesToPost failed', e));
  } catch (e) {
    console.warn('[generate] attachImagesToPost sync error', e);
  }

  return NextResponse.json({ ok: true, postId: post.id, slug: post.slug });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function serializeSectionsToMarkdown(sections: { heading: string; html: string }[]) {
  return sections.map((s) => `## ${s.heading}\n\n${s.html}`).join('\n\n');
}
function appendJsonLd(jsonLd: string, md: string) {
  return `${md}\n\n<script type="application/ld+json">${jsonLd}</script>`;
}
