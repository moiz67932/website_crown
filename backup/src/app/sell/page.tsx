import type { Metadata } from "next"
import SellPageClient from "./SellPageClient"

export const metadata: Metadata = {
  title: "Sell Your Home in California | Crown Coastal Homes",
  description:
    "Sell your California coastal property with confidence. Expert marketing, competitive pricing, and personalized service. Get your free home valuation today.",
}

export default function SellPage() {
  return <SellPageClient />
}
