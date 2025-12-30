"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Icon } from "@iconify/react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Autosend style select trigger
      "group flex h-9 w-full items-center justify-between rounded-lg border px-3 py-1.5 text-sm",
      "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900",
      "text-stone-800 dark:text-stone-200",
      "transition-all duration-100",
      "placeholder:text-stone-400 dark:placeholder:text-stone-500",
      "focus:outline-none focus:border-stone-300 dark:focus:border-stone-600",
      "focus-within:border-stone-300 dark:focus-within:border-stone-600",
      "focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:focus-within:shadow-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "hover:border-stone-300 dark:hover:border-stone-600",
      "hover:shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:hover:shadow-none",
      "[&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      {/* Autosend chevron icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none"
        className="text-stone-400 group-hover:text-stone-950 group-focus-within:text-stone-950 dark:group-hover:text-stone-200 dark:group-focus-within:text-stone-200 shrink-0 ml-2 transition-colors"
      >
        <path 
          d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // Autosend style dropdown content - clean, no arrows
        "relative z-[100] max-h-[60vh] sm:max-h-96 min-w-[8rem]",
        "rounded-xl border border-stone-200 dark:border-stone-700",
        "bg-white dark:bg-stone-900",
        "text-stone-800 dark:text-stone-200",
        "shadow-lg shadow-stone-200/50 dark:shadow-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-2 overflow-y-auto scrollbar-hide",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-1.5 px-3 text-xs font-semibold uppercase tracking-wide",
      "text-stone-500 dark:text-stone-400",
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // Autosend style dropdown item - clean and aesthetic
      "relative flex w-full cursor-pointer select-none items-center",
      "rounded-lg py-2.5 px-3 pr-8 text-sm",
      "outline-none transition-colors",
      "text-stone-700 dark:text-stone-300",
      "hover:bg-stone-100 dark:hover:bg-stone-800",
      "focus:bg-stone-100 dark:focus:bg-stone-800",
      "data-[state=checked]:text-stone-950 dark:data-[state=checked]:text-white",
      "data-[state=checked]:font-medium",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
          className="text-indigo-600 dark:text-indigo-400"
        >
          <path 
            d="M5 14l3.5 3.5L19 6.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
