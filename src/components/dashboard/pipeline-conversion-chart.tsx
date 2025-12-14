'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import type { PipelineStageConversion } from '@/app/actions/analytics-dashboard-actions';

interface PipelineConversionChartProps {
  data: PipelineStageConversion[];
  loading?: boolean;
}

// All stages use neutral backgrounds - no colored tints
const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  proposal: { 
    bg: 'bg-muted', 
    text: 'text-foreground',
    border: 'border-border',
  },
  negotiation: { 
    bg: 'bg-muted', 
    text: 'text-foreground',
    border: 'border-border',
  },
  closing: { 
    bg: 'bg-muted', 
    text: 'text-foreground',
    border: 'border-border',
  },
  won: { 
    bg: 'bg-muted', 
    text: 'text-foreground',
    border: 'border-border',
  },
};

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

export function PipelineConversionChart({ data, loading }: PipelineConversionChartProps) {
  if (loading) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:widget-5-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              PIPELINE
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="animate-pulse flex gap-1.5 sm:gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-20 sm:h-24 bg-stone-100 dark:bg-stone-900 rounded-lg sm:rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasData = data.some(d => d.count > 0);

  if (!hasData) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:widget-5-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              PIPELINE
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Track deals through each stage</p>
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-4 sm:py-6">
            Create deals to see your pipeline conversion funnel.
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Icon icon="solar:widget-5-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60" />
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            PIPELINE
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">How deals flow through your pipeline</p>
      </div>
      <div className="p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-end gap-1 mb-4 min-w-0">
          {data.map((stage, index) => {
            const colors = stageColors[stage.stage] || stageColors.proposal;
            const heightPercent = (stage.count / maxCount) * 100;
            
            return (
              <React.Fragment key={stage.stage}>
                <div className="flex-1 min-w-[60px] flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t-lg ${colors.bg} ${colors.border} border-2 transition-all duration-500 flex items-end justify-center`}
                    style={{ 
                      height: `${Math.max(heightPercent, 20)}px`,
                      minHeight: '40px',
                      maxHeight: '100px',
                    }}
                  >
                    <span className={`text-sm sm:text-lg font-bold ${colors.text} pb-1`}>
                      {stage.count}
                    </span>
                  </div>
                  <div className={`w-full p-1.5 sm:p-2 ${colors.bg} rounded-b-lg text-center`}>
                    <div className={`text-[10px] sm:text-xs font-medium ${colors.text} truncate`}>
                      {stage.label}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {formatCurrency(stage.value)}
                    </div>
                  </div>
                </div>
                {index < data.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-0.5 sm:px-1 pb-8 shrink-0">
                    <Icon icon="solar:arrow-right-linear" className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground font-mono">
                      {stage.conversionFromPrevious.toFixed(0)}%
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          {data.map((stage) => {
            const colors = stageColors[stage.stage] || stageColors.proposal;
            return (
              <div key={`stat-${stage.stage}`} className="text-center">
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md border ${colors.border} ${colors.bg} text-[10px] sm:text-xs font-mono ${colors.text}`}>
                  {stage.percentage.toFixed(0)}%
                </span>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-1">of total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
