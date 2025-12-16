'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import PageTitle from '@/components/ui/page-title';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { CsvImportCard } from '@/components/crm/csv-import-card';
import { getCrmStats } from '@/app/actions/crm-stats-actions';
import { Animated, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/animated';
import type { LeadStats } from '@/lib/crm/lead-data';

interface CrmWrapperProps {
  companyId: string;
}

export function CrmWrapper({ companyId }: CrmWrapperProps) {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getCrmStats();
        if (data) {
          setStats(data);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        console.error('Error loading CRM stats:', err);
        setError('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [companyId]);

  const statsLoading = isLoading;
  const displayStats = stats || {
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    brevoSyncedCount: 0,
    hubspotSyncedCount: 0,
    unsyncedCount: 0,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Animated animation="fadeDown">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <PageTitle 
            title="My Contacts" 
            description="People interested in your business" 
          />
          <ContextualHelpButton pageId="crm" />
        </div>
      </Animated>

      <Animated animation="fadeUp">
        <CsvImportCard companyId={companyId} />
      </Animated>

      {/* Stats Cards */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StaggerItem>
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-8 sm:inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Total Contacts
                </span>
                <Icon icon="solar:users-group-two-rounded-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60" />
              </div>
              <div className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {statsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <AnimatedCounter value={displayStats.totalLeads} duration={1.5} />
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Everyone in your list
              </p>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-8 sm:inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  New Contacts
                </span>
                <Icon icon="solar:graph-up-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60" />
              </div>
              <div className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {statsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <AnimatedCounter value={displayStats.newLeads} duration={1.5} />
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Awaiting first contact
              </p>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden col-span-2 lg:col-span-1">
            <div className="absolute inset-x-8 sm:inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Synced
                </span>
                <Icon icon="solar:check-circle-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground/60" />
              </div>
              <div className="text-lg sm:text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {statsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <AnimatedCounter 
                    value={displayStats.brevoSyncedCount + displayStats.hubspotSyncedCount} 
                    duration={1.5} 
                  />
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Connected to other apps
              </p>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Action Cards */}
      <Animated animation="fadeUp">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <div className="p-4 sm:p-5 pt-5 sm:pt-6">
              <div className="flex items-center justify-between mb-3">
                <Icon icon="solar:database-linear" className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Contact Table</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                View and manage all contacts in a detailed table. Search, filter, and update contacts.
              </p>
              <Button asChild className="w-full h-9 text-sm">
                <Link href="/crm/leads" className="flex items-center justify-center gap-2">
                  Open Table
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <div className="p-4 sm:p-5 pt-5 sm:pt-6">
              <div className="flex items-center justify-between mb-3">
                <Icon icon="solar:widget-5-linear" className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Sales Pipeline</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Visualize your sales process with Kanban. Drag and drop contacts between stages.
              </p>
              <Button asChild variant="secondary" className="w-full h-9 text-sm">
                <Link href="/crm/pipeline" className="flex items-center justify-center gap-2">
                  Open Pipeline
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <div className="p-4 sm:p-5 pt-5 sm:pt-6">
              <div className="flex items-center justify-between mb-3">
                <Icon icon="solar:chart-2-linear" className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Analytics</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                View insights and performance metrics. Track conversion rates over time.
              </p>
              <Button asChild variant="outline" className="w-full h-9 text-sm">
                <Link href="/crm/dashboard" className="flex items-center justify-center gap-2">
                  View Analytics
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Animated>

      {/* Quick Stats */}
      <Animated animation="fadeUp">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800">
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Quick Stats
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overview of contacts by status
            </p>
          </div>
          <div className="p-4 sm:p-5">
            {error ? (
              <div className="flex items-center gap-2 text-destructive">
                <Icon icon="solar:danger-circle-linear" className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {[
                  { label: 'New', value: displayStats.newLeads },
                  { label: 'Contacted', value: displayStats.contactedLeads },
                  { label: 'Qualified', value: displayStats.qualifiedLeads },
                  { label: 'Won', value: displayStats.wonLeads },
                  { label: 'Lost', value: displayStats.lostLeads },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground">
                      {statsLoading ? (
                        <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        stat.value
                      )}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Animated>
    </div>
  );
}
