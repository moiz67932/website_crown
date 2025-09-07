import React from 'react'

interface Props { html?: string }

export default function AIDescription({ html }: Props) {
  if (!html) return null
  return (
    <section className="prose dark:prose-invert max-w-none">
      <h2 className="text-xl font-semibold mb-2">About This City</h2>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}
