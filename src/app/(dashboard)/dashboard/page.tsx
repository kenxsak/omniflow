'use client';

// Dashboard page with modular components
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import SuperAdminDashboard from '@/components/admin/superadmin-dashboard';
import OnboardingChecklist from '@/components/onboarding/onboarding-checklist';
import { CrmWelcomeModal } from '@/components/onboarding/crm-welcome-modal';
import { AppIcon } from '@/components/ui/app-icon';
import { getStoredLeads } from '@/lib/mock-data';
import { getDealStats } from '@/app/actions/deal-actions';
import { getDashboardAnalytics } from '@/app/actions/analytics-dashboard-actions';
import { skipOnboardingAction, completeOnboardingAction } from '@/app/actions/onboarding-client-actions';
import type { DealStats } from '@/types/crm';
import type { WeekOverWeekStats, PipelineStageConversion, SalesTrendData, TeamPerformer } from '@/app/actions/analytics-dashboard-actions';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

// Import dashboard sub-components
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics';
import { DashboardActivity } from '@/components/dashboard/dashboard-activity';
import { DashboardPerformance } from '@/components/dashboard/dashboard-performance';

export default function DashboardPage() {
  const { appUser, company, isSuperAdmin, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [leadCount, setLeadCount] = useState(0);
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
        const [leads, stats, analytics] = await Promise.all([
          getStoredLeads(company.id),
          getDealStats(company.id),
          getDashboardAnalytics(company.id),
        ]);

        setLeadCount(leads.length);
        setDealStats(stats);

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

  // Loading state
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

  // Super admin view
  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  return (
    <div ref={pageRef} className="space-y-4 sm:space-y-6">
      <CrmWelcomeModal 
        company={company} 
        onDismiss={handleDismissOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      {/* Header Section - Autosend style */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          This is your OmniFlow control center.
        </p>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <AppIcon name="loader" size={32} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <DashboardMetrics 
            dealStats={dealStats}
            leadCount={leadCount}
          />

          {/* Activity & Tasks Section */}
          <DashboardActivity />

          {/* Performance Section */}
          <DashboardPerformance
            weekOverWeek={weekOverWeek}
            topPerformers={topPerformers}
            salesTrend={salesTrend}
            pipelineConversion={pipelineConversion}
          />
        </>
      )}

      {/* Help Button */}
      <ContextualHelpButton pageId="dashboard" />
    </div>
  );
}
