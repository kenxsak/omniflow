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
          "rounded-full shadow-xl hover:shadow-2xl",
          "border-2 border-primary/50 hover:border-primary",
          "hover:scale-110 active:scale-95 transition-all duration-200",
          "bg-background/95 backdrop-blur-sm",
          "text-primary hover:bg-primary hover:text-primary-foreground",
          isOpen &&
            "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",
          className
        )}
        style={{ zIndex: 99999 }}
        aria-label={isOpen ? "Close help" : "Open help"}
      >
        <AppIcon name={isOpen ? "x" : "help"} size={24} className="sm:hidden" />
        <AppIcon name={isOpen ? "x" : "help"} size={28} className="hidden sm:block" />
      </Button>

      <HelpPanel pageId={pageId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
