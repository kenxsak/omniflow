"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import type { EmailCampaign } from '@/lib/mock-data';
import { getStoredEmailCampaigns } from '@/lib/mock-data';
import BrevoCampaignList from '@/components/email/BrevoCampaignList';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import EmailPerformanceChart, { type EmailChartData } from '@/components/email/email-performance-chart';
import { useAuth } from '@/hooks/use-auth';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

// Helper for campaign status styling - using semantic colors
const getCampaignStatusClass = (status: EmailCampaign['status']) => {
  switch (status) {
    case 'Sent via Brevo':
    case 'Sent via Sender.net':
    case 'Sent':
      return 'bg-success-muted text-success-muted-foreground border border-success-border';
    case 'Draft':
      return 'bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60';
    case 'Scheduled':
      return 'bg-info-muted text-info-muted-foreground border border-info-border';
    case 'Sending via Brevo':
    case 'Sending via Sender.net':
      return 'bg-warning-muted text-warning-muted-foreground border border-warning-border animate-pulse';
    case 'Failed via Brevo':
    case 'Failed via Sender.net':
    case 'Failed':
      return 'bg-destructive-muted text-destructive-muted-foreground border border-destructive-border';
    default:
      return 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60';
  }
};

export default function EmailMarketingPage() {
  const [localCampaigns, setLocalCampaigns] = useState<EmailCampaign[]>([]);
  const [emailChartData, setEmailChartData] = useState<EmailChartData[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const { isFeatureEnabled } = useFeatureFlag();
  const [canShowAutomations, setCanShowAutomations] = useState(false);
  const { appUser } = useAuth();

  const loadLocalCampaigns = useCallback(async () => {
    if (!appUser?.companyId) {
      setIsLoadingLocal(false);
      return;
    }
    setIsLoadingLocal(true);
    const storedCampaigns = await getStoredEmailCampaigns(appUser.companyId);

    const sortedCampaigns = storedCampaigns.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });
    setLocalCampaigns(sortedCampaigns);

    const getValidDate = (timestamp: any): Date | null => {
      if (!timestamp) return null;
      if (timestamp.toDate) return timestamp.toDate();
      if (!isNaN(new Date(timestamp).getTime())) return new Date(timestamp);
      return null;
    };

    const sentCampaigns = storedCampaigns
      .filter(c => (c.status === 'Sent' || c.status === 'Sent via Brevo' || c.status === 'Sent via Sender.net') && c.recipientCount && c.recipientCount > 0 && getValidDate(c.sentDate))
      .sort((a, b) => (getValidDate(a.sentDate)?.getTime() || 0) - (getValidDate(b.sentDate)?.getTime() || 0))
      .slice(-5);

    const chartData: EmailChartData[] = sentCampaigns.map(campaign => {
      const recipientCount = campaign.recipientCount || 0;
      const opened = Math.round(recipientCount * ((campaign.openRate || 0) / 100));
      const clicked = Math.round(recipientCount * ((campaign.clickRate || 0) / 100));
      return {
        name: campaign.name,
        sent: recipientCount,
        opened: opened,
        clicked: clicked,
      }
    });
    setEmailChartData(chartData);
    setIsLoadingLocal(false);
  }, [appUser]);

  useEffect(() => {
    loadLocalCampaigns();
    const checkFeatureFlag = async () => {
      const enabled = await isFeatureEnabled('feat_email_workflows');
      setCanShowAutomations(enabled);
    };
    checkFeatureFlag();
  }, [loadLocalCampaigns, isFeatureEnabled]);

  const sentLocalCampaigns = localCampaigns.filter(c => c.status === 'Sent' || c.status === 'Sent via Brevo' || c.status === 'Sent via Sender.net');
  const avgOpenRate = sentLocalCampaigns.length > 0
    ? sentLocalCampaigns.reduce((sum, camp) => sum + (camp.openRate || 0), 0) / sentLocalCampaigns.length
    : 0;
  const avgClickRate = sentLocalCampaigns.length > 0
    ? sentLocalCampaigns.reduce((sum, camp) => sum + (camp.clickRate || 0), 0) / sentLocalCampaigns.length
    : 0;

  if (isLoadingLocal) {
    return (
      <div className="space-y-6 px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Email Campaigns</h1>
          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
        </div>
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center border border-stone-200/60 dark:border-stone-700/60">
            <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Email Campaigns
              </h1>
              <Badge className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs border border-stone-200/60 dark:border-stone-700/60 rounded-lg px-2 py-0.5">
                <Icon icon="solar:letter-linear" className="w-3 h-3 mr-1" />
                {localCampaigns.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Send emails to your contacts. Local campaigns are saved on your device.
            </p>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-2 flex-wrap">
            <Button asChild className="text-white" style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}>
              <Link href="/campaigns/ai-email">
                <Icon icon="solar:stars-linear" className="mr-2 h-4 w-4" /> Create with AI
              </Link>
            </Button>
            <Button variant="outline" onClick={loadLocalCampaigns} title="Refresh local campaigns">
              <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button asChild variant="outline">
              <Link href="/campaigns/compose-email">
                <Icon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" /> New Campaign
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <Button asChild size="sm" className="flex-shrink-0 text-white" style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}>
            <Link href="/campaigns/ai-email">
              <Icon icon="solar:stars-linear" className="mr-1.5 h-4 w-4" /> AI Create
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={loadLocalCampaigns} className="flex-shrink-0">
            <Icon icon="solar:refresh-linear" className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-shrink-0">
            <Link href="/campaigns/compose-email">
              <Icon icon="solar:add-circle-linear" className="mr-1.5 h-4 w-4" /> New
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl hover:border-blue-500/50 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Campaigns</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Icon icon="solar:letter-linear" className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {localCampaigns.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl hover:border-emerald-500/50 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Open Rate</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Icon icon="solar:eye-linear" className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {avgOpenRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl hover:border-amber-500/50 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Click Rate</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Icon icon="solar:cursor-linear" className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {avgClickRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl hover:border-purple-500/50 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Sent</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Icon icon="solar:graph-up-linear" className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold text-purple-600 dark:text-purple-400">
              {sentLocalCampaigns.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section for Brevo Campaigns */}
      <BrevoCampaignList />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-6 relative" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))' }}>
            <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }} />
            <div className="flex items-center gap-2">
              <Icon icon="solar:letter-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
              <CardTitle className="text-base sm:text-lg font-semibold">Recent Local Campaigns</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">Overview of your latest email campaigns stored locally.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {localCampaigns.length > 0 ? (
              <div className="space-y-3">
                {localCampaigns.slice(0, 5).map(campaign => (
                  <div key={campaign.id} className="p-3 sm:p-4 border border-stone-200/60 dark:border-stone-800/60 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h3 className="font-medium text-foreground text-sm sm:text-base truncate">{campaign.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-lg w-fit ${getCampaignStatusClass(campaign.status)}`}>{campaign.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:letter-linear" className="w-3 h-3" />
                        {campaign.recipientCount || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:eye-linear" className="w-3 h-3" />
                        {campaign.openRate?.toFixed(1) || 'N/A'}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:cursor-linear" className="w-3 h-3" />
                        {campaign.clickRate?.toFixed(1) || 'N/A'}%
                      </span>
                    </div>
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary text-xs sm:text-sm" asChild>
                      <Link href={`/email-marketing/campaigns/${campaign.id}`}>View Details →</Link>
                    </Button>
                  </div>
                ))}
                {localCampaigns.length > 5 && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-4 text-center">
                    And {localCampaigns.length - 5} more campaigns...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 border border-stone-200/60 dark:border-stone-700/60">
                  <Icon icon="solar:letter-linear" className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">No local campaigns found.</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/campaigns/compose-email">Create Your First Campaign</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl overflow-hidden">
            <CardHeader className="p-4 sm:p-6 relative" style={{ background: 'linear-gradient(to right, rgba(20, 184, 166, 0.05), rgba(16, 185, 129, 0.05))' }}>
              <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }} />
              <div className="flex items-center gap-2">
                <Icon icon="solar:link-linear" className="h-4 w-4" style={{ color: '#14b8a6' }} />
                <CardTitle className="text-base sm:text-lg font-semibold">Quick Links</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2">
              <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm rounded-xl" asChild>
                <Link href="/email-marketing/subscribers">
                  <Icon icon="solar:checklist-linear" className="mr-2 h-4 w-4" style={{ color: '#3b82f6' }} /> Contact Lists
                </Link>
              </Button>
              {canShowAutomations && (
                <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm rounded-xl" asChild>
                  <Link href="/email-marketing/automations">
                    <Icon icon="solar:bolt-linear" className="mr-2 h-4 w-4" style={{ color: '#f59e0b' }} /> Auto-Send Emails
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm rounded-xl" asChild>
                <Link href="/settings?tab=integrations">
                  <Icon icon="solar:settings-linear" className="mr-2 h-4 w-4" style={{ color: '#8b5cf6' }} /> Email Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-6 relative" style={{ background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), rgba(168, 85, 247, 0.05))' }}>
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }} />
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-2-linear" className="h-4 w-4" style={{ color: '#8b5cf6' }} />
            <CardTitle className="text-base sm:text-lg font-semibold">Email Performance Analytics</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Performance of your last 5 sent campaigns from local data.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] sm:h-[350px] p-2 sm:p-4">
          <EmailPerformanceChart data={emailChartData} />
        </CardContent>
      </Card>

      <ContextualHelpButton pageId="email-campaigns" />
    </div>
  );
}
