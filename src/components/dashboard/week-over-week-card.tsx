'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import { useCurrency } from '@/contexts/currency-context';
import type { WeekOverWeekStats } from '@/app/actions/analytics-dashboard-actions';

interface WeekOverWeekCardProps {
  stats: WeekOverWeekStats | null;
  loading?: boolean;
}

function ChangeIndicator({ change, label }: { change: number; label: string }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <div className="flex items-center gap-1">
      <AppIcon 
        name={isNeutral ? 'minus' : isPositive ? 'arrow-up-right' : 'arrow-down-right'} 
        size={12} 
        className="text-muted-foreground" 
      />
      <span className="text-xs font-medium text-muted-foreground">
        {isNeutral ? 'No change' : `${Math.abs(change).toFixed(0)}%`}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function WeekOverWeekCard({ stats, loading }: WeekOverWeekCardProps) {
  const { formatCurrency: formatCurrencyFull } = useCurrency();

  // Compact currency formatter using the user's currency
  const formatCompactCurrency = (amount: number): string => {
    if (amount >= 1000000) return formatCurrencyFull(amount / 1000000).replace(/\.00$/, '') + 'M';
    if (amount >= 1000) return formatCurrencyFull(amount / 1000).replace(/\.00$/, '') + 'K';
    return formatCurrencyFull(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="trending-up" size={16} className="text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold pt-1">This Week vs Last Week</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="trending-up" size={16} className="text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Week over Week</CardTitle>
              <CardDescription>Compare your performance to last week</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No data available yet. Start tracking your sales!
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'New Contacts',
      icon: 'users',
      current: stats.currentWeek.newContacts,
      previous: stats.previousWeek.newContacts,
      change: stats.changes.newContacts,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Deals Created',
      icon: 'target',
      current: stats.currentWeek.dealsCreated,
      previous: stats.previousWeek.dealsCreated,
      change: stats.changes.dealsCreated,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Deals Won',
      icon: 'check-circle',
      current: stats.currentWeek.dealsWon,
      previous: stats.previousWeek.dealsWon,
      change: stats.changes.dealsWon,
      format: (v: number) => v.toString(),
    },
    {
      label: 'Revenue Won',
      icon: 'dollar',
      current: stats.currentWeek.revenueWon,
      previous: stats.previousWeek.revenueWon,
      change: stats.changes.revenueWon,
      format: formatCompactCurrency,
    },
  ];

  const overallTrend = metrics.reduce((sum, m) => sum + m.change, 0) / metrics.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="trending-up" size={16} className="text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Week over Week</CardTitle>
              <CardDescription>Compare your performance to last week</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <AppIcon name={overallTrend >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={12} />
            {overallTrend >= 0 ? 'Improving' : 'Declining'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {metrics.map((metric) => (
              <div 
                key={metric.label}
                className="p-2.5 sm:p-3 rounded-lg border border-border/50 dark:border-white/[0.04] bg-muted/40 dark:bg-white/[0.04]"
              >
                <div className="h-6 w-6 rounded-lg bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center mb-2">
                  <AppIcon name={metric.icon} size={14} className="text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">{metric.label}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold">{metric.format(metric.current)}</span>
                  <span className="text-xs text-muted-foreground">
                    vs {metric.format(metric.previous)}
                  </span>
                </div>
                <ChangeIndicator change={metric.change} label="from last week" />
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
