"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return

    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className="relative group bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 dark:hover:bg-slate-700/70 border border-neutral-200/50 dark:border-slate-600/50 backdrop-blur-sm transition-all duration-300 hover:scale-110"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 h-5 w-5 text-amber-500 transform transition-all duration-500 ${
            isDarkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 h-5 w-5 text-slate-700 dark:text-slate-300 transform transition-all duration-500 ${
            isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
        isDarkMode 
          ? 'from-blue-400 to-purple-500' 
          : 'from-amber-400 to-orange-500'
      }`} />
    </Button>
  )
}
