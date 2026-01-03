"use client";

/**
 * Conversion Funnel Chart Component - v3.2
 * Fresh rewrite with modern design
 */

import { Icon } from '@iconify/react';
import type { ConversionFunnel } from '@/types/analytics';
import { formatNumber, formatPercentage } from '@/lib/analytics-service';
import { useCurrency } from '@/contexts/currency-context';
import { cn } from '@/lib/utils';

interface ConversionFunnelChartProps {
  funnel: ConversionFunnel;
}

export default function ConversionFunnelChart({ funnel }: ConversionFunnelChartProps) {
  const { formatCurrency } = useCurrency();
  const { stages, overallConversionRate, dropOffPoints } = funnel;
  
  const maxCount = stages.views.count || 1;
  const viewPercent = 100;
  const leadPercent = Math.max((stages.leads.count / maxCount) * 100, 10);
  const engagedPercent = Math.max((stages.engaged.count / maxCount) * 100, 10);
  const revenuePercent = Math.max((stages.revenue.customerCount / maxCount) * 100, 10);

  const funnelData = [
    { label: stages.views.label, count: stages.views.count, sub: `${stages.views.unique} unique`, pct: viewPercent, conv: '100%', bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', icon: 'solar:eye-bold' },
    { label: stages.leads.label, count: stages.leads.count, sub: `${formatPercentage(stages.leads.conversionRate)} conv`, pct: leadPercent, conv: formatPercentage(stages.leads.conversionRate), bg: 'bg-teal-500', light: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-600 dark:text-teal-400', icon: 'solar:users-group-rounded-bold' },
    { label: stages.engaged.label, count: stages.engaged.count, sub: `${formatPercentage(stages.engaged.conversionRate)} conv`, pct: engagedPercent, conv: formatPercentage(stages.engaged.conversionRate), bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', icon: 'solar:chat-round-dots-bold' },
    { label: stages.revenue.label, count: stages.revenue.customerCount, sub: formatCurrency(stages.revenue.totalRevenue), pct: revenuePercent, conv: formatPercentage(stages.revenue.conversionRate), bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-400', icon: 'solar:wallet-money-bold' },
  ];

  const health = overallConversionRate >= 5 ? 'excellent' : overallConversionRate >= 2 ? 'good' : overallConversionRate >= 0.5 ? 'average' : 'low';
  const healthColors = { excellent: 'text-emerald-500', good: 'text-blue-500', average: 'text-amber-500', low: 'text-rose-500' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Icon icon="solar:filter-bold" className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Conversion Funnel</h3>
            <p className="text-xs text-muted-foreground">Views → Leads → Engaged → Revenue</p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-2xl font-bold", healthColors[health])}>{formatPercentage(overallConversionRate)}</div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Overall Rate</p>
        </div>
      </div>

      {/* Funnel Stages */}
      <div className="space-y-4">
        {funnelData.map((stage, i) => (
          <div key={stage.label}>
            {/* Stage Card */}
            <div className={cn("rounded-xl border p-4", stage.light, "border-stone-200 dark:border-stone-700")}>
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stage.bg)}>
                  <Icon icon={stage.icon} className="h-6 w-6 text-white" />
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{stage.label}</p>
                      <p className="text-xs text-muted-foreground">{stage.sub}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xl font-bold", stage.text)}>{formatNumber(stage.count)}</p>
                      {i > 0 && <p className="text-[10px] text-muted-foreground">{stage.conv}</p>}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-3 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", stage.bg)} style={{ width: `${stage.pct}%` }}>
                      <span className="sr-only">{stage.pct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{stage.pct.toFixed(0)}% of total</p>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            {i < funnelData.length - 1 && (
              <div className="flex justify-center py-2">
                <Icon icon="solar:arrow-down-bold" className="h-5 w-5 text-stone-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Drop-off Section */}
      {dropOffPoints.length > 0 && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-200 dark:bg-rose-800 flex items-center justify-center">
              <Icon icon="solar:graph-down-bold" className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="font-semibold text-rose-700 dark:text-rose-300">Drop-off Analysis</p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400">Areas needing attention</p>
            </div>
          </div>
          <div className="space-y-3">
            {dropOffPoints.map((point, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{point.stage}</span>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900 px-2 py-0.5 rounded-full">
                    {formatPercentage(point.dropOffRate)} drop
                  </span>
                </div>
                <ul className="space-y-1">
                  {point.recommendations.map((rec, ri) => (
                    <li key={ri} className="text-xs text-muted-foreground flex items-start gap-2">
                      <Icon icon="solar:lightbulb-bolt-bold" className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
        <div className="text-center p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{formatNumber(stages.views.count)}</p>
          <p className="text-[10px] text-muted-foreground">Views</p>
        </div>
        <div className="text-center p-2.5 sm:p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
          <p className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400">{formatNumber(stages.leads.count)}</p>
          <p className="text-[10px] text-muted-foreground">Leads</p>
        </div>
        <div className="text-center p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(stages.engaged.count)}</p>
          <p className="text-[10px] text-muted-foreground">Engaged</p>
        </div>
        <div className="text-center p-2.5 sm:p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(stages.revenue.totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground">Revenue</p>
        </div>
      </div>
    </div>
  );
}
