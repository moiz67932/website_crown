import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice, formatPriceWithCommas } from '@/lib/utils';
import { LandingStats } from '@/types/landing';

interface Props { stats?: LandingStats; }

const statMeta: Array<{ key: keyof LandingStats; label: string; format: (v: number) => string }> = [
  { key: 'medianPrice', label: 'Median Price', format: formatPriceWithCommas },
  { key: 'pricePerSqft', label: '$ / Sqft', format: (v) => `$${v.toLocaleString()}` },
  { key: 'daysOnMarket', label: 'Days on Market', format: (v) => `${v}` },
  { key: 'totalActive', label: 'Active Listings', format: (v) => `${v}` },
];

export default function StatsSection({ stats }: Props) {
  console.log('📊 [StatsSection] Received stats:', stats)
  if (!stats) {
    console.log('⚠️ [StatsSection] Stats is null/undefined - not rendering')
    return null
  }
  if (Object.keys(stats).length === 0) {
    console.log('⚠️ [StatsSection] Stats is empty object - not rendering')
    return null
  }
  console.log('✅ [StatsSection] Rendering with stats:', stats)
  return (
    <section className="pt-2">
      <h2 className="text-2xl font-bold mb-6 text-brand-midnightCove">Market Snapshot</h2>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {statMeta.map((m) => {
          const value = stats[m.key];
          return (
            <Card key={m.key} className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{m.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold tracking-tight text-brand-midnightCove">
                  {typeof value === 'number' ? m.format(value) : '—'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
