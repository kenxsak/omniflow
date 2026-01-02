'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import ChatInterface from '@/components/ai-chat/chat-interface';
import ConversationHistorySidebar from '@/components/ai-chat/conversation-history-sidebar';
import { getAgentById } from '@/config/ai-agents';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Desktop collapsed by default
  
  const agent = getAgentById(agentId);
  
  if (!agent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Icon icon="solar:robot-linear" className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold mb-2">Agent Not Found</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md">
            The AI agent you're looking for doesn't exist.
          </p>
          <Link href="/ai-chat">
            <Button variant="outline" size="sm" className="h-9">
              <Icon icon="solar:arrow-left-linear" className="mr-2 h-4 w-4" />
              Back to All Agents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const showGuidedTrendingTopics = agent.id === 'seo-expert';
  const showGuidedReviewResponder = agent.id === 'customer-service';

  return (
    <TooltipProvider>
      <div className="space-y-2 sm:space-y-3">
        {/* Page Header */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/ai-chat">
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Icon icon="solar:arrow-left-linear" className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{agent.name}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">{agent.description}</p>
            </div>
          </div>
          <Button onClick={handleNewChat} size="sm" className="h-8 flex-shrink-0">
            <Icon icon="solar:add-circle-linear" className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </header>

        {/* Chat Container */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          {/* Top accent line */}
          <div className="absolute inset-x-4 sm:inset-x-8 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
          
          <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-180px)] flex">
            {/* Desktop Collapsible Sidebar - Genspark Style */}
            <aside 
              className={cn(
                "hidden md:flex flex-col border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 transition-all duration-200 ease-in-out",
                isSidebarExpanded ? "w-64" : "w-12"
              )}
            >
              {/* Sidebar Toggle & New Chat */}
              <div className="flex-shrink-0 p-2 border-b border-stone-200 dark:border-stone-800">
                <div className={cn("flex items-center", isSidebarExpanded ? "justify-between" : "justify-center")}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Icon 
                          icon={isSidebarExpanded ? "solar:sidebar-minimalistic-linear" : "solar:hamburger-menu-linear"} 
                          className="h-4 w-4 text-muted-foreground" 
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {isSidebarExpanded ? 'Collapse' : 'Expand'}
                    </TooltipContent>
                  </Tooltip>
                  
                  {isSidebarExpanded && (
                    <Button 
                      onClick={handleNewChat} 
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Icon icon="solar:add-circle-linear" className="h-3.5 w-3.5 mr-1.5" />
                      New
                    </Button>
                  )}
                </div>
              </div>

              {/* Collapsed: Icon-only quick actions */}
              {!isSidebarExpanded && (
                <div className="flex-1 flex flex-col items-center py-2 space-y-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleNewChat}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Icon icon="solar:add-circle-linear" className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">New Chat</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setIsSidebarExpanded(true)}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Icon icon="solar:history-linear" className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">Chat History</TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Expanded: Full sidebar content */}
              {isSidebarExpanded && (
                <div className="flex-1 overflow-hidden">
                  <ConversationHistorySidebar
                    currentSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                    compact
                  />
                </div>
              )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Mobile Header with Sheet */}
              <div className="md:hidden h-10 flex-shrink-0 border-b border-stone-200 dark:border-stone-800 px-2 flex items-center gap-2">
                <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon icon="solar:hamburger-menu-linear" className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <ConversationHistorySidebar
                      currentSessionId={currentSessionId}
                      onSelectSession={handleSelectSession}
                      onNewChat={handleNewChat}
                    />
                  </SheetContent>
                </Sheet>
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  History
                </span>
              </div>
              
              {/* Chat Interface */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface 
                  initialPrompt="" 
                  selectedAgent={agent}
                  showGuidedTrendingTopics={showGuidedTrendingTopics}
                  showGuidedReviewResponder={showGuidedReviewResponder}
                  sessionId={currentSessionId || undefined}
                  onSessionCreated={handleSessionCreated}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
