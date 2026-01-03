'use client';

import { StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/animated';
import { Icon } from '@iconify/react';
import { useCurrency } from '@/contexts/currency-context';
import type { DealStats } from '@/types/crm';

interface DashboardMetricsProps {
  dealStats: DealStats | null;
  leadCount: number;
}

export function DashboardMetrics({ dealStats, leadCount }: DashboardMetricsProps) {
  const { getCurrencyCode } = useCurrency();
  const pipelineValue = dealStats?.totalPipelineValue || 0;
  const conversionRate = dealStats?.conversionRate || 0;
  const wonRevenue = dealStats?.wonValue || 0;

  // Get currency symbol for AnimatedCounter prefix
  const currencySymbol = getCurrencyCode() === 'INR' ? '₹' : 
                         getCurrencyCode() === 'EUR' ? '€' : 
                         getCurrencyCode() === 'GBP' ? '£' : 
                         getCurrencyCode() === 'JPY' ? '¥' : '$';

  const metrics = [
    {
      title: 'PIPELINE VALUE',
      value: pipelineValue,
      prefix: currencySymbol,
      icon: 'solar:wallet-linear',
      subtitle: `${dealStats?.openDeals || 0} open deals`,
      accentColor: 'bg-[oklch(0.55_0.15_250)] dark:bg-[oklch(0.65_0.16_250)]',
      iconColor: 'text-[oklch(0.55_0.15_250)] dark:text-[oklch(0.65_0.16_250)]',
      valueColor: '#3b82f6',
    },
    {
      title: 'WON REVENUE',
      value: wonRevenue,
      prefix: currencySymbol,
      icon: 'solar:cup-star-linear',
      subtitle: `${dealStats?.wonDeals || 0} deals closed`,
      accentColor: 'bg-[oklch(0.60_0.16_145)] dark:bg-[oklch(0.68_0.17_145)]',
      iconColor: 'text-[oklch(0.60_0.16_145)] dark:text-[oklch(0.68_0.17_145)]',
      valueColor: '#10b981',
    },
    {
      title: 'CONVERSION RATE',
      value: conversionRate,
      suffix: '%',
      decimals: 1,
      icon: 'solar:chart-linear',
      subtitle: 'Deals won vs closed',
      accentColor: 'bg-[oklch(0.70_0.14_70)] dark:bg-[oklch(0.75_0.15_70)]',
      iconColor: 'text-[oklch(0.70_0.14_70)] dark:text-[oklch(0.75_0.15_70)]',
      valueColor: '#f59e0b',
    },
    {
      title: 'TOTAL CONTACTS',
      value: leadCount,
      icon: 'solar:users-group-two-rounded-linear',
      subtitle: leadCount > 0 ? 'In your CRM' : 'Add contacts to start',
      accentColor: 'bg-[oklch(0.55_0.15_300)] dark:bg-[oklch(0.65_0.16_300)]',
      iconColor: 'text-[oklch(0.55_0.15_300)] dark:text-[oklch(0.65_0.16_300)]',
      valueColor: '#8b5cf6',
    },
  ];

  return (
    <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((metric) => (
        <StaggerItem key={metric.title}>
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className={`absolute inset-x-8 sm:inset-x-12 top-0 h-0.5 rounded-b-full ${metric.accentColor}`} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground">
                  {metric.title}
                </span>
                <Icon icon={metric.icon} className={`h-4 w-4 sm:h-5 sm:w-5 ${metric.iconColor}`} />
              </div>
              <div className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums" style={{ color: metric.valueColor }}>
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
