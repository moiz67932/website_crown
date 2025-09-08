interface School { name: string; rating?: number; url?: string }
interface Props { schools?: School[] }

export default function SchoolsSection({ schools }: Props) {
  if (!schools || schools.length === 0) return null
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Schools</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map(s => (
          <li key={s.name} className="rounded-xl border p-4 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium block">{s.name}</span>
              {s.url && <a href={s.url} className="text-xs text-primary hover:underline">View</a>}
            </div>
            {typeof s.rating === 'number' && (
              <span className="text-xs font-semibold rounded-md bg-primary/10 text-primary px-2 py-1">{s.rating}/10</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
