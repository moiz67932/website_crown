"use client"

import Image from "next/image"

interface LogoDisplayProps {
  className?: string
  fill?: boolean
  width?: number
  height?: number
}

export default function LogoDisplay({ className = "", fill, width, height }: LogoDisplayProps) {
  // Combine the provided className with the theme-based filter classes
  const logoClassName = `transition-all duration-300 dark:invert dark:brightness-0 dark:contrast-100 dark:filter ${className}`.trim()

  return (
    <Image 
      src="/logo.png"
      alt="Crown Coastal Logo" 
      fill={fill}
      width={width}
      height={height}
      className={logoClassName}
    />
  )
}
