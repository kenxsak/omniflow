"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function FallingLine({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "absolute top-0 h-full w-px",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <div className="falling-line absolute h-24 w-px bg-gradient-to-b from-transparent via-white/80 to-transparent" />
    </div>
  );
}

function LayoutLines({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("pointer-events-none fixed inset-0 top-0 z-0", className)}
      {...props}
    >
      <div className="max-w-container line-y line-dashed relative mx-auto flex h-full flex-col">
        <FallingLine side="left" />
        <FallingLine side="right" />
      </div>
    </section>
  );
}

export { LayoutLines, FallingLine };
