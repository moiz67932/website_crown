// src/components/admin/ChartCard.tsx
export default function ChartCard({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {actions || null}
      </div>
      <div className="min-h-[180px]">{children}</div>
    </section>
  )
}
