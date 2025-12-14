'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export interface QuickTip {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

interface QuickTipsProps {
  pageId: string;
  tips: QuickTip[];
  showDismissAll?: boolean;
}

const DISMISSED_TIPS_KEY = 'omniflow_dismissed_tips';

function getDismissedTips(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(DISMISSED_TIPS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveDismissedTips(dismissed: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(dismissed));
  } catch {
    console.error('Failed to save dismissed tips');
  }
}

export function QuickTips({ pageId, tips, showDismissAll = true }: QuickTipsProps) {
  const { appUser } = useAuth();
  const [dismissedTipIds, setDismissedTipIds] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = getDismissedTips();
    const companyDismissed = dismissed[appUser?.companyId || 'global'] || [];
    setDismissedTipIds(companyDismissed);
    
    const allDismissed = tips.every(tip => companyDismissed.includes(`${pageId}_${tip.id}`));
    setIsVisible(!allDismissed);
  }, [pageId, tips, appUser?.companyId]);

  const dismissTip = (tipId: string) => {
    const fullTipId = `${pageId}_${tipId}`;
    const newDismissed = [...dismissedTipIds, fullTipId];
    setDismissedTipIds(newDismissed);
    
    const dismissed = getDismissedTips();
    dismissed[appUser?.companyId || 'global'] = newDismissed;
    saveDismissedTips(dismissed);

    const allDismissed = tips.every(tip => newDismissed.includes(`${pageId}_${tip.id}`));
    if (allDismissed) {
      setIsVisible(false);
    }
  };

  const dismissAll = () => {
    const newDismissed = tips.map(tip => `${pageId}_${tip.id}`);
    setDismissedTipIds([...dismissedTipIds, ...newDismissed]);
    
    const dismissed = getDismissedTips();
    dismissed[appUser?.companyId || 'global'] = [...(dismissed[appUser?.companyId || 'global'] || []), ...newDismissed];
    saveDismissedTips(dismissed);
    setIsVisible(false);
  };

  const visibleTips = tips.filter(tip => !dismissedTipIds.includes(`${pageId}_${tip.id}`));

  if (!isVisible || visibleTips.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            TIPS
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-warning">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            {visibleTips.length} NEW
          </span>
        </div>
        {showDismissAll && visibleTips.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={dismissAll}
            className="h-7 text-xs text-muted-foreground"
          >
            Dismiss all
          </Button>
        )}
      </div>
      
      <CardContent className="p-0 divide-y divide-border">
        {visibleTips.map((tip) => (
          <div 
            key={tip.id}
            className="flex items-start gap-3 px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">{tip.title}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">{tip.description}</p>
              {tip.actionLabel && tip.actionHref && (
                <Link 
                  href={tip.actionHref}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium mt-1.5"
                >
                  {tip.actionLabel.toUpperCase()}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => dismissTip(tip.id)}
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export const CRM_PAGE_TIPS: Record<string, QuickTip[]> = {
  crm: [
    {
      id: 'import-contacts',
      title: 'Import your contacts quickly',
      description: 'Use the Import button to upload contacts from a CSV file in seconds.',
    },
    {
      id: 'filter-contacts',
      title: 'Filter by status',
      description: 'Use the status filters to focus on New leads or Qualified prospects.',
    },
  ],
  pipeline: [
    {
      id: 'drag-deals',
      title: 'Drag to update deals',
      description: 'Move deals between stages by dragging cards across columns.',
    },
    {
      id: 'pipeline-value',
      title: 'Track your pipeline value',
      description: 'The header shows your total pipeline value and weighted forecast.',
    },
  ],
  deals: [
    {
      id: 'link-contacts',
      title: 'Link deals to contacts',
      description: 'Associate each deal with a contact to track the full customer journey.',
    },
    {
      id: 'set-probability',
      title: 'Set deal probability',
      description: 'Adjust probability to get more accurate revenue forecasts.',
    },
  ],
  dashboard: [
    {
      id: 'check-pipeline',
      title: 'Monitor your pipeline health',
      description: 'Check the Pipeline Value card to see your total open opportunities.',
      actionLabel: 'View pipeline',
      actionHref: '/crm/pipeline',
    },
    {
      id: 'conversion-rate',
      title: 'Track your conversion rate',
      description: 'See what percentage of deals you\'re winning to improve your sales process.',
    },
  ],
  tasks: [
    {
      id: 'link-tasks',
      title: 'Link tasks to contacts',
      description: 'Connect tasks to leads to keep everything organized.',
    },
    {
      id: 'set-priority',
      title: 'Prioritize important tasks',
      description: 'Set High priority for urgent follow-ups to stay on top of opportunities.',
    },
  ],
};
