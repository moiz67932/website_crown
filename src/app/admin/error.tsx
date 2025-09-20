'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="p-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-2">Something went wrong</h2>
        <pre className="text-xs text-red-600 whitespace-pre-wrap">{error.message}</pre>
        <button onClick={() => reset()} className="mt-3 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Try again</button>
      </div>
    </div>
  )
}
