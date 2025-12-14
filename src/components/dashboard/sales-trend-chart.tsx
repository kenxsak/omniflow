'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { SalesTrendData } from '@/app/actions/analytics-dashboard-actions';

interface SalesTrendChartProps {
  data: SalesTrendData[];
  loading?: boolean;
  chartType?: 'area' | 'bar';
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

export function SalesTrendChart({ data, loading, chartType = 'area' }: SalesTrendChartProps) {
  if (loading) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              SALES TREND
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="animate-pulse h-48 sm:h-64 bg-stone-100 dark:bg-stone-900 rounded-lg sm:rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = data.some(d => d.revenue > 0 || d.deals > 0);

  if (!hasData) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              SALES TREND
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Weekly performance over time</p>
        </div>
        <div className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-8 sm:py-12">
            Close some deals to see your sales trend chart!
          </p>
        </div>
      </div>
    );
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalWon = data.reduce((sum, d) => sum + d.wonDeals, 0);
  
  const recentWeeks = data.slice(-4);
  const olderWeeks = data.slice(0, 4);
  const recentRevenue = recentWeeks.reduce((sum, d) => sum + d.revenue, 0);
  const olderRevenue = olderWeeks.reduce((sum, d) => sum + d.revenue, 0);
  const trend = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;
  const isTrendingUp = trend >= 0;

  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon icon="solar:chart-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/60 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                SALES TREND
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">Weekly performance over 8 weeks</p>
          </div>
          <span className="flex items-center gap-1 shrink-0">
            <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${
              isTrendingUp ? 'bg-emerald-300 border-emerald-700' : 'bg-rose-300 border-rose-700'
            }`} />
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
              {Math.abs(trend).toFixed(0)}%
            </span>
          </span>
        </div>
        <div className="flex gap-3 sm:gap-4 mt-2">
          <div className="text-[10px] sm:text-xs">
            <span className="text-muted-foreground">Revenue: </span>
            <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="text-[10px] sm:text-xs">
            <span className="text-muted-foreground">Won: </span>
            <span className="font-semibold text-foreground">{totalWon}</span>
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="weekLabel" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  width={60}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Week ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--foreground))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="weekLabel" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  width={60}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  width={30}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : name === 'wonDeals' ? 'Won' : 'Lost'
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--foreground))" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="wonDeals" fill="hsl(var(--muted-foreground))" name="Won" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="lostDeals" fill="hsl(var(--border))" name="Lost" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
