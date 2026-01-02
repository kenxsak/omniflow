"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/react';
import { useCurrency } from '@/contexts/currency-context';
import type { Lead } from '@/lib/mock-data';

interface LeadSourceTrackerProps {
  leads: Lead[];
}

interface SourceStats {
  source: string;
  icon: string;
  color: string;
  total: number;
  won: number;
  lost: number;
  active: number;
  conversionRate: number;
  revenue: number;
  avgScore: number;
}

// Source icons and colors
const SOURCE_CONFIG: Record<string, { icon: string; color: string }> = {
  'Website': { icon: 'solar:global-bold', color: '#3b82f6' },
  'Website Inquiry': { icon: 'solar:global-bold', color: '#3b82f6' },
  'Referral': { icon: 'solar:users-group-rounded-bold', color: '#10b981' },
  'LinkedIn': { icon: 'mdi:linkedin', color: '#0077b5' },
  'Facebook': { icon: 'mdi:facebook', color: '#1877f2' },
  'Instagram': { icon: 'mdi:instagram', color: '#e4405f' },
  'Google Ads': { icon: 'mdi:google-ads', color: '#4285f4' },
  'Trade Show': { icon: 'solar:buildings-bold', color: '#8b5cf6' },
  'Cold Call': { icon: 'solar:phone-bold', color: '#f59e0b' },
  'Email Campaign': { icon: 'solar:letter-bold', color: '#06b6d4' },
  'WhatsApp': { icon: 'logos:whatsapp-icon', color: '#25d366' },
  'Digital Card': { icon: 'solar:card-bold', color: '#ec4899' },
  'Landing Page': { icon: 'solar:document-bold', color: '#6366f1' },
  'Other': { icon: 'solar:question-circle-bold', color: '#6b7280' },
};

export function LeadSourceTracker({ leads }: LeadSourceTrackerProps) {
  const { formatCurrency } = useCurrency();

  const sourceStats = useMemo(() => {
    const stats: Record<string, SourceStats> = {};

    leads.forEach(lead => {
      const source = lead.source || 'Other';
      const config = SOURCE_CONFIG[source] || SOURCE_CONFIG['Other'];

      if (!stats[source]) {
        stats[source] = {
          source,
          icon: config.icon,
          color: config.color,
          total: 0,
          won: 0,
          lost: 0,
          active: 0,
          conversionRate: 0,
          revenue: 0,
          avgScore: 0,
        };
      }

      stats[source].total++;
      
      if (lead.status === 'Won') {
        stats[source].won++;
        stats[source].revenue += lead.expectedValue || 0;
      } else if (lead.status === 'Lost') {
        stats[source].lost++;
      } else {
        stats[source].active++;
      }

      stats[source].avgScore += lead.leadScore || 50;
    });

    // Calculate averages and conversion rates
    Object.values(stats).forEach(stat => {
      stat.avgScore = Math.round(stat.avgScore / stat.total);
      const closedDeals = stat.won + stat.lost;
      stat.conversionRate = closedDeals > 0 ? Math.round((stat.won / closedDeals) * 100) : 0;
    });

    // Sort by total leads
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [leads]);

  const totalLeads = leads.length;
  const bestSource = sourceStats.reduce((best, current) => 
    current.conversionRate > best.conversionRate ? current : best
  , sourceStats[0]);

  return (
    <Card className="border-stone-200 dark:border-stone-800">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Icon icon="solar:chart-square-bold" className="w-3.5 h-3.5 text-white" />
          </div>
          Lead Sources
          {bestSource && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-auto bg-emerald-100 text-emerald-700">
              Best: {bestSource.source}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
        {sourceStats.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Icon icon="solar:chart-square-linear" className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No lead sources yet</p>
          </div>
        ) : (
          sourceStats.slice(0, 6).map((stat) => {
            const percentage = Math.round((stat.total / totalLeads) * 100);
            
            return (
              <div key={stat.source} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon={stat.icon} className="w-4 h-4" style={{ color: stat.color }} />
                    <span className="text-xs sm:text-sm font-medium">{stat.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{stat.total} leads</span>
                    <Badge 
                      variant="outline" 
                      className="text-[9px] h-4 px-1"
                      style={{ 
                        borderColor: stat.conversionRate >= 30 ? '#10b981' : stat.conversionRate >= 15 ? '#f59e0b' : '#6b7280',
                        color: stat.conversionRate >= 30 ? '#10b981' : stat.conversionRate >= 15 ? '#f59e0b' : '#6b7280',
                      }}
                    >
                      {stat.conversionRate}% conv
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={percentage} 
                    className="h-1.5 flex-1" 
                  />
                  <span className="text-[10px] text-muted-foreground w-8">{percentage}%</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {stat.won} won
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {stat.active} active
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {stat.lost} lost
                  </span>
                  {stat.revenue > 0 && (
                    <span className="ml-auto font-medium text-emerald-600">
                      {formatCurrency(stat.revenue)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* AI Insight */}
        {bestSource && bestSource.conversionRate > 0 && (
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-2">
              <Icon icon="solar:lightbulb-bolt-bold" className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">{bestSource.source}</span> has your highest conversion rate at {bestSource.conversionRate}%. 
                Consider investing more in this channel.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
