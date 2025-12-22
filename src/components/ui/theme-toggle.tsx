"use client";

import * as React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", prefersDark);
    }

    // Listen for storage changes (from preferences page)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        if (e.newValue === "dark") {
          setTheme("dark");
          document.documentElement.classList.add("dark");
        } else if (e.newValue === "light") {
          setTheme("light");
          document.documentElement.classList.remove("dark");
        } else {
          // System preference
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          setTheme(prefersDark ? "dark" : "light");
          document.documentElement.classList.toggle("dark", prefersDark);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="h-4 w-4" />
        <div className="h-5 w-9 rounded-full bg-muted" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center gap-1.5 focus-visible:outline-none",
        className
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Icon outside toggle */}
      {theme === "dark" ? (
        <Icon icon="solar:moon-linear" className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Icon icon="solar:sun-linear" className="h-4 w-4 text-muted-foreground" />
      )}

      {/* Toggle track */}
      <div
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
          "bg-[#525252]"
        )}
      >
        {/* Thumb - ring style */}
        <span
          className={cn(
            "pointer-events-none absolute h-3.5 w-3.5 rounded-full border-2 border-white bg-transparent transition-transform duration-200",
            theme === "dark" ? "translate-x-[18px]" : "translate-x-[3px]"
          )}
        />
      </div>
    </button>
  );
}
