"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { MENU_CONFIG } from '@/lib/menu-config';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  href?: string;
  action?: () => void;
  category: 'navigation' | 'ai' | 'action' | 'recent';
  keywords?: string[];
}

// AI Agents for quick access
const aiAgents: CommandItem[] = [
  { id: 'ai-content', label: 'Content Writer', description: 'Write blogs, emails, social posts', icon: 'solar:document-text-linear', href: '/ai-chat/content-writer', category: 'ai', keywords: ['write', 'blog', 'email', 'content'] },
  { id: 'ai-ads', label: 'Ad Strategist', description: 'Create ad campaigns', icon: 'solar:chart-2-linear', href: '/ai-chat/ad-strategist', category: 'ai', keywords: ['ads', 'campaign', 'google', 'facebook'] },
  { id: 'ai-visual', label: 'Visual Designer', description: 'Generate AI images', icon: 'solar:gallery-linear', href: '/ai-chat/visual-designer', category: 'ai', keywords: ['image', 'design', 'visual', 'picture'] },
  { id: 'ai-seo', label: 'SEO Expert', description: 'Keywords & optimization', icon: 'solar:magnifer-linear', href: '/ai-chat/seo-expert', category: 'ai', keywords: ['seo', 'keywords', 'search', 'ranking'] },
  { id: 'ai-support', label: 'Customer Service', description: 'Review responses', icon: 'solar:chat-round-dots-linear', href: '/ai-chat/customer-service', category: 'ai', keywords: ['review', 'support', 'customer', 'response'] },
  { id: 'ai-video', label: 'Video Producer', description: 'Scripts & concepts', icon: 'solar:videocamera-record-linear', href: '/ai-chat/video-producer', category: 'ai', keywords: ['video', 'script', 'youtube', 'tiktok'] },
];

// Quick actions
const quickActions: CommandItem[] = [
  { id: 'new-contact', label: 'Add Contact', description: 'Create a new contact', icon: 'solar:user-plus-linear', href: '/crm?action=add', category: 'action', keywords: ['contact', 'lead', 'customer', 'add'] },
  { id: 'new-task', label: 'Create Task', description: 'Add a new task', icon: 'solar:checklist-minimalistic-linear', href: '/tasks?action=add', category: 'action', keywords: ['task', 'todo', 'reminder'] },
  { id: 'new-campaign', label: 'New Campaign', description: 'Start email campaign', icon: 'solar:letter-linear', href: '/email-marketing', category: 'action', keywords: ['campaign', 'email', 'marketing'] },
  { id: 'schedule', label: 'Schedule Post', description: 'Schedule social content', icon: 'solar:calendar-linear', href: '/social-media/content-hub', category: 'action', keywords: ['schedule', 'post', 'social'] },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Build navigation items from menu config
  const navigationItems: CommandItem[] = MENU_CONFIG.flatMap(item => {
    const items: CommandItem[] = [{
      id: item.id,
      label: item.label,
      description: item.tooltip,
      icon: item.icon,
      href: item.href,
      category: 'navigation',
      keywords: [item.label.toLowerCase()],
    }];
    
    if (item.subItems) {
      item.subItems.forEach(sub => {
        items.push({
          id: sub.id,
          label: `${item.label} → ${sub.label}`,
          description: sub.tooltip,
          icon: sub.icon,
          href: sub.href,
          category: 'navigation',
          keywords: [item.label.toLowerCase(), sub.label.toLowerCase()],
        });
      });
    }
    
    return items;
  });

  // All items combined
  const allItems = [...aiAgents, ...quickActions, ...navigationItems];

  // Filter items based on search
  const filteredItems = search.trim()
    ? allItems.filter(item => {
        const searchLower = search.toLowerCase();
        return (
          item.label.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.keywords?.some(k => k.includes(searchLower))
        );
      })
    : allItems.slice(0, 12); // Show first 12 items when no search

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryLabels: Record<string, string> = {
    ai: 'AI Assistants',
    action: 'Quick Actions',
    navigation: 'Navigation',
    recent: 'Recent',
  };

  const categoryOrder = ['ai', 'action', 'navigation', 'recent'];

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle navigation with arrow keys
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) {
        if (item.href) {
          router.push(item.href);
        } else if (item.action) {
          item.action();
        }
        setOpen(false);
        setSearch('');
      }
    }
  }, [filteredItems, selectedIndex, router]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleItemClick = (item: CommandItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
    setOpen(false);
    setSearch('');
  };

  let itemIndex = -1;

  return (
    <>
      {/* Trigger Button - Can be placed in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-sm text-muted-foreground"
      >
        <Icon icon="solar:magnifer-linear" className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <Icon icon="solar:magnifer-linear" className="w-5 h-5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] p-0 gap-0 rounded-xl overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Command Palette</DialogTitle>
          </VisuallyHidden>
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <Icon icon="solar:magnifer-linear" className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyNavigation}
              placeholder="Search or ask AI anything..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/60"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="solar:magnifer-linear" className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
              </div>
            ) : (
              categoryOrder.map(category => {
                const items = groupedItems[category];
                if (!items || items.length === 0) return null;

                return (
                  <div key={category} className="mb-2">
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase px-2 py-1.5">
                      {categoryLabels[category]}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        itemIndex++;
                        const isSelected = itemIndex === selectedIndex;
                        const currentIndex = itemIndex;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                              isSelected 
                                ? "bg-purple-500/10 text-foreground" 
                                : "hover:bg-stone-100 dark:hover:bg-stone-800"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected ? "bg-purple-500/20" : "bg-stone-100 dark:bg-stone-800"
                            )}>
                              <Icon icon={item.icon} className={cn(
                                "w-4 h-4",
                                isSelected ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                              )}
                            </div>
                            {isSelected && (
                              <Icon icon="solar:arrow-right-linear" className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700">↵</kbd>
                Select
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Powered by AI
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
