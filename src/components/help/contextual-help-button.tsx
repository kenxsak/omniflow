"use client";

import { HelpCircle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      {/* Help FAB Button - Bottom Right */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        variant="outline"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
        }}
        className={cn(
          "h-11 w-11 sm:h-12 sm:w-12",
          "rounded-full shadow-lg hover:shadow-xl",
          "border-2 border-primary/40 hover:border-primary/60",
          "hover:scale-105 active:scale-95 transition-all duration-200",
          "bg-background",
          "text-primary hover:bg-primary/10",
          isOpen &&
            "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20",
          className
        )}
        aria-label={isOpen ? "Close help" : "Open help"}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <HelpCircle className="h-5 w-5" />
        )}
      </Button>

      <HelpPanel pageId={pageId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
