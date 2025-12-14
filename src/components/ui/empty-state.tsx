"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col gap-4 justify-center items-center flex-grow py-12 px-4", className)}>
      <div className="h-16 w-16 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
        <Icon icon={icon} className="h-8 w-8 text-stone-400 dark:text-stone-500" />
      </div>
      <div className="flex flex-col gap-1 text-center">
        <p className="text-stone-800 dark:text-stone-200 font-medium text-sm">{title}</p>
        {description && (
          <p className="text-stone-500 dark:text-stone-400 font-normal text-sm max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        action.href ? (
          <Button asChild size="sm">
            <Link href={action.href} className="inline-flex items-center gap-1">
              {action.label}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" className="-mr-1">
                <path d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
            </Link>
          </Button>
        ) : (
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        )
      )}
    </div>
  );
}

// Specific empty states for common use cases
export function NoDataFound({ 
  message = "No data found",
  suggestion = "Try adjusting your filters or search terms"
}: { 
  message?: string;
  suggestion?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{suggestion}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again later",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-3">
          Try Again
        </Button>
      )}
    </div>
  );
}
