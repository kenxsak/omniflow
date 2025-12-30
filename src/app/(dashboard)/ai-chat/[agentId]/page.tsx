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

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const agent = getAgentById(agentId);
  
  if (!agent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:robot-linear" className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Agent Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            The AI agent you're looking for doesn't exist.
          </p>
          <Link href="/ai-chat">
            <Button variant="outline" size="sm">
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
    <div className="space-y-4">
      {/* Page Header - matching dashboard style */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ai-chat">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon icon="solar:arrow-left-linear" className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{agent.name}</h1>
            <p className="text-xs text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        <Button onClick={handleNewChat} size="sm" className="h-8">
          <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1.5" />
          New Chat
        </Button>
      </header>

      {/* Chat Container - matching card style */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        {/* Top accent line like dashboard cards */}
        <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
        
        <div className="h-[calc(100vh-200px)] flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-64 flex-col border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20">
            <ConversationHistorySidebar
              currentSessionId={currentSessionId}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header */}
            <div className="lg:hidden h-12 flex-shrink-0 border-b border-stone-200 dark:border-stone-800 px-3 flex items-center gap-2">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Icon icon="solar:hamburger-menu-linear" className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <ConversationHistorySidebar
                    currentSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                  />
                </SheetContent>
              </Sheet>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Chat History
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
  );
}
