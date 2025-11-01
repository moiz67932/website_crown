import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer hover:cursor-pointer justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-primary text-white shadow-medium hover:shadow-strong hover:from-primary-500 hover:to-primary-600 hover:shadow-primary-400/25",
        destructive:
          "bg-gradient-to-r from-error-500 to-error-600 text-white shadow-medium hover:shadow-strong hover:from-error-600 hover:to-error-700 focus-visible:ring-error-400/50",
        outline:
          "border-2 border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 shadow-soft hover:bg-neutral-50 dark:hover:bg-slate-700 hover:border-primary-300 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-medium theme-transition",
        secondary:
          "bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-slate-700 dark:to-slate-600 text-neutral-700 dark:text-neutral-300 shadow-soft hover:from-neutral-200 hover:to-neutral-300 dark:hover:from-slate-600 dark:hover:to-slate-500 hover:shadow-medium theme-transition",
        ghost:
          "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl theme-transition",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700 rounded-none hover:scale-100",
        luxury:
          "bg-gradient-luxury text-white shadow-medium hover:shadow-strong hover:shadow-gold-400/25",
        accent:
          "bg-gradient-accent text-white shadow-medium hover:shadow-strong hover:shadow-accent-400/25",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm",
        sm: "h-9 px-4 py-2 text-sm rounded-xl",
        lg: "h-13 px-8 py-4 text-base rounded-2xl",
        xl: "h-16 px-10 py-5 text-lg rounded-3xl",
        icon: "size-11 rounded-2xl",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-13 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
