"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  getPrimaryAgents, 
  getSecondaryAgents, 
  getGeneralAgent,
  aiAgents
} from '@/config/ai-agents';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { cn } from '@/lib/utils';
import gsap from 'gsap';

// Map agent IDs to Solar icons
const agentIcons: Record<string, string> = {
  'content-writer': 'solar:document-text-linear',
  'ad-strategist': 'solar:chart-2-linear',
  'visual-designer': 'solar:gallery-linear',
  'seo-expert': 'solar:magnifer-linear',
  'customer-service': 'solar:chat-round-dots-linear',
  'video-producer': 'solar:videocamera-record-linear',
  'general-assistant': 'solar:stars-linear',
};

// Agent colors for the icon circles
const agentColors: Record<string, { bg: string; icon: string }> = {
  'content-writer': { bg: 'bg-blue-500/10', icon: 'text-blue-500' },
  'ad-strategist': { bg: 'bg-purple-500/10', icon: 'text-purple-500' },
  'visual-designer': { bg: 'bg-pink-500/10', icon: 'text-pink-500' },
  'seo-expert': { bg: 'bg-cyan-500/10', icon: 'text-cyan-500' },
  'customer-service': { bg: 'bg-indigo-500/10', icon: 'text-indigo-500' },
  'video-producer': { bg: 'bg-red-500/10', icon: 'text-red-500' },
  'general-assistant': { bg: 'bg-amber-500/10', icon: 'text-amber-500' },
};

export default function AIChatPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const primaryAgents = getPrimaryAgents();
  const secondaryAgents = getSecondaryAgents();
  const generalAgent = getGeneralAgent();
  const allAgents = [...primaryAgents, ...secondaryAgents];
  if (generalAgent) allAgents.push(generalAgent);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Animate entrance
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Navigate to the selected agent or general assistant with the prompt
    const agentId = selectedAgent || 'general-assistant';
    router.push(`/ai-chat/${agentId}?prompt=${encodeURIComponent(inputValue)}`);
  };

  const handleAgentClick = (agentId: string) => {
    router.push(`/ai-chat/${agentId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Quick prompts for inspiration
  const quickPrompts = [
    { icon: '📝', label: 'Write a blog post', prompt: 'Write a blog post about ' },
    { icon: '📱', label: 'Social media post', prompt: 'Create an Instagram post about ' },
    { icon: '✉️', label: 'Email campaign', prompt: 'Write an email to my customers about ' },
    { icon: '🎯', label: 'Ad copy', prompt: 'Create Google ad copy for ' },
    { icon: '🖼️', label: 'Generate image', prompt: 'Generate an image of ' },
    { icon: '💡', label: 'Business idea', prompt: 'Help me brainstorm ideas for ' },
  ];

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-3">
            OmniFlow AI Workspace
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Ask anything, create anything
          </p>
        </div>

        {/* Central Input - Genspark Style */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-6 sm:mb-8">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500/50 transition-all">
              {/* Agent selector button */}
              <button
                type="button"
                onClick={() => setSelectedAgent(selectedAgent ? null : 'general-assistant')}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  selectedAgent 
                    ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" 
                    : "bg-stone-100 dark:bg-stone-800 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon icon="solar:stars-linear" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI</span>
              </button>
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, create anything..."
                className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base placeholder:text-muted-foreground/60"
              />
              
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-muted-foreground"
                  title="Attach file"
                >
                  <Icon icon="solar:paperclip-linear" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-lg transition-colors",
                    inputValue.trim() 
                      ? "bg-purple-600 text-white hover:bg-purple-700" 
                      : "bg-stone-100 dark:bg-stone-800 text-muted-foreground"
                  )}
                >
                  <Icon icon="solar:arrow-up-linear" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            
            {/* Hint text */}
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-center mt-2">
              Press Enter to send • Select an agent below for specialized help
            </p>
          </div>
        </form>

        {/* Agent Icons Row - Genspark Style */}
        <div className="w-full max-w-3xl mb-6 sm:mb-8">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {allAgents.map((agent) => {
              const colors = agentColors[agent.id] || { bg: 'bg-stone-100', icon: 'text-stone-600' };
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAgentClick(agent.id)}
                  className="group flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/50 transition-all"
                >
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    colors.bg
                  )}>
                    <Icon icon={agentIcons[agent.id]} className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.icon)} />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center max-w-[60px] sm:max-w-[80px] truncate">
                    {agent.name.replace(' AI', '').replace(' Assistant', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="w-full max-w-2xl">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-center mb-3">
            Quick Start
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {quickPrompts.map((item, index) => (
              <button
                key={index}
                onClick={() => setInputValue(item.prompt)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-all text-xs sm:text-sm text-muted-foreground hover:text-foreground"
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - For You / Recent */}
      <div className="border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs sm:text-sm font-medium">
              For You
            </button>
            <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium transition-colors">
              Recent
            </button>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { icon: 'solar:document-text-linear', label: 'Blog Writer', desc: 'SEO-optimized articles', color: 'text-blue-500', href: '/ai-chat/content-writer' },
              { icon: 'solar:gallery-linear', label: 'Image Creator', desc: 'AI-generated visuals', color: 'text-pink-500', href: '/ai-chat/visual-designer' },
              { icon: 'solar:target-linear', label: 'Ad Generator', desc: 'High-converting ads', color: 'text-purple-500', href: '/ai-chat/ad-strategist' },
              { icon: 'solar:chat-round-dots-linear', label: 'Review Helper', desc: 'Professional responses', color: 'text-indigo-500', href: '/ai-chat/customer-service' },
            ].map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="p-3 sm:p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 transition-all cursor-pointer group">
                  <Icon icon={item.icon} className={cn("w-5 h-5 sm:w-6 sm:h-6 mb-2", item.color)} />
                  <p className="text-xs sm:text-sm font-medium mb-0.5 group-hover:text-foreground">{item.label}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Help Button */}
      <ContextualHelpButton pageId="ai-chat" />
    </div>
  );
}
