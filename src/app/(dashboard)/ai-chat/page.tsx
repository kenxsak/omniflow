"use client";

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { 
  getPrimaryAgents, 
  getSecondaryAgents, 
  getGeneralAgent
} from '@/config/ai-agents';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import gsap from 'gsap';

// Map agent IDs to Solar icons (linear style for consistency)
const agentIcons: Record<string, string> = {
  'content-writer': 'solar:document-text-linear',
  'ad-strategist': 'solar:chart-2-linear',
  'visual-designer': 'solar:gallery-linear',
  'seo-expert': 'solar:magnifer-linear',
  'customer-service': 'solar:chat-round-dots-linear',
  'video-producer': 'solar:videocamera-record-linear',
  'general-assistant': 'solar:stars-linear',
};

export default function AIChatPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  
  const primaryAgents = getPrimaryAgents();
  const secondaryAgents = getSecondaryAgents();
  const generalAgent = getGeneralAgent();

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div ref={headerRef} className="text-center py-8 px-4">
        <div className="flex justify-end mb-4 max-w-5xl mx-auto">
          <ContextualHelpButton pageId="ai-chat" />
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-medium text-muted-foreground mb-4">
          <Icon icon="solar:magic-stick-3-linear" className="h-3.5 w-3.5" />
          AI-Powered Assistant
        </div>
        
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
          OmniFlow Super AI Agent
        </h1>
        
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-4">
          Ask anything, create anything - Choose your AI agent
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs text-muted-foreground">
            <Icon icon="solar:robot-linear" className="w-3.5 h-3.5" />
            {primaryAgents.length + secondaryAgents.length + 1} Agents
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs text-muted-foreground">
            <Icon icon="solar:bolt-circle-linear" className="w-3.5 h-3.5" />
            Instant Responses
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs text-muted-foreground">
            <Icon icon="solar:brain-linear" className="w-3.5 h-3.5" />
            Context-Aware
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* Primary Agents */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="solar:magic-stick-3-linear" className="w-4 h-4 text-muted-foreground" />
            Your AI Specialists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryAgents.map((agent) => (
              <Link key={agent.id} href={`/ai-chat/${agent.id}`}>
                <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer transition-all group h-full flex flex-col">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${agent.bgColor} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon icon={agentIcons[agent.id]} className={`h-5 w-5 ${agent.color}`} />
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="font-semibold text-base mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {agent.description}
                  </p>
                  
                  {/* Capabilities */}
                  <div className="space-y-1.5 mb-4 flex-1">
                    {agent.capabilities.slice(0, 4).map((capability, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0"></span>
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Button */}
                  <Button 
                    variant="outline" 
                    className="w-full h-9 text-xs group-hover:bg-foreground group-hover:text-background transition-colors"
                    size="sm"
                  >
                    Get Started
                    <Icon icon="solar:arrow-right-linear" className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Agents */}
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Icon icon="solar:bolt-circle-linear" className="w-4 h-4 text-muted-foreground" />
            Additional Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {secondaryAgents.map((agent) => (
              <Link key={agent.id} href={`/ai-chat/${agent.id}`}>
                <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer transition-all group h-full flex flex-col">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${agent.bgColor} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon icon={agentIcons[agent.id]} className={`h-5 w-5 ${agent.color}`} />
                  </div>
                  
                  {/* Title & Description */}
                  <h3 className="font-semibold text-base mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {agent.description}
                  </p>
                  
                  {/* Capabilities */}
                  <div className="space-y-1.5 mb-4 flex-1">
                    {agent.capabilities.slice(0, 4).map((capability, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0"></span>
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Button */}
                  <Button 
                    variant="outline" 
                    className="w-full h-9 text-xs group-hover:bg-foreground group-hover:text-background transition-colors"
                    size="sm"
                  >
                    Get Started
                    <Icon icon="solar:arrow-right-linear" className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* General Agent */}
        {generalAgent && (
          <Link href={`/ai-chat/${generalAgent.id}`}>
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer transition-all group mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon icon="solar:stars-linear" className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{generalAgent.name}</h3>
                  <p className="text-sm text-muted-foreground">{generalAgent.description}</p>
                </div>
                <Icon icon="solar:arrow-right-linear" className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
          </Link>
        )}

        {/* Info Banner */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">New Agent-Based Interface</h3>
              <p className="text-sm text-muted-foreground mb-3">
                We've organized AI features into specialized agents for easier discovery. Your classic tools are still available!
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/social-media">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Classic Content Factory
                  </Button>
                </Link>
                <Link href="/ai-campaign-manager">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Classic Ad Manager
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
