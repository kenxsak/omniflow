'use client';

import { StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/animated';
import { Icon } from '@iconify/react';
import type { DealStats } from '@/types/crm';

interface DashboardMetricsProps {
  dealStats: DealStats | null;
  leadCount: number;
}

export function DashboardMetrics({ dealStats, leadCount }: DashboardMetricsProps) {
  const pipelineValue = dealStats?.totalPipelineValue || 0;
  const conversionRate = dealStats?.conversionRate || 0;
  const wonRevenue = dealStats?.wonValue || 0;

  const metrics = [
    {
      title: 'PIPELINE VALUE',
      value: pipelineValue,
      prefix: '$',
      icon: 'solar:wallet-linear',
      subtitle: `${dealStats?.openDeals || 0} open deals`,
    },
    {
      title: 'WON REVENUE',
      value: wonRevenue,
      prefix: '$',
      icon: 'solar:cup-star-linear',
      subtitle: `${dealStats?.wonDeals || 0} deals closed`,
    },
    {
      title: 'CONVERSION RATE',
      value: conversionRate,
      suffix: '%',
      decimals: 1,
      icon: 'solar:chart-linear',
      subtitle: 'Deals won vs closed',
    },
    {
      title: 'TOTAL CONTACTS',
      value: leadCount,
      icon: 'solar:users-group-two-rounded-linear',
      subtitle: leadCount > 0 ? 'In your CRM' : 'Add contacts to start',
    },
  ];

  return (
    <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric) => (
        <StaggerItem key={metric.title}>
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            {/* Accent bar at top - Clerk style */}
            <div className="absolute inset-x-8 sm:inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground">
                  {metric.title}
                </span>
                <Icon icon={metric.icon} className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60" />
              </div>
              <div className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                <AnimatedCounter 
                  value={metric.value} 
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  decimals={metric.decimals}
                  duration={1.2} 
                />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                {metric.subtitle}
              </p>
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
