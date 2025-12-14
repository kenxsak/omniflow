import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full p-2 pl-3 outline-none text-sm rounded-lg border max-h-9 transition-all duration-100",
          "border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900",
          "text-stone-800 dark:text-stone-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-stone-800 dark:file:text-stone-200",
          "placeholder:text-stone-400 dark:placeholder:text-stone-500",
          "focus:border-stone-400 dark:focus:border-stone-500 focus:bg-white dark:focus:bg-stone-950",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-stone-100 dark:disabled:bg-stone-900 disabled:text-stone-400",
          "hover:shadow-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
