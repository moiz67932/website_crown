// src/lib/landing/parseSections.ts

export type ParsedSection = {
  index: number;
  heading: string;   // includes the <h2>
  content: string;   // everything under this section until next <h2>
};

export function parseIntoSections(html: string): ParsedSection[] {
  if (!html || typeof html !== "string") return [];

  // Normalize
  const clean = html.replace(/\n+/g, "\n").trim();

  // Force-split by <h2> because our new prompt ALWAYS generates <h2>
  const parts = clean.split(/<h2[^>]*>/i);

  const sections: ParsedSection[] = [];
  let index = 0;

  for (const part of parts) {
    if (!part.trim()) continue;

    // Extract heading text (until closing </h2>)
    const headingMatch = part.match(/^(.*?)<\/h2>/i);
    let heading = headingMatch ? `<h2>${headingMatch[1]}</h2>` : "";

    // Extract content after </h2>
    let content = part.replace(/.*?<\/h2>/i, "").trim();

    sections.push({
      index,
      heading,
      content,
    });

    index++;
  }

  return sections;
}

export function bodyHasH2(html?: string): boolean {
  if (!html) return false
  return /<h2[\s>]/i.test(html)
}
