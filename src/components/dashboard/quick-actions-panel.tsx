'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import Link from 'next/link';
import { getPersonalizedQuickActions } from '@/app/actions/enhanced-quick-actions';
import type { EnhancedQuickAction, UrgencyLevel } from '@/types/behavior';
import gsap from 'gsap';

interface QuickActionsPanelProps {
  companyId?: string;
}

const iconMap: Record<string, string> = {
  'user-plus': 'user-plus',
  'mail': 'mail',
  'message-square': 'message',
  'wand-2': 'sparkles',
  'file-text': 'file-text',
  'brain': 'ai',
  'credit-card': 'credit-card',
  'link': 'link',
  'zap': 'bolt',
};

const badgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  'NEW': 'secondary',
  'TRENDING': 'default',
  'RECOMMENDED': 'secondary',
  'QUICK WIN': 'success',
  'DORMANT': 'warning',
  'TRY AGAIN': 'secondary',
  'URGENT': 'destructive',
};

// Enterprise-grade urgency styling using design system semantic colors
const urgencyConfig: Record<UrgencyLevel, { 
  borderColor: string; 
  bgColor: string;
  textColor: string;
  iconBg: string;
  progressColor: string;
  buttonVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'warning';
  dotColor: string;
}> = {
  critical: { 
    borderColor: 'border-destructive-border', 
    bgColor: 'bg-destructive-muted/30',
    textColor: 'text-destructive',
    iconBg: 'bg-destructive-muted',
    progressColor: 'bg-destructive',
    buttonVariant: 'destructive',
    dotColor: 'bg-destructive',
  },
  high: { 
    borderColor: 'border-warning-border', 
    bgColor: 'bg-warning-muted/30',
    textColor: 'text-warning',
    iconBg: 'bg-warning-muted',
    progressColor: 'bg-warning',
    buttonVariant: 'warning',
    dotColor: 'bg-warning',
  },
  medium: { 
    borderColor: 'border-info-border', 
    bgColor: 'bg-info-muted/30',
    textColor: 'text-info',
    iconBg: 'bg-info-muted',
    progressColor: 'bg-info',
    buttonVariant: 'default',
    dotColor: 'bg-info',
  },
  low: { 
    borderColor: 'border-border', 
    bgColor: '',
    textColor: 'text-muted-foreground',
    iconBg: 'bg-muted',
    progressColor: 'bg-muted-foreground',
    buttonVariant: 'outline',
    dotColor: 'bg-muted-foreground',
  },
};

export default function QuickActionsPanel({ companyId }: QuickActionsPanelProps) {
  const [actions, setActions] = useState<EnhancedQuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    async function fetchActions() {
      if (!companyId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const result = await getPersonalizedQuickActions(companyId);
        
        if (result && result.success && result.data) {
          setActions(result.data);
        } else {
          setError(result?.error || 'Failed to load recommendations');
        }
      } catch (error) {
        console.error('Error loading personalized quick actions:', error);
        setError('Unable to load recommendations.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchActions();
  }, [companyId]);

  useEffect(() => {
    if (!isLoading && actions.length > 0 && cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-action-card]');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [isLoading, actions]);

  if (!companyId || isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center">
              <AppIcon name="sparkles" size={16} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Personalized suggestions based on your activity
          </p>
        </div>
        <CardContent className="p-4 sm:p-6 flex justify-center items-center h-32 sm:h-40">
          <div className="flex flex-col items-center gap-2">
            <AppIcon name="loader" size={24} className="animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center">
              <AppIcon name="sparkles" size={16} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center gap-2 py-6 sm:py-8 text-muted-foreground">
            <AppIcon name="alert" size={16} />
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/50 dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center">
              <AppIcon name="sparkles" size={16} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
            You're all caught up! Great work.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border/50 dark:border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center">
            <AppIcon name="sparkles" size={16} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Personalized suggestions for you
            </p>
          </div>
        </div>
      </div>
      <CardContent className="p-3 sm:p-6">
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {actions.map((action) => {
            const actionIcon = iconMap[action.icon] || 'file-text';
            const urgencyStyle = urgencyConfig[action.urgency];
            
            return (
              <Card
                key={action.id}
                data-action-card
                className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${urgencyStyle.borderColor} ${urgencyStyle.bgColor}`}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Icon with urgency-aware styling */}
                  <div className="mb-3">
                    <div className={`h-9 w-9 rounded-xl ${urgencyStyle.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                      <AppIcon name={actionIcon} size={18} className={urgencyStyle.textColor} />
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                      {action.title}
                    </h3>
                    {action.badge && (
                      <Badge 
                        variant={badgeVariants[action.badge] as any || 'outline'}
                        className="shrink-0 text-[10px] font-medium"
                      >
                        {action.badge}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {action.description}
                  </p>
                  
                  {action.timeSinceLastAction && (
                    <div className="flex items-center gap-1.5 mb-3 text-[10px] text-muted-foreground">
                      <AppIcon name="clock" size={10} />
                      <span>Last: {action.timeSinceLastAction}</span>
                    </div>
                  )}

                  {/* Priority indicator with semantic progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1.5">
                      <span className={`font-medium ${urgencyStyle.textColor}`}>
                        {action.urgency === 'critical' ? 'Requires Attention' : 
                         action.urgency === 'high' ? 'High Priority' : 
                         action.urgency === 'medium' ? 'Recommended' : 'Suggested'}
                      </span>
                      <span className="text-muted-foreground font-medium tabular-nums">
                        {action.score.total}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/80 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${urgencyStyle.progressColor}`}
                        style={{ width: `${action.score.total}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    variant={urgencyStyle.buttonVariant}
                    className="w-full h-9 text-xs sm:text-sm font-medium"
                  >
                    <Link href={action.link} className="flex items-center justify-center gap-1.5">
                      {action.urgency === 'critical' ? 'Take Action' : 
                       action.urgency === 'high' ? 'Review Now' : 'View'}
                      <AppIcon name="arrow-right" size={14} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="font-medium">{actions.length} recommendations</span>
              {actions.some(a => a.urgency === 'critical') && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                  {actions.filter(a => a.urgency === 'critical').length} require attention
                </span>
              )}
              {actions.some(a => a.urgency === 'high') && (
                <span className="flex items-center gap-1.5 text-warning">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  {actions.filter(a => a.urgency === 'high').length} high priority
                </span>
              )}
            </div>
            <span className="text-muted-foreground/70">Updated daily</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
