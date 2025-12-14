"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // AutoSend style: transparent bg, bottom border only
      "flex items-center border-b border-stone-200 dark:border-stone-700 w-full",
      "gap-1 overflow-x-auto scrollbar-hide bg-transparent",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // AutoSend style: border-b-2 directly on trigger
      "flex whitespace-nowrap text-center items-center justify-center",
      "text-sm transition-all ease-in duration-75",
      "border-b-2 border-transparent -mb-px",
      "font-medium text-stone-600 dark:text-stone-400",
      // Active state: indigo text + indigo border + semibold
      "data-[state=active]:font-semibold data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400",
      "data-[state=active]:border-indigo-500",
      "focus-visible:outline-none",
      "disabled:pointer-events-none disabled:opacity-50",
      "shrink-0",
      className
    )}
    {...props}
  >
    {/* Inner div with hover bg and padding */}
    <div className="hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg px-3 py-1.5 mb-1">
      {children}
    </div>
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-4 data-[state=active]:duration-300",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
