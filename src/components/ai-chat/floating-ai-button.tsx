"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const quickPrompts = [
  { icon: '📝', label: 'Write content', prompt: 'Help me write ', agentId: 'content-writer' },
  { icon: '🎯', label: 'Create ad', prompt: 'Create an ad for ', agentId: 'ad-strategist' },
  { icon: '🖼️', label: 'Generate image', prompt: 'Generate an image of ', agentId: 'visual-designer' },
  { icon: '💬', label: 'Reply to review', prompt: 'Help me respond to this review: ', agentId: 'customer-service' },
];

export default function FloatingAIButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on AI chat pages (already has AI interface)
  const hideOnPages = ['/ai-chat'];
  const shouldHide = hideOnPages.some(page => pathname?.startsWith(page));

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (shouldHide) return null;

  const handleQuickPrompt = (agentId: string, prompt: string) => {
    setIsOpen(false);
    router.push(`/ai-chat/${agentId}?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleOpenAI = () => {
    setIsOpen(false);
    router.push('/ai-chat');
  };

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      )}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "group relative flex items-center justify-center",
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full",
              "bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600",
              "shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30",
              "transition-all duration-200 hover:scale-105",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
            )}
            aria-label="Open AI Assistant"
          >
            <Icon 
              icon="solar:stars-bold" 
              className={cn(
                "w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
            
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
            
            {/* Tooltip on hover (desktop only) */}
            <span className="hidden sm:block absolute right-full mr-3 px-2 py-1 rounded-lg bg-stone-900 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask AI (⌘K)
            </span>
          </button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          sideOffset={12}
          className="w-64 sm:w-72 p-0 rounded-xl border-stone-200 dark:border-stone-800 shadow-xl"
        >
          {/* Header */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Icon icon="solar:stars-linear" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Assistant</p>
                <p className="text-[10px] text-muted-foreground">Ask anything, create anything</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
              Quick Actions
            </p>
            <div className="space-y-0.5">
              {quickPrompts.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(item.agentId, item.prompt)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Open Full AI */}
          <div className="p-2 border-t border-stone-200 dark:border-stone-800">
            <button
              onClick={handleOpenAI}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              <Icon icon="solar:chat-round-dots-linear" className="w-4 h-4" />
              Open AI Workspace
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 rounded-b-xl">
            <p className="text-[10px] text-muted-foreground text-center">
              Press <kbd className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono">⌘K</kbd> for quick search
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
