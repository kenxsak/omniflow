'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Animated } from '@/components/ui/animated';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { getPersonalizedQuickActions } from '@/app/actions/enhanced-quick-actions';
import type { EnhancedQuickAction, UrgencyLevel } from '@/types/behavior';
import type { DealStats } from '@/types/crm';
import gsap from 'gsap';

interface DashboardActionsProps {
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  companyId?: string;
  leadCount: number;
  dealStats: DealStats | null;
}

// Status configuration - Autosend style with colored dots and borders
const getStatusConfig = (urgency: UrgencyLevel) => {
  const config: Record<UrgencyLevel, { label: string; dotBg: string; dotBorder: string }> = {
    critical: { label: 'Not Selected', dotBg: 'bg-rose-300', dotBorder: 'border-rose-700' },
    high: { label: 'Pending', dotBg: 'bg-amber-300', dotBorder: 'border-amber-700' },
    medium: { label: 'Missing', dotBg: 'bg-amber-300', dotBorder: 'border-amber-700' },
    low: { label: 'Optional', dotBg: 'bg-stone-300', dotBorder: 'border-stone-500' },
  };
  return config[urgency] || config.low;
};

export function DashboardActions({ 
  aiCreditsUsed, 
  aiCreditsLimit, 
  companyId,
  leadCount,
  dealStats
}: DashboardActionsProps) {
  const [actions, setActions] = useState<EnhancedQuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const stepsRef = useRef<HTMLDivElement>(null);

  const aiUsagePercent = aiCreditsLimit > 0 ? (aiCreditsUsed / aiCreditsLimit) * 100 : 0;
  const showNextSteps = leadCount < 10 || !dealStats || dealStats.totalDeals === 0;

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    async function fetchActions() {
      try {
        setIsLoading(true);
        const result = await getPersonalizedQuickActions(companyId!);
        if (result?.success && result.data) {
          setActions(result.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Error loading quick actions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActions();
  }, [companyId]);

  useEffect(() => {
    if (!isLoading && actions.length > 0 && stepsRef.current) {
      const steps = stepsRef.current.querySelectorAll('[data-step]');
      gsap.fromTo(
        steps,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [isLoading, actions]);

  return (
    <div className="space-y-4">
      {/* AI Credits - Clerk style */}
      {aiCreditsLimit > 0 && (
        <Animated animation="fadeUp">
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-[oklch(0.55_0.15_300)] dark:bg-[oklch(0.65_0.16_300)]" />
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                AI CREDITS
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums font-mono">
                {aiCreditsUsed.toLocaleString()} / {aiCreditsLimit.toLocaleString()}
              </span>
            </div>
            <div className="p-4">
              <Progress value={aiUsagePercent} className="h-1" />
            </div>
          </div>
        </Animated>
      )}

      {/* Main Actions Card - Autosend Style */}
      {companyId && (
        <Animated animation="fadeUp">
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="bg-card">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : actions.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div ref={stepsRef}>
                  {actions.map((action, index) => {
                    const status = getStatusConfig(action.urgency);
                    
                    return (
                      <div
                        key={action.id}
                        data-step
                        className="flex items-start gap-6 px-6 py-6 border-b border-border last:border-b-0"
                      >
                        {/* Step Number - Autosend style: filled bg circle */}
                        <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <p className="text-foreground font-medium text-base font-mono text-center">
                            {index + 1}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="space-y-4 flex-1">
                          <div>
                            {/* Title + Status badge row */}
                            <div className="flex items-center gap-4 mb-2">
                              <p className="text-stone-800 dark:text-stone-200 font-medium text-base">
                                {action.title}
                              </p>
                              {/* Status badge - Autosend style with colored dot and border */}
                              <span className="flex items-center gap-2">
                                <span className={`size-2.5 border-[1.5px] rounded-full ${status.dotBg} ${status.dotBorder}`} />
                                <span className="text-stone-800 dark:text-stone-200 font-semibold text-xs tracking-[0.48px] font-mono uppercase">
                                  {status.label}
                                </span>
                              </span>
                            </div>
                            <p className="text-stone-500 dark:text-stone-400 font-normal text-sm">
                              {action.description}
                            </p>
                          </div>
                          
                          {/* Action Button - Autosend filled style */}
                          <Button asChild size="sm">
                            <Link href={action.link} className="inline-flex items-center gap-1">
                              {action.urgency === 'critical' ? 'Take Action' : 
                               action.urgency === 'high' ? 'Complete' : 
                               action.urgency === 'medium' ? 'Set Up' : 'View'}
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" className="-mr-1">
                                <path d="M5 12H19.5833M19.5833 12L12.5833 5M19.5833 12L12.5833 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                              </svg>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Animated>
      )}

      {/* Next Steps - Only show if needed (Clerk style) */}
      {showNextSteps && !companyId && (
        <Animated animation="fadeUp">
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="font-semibold text-base text-foreground">Getting Started</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quick actions to set up your workspace.
              </p>
            </div>
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {[
                { 
                  show: leadCount < 10,
                  title: 'Add contacts',
                  description: 'Import or add contacts to build your pipeline.',
                  href: '/crm',
                  label: 'ADD CONTACTS',
                  status: 'PENDING'
                },
                { 
                  show: !dealStats || dealStats.totalDeals === 0,
                  title: 'Create a deal',
                  description: 'Track opportunities and forecast revenue.',
                  href: '/crm/pipeline',
                  label: 'CREATE DEAL',
                  status: 'NOT STARTED'
                },
              ].filter(step => step.show).map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
                >
                  <div className="flex-shrink-0 size-7 rounded-full border-2 border-stone-200 dark:border-stone-700 flex items-center justify-center">
                    <span className="text-xs font-semibold text-muted-foreground font-mono">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground">{step.title}</h3>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 border-[1.5px] rounded-full bg-amber-300 border-amber-700" />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                          {step.status}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 px-3 text-xs font-medium"
                    >
                      <Link href={step.href} className="inline-flex items-center gap-1.5">
                        {step.label}
                        <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Animated>
      )}
    </div>
  );
}
