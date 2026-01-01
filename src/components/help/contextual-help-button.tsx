"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/app-icon";
import { HelpPanel } from "./help-panel";
import { cn } from "@/lib/utils";
import { type PageId } from "@/lib/help-content";

interface ContextualHelpButtonProps {
  pageId: PageId;
  className?: string;
}

export function ContextualHelpButton({
  pageId,
  className,
}: ContextualHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help FAB Button - Bottom Right - Always on top */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        variant="outline"
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-6 sm:right-6",
          "h-12 w-12 sm:h-14 sm:w-14",
          "rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-200 ease-out",
          "hover:scale-105 active:scale-95",
          // Light mode: Blue gradient with white icon
          // Dark mode: Purple/violet gradient with white icon
          isOpen
            ? "bg-rose-500 hover:bg-rose-600 border-rose-400 text-white"
            : "bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-violet-500 dark:to-purple-600 border-blue-400 dark:border-violet-400 text-white hover:from-blue-600 hover:to-indigo-700 dark:hover:from-violet-600 dark:hover:to-purple-700",
          "border-2",
          // Pulse animation when not open to draw attention
          !isOpen && "animate-pulse-subtle",
          className
        )}
        style={{ zIndex: 99999 }}
        aria-label={isOpen ? "Close help" : "Open help"}
      >
        <AppIcon name={isOpen ? "x" : "help"} size={22} className="sm:hidden drop-shadow-sm" />
        <AppIcon name={isOpen ? "x" : "help"} size={26} className="hidden sm:block drop-shadow-sm" />
      </Button>

      <HelpPanel pageId={pageId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
