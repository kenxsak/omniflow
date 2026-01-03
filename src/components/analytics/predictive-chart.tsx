"use client";

/**
 * Predictive Chart Component
 * 
 * Line chart showing historical data and predicted future trends
 */

import { Area, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import type { PredictiveAnalytics } from '@/types/analytics';
import { Icon } from '@iconify/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/analytics-service';
import { useCurrency } from '@/contexts/currency-context';

interface PredictiveChartProps {
  analytics: PredictiveAnalytics;
  historicalLeads: number[];
}

export default function PredictiveChart({ analytics, historicalLeads }: PredictiveChartProps) {
  const { formatCurrency } = useCurrency();
  const { leadForecast, revenueForecast, trends, recommendations, accuracy } = analytics;
  
  // Check if we have any actual data
  const hasData = historicalLeads.some(v => v > 0) || leadForecast.nextMonth.predicted > 0;
  
  // Build chart data
  const chartData = historicalLeads.map((leads, index) => ({
    month: `M-${historicalLeads.length - index}`,
    leads,
    predicted: null as number | null,
  }));
  
  // Add next month prediction
  chartData.push({
    month: 'Next',
    leads: null as unknown as number,
    predicted: leadForecast.nextMonth.predicted,
  });

  // Connect last actual point to prediction
  if (chartData.length > 1 && historicalLeads.length > 0) {
    chartData[chartData.length - 2].predicted = historicalLeads[historicalLeads.length - 1];
  }

  // Calculate Y domain
  const allValues = [...historicalLeads, leadForecast.nextMonth.predicted].filter(v => v != null);
  const maxValue = Math.max(...allValues, 1);
  const yDomain = [0, Math.ceil(maxValue * 1.2)];
  
  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-amber-500 dark:bg-amber-400" />
      
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:graph-up-linear" className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Predictive Insights
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">AI-powered forecasts based on your historical data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Forecasts based on {analytics.historicalMonths} months of data
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {accuracy.score}% Confidence
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-5">
        {accuracy.reliability === 'low' && accuracy.note && (
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{accuracy.note}</p>
            </div>
          </div>
        )}
        
        <div className="h-64 w-full">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Icon icon="solar:chart-linear" className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No historical data available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Start capturing leads to see predictions</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#57534e" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#a8a29e' }} 
                  axisLine={{ stroke: '#57534e', strokeOpacity: 0.5 }}
                  tickLine={false}
                  dy={5}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#a8a29e' }} 
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  domain={yDomain}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1917',
                    border: '1px solid #44403c',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '8px 12px',
                    color: '#fafaf9'
                  }}
                  labelStyle={{ color: '#fafaf9' }}
                  itemStyle={{ color: '#a8a29e' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '12px' }} iconType="plainline" iconSize={16} />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#leadsGradient)"
                  name="Actual Leads"
                  dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  name="Predicted"
                  dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <h4 className="text-sm font-medium">Lead Forecast</h4>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Next Month: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatNumber(leadForecast.nextMonth.predicted)}</span>
                <span className="text-[10px] ml-1.5">({leadForecast.nextMonth.range.min}-{leadForecast.nextMonth.range.max})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Next 3 Months: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatNumber(leadForecast.next3Months.predicted)}</span>
              </p>
              <Badge variant="outline" className="mt-2 text-[10px]">{leadForecast.nextMonth.confidence} confidence</Badge>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:wallet-linear" className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <h4 className="text-sm font-medium">Revenue Forecast</h4>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                Next Month: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenueForecast.nextMonth.predicted)}</span>
                <span className="text-[10px] ml-1.5">({formatCurrency(revenueForecast.nextMonth.range.min)}-{formatCurrency(revenueForecast.nextMonth.range.max)})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Next 3 Months: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(revenueForecast.next3Months.predicted)}</span>
              </p>
              <Badge variant="outline" className="mt-2 text-[10px]">{revenueForecast.nextMonth.confidence} confidence</Badge>
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Key Trends</h4>
          <div className="space-y-2">
            {trends.map((trend, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                <Icon 
                  icon={trend.direction === 'up' ? 'solar:arrow-right-up-linear' : trend.direction === 'down' ? 'solar:arrow-right-down-linear' : 'solar:arrow-right-linear'} 
                  className="h-4 w-4 text-muted-foreground mt-0.5" 
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{trend.metric}</p>
                  <p className="text-xs text-muted-foreground">{trend.insight}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                    {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}% change
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Recommendations</h4>
            <ul className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/50 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
