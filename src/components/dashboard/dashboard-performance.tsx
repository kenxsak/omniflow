'use client';

import { Animated } from '@/components/ui/animated';

import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { PipelineConversionChart } from '@/components/dashboard/pipeline-conversion-chart';
import type { WeekOverWeekStats, PipelineStageConversion, SalesTrendData, TeamPerformer } from '@/app/actions/analytics-dashboard-actions';

interface DashboardPerformanceProps {
  weekOverWeek: WeekOverWeekStats | null;
  topPerformers: TeamPerformer[];
  salesTrend: SalesTrendData[];
  pipelineConversion: PipelineStageConversion[];
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}



export function DashboardPerformance({ 
  weekOverWeek, 
  topPerformers, 
  salesTrend, 
  pipelineConversion 
}: DashboardPerformanceProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Week over Week + Top Performers */}
      <Animated animation="fadeUp">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {/* Week over Week - Clerk style */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-[oklch(0.55_0.15_250)] dark:bg-[oklch(0.65_0.16_250)]" />
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                WEEK OVER WEEK
              </span>
              {weekOverWeek && (
                <span className="flex items-center gap-1">
                  <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${
                    weekOverWeek.changes.revenueWon >= 0 ? 'bg-emerald-300 border-emerald-700' : 'bg-rose-300 border-rose-700'
                  }`} />
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                    {weekOverWeek.changes.revenueWon >= 0 ? 'UP' : 'DOWN'}
                  </span>
                </span>
              )}
            </div>
            <div className="p-3 sm:p-4">
              {!weekOverWeek ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No data available yet. Start tracking your sales!
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { 
                      label: 'CONTACTS', 
                      current: weekOverWeek.currentWeek.newContacts, 
                      previous: weekOverWeek.previousWeek.newContacts,
                      change: weekOverWeek.changes.newContacts 
                    },
                    { 
                      label: 'CREATED', 
                      current: weekOverWeek.currentWeek.dealsCreated, 
                      previous: weekOverWeek.previousWeek.dealsCreated,
                      change: weekOverWeek.changes.dealsCreated 
                    },
                    { 
                      label: 'WON', 
                      current: weekOverWeek.currentWeek.dealsWon, 
                      previous: weekOverWeek.previousWeek.dealsWon,
                      change: weekOverWeek.changes.dealsWon 
                    },
                    { 
                      label: 'REVENUE', 
                      current: weekOverWeek.currentWeek.revenueWon, 
                      previous: weekOverWeek.previousWeek.revenueWon,
                      change: weekOverWeek.changes.revenueWon,
                      isCurrency: true
                    },
                  ].map((metric) => {
                    const isPositive = metric.change > 0;
                    const isNeutral = metric.change === 0;
                    
                    return (
                      <div 
                        key={metric.label}
                        className="p-2 sm:p-3 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50"
                      >
                        <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {metric.label}
                        </span>
                        <div className="flex items-baseline gap-1 sm:gap-2 mt-1">
                          <span className="text-sm sm:text-lg font-semibold tabular-nums text-foreground">
                            {metric.isCurrency ? formatCurrency(metric.current) : metric.current}
                          </span>
                          <span className="text-[9px] sm:text-[11px] text-muted-foreground tabular-nums font-mono">
                            vs {metric.isCurrency ? formatCurrency(metric.previous) : metric.previous}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1">
                          <span className={`size-1 sm:size-1.5 rounded-full ${
                            isNeutral ? 'bg-stone-400' : isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground font-mono">
                            {isNeutral ? '—' : `${Math.abs(metric.change).toFixed(0)}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Performers / Your Performance - Clerk style */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-[oklch(0.70_0.14_70)] dark:bg-[oklch(0.75_0.15_70)]" />
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {topPerformers.length > 1 ? 'TOP PERFORMERS' : 'YOUR PERFORMANCE'}
              </span>
            </div>
            <div className="p-3 sm:p-4">
              {topPerformers.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    Close deals to appear on the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 dark:divide-stone-800">
                  {topPerformers.slice(0, 3).map((performer, index) => (
                    <div 
                      key={performer.userId}
                      className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 size-6 sm:size-7 rounded-full border-2 border-stone-200 dark:border-stone-700 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground font-mono">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate text-foreground">{performer.userName}</span>
                          {index === 0 && topPerformers.length > 1 && (
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 sm:size-2 border-[1.5px] rounded-full bg-amber-300 border-amber-700" />
                              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                                TOP
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-mono">
                          <span>{performer.dealsWon} won</span>
                          <span className="hidden sm:inline">{performer.conversionRate.toFixed(0)}% rate</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-xs sm:text-sm tabular-nums text-foreground">
                          {formatCurrency(performer.revenueWon)}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-muted-foreground tabular-nums font-mono hidden sm:block">
                          Avg: {formatCurrency(performer.avgDealSize)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Animated>

      {/* Charts */}
      <Animated animation="fadeUp">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <SalesTrendChart data={salesTrend} chartType="area" />
          <PipelineConversionChart data={pipelineConversion} />
        </div>
      </Animated>
    </div>
  );
}
