"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: 'default' | 'lg'
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = 'default', ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "bg-[#525252] data-[state=checked]:bg-[rgb(148,118,255)]",
      size === 'default' && "h-5 w-9",
      size === 'lg' && "h-7 w-12",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block rounded-full border-2 border-white bg-transparent transition-transform duration-200",
        "data-[state=checked]:bg-white",
        size === 'default' && "h-3.5 w-3.5 data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[3px]",
        size === 'lg' && "h-5 w-5 data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[4px]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
