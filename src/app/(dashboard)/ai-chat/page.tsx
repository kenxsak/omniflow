"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import ChatInterface from '@/components/ai-chat/chat-interface';
import AgentCard from '@/components/ai-chat/agent-card';
import ConversationHistorySidebar from '@/components/ai-chat/conversation-history-sidebar';
import { 
  getPrimaryAgents, 
  getSecondaryAgents, 
  getGeneralAgent,
  getAgentById
} from '@/config/ai-agents';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { Animated, StaggerContainer, StaggerItem } from '@/components/ui/animated';
import gsap from 'gsap';

export default function AIChatPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  
  const primaryAgents = getPrimaryAgents();
  const secondaryAgents = getSecondaryAgents();
  const generalAgent = getGeneralAgent();
  const selectedAgent = selectedAgentId ? getAgentById(selectedAgentId) : null;

  // GSAP animation for header - instant
  useEffect(() => {
    if (headerRef.current && !selectedAgent && !currentSessionId) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [selectedAgent, currentSessionId]);

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setSelectedAgentId(null);
    setIsSidebarOpen(false);
  };

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  if (selectedAgent || currentSessionId) {
    const showGuidedTrendingTopics = selectedAgent?.id === 'seo-expert';
    const showGuidedReviewResponder = selectedAgent?.id === 'customer-service';
    
    return (
      <div className="h-[calc(100vh-80px)] flex">
        <div className="hidden lg:block w-80 flex-shrink-0 border-r">
          <ConversationHistorySidebar
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 sm:p-4 sticky top-0 z-10">
            <div className="flex items-center gap-2 sm:gap-4">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden flex-shrink-0 touch-target"
                  >
                    <Icon icon="solar:hamburger-menu-linear" className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0">
                  <ConversationHistorySidebar
                    currentSessionId={currentSessionId}
                    onSelectSession={handleSelectSession}
                    onNewChat={handleNewChat}
                  />
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="hidden lg:flex"
              >
                <Icon icon="solar:arrow-left-linear" className="h-4 w-4 mr-2" />
                Back
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                className="lg:hidden flex-shrink-0"
              >
                <Icon icon="solar:arrow-left-linear" className="h-5 w-5" />
              </Button>

              {selectedAgent && (
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${selectedAgent.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <selectedAgent.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${selectedAgent.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-sm sm:text-base truncate">{selectedAgent.name}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate hidden xs:block">{selectedAgent.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <ChatInterface 
            initialPrompt="" 
            selectedAgent={selectedAgent || undefined}
            showGuidedTrendingTopics={showGuidedTrendingTopics}
            showGuidedReviewResponder={showGuidedReviewResponder}
            sessionId={currentSessionId || undefined}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
      {/* Header Section */}
      <div ref={headerRef} className="mb-6 sm:mb-8 text-center">
        <div className="flex justify-end mb-3 sm:mb-4">
          <ContextualHelpButton pageId="ai-chat" />
        </div>
        
        <Animated animation="scaleIn">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 border border-primary/20">
            <Icon icon="solar:magic-stick-3-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium">AI-Powered Assistant</span>
          </div>
        </Animated>
        
        <Animated animation="fadeUp">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            OmniFlow Super AI Agent
          </h1>
        </Animated>
        
        <Animated animation="fadeUp">
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-2 max-w-2xl mx-auto">
            Ask anything, create anything - Choose your AI agent
          </p>
        </Animated>

        {/* Quick Stats */}
        <Animated animation="fadeUp">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4">
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
              <Icon icon="solar:robot-linear" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {primaryAgents.length + secondaryAgents.length + 1} Agents
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
              <Icon icon="solar:bolt-circle-linear" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Instant Responses
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
              <Icon icon="solar:brain-linear" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Context-Aware
            </Badge>
          </div>
        </Animated>
      </div>

      {/* Primary Agents */}
      <div className="mb-6 sm:mb-8">
        <Animated animation="fadeUp">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Icon icon="solar:magic-stick-3-linear" className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Your AI Specialists
          </h2>
        </Animated>
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {primaryAgents.map((agent) => (
            <StaggerItem key={agent.id}>
              <AgentCard 
                agent={agent}
                onClick={() => setSelectedAgentId(agent.id)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Secondary Agents */}
      <div className="mb-6 sm:mb-8">
        <Animated animation="fadeUp">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Icon icon="solar:bolt-circle-linear" className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            Additional Tools
          </h2>
        </Animated>
        <StaggerContainer className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {secondaryAgents.map((agent) => (
            <StaggerItem key={agent.id}>
              <AgentCard 
                agent={agent}
                onClick={() => setSelectedAgentId(agent.id)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* General Agent */}
      {generalAgent && (
        <Animated animation="fadeUp">
          <Card 
            className="cursor-pointer hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group mb-6 sm:mb-8"
            onClick={() => setSelectedAgentId(generalAgent.id)}
          >
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${generalAgent.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <generalAgent.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${generalAgent.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">{generalAgent.name}</CardTitle>
                  <CardDescription className="text-sm truncate">{generalAgent.description}</CardDescription>
                </div>
                <Icon icon="solar:chat-square-linear" className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
          </Card>
        </Animated>
      )}

      {/* Info Banner */}
      <Animated animation="fadeUp">
        <div className="p-4 sm:p-5 bg-info-muted border border-info-border rounded-xl">
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:magic-stick-3-linear" className="h-5 w-5 text-info" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">
                New Agent-Based Interface
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                We've organized AI features into specialized agents for easier discovery. Your classic tools are still available!
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/social-media">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                    Classic Content Factory
                  </Button>
                </Link>
                <Link href="/ai-campaign-manager">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                    Classic Ad Manager
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Animated>
    </div>
  );
}
