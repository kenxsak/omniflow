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
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:keyboard-linear" className="h-5 w-5" />
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
