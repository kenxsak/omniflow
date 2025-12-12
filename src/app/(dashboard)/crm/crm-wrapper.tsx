'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LayoutGrid, BarChart3, Database, TrendingUp, CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
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
          <Card className="card-gradient-blue overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Contacts</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {statsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <AnimatedCounter value={displayStats.totalLeads} duration={1.5} />
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                Everyone in your list
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="card-gradient-green overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">New Contacts</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {statsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <AnimatedCounter value={displayStats.newLeads} duration={1.5} />
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                Awaiting first contact
              </p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="card-gradient-purple overflow-hidden col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Synced</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                {statsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <AnimatedCounter 
                    value={displayStats.brevoSyncedCount + displayStats.hubspotSyncedCount} 
                    duration={1.5} 
                  />
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                Connected to other apps
              </p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Action Cards */}
      <Animated animation="fadeUp">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card variant="interactive" className="group">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Contact Table</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm mt-2">
                View and manage all contacts in a detailed table
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                Search, filter, and update contacts. Export to Excel and sync with other apps.
              </p>
              <Button asChild className="w-full group-hover:shadow-md transition-shadow">
                <Link href="/crm/leads" className="flex items-center justify-center gap-2">
                  Open Table
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="interactive" className="group">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <LayoutGrid className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="text-base sm:text-lg">Sales Pipeline</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm mt-2">
                Visualize your sales process with Kanban
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                Drag and drop contacts between stages. Track your sales funnel visually.
              </p>
              <Button asChild variant="secondary" className="w-full group-hover:shadow-md transition-shadow">
                <Link href="/crm/pipeline" className="flex items-center justify-center gap-2">
                  Open Pipeline
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="interactive" className="group md:col-span-2 lg:col-span-1">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-base sm:text-lg">Analytics</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm mt-2">
                View insights and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                See contact distribution, conversion rates, and track performance over time.
              </p>
              <Button asChild variant="outline" className="w-full group-hover:shadow-md transition-shadow">
                <Link href="/crm/dashboard" className="flex items-center justify-center gap-2">
                  View Analytics
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Animated>

      {/* Quick Stats */}
      <Animated animation="fadeUp">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
            <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Overview of contacts by status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-4">
            {error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { label: 'New', value: displayStats.newLeads, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Contacted', value: displayStats.contactedLeads, color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Qualified', value: displayStats.qualifiedLeads, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Won', value: displayStats.wonLeads, color: 'text-purple-600 dark:text-purple-400' },
                  { label: 'Lost', value: displayStats.lostLeads, color: 'text-red-600 dark:text-red-400' },
                ].map((stat, index) => (
                  <div key={stat.label} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <span className={`text-lg sm:text-2xl font-bold ${stat.color}`}>
                      {statsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        stat.value
                      )}
                    </span>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">{stat.label}</span>
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
