"use client";

import { Card } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";

// Kept props interface optional so existing callers passing `properties` don't break.
interface PropertyStatisticsProps {
  properties?: unknown[]; // Ignored – component is now fully static.
}

// A single static snapshot of example statistics so the component never depends on runtime data.
const STATIC_STATS = {
  count: 24,
  price: {
    avg: 950000,
    min: 650000,
    max: 1450000,
  },
  sqft: {
    avg: 2200,
    min: 1100,
    max: 4200,
  },
  pricePerSqft: 430, // pre‑computed
  // Year built info (example distribution omitted from UI for simplicity)
  yearBuiltStats: {
    oldestYear: 1950,
    newestYear: 2024,
    avgYear: 1998,
    decadeDistribution: [] as Array<{ name: string; value: number }>,
  },
  // Only features currently rendered
  commonFeatures: [
    { name: "Pool", count: 12, percentage: 50 },
    { name: "Garage", count: 18, percentage: 75 },
    { name: "Fireplace", count: 9, percentage: 38 },
    { name: "Garden", count: 7, percentage: 29 },
    { name: "Solar Panels", count: 5, percentage: 21 },
  ],
};

export default function PropertyStatistics(_props: PropertyStatisticsProps) {
  const stats = STATIC_STATS; // Always the same – no dynamic calculation.

  return (
    <Card className="w-full max-w-md bg-white shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Area Statistics</h3>
          <Badge variant="outline" className="bg-slate-50">
            {stats.count} properties
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Price Range */}
          <div>
            <h4 className="text-sm font-medium mb-2">Price Range</h4>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>${stats.price.min.toLocaleString()}</span>
              <span>${stats.price.max.toLocaleString()}</span>
            </div>
            <Progress value={50} className="h-1.5" />
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500">Average</span>
              <span className="text-sm font-medium">
                ${stats.price.avg.toLocaleString()}
              </span>
            </div>
          </div>

          <Separator />

          {/* Price per Square Foot */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Price per Sq Ft</span>
            <span className="text-sm font-medium">
              ${Math.round(stats.pricePerSqft).toLocaleString()}
            </span>
          </div>

          {/* Average Size */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Average Size</span>
            <span className="text-sm font-medium">
              {Math.round(stats.sqft.avg).toLocaleString()} sq ft
            </span>
          </div>

          <Separator />

          {/* Bedroom Distribution */}
          {/* <div>
            <h4 className="text-sm font-medium mb-3">Bedroom Distribution</h4>
            <div className="h-[120px]">
              <ChartContainer
                config={{
                  beds: {
                    label: "Bedrooms",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.bedDistribution}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" name="Properties" fill="var(--color-beds)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div> */}

          <Separator />

          {/* Status Distribution */}
          {/* <div>
            <h4 className="text-sm font-medium mb-3">Property Status</h4>
            <div className="h-[120px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label={({ name, percent }: { name?: string; percent?: number | null }) => {
                      if (typeof percent !== 'number' || Number.isNaN(percent)) {
                        return name ?? ''
                      }
                      const pct = Math.round(percent * 100)
                      return `${name ?? ''} (${pct}%)`
                    }}
                    labelLine={false}
                    paddingAngle={5}
                  /> */}

                  {/* <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} properties`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "0.375rem",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div> */}

          {/* Year Built Stats (if available) */}
                {stats.yearBuiltStats && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Year Built</h4>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-500">
                          {stats.yearBuiltStats.oldestYear} -{" "}
                          {stats.yearBuiltStats.newestYear}
                        </span>
                        <span className="text-sm">
                          Avg: {stats.yearBuiltStats.avgYear}
                        </span>
                      </div>
                      {/* {stats.yearBuiltStats.decadeDistribution.length > 1 && (
                        <div className="h-[100px]">
                          <ChartContainer
                            config={{
                              years: {
                                label: "Decade Built",
                                color: "hsl(var(--chart-2))",
                              },
                            }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stats.yearBuiltStats.decadeDistribution}>
                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" name="Properties" fill="var(--color-years)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                      )} */}
                    </div>
                  </>
                )}

                {/* Common Features (if available) */}
                {stats.commonFeatures.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Common Features</h4>
                      <div className="space-y-2">
                        {stats.commonFeatures.map((feature) => (
                          <div key={feature.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{feature.name}</span>
                              {/* <span>{feature.percentage}%</span> */}
                            </div>
                            {/* <Progress value={feature.percentage} className="h-1.5" /> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
        </div>
      </div>
    </Card>
  );
}
