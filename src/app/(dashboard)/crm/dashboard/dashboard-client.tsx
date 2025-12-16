"use client";

import { ContactUsageIndicator } from '@/components/crm/contact-usage-indicator';
import { TeamPerformanceDashboard } from '@/components/crm/team-performance-dashboard';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import type { DealStats, Activity as ActivityType } from '@/types/crm';
import { ACTIVITY_TYPE_LABELS } from '@/types/crm';
import type { Role, AppUser } from '@/types/saas';
import type { Lead } from '@/lib/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { useCurrency } from '@/contexts/currency-context';

interface DashboardStats {
  total: number;
  new: number;
  synced: number;
  won: number;
}

interface StatusDistribution {
  status: string;
  count: number;
  percentage: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
  statusDistribution: StatusDistribution[];
  planMetadata: {
    planId: string;
    planName: string;
    maxContacts: number | null;
  } | null;
  dealStats?: DealStats;
  weightedPipeline?: number;
  recentActivities?: ActivityType[];
  userRole?: Role;
  teamMembers?: AppUser[];
  leads?: Lead[];
}

export function DashboardClient({ 
  stats, 
  statusDistribution, 
  planMetadata,
  dealStats,
  weightedPipeline = 0,
  recentActivities = [],
  userRole,
  teamMembers = [],
  leads = [],
}: DashboardClientProps) {
  const { formatCurrency } = useCurrency();
  const conversionRate = dealStats?.conversionRate || 0;
  const pipelineValue = dealStats?.totalPipelineValue || 0;
  const wonValue = dealStats?.wonValue || 0;
  
  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager' || userRole === 'superadmin';
  const hasTeamMembers = teamMembers.length > 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <h1 className="text-2xl font-semibold text-foreground">CRM Analytics</h1>
      </header>

      {planMetadata && (
        <ContactUsageIndicator
          currentContactCount={stats.total}
          maxContacts={planMetadata.maxContacts}
          planName={planMetadata.planName}
          compact={true}
        />
      )}
      
      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Pipeline Value */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-3 sm:p-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Pipeline Value
              </span>
              <Icon icon="solar:wallet-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(pipelineValue)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Weighted: {formatCurrency(weightedPipeline)}
            </p>
          </div>
        </div>

        {/* Won Revenue */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-3 sm:p-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Won Revenue
              </span>
              <Icon icon="solar:cup-star-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
              {formatCurrency(wonValue)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Icon icon="solar:arrow-up-linear" className="h-3 w-3" />
              {dealStats?.wonDeals || 0} deals closed
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-3 sm:p-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Conversion Rate
              </span>
              <Icon icon="solar:chart-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
              {conversionRate.toFixed(1)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {dealStats?.openDeals || 0} deals in pipeline
            </p>
          </div>
        </div>

        {/* Total Contacts */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-3 sm:p-4 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Total Contacts
              </span>
              <Icon icon="solar:users-group-two-rounded-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
              {stats.total}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {stats.new} new this period
            </p>
          </div>
        </div>
      </div>

      {/* Activity & Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-primary" />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Icon icon="solar:chart-2-linear" className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Recent Activity
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Latest interactions with your contacts</p>
          </div>
          <div className="p-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-6">
                <Icon icon="solar:chart-2-linear" className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No recent activities</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {ACTIVITY_TYPE_LABELS[activity.type]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.content}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.occurredAt as string), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Contact Status Distribution
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">Breakdown of contacts by pipeline stage</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {statusDistribution.map(({ status, count, percentage }) => (
                <div key={status} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{status}</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-1.5">
                      <div 
                        className="bg-foreground h-1.5 rounded-full transition-all" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden p-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">New Contacts</span>
          <div className="text-xl font-semibold tabular-nums mt-1">{stats.new}</div>
          <p className="text-[10px] text-muted-foreground">Awaiting first contact</p>
        </div>

        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden p-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Synced</span>
          <div className="text-xl font-semibold tabular-nums mt-1">{stats.synced}</div>
          <p className="text-[10px] text-muted-foreground">Synced to platforms</p>
        </div>

        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden p-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Avg Deal Size</span>
          <div className="text-xl font-semibold tabular-nums mt-1">{formatCurrency(dealStats?.avgDealSize || 0)}</div>
          <p className="text-[10px] text-muted-foreground">Per opportunity</p>
        </div>

        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden p-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Open Deals</span>
          <div className="text-xl font-semibold tabular-nums mt-1">{dealStats?.openDeals || 0}</div>
          <p className="text-[10px] text-muted-foreground">In active pipeline</p>
        </div>
      </div>

      {/* Team Performance */}
      {isManagerOrAdmin && hasTeamMembers && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <Icon icon="solar:users-group-two-rounded-linear" className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Team Performance</h2>
              <p className="text-xs text-muted-foreground">Manager view: Per-rep performance metrics</p>
            </div>
          </div>
          <TeamPerformanceDashboard leads={leads} teamMembers={teamMembers} />
        </div>
      )}
    </div>
  );
}
