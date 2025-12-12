'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { getPersonalizedQuickActions } from '@/app/actions/enhanced-quick-actions';
import type { EnhancedQuickAction, UrgencyLevel } from '@/types/behavior';
import gsap from 'gsap';

interface QuickActionsPanelProps {
  companyId?: string;
}

const iconMap: Record<string, string> = {
  'user-plus': 'solar:user-plus-linear',
  'mail': 'solar:letter-linear',
  'message-square': 'solar:chat-square-linear',
  'wand-2': 'solar:magic-stick-3-linear',
  'file-text': 'solar:document-text-linear',
  'brain': 'solar:brain-linear',
  'credit-card': 'solar:card-linear',
  'link': 'solar:link-minimalistic-2-linear',
  'zap': 'solar:bolt-circle-linear',
};

const badgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  'NEW': 'info',
  'TRENDING': 'gradient',
  'RECOMMENDED': 'secondary',
  'QUICK WIN': 'success',
  'DORMANT': 'warning',
  'TRY AGAIN': 'secondary',
  'URGENT': 'destructive',
};

const urgencyConfig: Record<UrgencyLevel, { 
  borderColor: string; 
  bgColor: string;
  textColor: string;
}> = {
  critical: { 
    borderColor: 'border-red-500/50', 
    bgColor: 'bg-red-500/5',
    textColor: 'text-red-600 dark:text-red-400',
  },
  high: { 
    borderColor: 'border-amber-500/50', 
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  medium: { 
    borderColor: 'border-blue-500/30', 
    bgColor: 'bg-blue-500/5',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  low: { 
    borderColor: 'border-border', 
    bgColor: '',
    textColor: 'text-muted-foreground',
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

  // Animate cards when loaded - instant
  useEffect(() => {
    if (!isLoading && actions.length > 0 && cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('[data-action-card]');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0, ease: 'power2.out' }
      );
    }
  }, [isLoading, actions]);

  if (!companyId || isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-background p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <Icon icon="solar:magic-stick-3-linear" className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Personalized suggestions based on your activity
          </p>
        </div>
        <CardContent className="p-4 sm:p-6 flex justify-center items-center h-32 sm:h-40">
          <div className="flex flex-col items-center gap-2">
            <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden border-destructive/30">
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-background p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <Icon icon="solar:magic-stick-3-linear" className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-center gap-2 py-6 sm:py-8 text-muted-foreground">
            <Icon icon="solar:danger-circle-linear" className="h-4 w-4" />
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-background p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <Icon icon="solar:magic-stick-3-linear" className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold">Recommended Actions</h2>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
            You're all caught up! Great work. 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-background p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4 text-primary" />
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
            const actionIcon = iconMap[action.icon] || 'solar:document-text-linear';
            const urgencyStyle = urgencyConfig[action.urgency];
            
            return (
              <Card
                key={action.id}
                data-action-card
                className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  action.highlighted
                    ? `${urgencyStyle.borderColor} ${urgencyStyle.bgColor}`
                    : 'hover:border-primary/30'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Header */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                        action.highlighted
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                      } transition-colors`}
                    >
                      <Icon icon={actionIcon} className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 sm:gap-2">
                        <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2">
                          {action.title}
                        </h3>
                        {action.badge && (
                          <Badge 
                            variant={badgeVariants[action.badge] as any || 'outline'}
                            size="sm"
                            className="shrink-0"
                          >
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      {action.timeSinceLastAction && (
                        <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">
                          <Icon icon="solar:clock-circle-linear" className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>Last: {action.timeSinceLastAction}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                    {action.description}
                  </p>

                  {/* Priority indicator */}
                  {(action.urgency === 'critical' || action.urgency === 'high') && (
                    <div className="mb-2 sm:mb-3">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                        <span className={urgencyStyle.textColor}>
                          {action.urgency === 'critical' ? 'Critical' : 'High Priority'}
                        </span>
                        <span className="text-muted-foreground">
                          {action.score.total}/100
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            action.urgency === 'critical' 
                              ? 'bg-red-500' 
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${action.score.total}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <Button
                    asChild
                    size="sm"
                    variant={action.highlighted ? 'default' : 'outline'}
                    className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <Link href={action.link} className="flex items-center justify-center gap-1">
                      {action.urgency === 'critical' ? 'Take Action' : 'Go'}
                      <Icon icon="solar:arrow-right-linear" className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span>Top {actions.length} recommendations</span>
              {actions.some(a => a.urgency === 'critical') && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <Icon icon="solar:danger-circle-linear" className="h-3 w-3" />
                  {actions.filter(a => a.urgency === 'critical').length} critical
                </span>
              )}
            </div>
            <span>Refreshes daily</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
