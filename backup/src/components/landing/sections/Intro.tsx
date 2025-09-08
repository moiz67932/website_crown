interface Props { html?: string }

export default function Intro({ html }: Props) {
  if (!html) return null
  // Replace any direct CoreLogic / Trestle image URLs with proxied versions
  const proxiedHtml = html.replace(/src=("|')https?:\/\/(api-)?trestle\.corelogic\.com[^"']+("|')/gi, (match) => {
    const urlMatch = match.match(/src=("|')(.*?)("|')/i)
    if (!urlMatch) return match
    const original = urlMatch[2]
    const proxied = `/api/media?url=${encodeURIComponent(original)}`
    return `src="${proxied}"`
  })
  return (
    <section className="prose dark:prose-invert max-w-none mx-auto py-8">
      <h2 className="sr-only">Overview</h2>
      <div dangerouslySetInnerHTML={{ __html: proxiedHtml }} />
    </section>
  )
}
