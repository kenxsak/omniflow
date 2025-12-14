import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@iconify/react"

/**
 * Clerk-style "box in box" section card component
 * Outer: rounded section with subtle background
 * Inner: white card body with shadow and ring
 */

interface SectionCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const SectionCard = React.forwardRef<HTMLElement, SectionCardProps>(
  ({ className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1",
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
)
SectionCard.displayName = "SectionCard"

interface SectionCardHeaderProps extends React.HTMLAttributes<HTMLElement> {
  icon?: string
  title: string
  badge?: string
  children?: React.ReactNode
}

const SectionCardHeader = React.forwardRef<HTMLElement, SectionCardHeaderProps>(
  ({ className, icon, title, badge, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn("flex items-center gap-2 px-5 py-3", className)}
      {...props}
    >
      {icon && (
        <Icon icon={icon} className="h-5 w-5 text-muted-foreground" />
      )}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {badge && (
        <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-muted-foreground">
          {badge}
        </span>
      )}
      {children}
    </header>
  )
)
SectionCardHeader.displayName = "SectionCardHeader"

interface SectionCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SectionCardBody = React.forwardRef<HTMLDivElement, SectionCardBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-white dark:bg-stone-950",
        "shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
SectionCardBody.displayName = "SectionCardBody"

interface SectionCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SectionCardContent = React.forwardRef<HTMLDivElement, SectionCardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-5 space-y-5", className)}
      {...props}
    >
      {children}
    </div>
  )
)
SectionCardContent.displayName = "SectionCardContent"

interface SectionCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SectionCardFooter = React.forwardRef<HTMLDivElement, SectionCardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-5 py-3 border-t border-stone-200 dark:border-stone-800",
        "bg-stone-50/50 dark:bg-stone-900/50 rounded-b-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
SectionCardFooter.displayName = "SectionCardFooter"

// Info banner component for tips/notices inside section cards
interface SectionCardInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string
  children: React.ReactNode
}

const SectionCardInfo = React.forwardRef<HTMLDivElement, SectionCardInfoProps>(
  ({ className, icon = "solar:info-circle-linear", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-lg",
        "bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800",
        className
      )}
      {...props}
    >
      <Icon icon={icon} className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  )
)
SectionCardInfo.displayName = "SectionCardInfo"

export {
  SectionCard,
  SectionCardHeader,
  SectionCardBody,
  SectionCardContent,
  SectionCardFooter,
  SectionCardInfo,
}
