import { Button } from '@/components/ui/button';
import { AIAgent } from '@/config/ai-agents';
import { Icon } from '@iconify/react';
import Link from 'next/link';

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

interface AgentCardProps {
  agent: AIAgent;
  onClick?: () => void;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const iconName = agentIcons[agent.id] || 'solar:stars-linear';

  const cardContent = (
    <div 
      className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 p-5 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer transition-all group h-full flex flex-col"
      onClick={onClick}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${agent.bgColor} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
        <Icon icon={iconName} className={`h-5 w-5 ${agent.color}`} />
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
  );

  // If onClick is provided, use it; otherwise wrap in Link
  if (onClick) {
    return cardContent;
  }

  return (
    <Link href={`/ai-chat/${agent.id}`}>
      {cardContent}
    </Link>
  );
}
