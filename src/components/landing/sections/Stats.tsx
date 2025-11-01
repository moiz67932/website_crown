import { Card, CardContent } from '../../ui/card';
import { formatPrice, formatPriceWithCommas } from '../../../lib/utils';
import { LandingStats } from '../../../types/landing';
import { Home, Ruler, Timer, Building2 } from 'lucide-react'

interface Props { stats?: LandingStats; }

const statMeta: Array<{ key: keyof LandingStats; label: string; format: (v: number) => string; icon: any }> = [
  { key: 'medianPrice', label: 'Median Price', format: formatPriceWithCommas, icon: Home },
  { key: 'pricePerSqft', label: 'Price Per Sqft', format: (v) => `$${v.toLocaleString()}` , icon: Ruler },
  { key: 'daysOnMarket', label: 'Average Days on Market', format: (v) => `${v} days`, icon: Timer },
  { key: 'totalActive', label: 'Active Listings', format: (v) => `${v}`, icon: Building2 },
];

export default function StatsSection({ stats }: Props) {
  if (!stats) return null;
  return (
    <section className="pt-2">
      {/* Heading hidden here because parent wrapper renders the visible title */}
      <h2 className="sr-only">Market Snapshot</h2>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {statMeta.map((m) => {
          const value = stats[m.key];
          const Icon = m.icon
          return (
            <Card
              key={m.key}
              className="rounded-2xl bg-[#FAF7F2] p-6 shadow-md ring-1 ring-black/5 hover:shadow-lg transition"
            >
              <CardContent className="p-0 pt-0 flex flex-col items-center text-center">
                <Icon className="h-10 w-10 text-teal-600 mb-2" />
                <p className="text-3xl md:text-4xl font-extrabold text-[#1F2D3D] tracking-tight">
                  {typeof value === 'number' ? m.format(value) : '—'}
                </p>
                <p className="text-slate-600 mt-1">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
