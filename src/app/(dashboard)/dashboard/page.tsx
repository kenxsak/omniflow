'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import StatCard from '@/components/dashboard/stat-card';
import QuickActionsPanel from '@/components/dashboard/quick-actions-panel';
import SuperAdminDashboard from '@/components/admin/superadmin-dashboard';
import OnboardingChecklist from '@/components/onboarding/onboarding-checklist';
import { CrmWelcomeModal } from '@/components/onboarding/crm-welcome-modal';
import { NextStepsPanel } from '@/components/onboarding/next-steps-panel';
import { QuickTips, CRM_PAGE_TIPS } from '@/components/onboarding/quick-tips';
import { WeekOverWeekCard } from '@/components/dashboard/week-over-week-card';
import { PipelineConversionChart } from '@/components/dashboard/pipeline-conversion-chart';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { TopPerformersCard } from '@/components/dashboard/top-performers-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Animated, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/animated';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { getStoredLeads } from '@/lib/mock-data';
import { getCompanyAIAnalyticsAction } from '@/app/actions/company-ai-analytics-actions';
import { getDealStats } from '@/app/actions/deal-actions';
import { getDashboardAnalytics } from '@/app/actions/analytics-dashboard-actions';
import { skipOnboardingAction, completeOnboardingAction } from '@/app/actions/onboarding-client-actions';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { UpcomingAppointmentsCard } from '@/components/dashboard/upcoming-appointments-card';
import { MyTasksCard } from '@/components/dashboard/my-tasks-card';
import { EnterpriseActivityCard } from '@/components/dashboard/enterprise-activity-card';
import type { DealStats } from '@/types/crm';
import type { WeekOverWeekStats, PipelineStageConversion, SalesTrendData, TeamPerformer } from '@/app/actions/analytics-dashboard-actions';
import gsap from 'gsap';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return `${amount.toLocaleString()}`;
}

export default function DashboardPage() {
  const { appUser, company, isSuperAdmin, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [leadCount, setLeadCount] = useState(0);
  const [aiCreditsUsed, setAiCreditsUsed] = useState(0);
  const [aiCreditsLimit, setAiCreditsLimit] = useState(0);
  const [dealStats, setDealStats] = useState<DealStats | null>(null);
  const [weekOverWeek, setWeekOverWeek] = useState<WeekOverWeekStats | null>(null);
  const [pipelineConversion, setPipelineConversion] = useState<PipelineStageConversion[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TeamPerformer[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!company?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [leads, aiAnalytics, stats, analytics] = await Promise.all([
          getStoredLeads(company.id),
          getCompanyAIAnalyticsAction(company.id),
          getDealStats(company.id),
          getDashboardAnalytics(company.id),
        ]);

        setLeadCount(leads.length);
        setDealStats(stats);

        if (aiAnalytics?.success && aiAnalytics.data) {
          setAiCreditsUsed(aiAnalytics.data.currentMonth.creditsUsed);
          setAiCreditsLimit(aiAnalytics.data.currentMonth.creditsLimit);
        }

        if (analytics) {
          setWeekOverWeek(analytics.weekOverWeek);
          setPipelineConversion(analytics.pipelineConversion);
          setSalesTrend(analytics.salesTrend);
          setTopPerformers(analytics.topPerformers);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [company]);

  const handleDismissOnboarding = async () => {
    if (company?.id) {
      await skipOnboardingAction(company.id);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (company?.id) {
      await completeOnboardingAction(company.id);
    }
  };

  if (authLoading || !appUser) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  const aiUsagePercent = aiCreditsLimit > 0 ? (aiCreditsUsed / aiCreditsLimit) * 100 : 0;
  const showAiWarning = aiUsagePercent >= 80;
  const pipelineValue = dealStats?.totalPipelineValue || 0;
  const conversionRate = dealStats?.conversionRate || 0;
  const wonRevenue = dealStats?.wonValue || 0;

  return (
    <div ref={pageRef} className="space-y-4 sm:space-y-6">
      <CrmWelcomeModal 
        company={company} 
        onDismiss={handleDismissOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      {/* Header */}
      <Animated animation="fadeDown" className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {appUser.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            {wonRevenue > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 shrink-0">
                <Icon icon="solar:graph-up-linear" className="h-3 w-3 mr-1" />
                {formatCurrency(wonRevenue)} won
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's what's happening with your business today.
          </p>
        </div>
        <ContextualHelpButton pageId="dashboard" />
      </Animated>

      <QuickTips pageId="dashboard" tips={CRM_PAGE_TIPS.dashboard} />

      <OnboardingChecklist />

      {showAiWarning && (
        <Animated animation="scaleIn">
          <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800">
            <Icon icon="solar:danger-circle-linear" className="h-4 w-4" />
            <AlertTitle className="text-sm sm:text-base">Smart Tools Running Low</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
              You've used {aiUsagePercent.toFixed(0)}% of your smart tools quota. Consider upgrading your plan.
            </AlertDescription>
          </Alert>
        </Animated>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="solar:refresh-circle-linear" className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StaggerItem>
              <Card className="card-gradient-blue overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pipeline Value</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Icon icon="solar:dollar-minimalistic-linear" className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                    <AnimatedCounter value={pipelineValue} prefix="$" duration={1.5} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 flex items-center gap-1 mt-1">
                    <Icon icon="solar:arrow-right-up-linear" className="h-3 w-3" />
                    {dealStats?.openDeals || 0} open deals
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="card-gradient-green overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Won Revenue</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Icon icon="solar:target-linear" className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    <AnimatedCounter value={wonRevenue} prefix="$" duration={1.5} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1 mt-1">
                    <Icon icon="solar:arrow-right-up-linear" className="h-3 w-3" />
                    {dealStats?.wonDeals || 0} deals closed
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="card-gradient-purple overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Conversion</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Icon icon="solar:chart-2-linear" className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                    <AnimatedCounter value={conversionRate} suffix="%" decimals={1} duration={1.5} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                    Deals won vs closed
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Contacts</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon icon="solar:users-group-two-rounded-linear" className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-lg sm:text-2xl font-bold">
                    <AnimatedCounter value={leadCount} duration={1.5} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {leadCount > 0 ? 'In your CRM' : 'Add contacts to start'}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Activity Cards */}
          <Animated animation="fadeUp">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              <UpcomingAppointmentsCard />
              <MyTasksCard />
              <EnterpriseActivityCard />
            </div>
          </Animated>

          {/* Analytics Row */}
          <Animated animation="fadeUp">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <WeekOverWeekCard stats={weekOverWeek} />
              <TopPerformersCard performers={topPerformers} />
            </div>
          </Animated>

          {/* Charts */}
          <Animated animation="fadeUp">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <SalesTrendChart data={salesTrend} chartType="area" />
              <PipelineConversionChart data={pipelineConversion} />
            </div>
          </Animated>

          {/* Next Steps */}
          {(leadCount < 10 || !dealStats || dealStats.totalDeals === 0) && (
            <Animated animation="fadeUp">
              <NextStepsPanel 
                contactCount={leadCount} 
                dealStats={dealStats || undefined}
                hasSentCampaign={false}
                hasUsedAI={aiCreditsUsed > 0}
              />
            </Animated>
          )}

          {/* AI Credits */}
          {aiCreditsLimit > 0 && (
            <Animated animation="fadeUp">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4 text-amber-600" />
                    </div>
                    Smart Tools This Month
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Track your AI-powered feature usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">
                        {aiCreditsUsed.toLocaleString()} of {aiCreditsLimit.toLocaleString()} uses
                      </span>
                      <span className="font-medium">{aiUsagePercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={aiUsagePercent} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </Animated>
          )}

          {/* Quick Actions */}
          <Animated animation="fadeUp">
            <QuickActionsPanel companyId={company?.id} />
          </Animated>
        </>
      )}
    </div>
  );
}
