"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { WhatsAppCampaign, WhatsAppRecipient } from '@/types/messaging';
import { getWhatsAppCampaigns, getWhatsAppCampaignRecipients, addWhatsAppCampaign, deleteWhatsAppCampaign } from '@/lib/messaging-campaigns-data';
import { sendBulkWhatsAppViaAiSensyAction } from '@/app/actions/aisensy-actions';
import { getMetaWhatsAppTemplatesAction, sendBulkWhatsAppViaMetaAction } from '@/app/actions/meta-whatsapp-actions';
import { getAuthkeyTemplatesAction, sendBulkWhatsAppViaAuthkeyAction } from '@/app/actions/authkey-actions';
import { getGupshupTemplatesAction, sendBulkWhatsAppViaGupshupAction } from '@/app/actions/gupshup-actions';
import { getMSG91WhatsAppTemplatesAction, sendBulkWhatsAppViaMSG91Action } from '@/app/actions/msg91-whatsapp-actions';
import { getFast2SMSWhatsAppTemplatesAction, sendBulkWhatsAppViaFast2SMSAction } from '@/app/actions/fast2sms-whatsapp-actions';
import { getWhatsAppLists, getWhatsAppContacts } from '@/lib/whatsapp-marketing-data';
import type { WhatsAppList, WhatsAppContact } from '@/types/whatsapp';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function WhatsAppBulkCampaignsPage() {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create'>('campaigns');
  
  // Campaigns list
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  
  // Create campaign
  const [campaignName, setCampaignName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'aisensy' | 'meta' | 'authkey' | 'gupshup' | 'msg91WhatsApp' | 'fast2smsWhatsApp'>('authkey');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');
  const [whatsappLists, setWhatsappLists] = useState<WhatsAppList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [templateType, setTemplateType] = useState<'text' | 'media'>('text');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  
  // Campaign details
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<WhatsAppRecipient[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  // Confetti celebration function
  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // Load campaigns on mount
  useEffect(() => {
    if (appUser?.companyId) {
      loadCampaigns();
      loadWhatsAppLists();
    }
  }, [appUser?.companyId]);

  const loadCampaigns = async () => {
    if (!appUser?.companyId) return;
    setIsLoadingCampaigns(true);
    try {
      const campaignsList = await getWhatsAppCampaigns(appUser.companyId);
      setCampaigns(campaignsList);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({ title: 'Error', description: 'Failed to load campaigns', variant: 'destructive' });
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadWhatsAppLists = async () => {
    if (!appUser?.companyId) return;
    setIsLoadingLists(true);
    try {
      const lists = await getWhatsAppLists(appUser.companyId);
      setWhatsappLists(lists);
    } catch (error) {
      console.error('Error loading WhatsApp lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const loadTemplates = async () => {
    if (!appUser?.idToken) return;
    setIsLoadingTemplates(true);
    try {
      if (selectedPlatform === 'meta') {
        const result = await getMetaWhatsAppTemplatesAction(appUser.idToken);
        if (result.success && result.templates) {
          const approvedTemplates = result.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approvedTemplates);
          if (approvedTemplates.length === 0) {
            toast({ title: 'No Templates Found', description: 'No approved templates found. Create templates in Meta Business Manager first.', variant: 'default' });
          }
        } else {
          setTemplates([]);
          toast({ title: 'Meta WhatsApp Connection Issue', description: result.error || 'Could not load templates. Check your API credentials.', variant: 'destructive' });
        }
      } else if (selectedPlatform === 'gupshup') {
        const result = await getGupshupTemplatesAction(appUser.idToken);
        if (result.success && result.templates) {
          const approvedTemplates = result.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approvedTemplates);
        } else {
          setTemplates([]);
        }
      } else if (selectedPlatform === 'aisensy') {
        setTemplates([]);
        toast({ title: 'Manual Template Entry', description: 'AiSensy requires manual template entry. Create your template in AiSensy dashboard first.', variant: 'default' });
      } else if (selectedPlatform === 'authkey') {
        const result = await getAuthkeyTemplatesAction(appUser.idToken);
        if (result.success && result.templates) {
          const approvedTemplates = result.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approvedTemplates);
        } else {
          setTemplates([]);
        }
      } else if (selectedPlatform === 'msg91WhatsApp') {
        const result = await getMSG91WhatsAppTemplatesAction(appUser.idToken);
        if (result.success && result.templates) {
          const approvedTemplates = result.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approvedTemplates);
        } else {
          setTemplates([]);
        }
      } else if (selectedPlatform === 'fast2smsWhatsApp') {
        const result = await getFast2SMSWhatsAppTemplatesAction(appUser.idToken);
        if (result.success && result.templates) {
          const approvedTemplates = result.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approvedTemplates);
        } else {
          setTemplates([]);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'create' && appUser?.idToken) {
      loadTemplates();
      setSelectedTemplate('');
    }
  }, [activeTab, appUser?.idToken, selectedPlatform]);

  const handleCreateCampaign = async () => {
    if (!appUser?.companyId || !appUser?.uid || !appUser?.idToken) {
      toast({ title: 'Authentication Required', description: 'Please log in to create campaigns', variant: 'destructive' });
      return;
    }
    if (!campaignName.trim()) {
      toast({ title: 'Campaign Name Required', description: 'Please enter a campaign name', variant: 'destructive' });
      return;
    }
    if (!selectedTemplate) {
      toast({ title: 'Message Design Required', description: 'Please choose a message design to send', variant: 'destructive' });
      return;
    }
    if (!selectedListId) {
      toast({ title: 'Recipients Required', description: 'Please select a contact list', variant: 'destructive' });
      return;
    }
    if (selectedPlatform === 'gupshup' && !company?.apiKeys?.gupshup?.phoneNumber) {
      toast({ title: 'Phone Number Required', description: 'Please add your Business WhatsApp Phone Number in Settings.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const contacts = await getWhatsAppContacts(selectedListId, appUser.companyId);
      if (contacts.length === 0) {
        toast({ title: 'No Contacts', description: 'The selected list has no contacts', variant: 'destructive' });
        return;
      }

      const recipients: WhatsAppRecipient[] = contacts.map(contact => ({
        phone: contact.phoneNumber,
        name: contact.name,
        status: 'pending',
      }));

      let result;
      if (selectedPlatform === 'aisensy') {
        result = await sendBulkWhatsAppViaAiSensyAction({ idToken: appUser.idToken, campaignName: selectedTemplate, recipients: recipients.map(r => ({ phone: r.phone, name: r.name })) });
      } else if (selectedPlatform === 'meta') {
        result = await sendBulkWhatsAppViaMetaAction(appUser.idToken, { templateName: selectedTemplate, languageCode: 'en', recipients: recipients.map(r => ({ phone: r.phone, parameters: [] })) });
      } else if (selectedPlatform === 'authkey') {
        result = await sendBulkWhatsAppViaAuthkeyAction(appUser.idToken, { templateName: selectedTemplate, templateType, headerImageUrl: templateType === 'media' ? headerImageUrl : undefined, recipients: recipients.map(r => ({ phone: r.phone, parameters: r.name ? [r.name] : [] })) });
      } else if (selectedPlatform === 'gupshup') {
        result = await sendBulkWhatsAppViaGupshupAction({ idToken: appUser.idToken, source: company!.apiKeys!.gupshup!.phoneNumber!, templateId: selectedTemplate, recipients: recipients.map(r => ({ phone: r.phone, name: r.name, params: [] })) });
      } else if (selectedPlatform === 'msg91WhatsApp') {
        result = await sendBulkWhatsAppViaMSG91Action({ idToken: appUser.idToken, templateName: selectedTemplate, languageCode: 'en', recipients: recipients.map(r => ({ phone: r.phone, name: r.name, parameters: r.name ? [r.name] : [] })) });
      } else if (selectedPlatform === 'fast2smsWhatsApp') {
        result = await sendBulkWhatsAppViaFast2SMSAction({ idToken: appUser.idToken, templateName: selectedTemplate, recipients: recipients.map(r => ({ phone: r.phone, name: r.name, parameters: r.name ? [r.name] : [] })) });
      } else {
        throw new Error('Invalid platform selected');
      }

      if (result.success) {
        const failedPhones = new Set((result as any).failedRecipients?.map((f: { phone: string }) => f.phone) || []);
        const updatedRecipients = recipients.map(recipient => ({ ...recipient, status: failedPhones.has(recipient.phone) ? ('failed' as const) : ('sent' as const) }));
        const successCount = recipients.length - failedPhones.size;
        const failedCount = failedPhones.size;
        const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
        const templateNameForDisplay = selectedTemplateObj ? (selectedTemplateObj.elementName || selectedTemplateObj.name) : selectedTemplate;

        // Map platform to valid type
        const platformMap: Record<string, 'meta' | 'authkey' | 'wati' | 'aisensy' | 'interakt' | 'unified'> = {
          'meta': 'meta',
          'authkey': 'authkey',
          'aisensy': 'aisensy',
          'gupshup': 'unified',
          'msg91WhatsApp': 'unified',
          'fast2smsWhatsApp': 'unified',
        };

        const campaign: Omit<WhatsAppCampaign, 'id' | 'createdAt'> = {
          companyId: appUser.companyId,
          name: campaignName,
          platform: platformMap[selectedPlatform] || 'unified',
          templateId: selectedTemplate,
          templateName: templateNameForDisplay,
          recipients: updatedRecipients,
          status: 'completed',
          createdBy: appUser.uid,
          sentAt: new Date().toISOString(),
          stats: { total: recipients.length, sent: successCount, delivered: 0, read: 0, failed: failedCount, replied: 0 },
        };

        await addWhatsAppCampaign(campaign);
        triggerConfetti();
        toast({ title: 'Campaign Sent Successfully!', description: `Sent to ${successCount} contacts${failedCount > 0 ? ` (${failedCount} failed)` : ''}` });
        setCampaignName('');
        setSelectedTemplate('');
        setSelectedListId('');
        setActiveTab('campaigns');
        loadCampaigns();
      } else {
        throw new Error(result.error || 'Campaign sending failed');
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({ title: 'Campaign Failed', description: error.message || 'Failed to send campaign', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleViewCampaign = async (campaign: WhatsAppCampaign) => {
    if (!appUser?.companyId) return;
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
    setIsLoadingRecipients(true);
    try {
      const recipients = await getWhatsAppCampaignRecipients(appUser.companyId, campaign.id);
      setCampaignRecipients(recipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({ title: 'Error', description: 'Failed to load campaign recipients', variant: 'destructive' });
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!appUser?.companyId) return;
    try {
      await deleteWhatsAppCampaign(appUser.companyId, campaignId);
      toast({ title: 'Campaign Deleted', description: 'Campaign has been removed' });
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({ title: 'Error', description: 'Failed to delete campaign', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: WhatsAppCampaign['status']) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 dark:text-emerald-400';
      case 'sending': return 'text-blue-600 dark:text-blue-400';
      case 'scheduled': return 'text-amber-600 dark:text-amber-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const selectedList = whatsappLists.find(l => l.id === selectedListId);
  const selectedTemplateObj = templates.find(t => (t.id || t.name) === selectedTemplate);

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">WhatsApp Bulk Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">Send WhatsApp messages to hundreds or thousands of contacts at once</p>
        </div>
        <Button asChild size="sm" className="h-8 text-xs text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }}>
          <Link href="/campaigns/ai-email">
            <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-3.5 w-3.5" />
            Create with AI
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3 hover:border-blue-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Icon icon="solar:plain-linear" className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Campaigns</span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">{campaigns.length}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Lists</span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-purple-600 dark:text-purple-400">{whatsappLists.length}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Sent</span>
          </div>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{campaigns.reduce((acc, c) => acc + c.stats.sent, 0)}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3 hover:border-teal-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Icon icon="solar:link-linear" className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Platform</span>
          </div>
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400">API Active</p>
        </div>
      </div>

      {/* Clerk-style Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'campaigns' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" />
              My Campaigns
            </span>
            {activeTab === 'campaigns' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'create' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:add-circle-linear" className="h-4 w-4" />
              Create Campaign
            </span>
            {activeTab === 'create' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4 mt-4">
          {/* Welcome Tip for First-Time Users */}
          {campaigns.length === 0 && !isLoadingCampaigns && (
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
              <div className="flex items-start gap-3">
                <Icon icon="solar:magic-stick-3-linear" className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Quick Start Guide</h3>
                  <p className="text-xs text-muted-foreground">To send your first WhatsApp message to many people:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                    <li>Choose your platform (Gupshup, WMart CPaaS, or AiSensy) and connect it in Settings</li>
                    <li>Create a list of contacts in WhatsApp Marketing</li>
                    <li>Come back here and click "Create Campaign" to send</li>
                  </ol>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <Link href="/settings">
                        <Icon icon="solar:settings-linear" className="h-3.5 w-3.5 mr-1.5" />
                        Set Up Connection
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <Link href="/whatsapp-marketing">
                        <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5 mr-1.5" />
                        Manage Contacts
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostics Tool Alert */}
          {campaigns.length > 0 && (
            <div className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg">
              <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Having trouble sending messages? Use the diagnostics tool to test your WhatsApp connection.</p>
                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <Link href="/whatsapp-diagnostics">
                    <Icon icon="solar:settings-linear" className="h-3.5 w-3.5 mr-1.5" />
                    Run Diagnostics
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Campaign History */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-semibold text-sm">Campaign History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">View and manage your WhatsApp bulk campaigns</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadCampaigns} disabled={isLoadingCampaigns} className="h-8 text-xs">
                <Icon icon={isLoadingCampaigns ? "solar:refresh-linear" : "solar:refresh-linear"} className={cn("mr-1.5 h-3.5 w-3.5", isLoadingCampaigns && "animate-spin")} />
                Refresh
              </Button>
            </div>
            <div className="p-4">
              {isLoadingCampaigns ? (
                <div className="flex justify-center items-center py-8">
                  <Icon icon="solar:refresh-linear" className="animate-spin h-5 w-5 text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="solar:chat-round-line-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="text-sm font-medium mb-1">No campaigns yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">Create your first WhatsApp bulk campaign to get started</p>
                  <Button size="sm" onClick={() => setActiveTab('create')} className="h-8 text-xs">
                    <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <div className="min-w-[800px]">
                    <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Campaign Name</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Message Design</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Status</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Recipients</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Delivered</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Created</th>
                            <th className="h-9 px-4 text-right align-middle text-xs font-medium text-muted-foreground w-[100px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaigns.map((campaign, index) => (
                            <tr key={campaign.id} className={cn("hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors", index !== campaigns.length - 1 && "border-b border-stone-200 dark:border-stone-800")}>
                              <td className="h-12 px-4 align-middle font-medium">{campaign.name}</td>
                              <td className="h-12 px-4 align-middle text-muted-foreground">{campaign.templateName}</td>
                              <td className="h-12 px-4 align-middle">
                                <span className={cn("text-xs font-medium capitalize", getStatusColor(campaign.status))}>
                                  {campaign.status}
                                </span>
                              </td>
                              <td className="h-12 px-4 align-middle tabular-nums">{campaign.stats.total}</td>
                              <td className="h-12 px-4 align-middle tabular-nums">{campaign.stats.delivered} / {campaign.stats.sent}</td>
                              <td className="h-12 px-4 align-middle text-muted-foreground">{format(new Date(campaign.createdAt), 'MMM dd, yyyy')}</td>
                              <td className="h-12 px-4 align-middle text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewCampaign(campaign)}>
                                    <Icon icon="solar:eye-linear" className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => handleDeleteCampaign(campaign.id)}>
                                    <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Campaign Tab */}
      {activeTab === 'create' && (
        <div className="mt-4">
          {/* Two Column Layout: Form + Phone Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              {/* Step 1: Select Platform */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#3b82f6' }}>1</span>
                  <h3 className="font-semibold text-sm">Select WhatsApp Platform</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { id: 'authkey', name: 'WMart CPaaS', badge: 'Recommended', badgeColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', desc: 'Multi-channel CPaaS supporting WhatsApp, SMS, Email, and Voice', apiKey: company?.apiKeys?.authkey },
                    { id: 'meta', name: 'Meta (Direct)', badge: 'Official API', badgeColor: 'bg-stone-100 dark:bg-stone-800 text-muted-foreground', desc: 'Official WhatsApp Business API with best deliverability', apiKey: company?.apiKeys?.metaWhatsApp },
                    { id: 'aisensy', name: 'AiSensy', badge: null, badgeColor: '', desc: 'AI-powered WhatsApp platform with built-in chatbots', apiKey: company?.apiKeys?.aisensy },
                    { id: 'gupshup', name: 'Gupshup', badge: 'Enterprise', badgeColor: 'bg-stone-100 dark:bg-stone-800 text-muted-foreground', desc: 'Enterprise-grade platform with advanced automation', apiKey: company?.apiKeys?.gupshup },
                    { id: 'msg91WhatsApp', name: 'MSG91 WhatsApp', badge: null, badgeColor: '', desc: 'Affordable WhatsApp Business API for India', apiKey: company?.apiKeys?.msg91WhatsApp },
                    { id: 'fast2smsWhatsApp', name: 'Fast2SMS WhatsApp', badge: null, badgeColor: '', desc: 'Zero setup fee WhatsApp platform', apiKey: company?.apiKeys?.fast2smsWhatsApp },
                  ].map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setSelectedPlatform(platform.id as any)}
                      className={cn(
                        "p-3 border rounded-lg text-left transition-all",
                        selectedPlatform === platform.id
                          ? "border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/50"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm flex items-center gap-1.5 flex-wrap">
                          {platform.name}
                          {platform.badge && (
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded", platform.badgeColor)}>{platform.badge}</span>
                          )}
                        </h4>
                        {selectedPlatform === platform.id && platform.apiKey && (
                          <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        )}
                        {selectedPlatform === platform.id && !platform.apiKey && (
                          <Icon icon="solar:danger-triangle-linear" className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{platform.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Platform Not Connected Alert */}
                {selectedPlatform && !(company?.apiKeys as any)?.[selectedPlatform] && (
                  <div className="mt-3 flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                    <Icon icon="solar:danger-triangle-linear" className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Setup Required</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Connect your {selectedPlatform === 'authkey' ? 'WMart CPaaS' : selectedPlatform} account in Settings to send campaigns.</p>
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs mt-2">
                        <Link href="/settings?tab=integrations">
                          <Icon icon="solar:settings-linear" className="h-3.5 w-3.5 mr-1.5" />
                          Set Up Connection
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Campaign Name */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#8b5cf6' }}>2</span>
                  <h3 className="font-semibold text-sm">Campaign Name</h3>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="campaignName" className="text-xs text-muted-foreground">
                    {selectedPlatform === 'aisensy' ? 'Campaign Label (for your records)' : 'Name'}
                  </Label>
                  <Input
                    id="campaignName"
                    placeholder={selectedPlatform === 'aisensy' ? 'e.g., Diwali Campaign 2025' : 'e.g., Summer Sale 2025'}
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Step 3: Select Template */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#14b8a6' }}>3</span>
                  <h3 className="font-semibold text-sm">
                    {selectedPlatform === 'aisensy' ? 'AiSensy API Campaign Name' : 'Message Template'}
                  </h3>
                </div>

                {(selectedPlatform === 'meta' || selectedPlatform === 'gupshup' || (selectedPlatform === 'authkey' && templates.length > 0)) ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="template" className="text-xs text-muted-foreground">Select Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger id="template" className="h-9">
                          <SelectValue placeholder="Choose a message design" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTemplates ? (
                            <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                          ) : templates.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">No approved templates found.</div>
                          ) : (
                            templates.map((template) => (
                              <SelectItem key={template.id || template.name} value={template.id || template.name}>
                                {template.elementName || template.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedPlatform === 'authkey' && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="templateType" className="text-xs text-muted-foreground">Template Type</Label>
                          <Select value={templateType} onValueChange={(v) => setTemplateType(v as 'text' | 'media')}>
                            <SelectTrigger id="templateType" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Template</SelectItem>
                              <SelectItem value="media">Media Template (with image/video)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {templateType === 'media' && (
                          <div className="space-y-1.5">
                            <Label htmlFor="headerImage" className="text-xs text-muted-foreground">Header Image/Video URL</Label>
                            <Input
                              id="headerImage"
                              placeholder="https://wpgallery.s3.ap-south-1.amazonaws.com/gallery/..."
                              value={headerImageUrl}
                              onChange={(e) => setHeaderImageUrl(e.target.value)}
                              className="h-9"
                            />
                            <p className="text-[10px] text-muted-foreground">Upload media in WMart CPaaS Media Gallery first, then paste the URL here.</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="template" className="text-xs text-muted-foreground">
                      {selectedPlatform === 'aisensy' ? 'Campaign Name' : 'Template ID'}
                    </Label>
                    <Input
                      id="template"
                      placeholder={selectedPlatform === 'aisensy' ? 'Enter your AiSensy campaign name' : 'Enter template ID from dashboard'}
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="h-9"
                    />
                    {selectedPlatform === 'authkey' && (
                      <>
                        <div className="space-y-1.5 mt-3">
                          <Label htmlFor="templateType" className="text-xs text-muted-foreground">Template Type</Label>
                          <Select value={templateType} onValueChange={(v) => setTemplateType(v as 'text' | 'media')}>
                            <SelectTrigger id="templateType" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text Template</SelectItem>
                              <SelectItem value="media">Media Template (with image/video)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {templateType === 'media' && (
                          <div className="space-y-1.5 mt-3">
                            <Label htmlFor="headerImage" className="text-xs text-muted-foreground">Header Image/Video URL</Label>
                            <Input
                              id="headerImage"
                              placeholder="https://wpgallery.s3.ap-south-1.amazonaws.com/gallery/..."
                              value={headerImageUrl}
                              onChange={(e) => setHeaderImageUrl(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                  <Icon icon="solar:info-circle-linear" className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                  <div className="text-[10px] text-muted-foreground">
                    <p className="font-medium mb-1">Only WhatsApp-approved designs shown</p>
                    <p>WhatsApp reviews all bulk message designs before you can use them. This usually takes 1-24 hours.</p>
                  </div>
                </div>
              </div>

              {/* Step 4: Select Recipients */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: '#10b981' }}>4</span>
                  <h3 className="font-semibold text-sm">Select Recipients</h3>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipientList" className="text-xs text-muted-foreground">Contact List</Label>
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger id="recipientList" className="h-9">
                      <SelectValue placeholder="Select a contact list" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLists ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading...</div>
                      ) : whatsappLists.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">No contact lists found. Create one in WhatsApp Marketing.</div>
                      ) : (
                        whatsappLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name} ({list.contactCount || 0} contacts)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedList && (
                  <div className="flex items-center gap-2 p-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                    <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" style={{ color: '#10b981' }} />
                    <span className="text-xs">
                      <strong style={{ color: '#10b981' }}>{selectedList.contactCount || 0}</strong> contacts will receive this message
                    </span>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleCreateCampaign}
                disabled={isSending || !campaignName || !selectedTemplate || !selectedListId}
                className="w-full h-10 text-white"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' }}
              >
                {isSending ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:plain-linear" className="h-4 w-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </div>

            {/* Phone Preview - Sticky on desktop */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-4">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">Live Preview</p>
                
                {/* WhatsApp Phone Frame */}
                <div className="mx-auto w-[280px] h-[560px] bg-stone-900 rounded-[3rem] p-3 shadow-xl border-4 border-stone-800">
                  <div className="w-full h-full bg-[#0b141a] rounded-[2.25rem] overflow-hidden flex flex-col">
                    {/* Phone Notch */}
                    <div className="flex justify-center pt-2 pb-1">
                      <div className="w-20 h-5 bg-stone-900 rounded-full" />
                    </div>
                    
                    {/* WhatsApp Header */}
                    <div className="px-3 py-2 bg-[#1f2c34] flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center">
                        <Icon icon="solar:user-bold" className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {selectedList ? `${selectedList.contactCount || 0} Recipients` : 'Contact Name'}
                        </p>
                        <p className="text-[10px] text-stone-400">online</p>
                      </div>
                      <Icon icon="solar:videocamera-linear" className="w-5 h-5 text-stone-400" />
                      <Icon icon="solar:phone-linear" className="w-5 h-5 text-stone-400" />
                    </div>
                    
                    {/* Chat Background */}
                    <div className="flex-1 p-3 overflow-y-auto" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23182229\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                      {selectedTemplate ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-[#005c4b] rounded-lg rounded-tr-sm px-3 py-2 shadow-sm">
                            <p className="text-xs text-white whitespace-pre-wrap break-words leading-relaxed">
                              {selectedTemplateObj?.body || selectedTemplateObj?.content || `Template: ${selectedTemplate}`}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p className="text-[9px] text-stone-300">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <Icon icon="solar:check-read-bold" className="w-3 h-3 text-[#53bdeb]" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Icon icon="solar:chat-round-line-linear" className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                            <p className="text-xs text-stone-500">Select a template to preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* WhatsApp Input Bar */}
                    <div className="px-2 py-2 bg-[#1f2c34] flex items-center gap-2">
                      <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-2 flex items-center gap-2">
                        <Icon icon="solar:sticker-smile-circle-linear" className="w-5 h-5 text-stone-400" />
                        <span className="text-xs text-stone-500 flex-1">Type a message</span>
                        <Icon icon="solar:paperclip-linear" className="w-5 h-5 text-stone-400" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                        <Icon icon="solar:microphone-bold" className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Home Indicator */}
                    <div className="flex justify-center py-2 bg-[#0b141a]">
                      <div className="w-24 h-1 bg-stone-700 rounded-full" />
                    </div>
                  </div>
                </div>
                
                {/* Preview Stats */}
                <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Campaign: {campaignName || 'Not set'}</span>
                    <span>{selectedList?.contactCount || 0} recipients</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Platform: {selectedPlatform === 'authkey' ? 'WMart CPaaS' : selectedPlatform}</span>
                    <span>Template: {selectedTemplate ? 'Selected' : 'Not selected'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-3xl max-h-[80vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
          <DialogHeader className="relative">
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>Campaign details and delivery status</DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            {selectedCampaign && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Status</p>
                    <span className={cn("text-sm font-medium capitalize", getStatusColor(selectedCampaign.status))}>
                      {selectedCampaign.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Template</p>
                    <p className="text-sm font-medium">{selectedCampaign.templateName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Total</p>
                    <p className="text-sm font-medium tabular-nums">{selectedCampaign.stats.total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Delivered</p>
                    <p className="text-sm font-medium tabular-nums">
                      {selectedCampaign.stats.delivered} ({Math.round((selectedCampaign.stats.delivered / selectedCampaign.stats.total) * 100)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Read</p>
                    <p className="text-sm font-medium tabular-nums">{selectedCampaign.stats.read}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Failed</p>
                    <p className="text-sm font-medium tabular-nums text-red-600 dark:text-red-400">{selectedCampaign.stats.failed}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">Recipients</h4>
                  {isLoadingRecipients ? (
                    <div className="flex items-center justify-center py-4">
                      <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ScrollArea className="w-full">
                      <div className="min-w-[400px]">
                        <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                                <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Name</th>
                                <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Phone</th>
                                <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {campaignRecipients.slice(0, 50).map((recipient, index) => (
                                <tr key={index} className={cn("hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors", index !== Math.min(campaignRecipients.length, 50) - 1 && "border-b border-stone-200 dark:border-stone-800")}>
                                  <td className="h-10 px-4 align-middle font-medium">{recipient.name || '-'}</td>
                                  <td className="h-10 px-4 align-middle text-muted-foreground">{recipient.phone}</td>
                                  <td className="h-10 px-4 align-middle">
                                    <span className={cn(
                                      "text-xs font-medium capitalize",
                                      recipient.status === 'delivered' || recipient.status === 'sent' ? 'text-emerald-600 dark:text-emerald-400' :
                                      recipient.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                                      'text-muted-foreground'
                                    )}>
                                      {recipient.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {campaignRecipients.length > 50 && (
                            <div className="p-2 text-xs text-center text-muted-foreground border-t border-stone-200 dark:border-stone-800">
                              Showing first 50 of {campaignRecipients.length} recipients
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Help Button */}
      <ContextualHelpButton pageId="whatsapp-bulk-campaigns" />
    </div>
  );
}
