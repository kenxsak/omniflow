"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/react';
import { useCurrency } from '@/contexts/currency-context';
import type { Lead } from '@/lib/mock-data';

interface SalesForecastProps {
  leads: Lead[];
  monthlyTarget?: number;
}

// Probability by stage (industry standard)
const STAGE_PROBABILITY: Record<Lead['status'], number> = {
  New: 10,
  Contacted: 25,
  Qualified: 50,
  Won: 100,
  Lost: 0,
};

export function SalesForecast({ leads, monthlyTarget = 100000 }: SalesForecastProps) {
  const { formatCurrency } = useCurrency();

  const forecast = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter active leads (not Won/Lost)
    const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
    
    // Calculate weighted pipeline
    let weightedTotal = 0;
    let bestCase = 0;
    let worstCase = 0;

    activeLeads.forEach(lead => {
      const value = lead.expectedValue || 0;
      const probability = STAGE_PROBABILITY[lead.status] / 100;
      const score = (lead.leadScore || 50) / 100;
      
      // Skip if value is 0 or invalid
      if (!value || isNaN(value)) return;
      
      // Weighted value = deal value × stage probability × lead score factor
      const weighted = value * probability * (0.5 + score * 0.5);
      if (!isNaN(weighted)) {
        weightedTotal += weighted;
      }
      
      // Best case: all deals close
      bestCase += value;
      
      // Worst case: only high-probability deals
      if (probability >= 0.5) {
        worstCase += value * probability;
      }
    });
    
    // Ensure no NaN values
    weightedTotal = isNaN(weightedTotal) ? 0 : weightedTotal;
    bestCase = isNaN(bestCase) ? 0 : bestCase;
    worstCase = isNaN(worstCase) ? 0 : worstCase;

    // Won this month
    const wonThisMonth = leads.filter(l => {
      if (l.status !== 'Won' || !l.wonDate) return false;
      const wonDate = l.wonDate?.toDate ? l.wonDate.toDate() : new Date(l.wonDate);
      return wonDate.getMonth() === currentMonth && wonDate.getFullYear() === currentYear;
    });

    const wonRevenue = wonThisMonth.reduce((sum, l) => {
      const val = l.expectedValue || 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    // Projected total = won + weighted forecast
    const projectedTotal = (isNaN(wonRevenue) ? 0 : wonRevenue) + (isNaN(weightedTotal) ? 0 : weightedTotal);
    const targetProgress = monthlyTarget > 0 ? Math.min(100, Math.round((projectedTotal / monthlyTarget) * 100)) : 0;

    // Deals by stage
    const byStage = {
      New: leads.filter(l => l.status === 'New').length,
      Contacted: leads.filter(l => l.status === 'Contacted').length,
      Qualified: leads.filter(l => l.status === 'Qualified').length,
    };

    // Conversion prediction (simple ML-like heuristic)
    const avgScore = activeLeads.length > 0 
      ? activeLeads.reduce((sum, l) => sum + (l.leadScore || 50), 0) / activeLeads.length 
      : 50;
    const predictedConversions = Math.round(activeLeads.length * (avgScore / 100) * 0.3);

    return {
      weightedTotal,
      bestCase,
      worstCase,
      wonRevenue,
      projectedTotal,
      targetProgress,
      byStage,
      activeDeals: activeLeads.length,
      predictedConversions,
      avgScore: Math.round(avgScore),
    };
  }, [leads, monthlyTarget]);

  return (
    <Card className="border-stone-200 dark:border-stone-800">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Icon icon="solar:chart-2-bold" className="w-3.5 h-3.5 text-white" />
          </div>
          Sales Forecast
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-auto">
            AI POWERED
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-4">
        {/* Monthly Target Progress */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Monthly Target</span>
            <span className="text-xs font-medium">{forecast.targetProgress}%</span>
          </div>
          <Progress value={forecast.targetProgress} className="h-2 mb-2" />
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-bold text-emerald-600">
              {formatCurrency(forecast.projectedTotal)}
            </span>
            <span className="text-xs text-muted-foreground">
              of {formatCurrency(monthlyTarget)}
            </span>
          </div>
        </div>

        {/* Forecast Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Won</span>
            </div>
            <span className="text-sm font-semibold text-emerald-600">
              {formatCurrency(forecast.wonRevenue)}
            </span>
          </div>
          <div className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon icon="solar:graph-up-bold" className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">Weighted</span>
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(forecast.weightedTotal)}
            </span>
          </div>
          <div className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon icon="solar:arrow-up-bold" className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-[10px] text-muted-foreground">Best Case</span>
            </div>
            <span className="text-sm font-semibold text-purple-600">
              {formatCurrency(forecast.bestCase)}
            </span>
          </div>
          <div className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon icon="solar:arrow-down-bold" className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] text-muted-foreground">Worst Case</span>
            </div>
            <span className="text-sm font-semibold text-amber-600">
              {formatCurrency(forecast.worstCase)}
            </span>
          </div>
        </div>

        {/* AI Prediction */}
        <div className="p-3 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="solar:magic-stick-3-bold" className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">AI Prediction</span>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            Based on {forecast.activeDeals} active deals with avg score of {forecast.avgScore}%, 
            we predict <span className="font-semibold">{forecast.predictedConversions} conversions</span> this month.
          </p>
        </div>

        {/* Pipeline by Stage */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pipeline by Stage
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs">New</span>
              <span className="text-xs font-semibold ml-auto">{forecast.byStage.New}</span>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs">Contacted</span>
              <span className="text-xs font-semibold ml-auto">{forecast.byStage.Contacted}</span>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs">Qualified</span>
              <span className="text-xs font-semibold ml-auto">{forecast.byStage.Qualified}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
