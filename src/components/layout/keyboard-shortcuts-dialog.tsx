"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialogs / Cancel' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'H'], description: 'Go to Dashboard' },
      { keys: ['G', 'C'], description: 'Go to CRM' },
      { keys: ['G', 'A'], description: 'Go to AI Chat' },
      { keys: ['G', 'T'], description: 'Go to Tasks' },
    ],
  },
  {
    title: 'AI Chat',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line' },
      { keys: ['⌘', 'N'], description: 'New conversation' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], description: 'New item (context-aware)' },
      { keys: ['⌘', 'S'], description: 'Save' },
      { keys: ['⌘', 'Enter'], description: 'Submit form' },
    ],
  },
];

export default function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts on '?' key (without modifiers)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Don't trigger if typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] sm:max-w-[560px] p-0 gap-0 rounded-xl overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Icon icon="solar:keyboard-linear" className="w-5 h-5 text-muted-foreground" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-2.5">
                {group.title}
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-stone-50 dark:bg-stone-900/50"
                  >
                    <span className="text-xs sm:text-sm text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <kbd 
                          key={keyIndex}
                          className="min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded bg-stone-200 dark:bg-stone-700 text-[10px] sm:text-xs font-medium text-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono">?</kbd> anytime to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
