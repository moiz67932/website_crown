"use client"
import React from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("App Error:", error)
  }, [error])
  return (
    <div style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p>{error?.message || "Unexpected error"}</p>
      <button onClick={() => reset()} style={{ marginTop: 12, padding: "8px 12px", border: "1px solid #ccc" }}>
        Try again
      </button>
    </div>
  )
}
