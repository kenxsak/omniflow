'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

interface TeamStats {
  totalMembers: number;
  activeToday: number;
  claimedLeads: number;
  recentActivity: AuditEntry[];
}

interface AuditEntry {
  id: string;
  action: string;
  performedByName?: string;
  entityType: string;
  timestamp: string;
}

export function EnterpriseActivityCard() {
  const { appUser, company, idToken } = useAuth();
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!company?.id || !idToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/enterprise/dashboard-stats?companyId=${company.id}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error loading enterprise stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [company?.id, idToken]);

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, string> = {
      claim: 'solar:lock-linear',
      release: 'solar:lock-unlocked-linear',
      create: 'solar:user-plus-linear',
      update: 'solar:pen-linear',
      assign: 'solar:user-check-linear',
    };
    const iconName = iconMap[action] || 'solar:chart-linear';
    return <Icon icon={iconName} className="h-3 w-3 text-muted-foreground" />;
  };

  const getActionLabel = (action: string, entityType: string) => {
    const labels: Record<string, string> = {
      claim: 'claimed a lead',
      release: 'released a lead',
      create: `created a ${entityType}`,
      update: `updated a ${entityType}`,
      assign: `assigned a ${entityType}`,
      delete: `deleted a ${entityType}`,
      status_change: `changed ${entityType} status`,
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            TEAM
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 sm:size-2 border-[1.5px] rounded-full bg-violet-300 border-violet-700" />
            <span className="text-[8px] sm:text-[9px] font-semibold text-foreground uppercase tracking-wide font-mono">
              ENT
            </span>
          </span>
        </div>
        <div className="flex justify-center py-4 sm:py-6">
          <Icon icon="solar:refresh-linear" className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            TEAM
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 sm:size-2 border-[1.5px] rounded-full bg-violet-300 border-violet-700" />
            <span className="text-[8px] sm:text-[9px] font-semibold text-foreground uppercase tracking-wide font-mono">
              ENT
            </span>
          </span>
        </div>
        <div className="p-3 sm:p-4">
          <div className="text-center py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Enterprise features for large teams
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-[8px] sm:text-[10px] text-muted-foreground">Claiming</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-[8px] sm:text-[10px] text-muted-foreground">Audit</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-[8px] sm:text-[10px] text-muted-foreground">Auto</span>
              </div>
            </div>
            {appUser?.role === 'admin' && (
              <Button variant="outline" size="sm" asChild className="h-6 sm:h-7 text-[10px] sm:text-xs">
                <Link href="/settings/enterprise" className="inline-flex items-center gap-1">
                  CONFIGURE
                  <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            TEAM
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 sm:size-2 border-[1.5px] rounded-full bg-violet-300 border-violet-700" />
            <span className="text-[8px] sm:text-[9px] font-semibold text-foreground uppercase tracking-wide font-mono">
              ENT
            </span>
          </span>
        </div>
        {appUser?.role === 'admin' && (
          <Button variant="ghost" size="sm" asChild className="h-6 sm:h-7 text-[10px] sm:text-xs px-2">
            <Link href="/settings/enterprise" className="inline-flex items-center gap-1">
              <span className="hidden sm:inline">SETTINGS</span>
              <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className="text-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800">
            <div className="text-sm sm:text-lg font-semibold tabular-nums text-foreground">{stats.totalMembers}</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground font-mono">MEMBERS</div>
          </div>
          <div className="text-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800">
            <div className="text-sm sm:text-lg font-semibold tabular-nums text-foreground">{stats.activeToday}</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground font-mono">ACTIVE</div>
          </div>
          <div className="text-center p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-800">
            <div className="text-sm sm:text-lg font-semibold tabular-nums text-foreground">{stats.claimedLeads}</div>
            <div className="text-[8px] sm:text-[10px] text-muted-foreground font-mono">CLAIMED</div>
          </div>
        </div>

        {stats.recentActivity.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                RECENT
              </span>
              <Link href="/settings/enterprise" className="text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground">
                All
              </Link>
            </div>
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {stats.recentActivity.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 first:pt-0 last:pb-0 text-[10px] sm:text-[11px]"
                >
                  <span className="font-medium truncate max-w-[60px] sm:max-w-[80px] text-foreground">
                    {entry.performedByName || 'User'}
                  </span>
                  <span className="text-muted-foreground truncate flex-1">
                    {getActionLabel(entry.action, entry.entityType)}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground flex-shrink-0 tabular-nums font-mono hidden sm:inline">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
