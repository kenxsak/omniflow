"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        return <Badge variant="secondary" className="text-[10px]">Sent</Badge>;
      case 'sending':
      case 'processing':
        return <Badge variant="secondary" className="text-[10px]">Sending</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="text-[10px]">Failed</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="text-[10px]">Draft</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
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

  const filteredCampaigns = useMemo(() => {
    if (activeTab === 'all') return allCampaigns;
    return allCampaigns.filter(c => c.type === activeTab);
  }, [allCampaigns, activeTab]);

  const loadMoreCampaigns = () => {
    setDisplayCount(prev => prev + LOAD_MORE_COUNT);
  };

  const displayedCampaigns = filteredCampaigns.slice(0, displayCount);
  const hasMore = filteredCampaigns.length > displayCount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <div className="flex justify-between gap-x-8 items-center">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
            <p className="text-sm text-muted-foreground">Send messages via Email, SMS, or WhatsApp</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="h-8 shadow-sm">
              <Link href="/campaigns/compose-email">
                <Icon icon="solar:pen-new-square-linear" className="mr-1.5 h-4 w-4" />
                Compose
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 shadow-sm">
              <Link href="/campaigns/ai-email">
                <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-4 w-4" />
                AI Studio
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <ContextualHelpButton pageId="email-campaigns" />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/campaigns/compose-email', icon: 'solar:pen-new-square-linear', title: 'Write Email', desc: 'No AI credits' },
          { href: '/campaigns/ai-email', icon: 'solar:magic-stick-3-linear', title: 'AI Studio', desc: 'Generate with AI' },
          { href: '/campaigns/templates', icon: 'solar:document-text-linear', title: 'Templates', desc: 'Ready designs' },
          { href: '/campaigns/ai-email/saved-templates', icon: 'solar:letter-linear', title: 'Saved', desc: 'Your templates' },
        ].map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className="group relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden hover:border-stone-300 dark:hover:border-stone-700 transition-all"
          >
            <div className="flex flex-col items-center gap-1.5 p-4">
              <Icon icon={item.icon} className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-center">{item.title}</span>
              <span className="text-[10px] text-muted-foreground text-center">{item.desc}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total</span>
              <Icon icon="solar:paper-plane-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin" /> : allCampaigns.length}
            </p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email</span>
              <Icon icon="solar:letter-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin" /> : emailCampaigns.length}
            </p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">SMS/WA</span>
              <Icon icon="solar:chat-square-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">
              {isLoading ? <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin" /> : smsCampaigns.length + whatsappCampaigns.length}
            </p>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Your Campaigns</span>
            <p className="text-xs text-muted-foreground mt-0.5">View and manage all campaigns</p>
          </div>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs shadow-sm">
            <Link href="/campaign-jobs" className="flex items-center gap-1.5">
              <Icon icon="solar:clock-circle-linear" className="h-3.5 w-3.5" />
              Delivery Status
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-stretch gap-6 px-4 border-b border-stone-200 dark:border-stone-800">
          {[
            { key: 'all', label: 'All', count: allCampaigns.length },
            { key: 'email', label: 'Email', count: emailCampaigns.length },
            { key: 'sms', label: 'SMS', count: smsCampaigns.length },
            { key: 'whatsapp', label: 'WhatsApp', count: whatsappCampaigns.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap py-2.5 text-sm transition-colors ${
                activeTab === tab.key 
                  ? 'text-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === tab.key && (
                <span className="absolute left-0 top-full h-px w-full bg-foreground" />
              )}
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:paper-plane-linear" className="h-8 w-8 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">No campaigns yet. Create your first campaign!</p>
              <Button asChild size="sm">
                <Link href="/campaigns/ai-email">
                  <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-4 w-4" />
                  Create with AI
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-1">
              <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-100/50 dark:bg-stone-800/50">
                      <th className="text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Channel</th>
                      <th className="text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Campaign</th>
                      <th className="text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden sm:table-cell">Recipients</th>
                      <th className="text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden md:table-cell">Provider</th>
                      <th className="text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status</th>
                      <th className="text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden sm:table-cell">Created</th>
                      <th className="text-right py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">View</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-stone-950">
                    {displayedCampaigns.map((campaign, index) => {
                      const createdDate = campaign.createdAt?.toDate 
                        ? campaign.createdAt.toDate() 
                        : new Date(campaign.createdAt || Date.now());
                      
                      return (
                        <tr key={`${campaign.type}-${campaign.id || index}`} className="border-t border-stone-200 dark:border-stone-800 hover:bg-muted/30 transition-colors group">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Icon icon={campaign.icon} className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize text-xs">{campaign.type}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-sm">{campaign.name}</span>
                          </td>
                          <td className="text-center py-3 px-3 hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Icon icon="solar:users-group-two-rounded-linear" className="h-3 w-3" />
                              {(campaign as any).recipientCount || 0}
                            </div>
                          </td>
                          <td className="text-center py-3 px-3 hidden md:table-cell">
                            {campaign.type === 'email' ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {(campaign as any).provider === 'brevo' ? 'Brevo' : 
                                 (campaign as any).provider === 'sender' ? 'Sender' : 
                                 campaign.status?.includes('Brevo') ? 'Brevo' :
                                 campaign.status?.includes('Sender') ? 'Sender' : '-'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-3">{getStatusBadge(campaign.status)}</td>
                          <td className="text-center py-3 px-3 hidden sm:table-cell text-xs text-muted-foreground">
                            {format(createdDate, 'MMM dd, yyyy')}
                          </td>
                          <td className="text-right py-3 px-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 group-hover:opacity-100">
                              <Icon icon="solar:eye-linear" className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" size="sm" onClick={loadMoreCampaigns} className="h-8 text-xs shadow-sm">
                <Icon icon="solar:alt-arrow-down-linear" className="h-4 w-4 mr-2" />
                Load More ({filteredCampaigns.length - displayCount} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
