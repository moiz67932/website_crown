"use client"
import React from "react"

export default function TypingIndicator() {
  return (
    <div className="inline-flex items-center space-x-1 bg-gray-800 text-white/95 px-3 py-2 rounded-2xl shadow-sm">
      <span className="sr-only">Assistant is typing</span>
      <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" />
    </div>
  )
}
