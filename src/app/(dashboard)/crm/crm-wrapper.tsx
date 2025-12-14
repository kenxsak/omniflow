'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6">
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
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StaggerItem>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
              <Icon icon="solar:users-group-two-rounded-linear" className="h-5 w-5 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                {statsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <AnimatedCounter value={displayStats.totalLeads} duration={1.5} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Everyone in your list
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">New Contacts</CardTitle>
              <Icon icon="solar:graph-up-linear" className="h-5 w-5 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                {statsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <AnimatedCounter value={displayStats.newLeads} duration={1.5} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting first contact
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="absolute inset-x-12 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Synced</CardTitle>
              <Icon icon="solar:check-circle-linear" className="h-5 w-5 text-muted-foreground/60" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                {statsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <AnimatedCounter 
                    value={displayStats.brevoSyncedCount + displayStats.hubspotSyncedCount} 
                    duration={1.5} 
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Connected to other apps
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Action Cards */}
      <Animated animation="fadeUp">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group relative overflow-hidden">
            <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <CardHeader className="pt-4">
              <div className="flex items-center justify-between">
                <Icon icon="solar:database-linear" className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <CardTitle className="text-base mt-3">Contact Table</CardTitle>
              <CardDescription className="text-sm">
                View and manage all contacts in a detailed table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Search, filter, and update contacts. Export to Excel and sync with other apps.
              </p>
              <Button asChild className="w-full">
                <Link href="/crm/leads" className="flex items-center justify-center gap-2">
                  Open Table
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <CardHeader className="pt-4">
              <div className="flex items-center justify-between">
                <Icon icon="solar:widget-5-linear" className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <CardTitle className="text-base mt-3">Sales Pipeline</CardTitle>
              <CardDescription className="text-sm">
                Visualize your sales process with Kanban
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop contacts between stages. Track your sales funnel visually.
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/crm/pipeline" className="flex items-center justify-center gap-2">
                  Open Pipeline
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden md:col-span-2 lg:col-span-1">
            <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
            <CardHeader className="pt-4">
              <div className="flex items-center justify-between">
                <Icon icon="solar:chart-2-linear" className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <CardTitle className="text-base mt-3">Analytics</CardTitle>
              <CardDescription className="text-sm">
                View insights and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                See contact distribution, conversion rates, and track performance over time.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/crm/dashboard" className="flex items-center justify-center gap-2">
                  View Analytics
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Animated>

      {/* Quick Stats */}
      <Animated animation="fadeUp">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
            <CardDescription>
              Overview of contacts by status
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <span className="text-xl sm:text-2xl font-semibold text-foreground">
                      {statsLoading ? (
                        <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        stat.value
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Animated>
    </div>
  );
}
