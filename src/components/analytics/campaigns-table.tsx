"use client";

import { Icon } from '@iconify/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '@/lib/analytics-service';
import { useCurrency } from '@/contexts/currency-context';
import type { CampaignROI } from '@/types/analytics';

interface CampaignsTableProps {
  campaigns: CampaignROI[];
}

export default function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const { formatCurrency } = useCurrency();
  
  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Icon icon="solar:target-linear" className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Campaign Performance & ROI
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Detailed ROI analysis for your marketing campaigns</p>
      </div>
      <div className="p-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50 dark:bg-stone-900">
              <TableHead className="text-[10px] uppercase tracking-wider">Campaign</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">Leads</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">Customers</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">Revenue</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">Spend</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">ROI</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider text-right">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.campaignId}>
                <TableCell className="font-medium text-sm">
                  {campaign.campaignName}
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {campaign.campaignType}
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">{campaign.leadsGenerated}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{campaign.customersAcquired}</TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(campaign.revenue)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-amber-600 dark:text-amber-400">
                  {formatCurrency(campaign.marketingSpend + campaign.aiCostsUsed)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="secondary" 
                    className={`text-[10px] ${campaign.roi >= 100 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : campaign.roi >= 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}
                  >
                    {formatPercentage(campaign.roi, 0)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] capitalize ${
                      campaign.performanceRating === 'excellent' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                      campaign.performanceRating === 'good' ? 'border-blue-500/30 text-blue-600 dark:text-blue-400' :
                      campaign.performanceRating === 'average' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
                      'border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {campaign.performanceRating}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
