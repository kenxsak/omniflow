import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "interactive" | "glass" | "mobile" | "clerk"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-card-foreground transition-all duration-100",
      // Default variant - standard card with border
      variant === "default" && "rounded-2xl bg-card border border-border",
      // Interactive variant - hover effects
      variant === "interactive" && "rounded-2xl bg-card border border-border hover:border-accent cursor-pointer",
      // Glass variant - translucent
      variant === "glass" && "rounded-2xl bg-card/90 border border-border backdrop-blur-sm",
      // Mobile variant
      variant === "mobile" && "rounded-2xl bg-card border border-border",
      // Clerk-style box-in-box variant
      variant === "clerk" && [
        "rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1",
        "[&>*:first-child]:rounded-xl [&>*:first-child]:bg-white [&>*:first-child]:dark:bg-stone-950",
        "[&>*:first-child]:shadow-sm [&>*:first-child]:ring-1 [&>*:first-child]:ring-stone-200/60 [&>*:first-child]:dark:ring-stone-800",
      ],
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-foreground font-semibold text-base leading-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground font-normal text-sm leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
