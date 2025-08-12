"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ComparisonProvider } from "@/contexts/comparison-context"
import { Toaster } from "@/components/ui/toaster"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        {children}
        <Toaster />
      </ComparisonProvider>
    </QueryClientProvider>
  )
} 