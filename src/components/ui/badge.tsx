import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-2 font-semibold font-mono uppercase tracking-[0.48px] transition-all duration-150 focus:outline-none",
  {
    variants: {
      variant: {
        // Default - Stone style with dot
        default:
          "text-stone-800 dark:text-stone-200",
        // Secondary - Subtle gray
        secondary:
          "text-stone-500 dark:text-stone-400",
        // Destructive - Red dot
        destructive:
          "text-stone-800 dark:text-stone-200",
        // Outline - Clean border only
        outline: 
          "text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-0.5",
        // Success - Green dot
        success:
          "text-stone-800 dark:text-stone-200",
        // Warning - Amber dot
        warning:
          "text-stone-800 dark:text-stone-200",
        // Info - Blue dot
        info:
          "text-stone-800 dark:text-stone-200",
        // Purple - Indigo style
        purple:
          "text-indigo-600 dark:text-indigo-400",
        // Gradient - Same as default
        gradient:
          "text-stone-800 dark:text-stone-200",
      },
      size: {
        default: "text-xs",
        sm: "text-[10px]",
        lg: "text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
