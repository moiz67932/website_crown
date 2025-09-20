declare module 'google-trends-api' {
  export function dailyTrends(options: { geo: string; trendDate?: Date; tz?: string | number }): Promise<string>
}
