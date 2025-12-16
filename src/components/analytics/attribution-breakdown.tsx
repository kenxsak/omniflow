"use client";

/**
 * Attribution Breakdown Component
 * 
 * Multi-channel revenue attribution visualization (pie chart + table)
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import type { RevenueAttribution } from '@/types/analytics';
import { formatCurrency, formatPercentage } from '@/lib/analytics-service';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AttributionBreakdownProps {
  attribution: RevenueAttribution;
}

// Visible colors for pie chart (works in both light and dark mode)
const PIE_COLORS = [
  '#fafaf9', // stone-50 (white)
  '#a8a29e', // stone-400
  '#78716c', // stone-500
  '#57534e', // stone-600
  '#44403c', // stone-700
  '#292524', // stone-800
];

// Capitalize first letter of each word
const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export default function AttributionBreakdown({ attribution }: AttributionBreakdownProps) {
  const { channels, totalRevenue, overallROI, topChannel, insights, recommendations } = attribution;
  
  // Check if there's actual data
  const hasData = channels.some(ch => ch.revenue > 0 || ch.leadsGenerated > 0);
  
  // Prepare pie chart data
  const pieData = channels.map((ch, index) => ({
    name: ch.channelLabel,
    value: Math.max(ch.revenue, 1), // Ensure minimum value for visibility
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));
  
  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:pie-chart-2-linear" className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Revenue Attribution
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">See which marketing channels drive the most revenue</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Multi-channel attribution analysis</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {overallROI.toFixed(0)}% ROI
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-5">
        {/* Top Channel */}
        <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-start gap-2">
            <Icon icon="solar:cup-star-linear" className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {capitalizeWords(topChannel.channel)} is Your Top Channel
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{topChannel.reason}</p>
            </div>
          </div>
        </div>
        
        {/* Pie Chart */}
        <div className="h-64">
          {!hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Icon icon="solar:pie-chart-2-linear" className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No revenue data available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Start generating leads to see attribution</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  stroke="#1c1917"
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#1c1917',
                    border: '1px solid #44403c',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '8px 12px',
                    color: '#fafaf9'
                  }}
                  itemStyle={{ color: '#a8a29e' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: '#a8a29e' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Channel Performance Table */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Channel Performance</h4>
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50 dark:bg-stone-900">
                  <TableHead className="text-[10px] uppercase tracking-wider">Channel</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Leads</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Revenue</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">ROI</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Conv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((channel, index) => (
                    <TableRow key={channel.channel}>
                      <TableCell className="text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          {channel.channelLabel}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        {channel.leadsGenerated}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium tabular-nums">
                        {formatCurrency(channel.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[10px]">
                          {channel.roi === Infinity ? '∞' : formatPercentage(channel.roi, 0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        {formatPercentage(channel.conversionRate)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Attribution Models */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Attribution Model Comparison</h4>
          <div className="grid md:grid-cols-3 gap-3">
            {channels.slice(0, 3).map((channel, index) => (
              <div key={channel.channel} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                <div className="text-xs font-medium mb-2 flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  {channel.channelLabel}
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First-Touch:</span>
                    <span className="font-medium tabular-nums">{formatPercentage(channel.firstTouchAttribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last-Touch:</span>
                    <span className="font-medium tabular-nums">{formatPercentage(channel.lastTouchAttribution)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multi-Touch:</span>
                    <span className="font-medium tabular-nums">{formatPercentage(channel.multiTouchAttribution)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Insights */}
        {insights.length > 0 && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Key Insights</h4>
            <ul className="space-y-1">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/50 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/50 mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">{formatCurrency(totalRevenue)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">{formatCurrency(attribution.totalMarketingSpend)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Marketing Spend</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold tabular-nums text-foreground">{formatPercentage(overallROI, 0)}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Overall ROI</div>
          </div>
        </div>
      </div>
    </div>
  );
}
