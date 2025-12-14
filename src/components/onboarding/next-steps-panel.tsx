'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import Link from 'next/link';
import type { DealStats } from '@/types/crm';

interface NextStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  actionLabel: string;
  priority: 'high' | 'medium' | 'low';
  condition: (data: NextStepsData) => boolean;
  completed: (data: NextStepsData) => boolean;
}

interface NextStepsData {
  contactCount: number;
  dealStats?: DealStats;
  hasSentCampaign: boolean;
  hasUsedAI: boolean;
}

const NEXT_STEPS: NextStep[] = [
  {
    id: 'add-contacts',
    title: 'Add more contacts',
    description: 'Build your contact list to grow your sales pipeline',
    icon: 'users',
    href: '/crm',
    actionLabel: 'Add Contacts',
    priority: 'high',
    condition: (data) => data.contactCount < 10,
    completed: (data) => data.contactCount >= 10,
  },
  {
    id: 'create-deal',
    title: 'Create your first deal',
    description: 'Track opportunities and forecast revenue',
    icon: 'dollar',
    href: '/crm/pipeline',
    actionLabel: 'Create Deal',
    priority: 'high',
    condition: (data) => !data.dealStats || data.dealStats.totalDeals === 0,
    completed: (data) => data.dealStats ? data.dealStats.totalDeals > 0 : false,
  },
  {
    id: 'view-pipeline',
    title: 'Review your pipeline',
    description: 'Visualize deals across stages',
    icon: 'pipeline',
    href: '/crm/pipeline',
    actionLabel: 'View Pipeline',
    priority: 'medium',
    condition: (data) => data.dealStats ? data.dealStats.totalDeals > 0 && data.dealStats.openDeals > 0 : false,
    completed: () => false,
  },
  {
    id: 'send-campaign',
    title: 'Send a marketing campaign',
    description: 'Reach your contacts with email, SMS, or WhatsApp',
    icon: 'send',
    href: '/campaigns',
    actionLabel: 'Create Campaign',
    priority: 'medium',
    condition: (data) => !data.hasSentCampaign && data.contactCount >= 5,
    completed: (data) => data.hasSentCampaign,
  },
  {
    id: 'try-ai',
    title: 'Try AI content generation',
    description: 'Let AI write compelling marketing messages',
    icon: 'sparkles',
    href: '/ai-assistant',
    actionLabel: 'Try AI',
    priority: 'low',
    condition: (data) => !data.hasUsedAI,
    completed: (data) => data.hasUsedAI,
  },
  {
    id: 'close-deal',
    title: 'Close a deal',
    description: 'Mark a deal as won to track revenue',
    icon: 'target',
    href: '/crm/pipeline',
    actionLabel: 'View Deals',
    priority: 'high',
    condition: (data) => data.dealStats ? data.dealStats.openDeals > 0 && data.dealStats.wonDeals === 0 : false,
    completed: (data) => data.dealStats ? data.dealStats.wonDeals > 0 : false,
  },
  {
    id: 'grow-revenue',
    title: 'Grow your pipeline',
    description: 'Add more high-value opportunities',
    icon: 'trending-up',
    href: '/crm/pipeline',
    actionLabel: 'Add Deals',
    priority: 'medium',
    condition: (data) => data.dealStats ? data.dealStats.wonDeals > 0 && data.dealStats.openDeals < 5 : false,
    completed: (data) => data.dealStats ? data.dealStats.openDeals >= 5 : false,
  },
];

// All priorities use neutral backgrounds - no colored tints
const priorityColors = {
  high: 'bg-muted/60 dark:bg-white/[0.06] text-muted-foreground',
  medium: 'bg-muted/60 dark:bg-white/[0.06] text-muted-foreground',
  low: 'bg-muted/60 dark:bg-white/[0.06] text-muted-foreground',
};

interface NextStepsPanelProps {
  contactCount: number;
  dealStats?: DealStats;
  hasSentCampaign?: boolean;
  hasUsedAI?: boolean;
  maxSteps?: number;
}

export function NextStepsPanel({
  contactCount,
  dealStats,
  hasSentCampaign = false,
  hasUsedAI = false,
  maxSteps = 3,
}: NextStepsPanelProps) {
  const data: NextStepsData = {
    contactCount,
    dealStats,
    hasSentCampaign,
    hasUsedAI,
  };

  const activeSteps = NEXT_STEPS
    .filter(step => step.condition(data) && !step.completed(data))
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, maxSteps);

  const completedCount = NEXT_STEPS.filter(step => step.completed(data)).length;

  if (activeSteps.length === 0) {
    return (
      <Card className="border-success-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <AppIcon name="check-circle" size={24} className="text-success-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">
                You're all set!
              </h3>
              <p className="text-sm text-muted-foreground">
                You've completed the essential setup steps. Keep growing your business!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center">
                <AppIcon name="target" size={16} className="text-muted-foreground" />
              </div>
              Next Steps
            </CardTitle>
            <CardDescription>
              Recommended actions to grow your business
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {completedCount}/{NEXT_STEPS.length} done
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeSteps.map((step) => {
            const isCompleted = step.completed(data);
            
            return (
              <div
                key={step.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <AppIcon name="check-circle" size={20} className="text-success-muted-foreground" />
                  ) : (
                    <AppIcon name="circle" size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className={`p-2 rounded-lg ${priorityColors[step.priority]}`}>
                  <AppIcon name={step.icon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.title}</span>
                    {step.priority === 'high' && (
                      <Badge variant="outline" className="text-xs">
                        Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={step.href}>
                    {step.actionLabel}
                    <AppIcon name="arrow-right" size={14} className="ml-1" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
