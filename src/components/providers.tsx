"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ComparisonProvider } from "../contexts/comparison-context"
import { SupabaseProvider } from "./providers/supabase-provider"
import { Toaster } from "./ui/toaster"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <ComparisonProvider>
          {children}
          <Toaster />
        </ComparisonProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  )
} 