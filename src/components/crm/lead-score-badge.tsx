"use client";

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/react';
import { calculateLeadScore, getLeadTemperature, getTemperatureBgColor, getScoreColor, type ScoreBreakdown } from '@/lib/crm/lead-scoring';
import type { Lead } from '@/lib/mock-data';

interface LeadScoreBadgeProps {
  lead: Lead;
  showDetails?: boolean;
  size?: 'sm' | 'md';
}

export function LeadScoreBadge({ lead, showDetails = false, size = 'sm' }: LeadScoreBadgeProps) {
  const scoreBreakdown = calculateLeadScore(lead);
  const temperature = getLeadTemperature(scoreBreakdown.total);
  const tempBgColor = getTemperatureBgColor(temperature);
  const scoreColor = getScoreColor(scoreBreakdown.total);

  const temperatureIcon = {
    hot: '🔥',
    warm: '🌡️',
    cold: '❄️',
  }[temperature];

  const temperatureLabel = {
    hot: 'Hot Lead',
    warm: 'Warm Lead',
    cold: 'Cold Lead',
  }[temperature];

  if (showDetails) {
    return (
      <div className="space-y-2 sm:space-y-3">
        {/* Score Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">{temperatureIcon}</span>
            <div>
              <p className="text-xs sm:text-sm font-medium">{temperatureLabel}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Lead Score</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg sm:text-xl font-bold">{scoreBreakdown.total}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress value={scoreBreakdown.total} className="h-2" />
        </div>

        {/* Score Factors */}
        <div className="space-y-1.5">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Score Breakdown</p>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {scoreBreakdown.factors.map((factor, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="text-muted-foreground truncate">{factor.name}</span>
                <span className={factor.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                  {factor.points}/{factor.maxPoints}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Compact badge view
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${tempBgColor} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'} cursor-help`}
          >
            {temperatureIcon} {scoreBreakdown.total}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-48 p-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{temperatureLabel}</span>
              <span className="text-xs font-bold">{scoreBreakdown.total}/100</span>
            </div>
            <Progress value={scoreBreakdown.total} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              Based on profile completeness & engagement
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact temperature indicator for tables
 */
export function TemperatureIndicator({ temperature }: { temperature?: 'hot' | 'warm' | 'cold' }) {
  if (!temperature) return null;

  const config = {
    hot: { icon: '🔥', color: 'text-red-500', label: 'Hot' },
    warm: { icon: '🌡️', color: 'text-orange-500', label: 'Warm' },
    cold: { icon: '❄️', color: 'text-blue-500', label: 'Cold' },
  }[temperature];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{config.icon}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span className="text-xs">{config.label} Lead</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
