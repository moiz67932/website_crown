"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"

interface PropertyStatisticsProps {
  properties: Array<{
    id: string
    price: number
    beds: number
    baths: number
    sqft: number
    status: string
    yearBuilt?: number
    features?: string[]
  }>
}

export default function PropertyStatistics({ properties }: PropertyStatisticsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    if (!properties.length) return null

    // Price statistics
    const prices = properties.map((p) => p.price)
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    // Square footage statistics
    const sqfts = properties.map((p) => p.sqft)
    const avgSqft = sqfts.reduce((sum, sqft) => sum + sqft, 0) / sqfts.length
    const minSqft = Math.min(...sqfts)
    const maxSqft = Math.max(...sqfts)

    // Price per square foot
    const pricePerSqft = properties.map((p) => p.price / p.sqft)
    const avgPricePerSqft = pricePerSqft.reduce((sum, ppsf) => sum + ppsf, 0) / pricePerSqft.length

    // Bedroom distribution
    const bedCounts = properties.reduce(
      (acc, p) => {
        const beds = p.beds
        acc[beds] = (acc[beds] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    const bedDistribution = Object.entries(bedCounts).map(([beds, count]) => ({
      name: `${beds} ${Number(beds) === 1 ? "bed" : "beds"}`,
      value: count,
    }))

    // Status distribution
    const statusCounts = properties.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }))

    // Year built distribution (if available)
    let yearBuiltStats = null
    const propertiesWithYear = properties.filter((p) => p.yearBuilt)

    if (propertiesWithYear.length > 0) {
      const years = propertiesWithYear.map((p) => p.yearBuilt!)
      const avgYear = Math.round(years.reduce((sum, year) => sum + year, 0) / years.length)
      const oldestYear = Math.min(...years)
      const newestYear = Math.max(...years)

      // Group by decade
      const decadeCounts = propertiesWithYear.reduce(
        (acc, p) => {
          const decade = Math.floor(p.yearBuilt! / 10) * 10
          acc[decade] = (acc[decade] || 0) + 1
          return acc
        },
        {} as Record<number, number>,
      )

      const decadeDistribution = Object.entries(decadeCounts)
        .map(([decade, count]) => ({
          name: `${decade}s`,
          value: count,
        }))
        .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name))

      yearBuiltStats = {
        avgYear,
        oldestYear,
        newestYear,
        decadeDistribution,
      }
    }

    // Common features (if available)
    let commonFeatures: { name: string; count: number }[] = []
    const propertiesWithFeatures = properties.filter((p) => p.features && p.features.length > 0)

    if (propertiesWithFeatures.length > 0) {
      const featureCounts = propertiesWithFeatures.reduce(
        (acc, p) => {
          p.features!.forEach((feature) => {
            acc[feature] = (acc[feature] || 0) + 1
          })
          return acc
        },
        {} as Record<string, number>,
      )

      commonFeatures = Object.entries(featureCounts)
        .map(([feature, count]) => ({
          name: feature,
          count,
          percentage: Math.round((count / propertiesWithFeatures.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Top 5 features
    }

    return {
      count: properties.length,
      price: {
        avg: avgPrice,
        min: minPrice,
        max: maxPrice,
      },
      sqft: {
        avg: avgSqft,
        min: minSqft,
        max: maxSqft,
      },
      pricePerSqft: avgPricePerSqft,
      bedDistribution,
      statusDistribution,
      yearBuiltStats,
      commonFeatures,
    }
  }, [properties])

  if (!stats) return null

  // Colors for charts
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

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
              <span className="text-sm font-medium">${stats.price.avg.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Price per Square Foot */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Price per Sq Ft</span>
            <span className="text-sm font-medium">${Math.round(stats.pricePerSqft).toLocaleString()}</span>
          </div>

          {/* Average Size */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Average Size</span>
            <span className="text-sm font-medium">{Math.round(stats.sqft.avg).toLocaleString()} sq ft</span>
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
          <div>
            <h4 className="text-sm font-medium mb-3">Property Status</h4>
            <div className="h-[120px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => percent ? `${name} (${(percent * 100).toFixed(0)}%)` : name}
                    labelLine={false}
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} properties`, name]}
                    contentStyle={{ borderRadius: "0.375rem", border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year Built Stats (if available) */}
          {stats.yearBuiltStats && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Year Built</h4>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-slate-500">
                    {stats.yearBuiltStats.oldestYear} - {stats.yearBuiltStats.newestYear}
                  </span>
                  <span className="text-sm">Avg: {stats.yearBuiltStats.avgYear}</span>
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
  )
}
