"use client";

import { useState, useEffect, useCallback } from 'react';
import PageTitle from '@/components/ui/page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, ListChecks, Send, Settings2, RefreshCw, Loader2, Sparkles, Mail, TrendingUp, MousePointer, Eye } from 'lucide-react';
import Link from 'next/link';
import type { EmailCampaign } from '@/lib/mock-data';
import { getStoredEmailCampaigns } from '@/lib/mock-data';
import BrevoCampaignList from '@/components/email/BrevoCampaignList';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import EmailPerformanceChart, { type EmailChartData } from '@/components/email/email-performance-chart';
import { useAuth } from '@/hooks/use-auth';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { Animated, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/animated';


// Helper for campaign status styling
const getCampaignStatusClass = (status: EmailCampaign['status']) => {
  switch (status) {
    case 'Sent via Brevo':
    case 'Sent via Sender.net':
    case 'Sent':
      return 'bg-success-muted text-success-muted-foreground border border-success-border';
    case 'Draft':
      return 'bg-warning-muted text-warning-muted-foreground border border-warning-border';
    case 'Scheduled':
      return 'bg-info-muted text-info-muted-foreground border border-info-border';
    case 'Sending via Brevo':
    case 'Sending via Sender.net':
      return 'bg-info-muted text-info-muted-foreground border border-info-border animate-pulse';
    case 'Failed via Brevo':
    case 'Failed via Sender.net':
    case 'Failed':
      return 'bg-destructive-muted text-destructive-muted-foreground border border-destructive-border';
    default:
      return 'bg-muted text-muted-foreground border border-border';
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
    
    // Use safe date conversion for sorting
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

  // Aggregate stats from loaded local campaigns (simplified)
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
        <PageTitle title="Email Campaigns" description="Loading campaigns..." />
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      {/* Header Section */}
      <Animated animation="fadeUp">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Email Campaigns
                </h1>
                <Badge variant="secondary" className="text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  {localCampaigns.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Send emails to your contacts. Local campaigns are saved on your device.
              </p>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex gap-2 flex-wrap">
              <Button asChild variant="default">
                <Link href="/campaigns/ai-email">
                  <Sparkles className="mr-2 h-4 w-4" /> Create with AI
                </Link>
              </Button>
              <Button variant="outline" onClick={loadLocalCampaigns} title="Refresh local campaigns">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href="/email-marketing/create-campaign">
                  <PlusCircle className="mr-2 h-4 w-4" /> New Campaign
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Mobile Actions */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button asChild size="sm" variant="default" className="flex-shrink-0 touch-target">
              <Link href="/campaigns/ai-email">
                <Sparkles className="mr-1.5 h-4 w-4" /> AI Create
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={loadLocalCampaigns} className="flex-shrink-0 touch-target">
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button asChild variant="outline" size="sm" className="flex-shrink-0 touch-target">
              <Link href="/email-marketing/create-campaign">
                <PlusCircle className="mr-1.5 h-4 w-4" /> New
              </Link>
            </Button>
          </div>
        </div>
      </Animated>
      
      {/* Stats Cards */}
      <Animated animation="fadeUp">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Campaigns</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                <AnimatedCounter value={localCampaigns.length} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-success-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Open Rate</span>
                <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center">
                  <Eye className="w-4 h-4 text-success-muted-foreground" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-success">
                <AnimatedCounter value={avgOpenRate} decimals={1} suffix="%" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-info-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Click Rate</span>
                <div className="w-8 h-8 rounded-lg bg-info-muted flex items-center justify-center">
                  <MousePointer className="w-4 h-4 text-info-muted-foreground" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-info">
                <AnimatedCounter value={avgClickRate} decimals={1} suffix="%" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Sent</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                <AnimatedCounter value={sentLocalCampaigns.length} />
              </div>
            </CardContent>
          </Card>
        </div>
      </Animated>

      {/* Section for Brevo Campaigns */}
      <Animated animation="fadeUp">
        <BrevoCampaignList />
      </Animated>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Animated animation="fadeUp" className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Recent Local Campaigns</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Overview of your latest email campaigns stored locally.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {localCampaigns.length > 0 ? (
                <StaggerContainer className="space-y-3">
                  {localCampaigns.slice(0, 5).map(campaign => (
                    <StaggerItem key={campaign.id}>
                      <div className="p-3 sm:p-4 border rounded-xl hover:bg-muted/50 transition-all duration-300 hover:shadow-md group">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{campaign.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full w-fit ${getCampaignStatusClass(campaign.status)}`}>{campaign.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {campaign.recipientCount || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {campaign.openRate?.toFixed(1) || 'N/A'}%
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3" />
                            {campaign.clickRate?.toFixed(1) || 'N/A'}%
                          </span>
                        </div>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary text-xs sm:text-sm" asChild>
                          <Link href={`/email-marketing/campaigns/${campaign.id}`}>View Details →</Link>
                        </Button>
                      </div>
                    </StaggerItem>
                  ))}
                  {localCampaigns.length > 5 && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-4 text-center">
                      And {localCampaigns.length - 5} more campaigns...
                    </p>
                  )}
                </StaggerContainer>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">No local campaigns found.</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/email-marketing/create-campaign">Create Your First Campaign</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </Animated>

        <Animated animation="fadeUp" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2">
              <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm" asChild>
                <Link href="/email-marketing/subscribers">
                  <ListChecks className="mr-2 h-4 w-4"/> Contact Lists
                </Link>
              </Button>
              {canShowAutomations && (
                <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm" asChild>
                  <Link href="/email-marketing/automations">
                    <Send className="mr-2 h-4 w-4"/> Auto-Send Emails
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start h-10 sm:h-11 text-sm" asChild>
                <Link href="/settings?tab=integrations">
                  <Settings2 className="mr-2 h-4 w-4"/> Email Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </Animated>
      </div>

      <Animated animation="fadeUp">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Email Performance Analytics</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Performance of your last 5 sent campaigns from local data.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] sm:h-[350px] p-2 sm:p-4">
            <EmailPerformanceChart data={emailChartData} />
          </CardContent>
        </Card>
      </Animated>
      
      <ContextualHelpButton pageId="email-campaigns" />
    </div>
  );
}
