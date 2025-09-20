export function linkifyHtml(html: string, city?: string, related?: { title: string; slug: string }[]) {
  let out = html || ''
  if (city) {
    // Replace plain city phrases not already within anchors
    const pattern = new RegExp(`(>[^<]*?)\\b(${escapeRegExp(city)})\\b([^<]*?<)`, 'gi')
    out = out.replace(pattern, (m, p1, p2, p3) => `${p1}<a href="/buy?city=${encodeURIComponent(city)}" class="text-sky-600 hover:underline">${p2}</a>${p3}`)
  }

  if (related && related.length) {
    const items = related
      .slice(0, 3)
      .map(r => `<li><a href="/blog/${r.slug}" class="text-sky-600 hover:underline">${escapeHtml(r.title)}</a></li>`)
      .join('')
    const box = `
      <aside class="mt-10 border rounded-lg p-4 bg-slate-50">
        <div class="font-semibold mb-2">Further Reading</div>
        <ul class="list-disc pl-5 space-y-1 text-sm">${items}</ul>
      </aside>
    `
    out += box
  }
  return out
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}
