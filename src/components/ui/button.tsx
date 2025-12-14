import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap text-center select-none transition-all duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // Default - Autosend style: dark filled button with border
        default: "bg-stone-700 text-stone-50 border-2 border-stone-800 hover:bg-stone-800 rounded-lg font-mono font-semibold uppercase text-xs tracking-wide dark:bg-stone-900 dark:border-stone-700 dark:hover:bg-stone-700",
        // Destructive - Red
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 rounded-lg font-mono font-semibold uppercase text-xs tracking-wide",
        // Outline - Border only, for secondary actions
        outline: "border-2 border-stone-300 bg-transparent text-stone-700 hover:bg-stone-100 rounded-lg font-mono font-semibold uppercase text-xs tracking-wide dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800",
        // Secondary - Subtle background
        secondary: "bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-lg font-mono font-semibold uppercase text-xs tracking-wide dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700",
        // Ghost - No background until hover
        ghost: "hover:bg-stone-100 text-stone-700 rounded-lg dark:hover:bg-stone-800 dark:text-stone-300",
        // Link - Underline style
        link: "text-stone-700 underline-offset-4 hover:underline dark:text-stone-300",
        // Success - Green
        success: "bg-success text-success-foreground hover:bg-success/90 active:bg-success/80 rounded-lg font-mono font-semibold uppercase text-xs tracking-wide",
        // Warning - Amber
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/80 rounded-lg font-mono font-semibold uppercase text-xs tracking-wide",
      },
      size: {
        default: "h-7 px-3 py-1",
        sm: "h-6 px-3 py-1",
        lg: "h-9 px-4 py-2",
        xl: "h-10 px-5 py-2",
        xs: "h-5 px-2 py-0.5 text-[10px]",
        icon: "h-8 w-8",
        "icon-sm": "h-6 w-6",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
