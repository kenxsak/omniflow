"use client";

import { useState, useEffect, useMemo } from 'react';
import PageTitle from '@/components/ui/page-title';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Animated, StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/animated';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { EmailCampaign } from '@/lib/mock-data';
import { getStoredEmailCampaigns } from '@/lib/mock-data';
import { getSMSCampaigns, getWhatsAppCampaigns } from '@/lib/messaging-campaigns-data';
import type { SMSCampaign, WhatsAppCampaign } from '@/types/messaging';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

const INITIAL_DISPLAY_COUNT = 20;
const LOAD_MORE_COUNT = 20;

export default function CampaignsPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'email' | 'sms' | 'whatsapp'>('all');
  
  const [emailCampaigns, setEmailCampaigns] = useState<EmailCampaign[]>([]);
  const [smsCampaigns, setSmsCampaigns] = useState<SMSCampaign[]>([]);
  const [whatsappCampaigns, setWhatsAppCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  useEffect(() => {
    if (appUser?.companyId) {
      loadAllCampaigns();
    }
  }, [appUser?.companyId]);

  const loadAllCampaigns = async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
      const [emails, sms, whatsapp] = await Promise.all([
        getStoredEmailCampaigns(appUser.companyId),
        getSMSCampaigns(appUser.companyId),
        getWhatsAppCampaigns(appUser.companyId),
      ]);
      setEmailCampaigns(emails);
      setSmsCampaigns(sms);
      setWhatsAppCampaigns(whatsapp);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
      case 'completed':
        return <Badge variant="success" size="sm"><Icon icon="solar:checkmark-circle-linear" className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'sending':
      case 'processing':
        return <Badge variant="info" size="sm"><Icon icon="solar:clock-circle-linear" className="h-3 w-3 mr-1" />Sending</Badge>;
      case 'failed':
        return <Badge variant="destructive" size="sm"><Icon icon="solar:close-circle-linear" className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'draft':
        return <Badge variant="outline" size="sm"><Icon icon="solar:clock-circle-linear" className="h-3 w-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const allCampaigns = useMemo(() => {
    return [
      ...emailCampaigns.map(c => ({ ...c, type: 'email' as const, icon: 'solar:letter-linear' })),
      ...smsCampaigns.map(c => ({ ...c, type: 'sms' as const, icon: 'solar:chat-square-linear' })),
      ...whatsappCampaigns.map(c => ({ ...c, type: 'whatsapp' as const, icon: 'solar:chat-round-dots-linear' })),
    ].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [emailCampaigns, smsCampaigns, whatsappCampaigns]);

  const loadMoreCampaigns = () => {
    setDisplayCount(prev => prev + LOAD_MORE_COUNT);
  };

  const renderCampaignTable = (campaigns: typeof allCampaigns) => {
    if (campaigns.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12">
          <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Icon icon="solar:paper-plane-linear" className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">No campaigns yet. Create your first campaign!</p>
          <Button asChild>
            <Link href="/campaigns/ai-email">
              <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-4 w-4" />
              Create with AI
            </Link>
          </Button>
        </div>
      );
    }

    const displayedCampaigns = campaigns.slice(0, displayCount);
    const hasMore = campaigns.length > displayCount;

    return (
      <>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[600px] sm:min-w-0 px-4 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Channel</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="hidden sm:table-cell">Recipients</TableHead>
                  <TableHead className="hidden md:table-cell">Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-right w-[60px]">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCampaigns.map((campaign, index) => {
                  const campaignIcon = campaign.icon;
                  const createdDate = campaign.createdAt?.toDate 
                    ? campaign.createdAt.toDate() 
                    : new Date(campaign.createdAt || Date.now());
                  
                  return (
                    <TableRow key={`${campaign.type}-${campaign.id || index}`} className="group">
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                            <Icon icon={campaignIcon} className="h-3.5 w-3.5" />
                          </div>
                          <span className="capitalize text-xs hidden xs:inline">{campaign.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs sm:text-sm line-clamp-1">{campaign.name}</span>
                          {campaign.type === 'email' && (campaign as any).isAIGenerated && (
                            <Badge variant="purple" size="sm">
                              <Icon icon="solar:magic-stick-3-linear" className="h-2.5 w-2.5 mr-0.5" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className="sm:hidden text-[10px] text-muted-foreground mt-0.5">
                          {(campaign as any).recipientCount || 0} recipients • {format(createdDate, 'MMM dd')}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          <Icon icon="solar:users-group-two-rounded-linear" className="h-3 w-3 text-muted-foreground" />
                          {(campaign as any).recipientCount || 0}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {campaign.type === 'email' && (
                          <Badge variant="outline" size="sm">
                            {(campaign as any).provider === 'brevo' ? 'Brevo' : 
                             (campaign as any).provider === 'sender' ? 'Sender' : 
                             campaign.status?.includes('Brevo') ? 'Brevo' :
                             campaign.status?.includes('Sender') ? 'Sender' : '-'}
                          </Badge>
                        )}
                        {campaign.type !== 'email' && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {format(createdDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" className="opacity-60 group-hover:opacity-100">
                          <Icon icon="solar:eye-linear" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        {hasMore && (
          <div className="flex justify-center py-4 border-t">
            <Button variant="outline" size="sm" onClick={loadMoreCampaigns}>
              <Icon icon="solar:alt-arrow-down-linear" className="h-4 w-4 mr-2" />
              Load More ({campaigns.length - displayCount} remaining)
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Animated animation="fadeDown">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <PageTitle 
            title="Campaigns" 
            description="Send messages via Email, SMS, or WhatsApp"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Link href="/campaigns/compose-email">
                <Icon icon="solar:pen-new-square-linear" className="mr-1.5 h-4 w-4" />
                <span className="hidden xs:inline">Compose</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1 sm:flex-none">
              <Link href="/campaigns/ai-email">
                <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-4 w-4" />
                AI Studio
              </Link>
            </Button>
          </div>
        </div>
      </Animated>

      <ContextualHelpButton pageId="email-campaigns" />

      {/* Quick Actions */}
      <Animated animation="fadeUp">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { href: '/campaigns/compose-email', icon: 'solar:pen-new-square-linear', title: 'Write Email', desc: 'No AI credits' },
            { href: '/campaigns/ai-email', icon: 'solar:magic-stick-3-linear', title: 'AI Studio', desc: 'Generate with AI' },
            { href: '/campaigns/templates', icon: 'solar:document-text-linear', title: 'Templates', desc: 'Ready designs' },
            { href: '/campaigns/ai-email/saved-templates', icon: 'solar:letter-linear', title: 'Saved', desc: 'Your templates' },
          ].map((item, i) => (
            <Link 
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center gap-1 p-3 sm:p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Icon icon={item.icon} className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">{item.title}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center hidden xs:block">{item.desc}</span>
            </Link>
          ))}
        </div>
      </Animated>

      {/* Stats */}
      <StaggerContainer className="grid grid-cols-3 gap-2 sm:gap-4">
        <StaggerItem>
          <Card className="card-gradient-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              <Icon icon="solar:paper-plane-linear" className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {isLoading ? <Icon icon="solar:refresh-circle-linear" className="h-5 w-5 animate-spin" /> : <AnimatedCounter value={allCampaigns.length} />}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="card-gradient-purple">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Email</CardTitle>
              <Icon icon="solar:letter-linear" className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {isLoading ? <Icon icon="solar:refresh-circle-linear" className="h-5 w-5 animate-spin" /> : <AnimatedCounter value={emailCampaigns.length} />}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">SMS/WA</CardTitle>
              <Icon icon="solar:chat-square-linear" className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-success">
                {isLoading ? <Icon icon="solar:refresh-circle-linear" className="h-5 w-5 animate-spin" /> : <AnimatedCounter value={smsCampaigns.length + whatsappCampaigns.length} />}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Campaign List */}
      <Animated animation="fadeUp">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Your Campaigns</CardTitle>
                <CardDescription className="text-xs sm:text-sm">View and manage all campaigns</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/campaign-jobs" className="flex items-center gap-1.5">
                  <Icon icon="solar:clock-circle-linear" className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Delivery Status</span>
                  <span className="xs:hidden">Status</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="rounded-none">
                <TabsTrigger value="all">All ({allCampaigns.length})</TabsTrigger>
                <TabsTrigger value="email">Email ({emailCampaigns.length})</TabsTrigger>
                <TabsTrigger value="sms">SMS ({smsCampaigns.length})</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp ({whatsappCampaigns.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  renderCampaignTable(allCampaigns)
                )}
              </TabsContent>
              
              <TabsContent value="email" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  renderCampaignTable(allCampaigns.filter(c => c.type === 'email'))
                )}
              </TabsContent>
              
              <TabsContent value="sms" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  renderCampaignTable(allCampaigns.filter(c => c.type === 'sms'))
                )}
              </TabsContent>
              
              <TabsContent value="whatsapp" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  renderCampaignTable(allCampaigns.filter(c => c.type === 'whatsapp'))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Animated>
    </div>
  );
}
