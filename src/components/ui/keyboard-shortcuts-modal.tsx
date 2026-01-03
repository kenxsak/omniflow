"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Mac Command Key Icon
const MacCommandIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.5 3C15.57 3 14 4.57 14 6.5V8h-4V6.5C10 4.57 8.43 3 6.5 3S3 4.57 3 6.5S4.57 10 6.5 10H8v4H6.5C4.57 14 3 15.57 3 17.5S4.57 21 6.5 21s3.5-1.57 3.5-3.5V16h4v1.5c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5H16v-4h1.5c1.93 0 3.5-1.57 3.5-3.5S19.43 3 17.5 3M16 8V6.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S18.33 8 17.5 8zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5S8 5.67 8 6.5V8zm3.5 6v-4h4v4zm7.5 5c-.83 0-1.5-.67-1.5-1.5V16h1.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5m-11 0c-.83 0-1.5-.67-1.5-1.5S5.67 16 6.5 16H8v1.5c0 .83-.67 1.5-1.5 1.5" />
  </svg>
);

// Windows Keyboard Icon
const WindowsKeyboardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 9 32 22" className={className} fill="currentColor">
    <g>
      <path d="M7.5 23a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm15.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM10.5 23a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM6 20.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 17a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 13a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1A.5.5 0 0 0 6 14v-.5a.5.5 0 0 0-.5-.5zm5.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5z" />
      <path d="M1 14a4 4 0 0 1 4-4h22a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4zm26-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h22a2 2 0 0 0 2-2V14a2 2 0 0 0-2-2" />
    </g>
  </svg>
);

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ["G", "H"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["G", "C"], description: "Go to Contacts", category: "Navigation" },
  { keys: ["G", "T"], description: "Go to Tasks", category: "Navigation" },
  { keys: ["G", "S"], description: "Go to Settings", category: "Navigation" },
  { keys: ["G", "A"], description: "Go to AI Chat", category: "Navigation" },
  
  // Actions
  { keys: ["N"], description: "New item (context-aware)", category: "Actions" },
  { keys: ["⌘", "K"], description: "Open command palette", category: "Actions" },
  { keys: ["/"], description: "Focus search", category: "Actions" },
  { keys: ["Esc"], description: "Close modal / Cancel", category: "Actions" },
  
  // General
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["⌘", "\\"], description: "Toggle sidebar", category: "General" },
  { keys: ["⌘", "D"], description: "Toggle dark mode", category: "General" },
];

// Group shortcuts by category
const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = [];
  }
  acc[shortcut.category].push(shortcut);
  return acc;
}, {} as Record<string, Shortcut[]>);

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Replace ⌘ with Ctrl on non-Mac
  const formatKey = (key: string) => {
    if (key === "⌘" && !isMac) return "Ctrl";
    return key;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-md p-4 sm:p-6 rounded-xl">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            {isMac ? (
              <MacCommandIcon className="h-5 w-5" />
            ) : (
              <WindowsKeyboardIcon className="h-5 w-5" />
            )}
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick actions to navigate faster
          </DialogDescription>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                    >
                      <span className="text-sm text-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center gap-0.5">
                            <kbd
                              className={cn(
                                "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5",
                                "text-xs font-medium rounded-md",
                                "bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm",
                                "text-muted-foreground"
                              )}
                            >
                              {formatKey(key)}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-stone-200 dark:border-stone-800">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">?</kbd> anytime to show this
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

// Hook to handle global keyboard shortcuts
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Show shortcuts modal with ?
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      // Escape to close
      if (e.key === "Escape") {
        setShowShortcuts(false);
        setPendingKey(null);
        return;
      }

      // Command palette with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Could trigger command palette here
        return;
      }

      // Toggle dark mode with Cmd/Ctrl + D
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        html.classList.toggle("dark", !isDark);
        localStorage.setItem("theme", isDark ? "light" : "dark");
        return;
      }

      // G + key navigation shortcuts
      const key = e.key.toUpperCase();
      
      if (pendingKey === "G") {
        e.preventDefault();
        clearTimeout(timeout);
        setPendingKey(null);
        
        const routes: Record<string, string> = {
          H: "/dashboard",
          C: "/crm",
          T: "/tasks",
          S: "/settings",
          A: "/ai-chat",
        };
        
        if (routes[key]) {
          window.location.href = routes[key];
        }
        return;
      }

      if (key === "G") {
        e.preventDefault();
        setPendingKey("G");
        timeout = setTimeout(() => setPendingKey(null), 1000);
        return;
      }

      // Focus search with /
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [pendingKey]);

  return { showShortcuts, setShowShortcuts };
}
