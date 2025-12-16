"use client";

/**
 * Conversion Funnel Chart Component
 * 
 * Visual funnel showing customer journey stages with conversion rates and drop-offs
 */

import { Icon } from '@iconify/react';
import type { ConversionFunnel } from '@/types/analytics';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/analytics-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConversionFunnelChartProps {
  funnel: ConversionFunnel;
}

export default function ConversionFunnelChart({ funnel }: ConversionFunnelChartProps) {
  const { stages, overallConversionRate, dropOffPoints } = funnel;
  
  // Calculate widths for visual funnel (proportional to count)
  const maxCount = stages.views.count;
  const viewWidth = 100;
  const leadWidth = Math.max((stages.leads.count / maxCount) * 100, 5);
  const engagedWidth = Math.max((stages.engaged.count / maxCount) * 100, 5);
  const revenueWidth = Math.max((stages.revenue.customerCount / maxCount) * 100, 5);
  
  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:filter-linear" className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Conversion Funnel
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">Track how visitors progress through your customer journey from initial view to revenue</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Customer journey from views to revenue</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-foreground">
              {formatPercentage(overallConversionRate)}
            </div>
            <div className="text-[10px] text-muted-foreground">Overall Conversion</div>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Visual Funnel */}
        <div className="space-y-3">
          {/* Stage 1: Views */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:eye-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{stages.views.label}</span>
              </div>
              <span className="text-muted-foreground">
                {formatNumber(stages.views.count)} ({formatNumber(stages.views.unique)} unique)
              </span>
            </div>
            <div 
              className="h-10 bg-stone-200 dark:bg-stone-700 rounded-lg flex items-center justify-center text-foreground text-xs font-medium"
              style={{ width: `${viewWidth}%` }}
            >
              100%
            </div>
          </div>
          
          {/* Stage 2: Leads */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{stages.leads.label}</span>
              </div>
              <span className="text-muted-foreground">
                {formatNumber(stages.leads.count)} leads ({formatPercentage(stages.leads.conversionRate)} conversion)
              </span>
            </div>
            <div 
              className="h-10 bg-stone-300 dark:bg-stone-600 rounded-lg flex items-center justify-center text-foreground text-xs font-medium"
              style={{ width: `${leadWidth}%` }}
            >
              {formatPercentage(stages.leads.conversionRate)}
            </div>
          </div>
          
          {/* Stage 3: Engaged */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:letter-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{stages.engaged.label}</span>
              </div>
              <span className="text-muted-foreground">
                {formatNumber(stages.engaged.count)} engaged ({formatPercentage(stages.engaged.conversionRate)} conversion)
              </span>
            </div>
            <div 
              className="h-10 bg-stone-400 dark:bg-stone-500 rounded-lg flex items-center justify-center text-white dark:text-stone-950 text-xs font-medium"
              style={{ width: `${engagedWidth}%` }}
            >
              {formatPercentage(stages.engaged.conversionRate)}
            </div>
          </div>
          
          {/* Stage 4: Revenue */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:wallet-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{stages.revenue.label}</span>
              </div>
              <span className="text-muted-foreground">
                {formatNumber(stages.revenue.customerCount)} customers | {formatCurrency(stages.revenue.totalRevenue)}
              </span>
            </div>
            <div 
              className="h-10 bg-stone-500 dark:bg-stone-400 rounded-lg flex items-center justify-center text-white dark:text-stone-950 text-xs font-medium"
              style={{ width: `${revenueWidth}%` }}
            >
              {formatPercentage(stages.revenue.conversionRate)}
            </div>
          </div>
        </div>
        
        {/* Drop-off Alerts */}
        {dropOffPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
              <Icon icon="solar:graph-down-linear" className="h-3.5 w-3.5" />
              Drop-off Points & Recommendations
            </h4>
            {dropOffPoints.map((point, idx) => (
              <div key={idx} className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-stone-50 dark:bg-stone-900">
                <p className="text-xs font-medium text-foreground">{point.stage} - {formatPercentage(point.dropOffRate)} drop-off</p>
                <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5 mt-1.5">
                  {point.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums">{formatNumber(stages.views.count)}</div>
            <div className="text-[10px] text-muted-foreground">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums">{formatNumber(stages.leads.count)}</div>
            <div className="text-[10px] text-muted-foreground">Leads Captured</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums">{formatNumber(stages.engaged.count)}</div>
            <div className="text-[10px] text-muted-foreground">Engaged</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums">{formatCurrency(stages.revenue.totalRevenue)}</div>
            <div className="text-[10px] text-muted-foreground">Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
