'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useCompanyApiKeys } from '@/hooks/use-company-api-keys';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { generateEmailCampaignAction } from '@/app/actions/unified-campaign-actions';
import { createAICampaignDraftAction, updateAICampaignDraftAction, getAICampaignDraftAction } from '@/app/actions/ai-campaign-draft-actions';
import { createSavedEmailTemplateAction } from '@/app/actions/saved-email-template-actions';
import { publishAICampaignAction } from '@/app/actions/publish-ai-campaign-actions';
import { fetchBrevoListsAction } from '@/actions/brevo-subscribers';
import { fetchSenderListsAction } from '@/app/actions/sender-actions';
import { fetchInternalEmailListsAction, type InternalEmailList } from '@/app/actions/fetch-internal-email-lists-action';
import { syncEmailListToBrevoAction, syncEmailListToSenderAction } from '@/app/actions/sync-email-list-to-provider-action';
import type { ParsedCampaignBrief, EmailContent } from '@/types/ai-campaigns';
import { getDefaultBrevoListId } from '@/lib/brevo-utils';
import { showAIContentReadyToast } from '@/lib/ai-toast-helpers';

const EXAMPLE_PROMPTS = [
  "Flash sale - 50% off everything! Ends tonight at midnight. Target all customers. Urgent tone. CTA: Shop Now",
  "New product launch: AI-powered business assistant. Professional tone. Target: small business owners. CTA: Start Free Trial",
  "Holiday special event next Friday. Friendly tone. Include early bird discount. CTA: Reserve Your Spot",
];

// Custom AI Email Icon
const AIEmailIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.537 1.26a.4.4 0 0 1 .088-.01h9.75q.045 0 .088.01L6.5 4.738zM.033 1.3A1.6 1.6 0 0 0 0 1.626v6.75A1.625 1.625 0 0 0 1.625 10H5a.625.625 0 1 0 0-1.25H1.625a.375.375 0 0 1-.375-.375V2.586l4.891 3.426a.63.63 0 0 0 .718 0l4.891-3.426v4.039a.625.625 0 1 0 1.25 0v-5A1.627 1.627 0 0 0 11.375 0h-9.75A1.625 1.625 0 0 0 .033 1.3m11.143 6.1c-.195-.87-1.428-.865-1.616.006l-.02.097A2.65 2.65 0 0 1 7.422 9.57c-.896.159-.896 1.453 0 1.612a2.65 2.65 0 0 1 2.118 2.066l.02.097c.188.87 1.42.877 1.616.007l.025-.113a2.67 2.67 0 0 1 2.126-2.056c.897-.159.897-1.455 0-1.614A2.67 2.67 0 0 1 11.2 7.512z" clipRule="evenodd" />
  </svg>
);

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers: number;
}

interface SenderList {
  id: string;
  name: string;
  total: number;
}

type DeliveryProvider = 'brevo' | 'sender' | 'smtp';
type WizardStage = 1 | 2 | 3;

export default function AICampaignStudioPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { apiKeys, isLoading: isLoadingApiKeys } = useCompanyApiKeys();
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftIdFromUrl = searchParams.get('draft');
  
  const [stage, setStage] = useState<WizardStage>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [loadedFromDraft, setLoadedFromDraft] = useState(false);
  const [attemptedDraftId, setAttemptedDraftId] = useState<string | null>(null);
  
  const [campaignPrompt, setCampaignPrompt] = useState('');
  const [parsedBrief, setParsedBrief] = useState<ParsedCampaignBrief | null>(null);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  
  const [emailListId, setEmailListId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  
  const [selectedInternalListId, setSelectedInternalListId] = useState('');
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider | null>(null);
  const [brevoLists, setBrevoLists] = useState<BrevoList[]>([]);
  const [senderLists, setSenderLists] = useState<SenderList[]>([]);
  const [internalLists, setInternalLists] = useState<InternalEmailList[]>([]);
  const [selectedBrevoListId, setSelectedBrevoListId] = useState('__new__');
  const [selectedSenderListId, setSelectedSenderListId] = useState('');
  const [isLoadingBrevoLists, setIsLoadingBrevoLists] = useState(false);
  const [isLoadingSenderLists, setIsLoadingSenderLists] = useState(false);
  const [isLoadingInternalLists, setIsLoadingInternalLists] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const fetchBrevoLists = useCallback(async () => {
    if (!apiKeys?.brevo?.apiKey) return;
    
    setIsLoadingBrevoLists(true);
    try {
      const result = await fetchBrevoListsAction(apiKeys.brevo.apiKey);
      if (result.success && result.lists) {
        setBrevoLists(result.lists);
        if (result.lists.length > 0 && !selectedBrevoListId) {
          const defaultId = getDefaultBrevoListId(apiKeys);
          const defaultListExists = result.lists?.find(l => l.id.toString() === defaultId);
          if (defaultListExists) {
            setSelectedBrevoListId(defaultId);
          } else {
            setSelectedBrevoListId(result.lists[0].id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Brevo lists:', error);
    } finally {
      setIsLoadingBrevoLists(false);
    }
  }, [apiKeys, selectedBrevoListId]);

  const fetchSenderLists = useCallback(async () => {
    if (!apiKeys?.sender?.apiKey) return;
    
    setIsLoadingSenderLists(true);
    try {
      const result = await fetchSenderListsAction(apiKeys.sender.apiKey);
      if (result.success && result.lists) {
        setSenderLists(result.lists.map(l => ({
          id: l.id,
          name: l.title,
          total: l.total || 0
        })));
        if (result.lists.length > 0 && !selectedSenderListId) {
          setSelectedSenderListId(result.lists[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching Sender lists:', error);
    } finally {
      setIsLoadingSenderLists(false);
    }
  }, [apiKeys, selectedSenderListId]);

  const fetchInternalLists = useCallback(async () => {
    if (!appUser?.idToken) return;
    
    setIsLoadingInternalLists(true);
    try {
      const result = await fetchInternalEmailListsAction(appUser.idToken);
      if (result.success && result.lists) {
        setInternalLists(result.lists);
        if (result.lists.length > 0 && !selectedInternalListId) {
          setSelectedInternalListId(result.lists[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching internal lists:', error);
    } finally {
      setIsLoadingInternalLists(false);
    }
  }, [appUser?.idToken, selectedInternalListId]);

  useEffect(() => {
    if (stage === 3) {
      if (!loadedFromDraft) {
        setSelectedInternalListId('');
        setDeliveryProvider(null);
        setSelectedBrevoListId('');
        setSelectedSenderListId('');
      }
      fetchInternalLists();
    }
  }, [stage, loadedFromDraft]);

  useEffect(() => {
    if (stage === 3 && deliveryProvider === 'brevo' && apiKeys?.brevo?.apiKey) {
      fetchBrevoLists();
    } else if (stage === 3 && deliveryProvider === 'sender' && apiKeys?.sender?.apiKey) {
      fetchSenderLists();
    }
  }, [stage, deliveryProvider, apiKeys?.brevo?.apiKey, apiKeys?.sender?.apiKey, fetchBrevoLists, fetchSenderLists]);

  useEffect(() => {
    if (!draftIdFromUrl) {
      if (loadedFromDraft) {
        setLoadedFromDraft(false);
        setCampaignPrompt('');
        setParsedBrief(null);
        setEmailContent(null);
        setStage(1);
      }
      if (currentDraftId) setCurrentDraftId(null);
      if (attemptedDraftId) setAttemptedDraftId(null);
    } else if (draftIdFromUrl !== attemptedDraftId) {
      if (loadedFromDraft) setLoadedFromDraft(false);
    }
  }, [draftIdFromUrl, loadedFromDraft, currentDraftId, attemptedDraftId]);

  useEffect(() => {
    const loadDraftFromUrl = async () => {
      if (!draftIdFromUrl || !appUser?.idToken) return;
      if (attemptedDraftId === draftIdFromUrl) return;
      
      setAttemptedDraftId(draftIdFromUrl);
      setIsLoadingDraft(true);
      try {
        const result = await getAICampaignDraftAction({
          idToken: appUser.idToken,
          draftId: draftIdFromUrl,
        });
        
        if (result.success && result.draft) {
          const draft = result.draft;
          setCampaignPrompt(draft.originalPrompt || '');
          setParsedBrief(draft.parsedBrief || null);
          setEmailContent(draft.emailContent || null);
          setCurrentDraftId(draft.id);
          setLoadedFromDraft(true);
          
          if (draft.emailContent?.htmlBody && draft.emailContent?.subjectLines?.length > 0) {
            setStage(3);
            toast({
              title: 'Draft Loaded',
              description: 'Your saved draft is ready to send.',
            });
          } else {
            setStage(1);
            setLoadedFromDraft(false);
          }
        }
      } catch (error: any) {
        console.error('Error loading draft:', error);
      } finally {
        setIsLoadingDraft(false);
      }
    };
    
    loadDraftFromUrl();
  }, [draftIdFromUrl, appUser?.idToken, loadedFromDraft, toast]);

  const selectedInternalList = useMemo(() => 
    internalLists.find(l => l.id === selectedInternalListId),
    [internalLists, selectedInternalListId]
  );

  const hasBrevoConfigured = Boolean(apiKeys?.brevo?.apiKey);
  const hasSenderConfigured = Boolean(apiKeys?.sender?.apiKey);
  const hasSmtpConfigured = Boolean(apiKeys?.smtp?.host);
  const hasAnyProvider = hasBrevoConfigured || hasSenderConfigured || hasSmtpConfigured;

  const handleGenerateCampaign = async () => {
    if (!campaignPrompt.trim() || !appUser?.companyId || !appUser?.uid) return;

    setIsGenerating(true);
    
    try {
      const result = await generateEmailCampaignAction(appUser.companyId, appUser.uid, campaignPrompt);
      
      if (!result?.success || !result.data) {
        toast({
          title: 'Generation Failed',
          description: result?.error || 'Failed to generate campaign',
          variant: 'destructive',
        });
        return;
      }

      if (result.parsedBrief) {
        setParsedBrief(result.parsedBrief as ParsedCampaignBrief);
      }
      setEmailContent({
        subjectLines: result.data.subjectLineSuggestions,
        selectedSubjectIndex: 0,
        htmlBody: result.data.htmlContent,
        ctaSuggestions: result.data.ctaSuggestions,
      });

      if (appUser?.idToken) {
        try {
          const draftResult = await createAICampaignDraftAction({
            idToken: appUser.idToken,
            originalPrompt: campaignPrompt,
            parsedBrief: result.parsedBrief as ParsedCampaignBrief | undefined,
            emailContent: {
              subjectLines: result.data.subjectLineSuggestions,
              selectedSubjectIndex: 0,
              htmlBody: result.data.htmlContent,
              ctaSuggestions: result.data.ctaSuggestions,
            },
            selectedChannels: ['email'],
          });

          if (draftResult.success && draftResult.draft) {
            setCurrentDraftId(draftResult.draft.id);
          }
        } catch (draftError) {
          console.error('Error creating draft:', draftError);
        }
      }

      showAIContentReadyToast(toast, "Email Campaign", result.quotaInfo);
      setStage(2);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!appUser?.idToken || !currentDraftId) return;
    
    setIsSaving(true);
    try {
      await updateAICampaignDraftAction({
        idToken: appUser.idToken,
        draftId: currentDraftId,
        parsedBrief: parsedBrief || undefined,
        emailContent: emailContent || undefined,
      });
      toast({ title: 'Draft Saved' });
    } catch (error: any) {
      toast({ title: 'Save Failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!appUser?.idToken || !emailContent || !templateName.trim()) return;

    setIsSavingTemplate(true);
    try {
      const result = await createSavedEmailTemplateAction({
        idToken: appUser.idToken,
        template: {
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          subject: emailContent.subjectLines[emailContent.selectedSubjectIndex],
          htmlContent: emailContent.htmlBody,
          originalPrompt: campaignPrompt,
          sourceDraftId: currentDraftId || undefined,
        },
      });

      if (result.success) {
        toast({ title: 'Template Saved!' });
        setSaveTemplateDialogOpen(false);
      }
    } catch (error: any) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handlePublishCampaigns = async () => {
    if (!appUser?.idToken || !appUser?.companyId || !selectedInternalListId || !deliveryProvider) return;

    let draftIdToUse = currentDraftId;
    if (!draftIdToUse) {
      try {
        const draftResult = await createAICampaignDraftAction({
          idToken: appUser.idToken,
          originalPrompt: campaignPrompt,
          parsedBrief: parsedBrief || undefined,
          emailContent: emailContent || undefined,
          selectedChannels: ['email'],
        });

        if (draftResult.success && draftResult.draft) {
          draftIdToUse = draftResult.draft.id;
          setCurrentDraftId(draftIdToUse);
        } else {
          return;
        }
      } catch (error) {
        return;
      }
    }

    setIsPublishing(true);
    setIsSyncing(true);

    try {
      let providerListId: string | number | undefined;
      let providerListName: string | undefined;
      let syncedContactCount = 0;

      if (deliveryProvider === 'brevo' && apiKeys?.brevo?.apiKey) {
        const syncResult = await syncEmailListToBrevoAction(
          selectedInternalListId,
          appUser.companyId,
          apiKeys.brevo.apiKey,
          selectedBrevoListId && selectedBrevoListId !== '__new__' ? parseInt(selectedBrevoListId) : undefined,
          selectedBrevoListId === '__new__'
        );

        if (!syncResult.success) throw new Error(syncResult.errorMessage);

        providerListId = syncResult.providerListId;
        providerListName = syncResult.providerListName || selectedInternalList?.name;
        syncedContactCount = syncResult.syncedCount;
      } else if (deliveryProvider === 'sender' && apiKeys?.sender?.apiKey) {
        const syncResult = await syncEmailListToSenderAction(
          selectedInternalListId,
          appUser.companyId,
          apiKeys.sender.apiKey,
          selectedSenderListId
        );

        if (!syncResult.success) throw new Error(syncResult.errorMessage);

        providerListId = syncResult.providerListId;
        providerListName = senderLists.find(l => l.id === selectedSenderListId)?.name;
        syncedContactCount = syncResult.syncedCount;
      } else if (deliveryProvider === 'smtp') {
        providerListId = selectedInternalListId;
        providerListName = selectedInternalList?.name;
        syncedContactCount = selectedInternalList?.contactCount || 0;
      }

      setIsSyncing(false);

      await updateAICampaignDraftAction({
        idToken: appUser.idToken,
        draftId: draftIdToUse,
        parsedBrief: parsedBrief || undefined,
        emailContent: emailContent || undefined,
        selectedChannels: ['email'],
        emailConfig: {
          provider: deliveryProvider,
          listId: String(providerListId),
          listName: providerListName || 'Email List',
          recipientCount: syncedContactCount,
        },
      });

      const publishResult = await publishAICampaignAction({
        idToken: appUser.idToken,
        draftId: draftIdToUse,
      });

      if (publishResult.success) {
        toast({
          title: 'Email Campaign Published!',
          description: `Campaign will be sent to ${syncedContactCount} contacts.`,
        });

        if (draftIdFromUrl) router.replace('/campaigns/ai-email');
        
        setTimeout(() => {
          setCampaignPrompt('');
          setParsedBrief(null);
          setEmailContent(null);
          setSelectedInternalListId('');
          setDeliveryProvider(null);
          setCurrentDraftId(null);
          setLoadedFromDraft(false);
          setAttemptedDraftId(null);
          setStage(1);
        }, 3000);
      }
    } catch (error: any) {
      toast({ title: 'Publishing Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPublishing(false);
      setIsSyncing(false);
    }
  };

  const canProceedToStage3 = Boolean(parsedBrief && emailContent);

  if (isLoadingDraft) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading your draft...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <div className="flex justify-between gap-x-8 items-center">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <AIEmailIcon className="h-6 w-6" />
              AI Email Campaign Studio
            </h1>
            <p className="text-sm text-muted-foreground">Create professional email campaigns from a single prompt using AI</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 shadow-sm">
              <Link href="/campaigns/ai-email/saved-templates">
                <Icon icon="solar:bookmark-linear" className="mr-1.5 h-4 w-4" />
                Saved Templates
              </Link>
            </Button>
            <Badge variant="secondary" className="text-xs">BETA</Badge>
          </div>
        </div>
      </header>

      {/* Draft Alert */}
      {loadedFromDraft && (
        <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <p className="text-sm text-muted-foreground">
            <Icon icon="solar:document-text-linear" className="h-4 w-4 inline mr-2" />
            Using saved draft - No AI credits will be used.
            <Link href="/campaigns/ai-email/drafts" className="ml-2 underline">View all drafts</Link>
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-foreground transition-all duration-300" 
          style={{ width: stage === 1 ? '33%' : stage === 2 ? '66%' : '100%' }}
        />
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, label: 'Describe' },
          { num: 2, label: 'Review' },
          { num: 3, label: 'Publish' },
        ].map((s) => (
          <div 
            key={s.num}
            className={`relative border rounded-xl p-3 transition-all ${
              stage >= s.num 
                ? 'border-foreground bg-white dark:bg-stone-950' 
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                stage >= s.num 
                  ? 'bg-foreground text-background' 
                  : 'bg-stone-200 dark:bg-stone-800 text-muted-foreground'
              }`}>
                {s.num}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
          </div>
        ))}
      </div>


      {/* Stage 1: Describe */}
      {stage === 1 && (
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-blue-500 dark:bg-blue-400" />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Stage 1: Describe Your Email Campaign</span>
            <p className="text-xs text-muted-foreground mt-0.5">Tell us about your campaign in plain language</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm">Campaign Description</Label>
              <Textarea
                id="prompt"
                placeholder="Example: Flash sale - 50% off everything! Ends tonight. Target all customers. Urgent tone. CTA: Shop Now"
                value={campaignPrompt}
                onChange={(e) => setCampaignPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Try an example:</Label>
              <div className="grid gap-2">
                {EXAMPLE_PROMPTS.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    onClick={() => setCampaignPrompt(example)}
                    className="h-auto py-2.5 px-3 justify-start text-left whitespace-normal"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current mr-2.5 shrink-0" />
                    <span className="text-sm">{example}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
            <Button 
              onClick={handleGenerateCampaign} 
              disabled={isGenerating || !campaignPrompt.trim()}
              className="h-9 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <AIEmailIcon className="mr-2 h-4 w-4" />
                  Generate Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Stage 2: Review */}
      {stage === 2 && parsedBrief && emailContent && (
        <div className="space-y-4">
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-teal-500 dark:bg-teal-400" />
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Stage 2: Review & Customize Content</span>
                <p className="text-xs text-muted-foreground mt-0.5">Review and edit the AI-generated content for each channel</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerateCampaign} disabled={isGenerating} className="h-7 text-xs shadow-sm">
                <Icon icon="solar:refresh-linear" className="mr-1.5 h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Campaign Brief */}
              <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Campaign Brief</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Goal:</span> {parsedBrief.campaignGoal}</div>
                  <div><span className="text-muted-foreground">Audience:</span> {parsedBrief.targetAudience}</div>
                  <div><span className="text-muted-foreground">Tone:</span> {parsedBrief.tone}</div>
                  <div><span className="text-muted-foreground">CTA:</span> {parsedBrief.callToAction}</div>
                </div>
              </div>

              {/* Email Content Tab */}
              <div className="border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Icon icon="solar:letter-linear" className="h-4 w-4" />
                  Email Content
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Subject Line</Label>
                  <Select
                    value={String(emailContent.selectedSubjectIndex)}
                    onValueChange={(value) =>
                      setEmailContent({ ...emailContent, selectedSubjectIndex: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailContent.subjectLines.map((subject, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Email Body (HTML)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(emailContent.htmlBody);
                        toast({ title: 'Copied to clipboard' });
                      }}
                    >
                      <Icon icon="solar:copy-linear" className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                  </div>
                  <Textarea
                    value={emailContent.htmlBody}
                    onChange={(e) => setEmailContent({ ...emailContent, htmlBody: e.target.value })}
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-between">
              <Button variant="outline" onClick={() => setStage(1)} className="h-8 shadow-sm">
                <Icon icon="solar:arrow-left-linear" className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setTemplateName(parsedBrief?.campaignGoal || 'Email Template');
                  setTemplateDescription('');
                  setSaveTemplateDialogOpen(true);
                }} className="h-8 shadow-sm">
                  <Icon icon="solar:bookmark-linear" className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving} className="h-8 shadow-sm">
                  {isSaving && <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />}
                  Save Draft
                </Button>
                <Button onClick={() => setStage(3)} disabled={!canProceedToStage3} className="h-8 shadow-sm">
                  Continue
                  <Icon icon="solar:arrow-right-linear" className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: Publish */}
      {stage === 3 && (
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-emerald-500 dark:bg-emerald-400" />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Stage 3: Select Audience & Send</span>
            <p className="text-xs text-muted-foreground mt-0.5">Choose your contacts and delivery provider</p>
          </div>

          <div className="p-4 space-y-6">
            {/* Info Alert */}
            <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
              <p className="text-xs text-muted-foreground">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 inline mr-2" />
                For SMS and WhatsApp campaigns, use the manual campaign tools with your approved message templates.
              </p>
            </div>

            {/* Step 1: Select Audience */}
            <div className="space-y-3 p-4 rounded-lg border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">1</div>
                <Label className="text-sm font-medium">Select Your Audience</Label>
              </div>
              <p className="text-xs text-muted-foreground">Choose which contacts to send this campaign to.</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Email List</Label>
                  <Button variant="ghost" size="sm" onClick={fetchInternalLists} disabled={isLoadingInternalLists} className="h-7 text-xs">
                    <Icon icon="solar:refresh-linear" className={`h-3 w-3 mr-1 ${isLoadingInternalLists ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                {isLoadingInternalLists ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                    <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading lists...</span>
                  </div>
                ) : internalLists.length === 0 ? (
                  <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50 text-center">
                    <Icon icon="solar:users-group-two-rounded-linear" className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No email lists found.</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/campaigns/email-lists">Create Email List</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select value={selectedInternalListId} onValueChange={setSelectedInternalListId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email list..." />
                      </SelectTrigger>
                      <SelectContent>
                        {internalLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name} ({list.contactCount.toLocaleString()} contacts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedInternalList && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                        <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedInternalList.contactCount.toLocaleString()} contacts will receive this campaign</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Delivery Provider */}
            {selectedInternalListId && (
              <div className="space-y-3 p-4 rounded-lg border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium">2</div>
                  <Label className="text-sm font-medium">Choose Delivery Channel</Label>
                </div>
                <p className="text-xs text-muted-foreground">Select which email service to use for sending.</p>

                {!hasAnyProvider ? (
                  <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50 text-center">
                    <Icon icon="solar:danger-triangle-linear" className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No email providers configured.</p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/settings?tab=integrations">
                        <Icon icon="solar:settings-linear" className="h-4 w-4 mr-2" />
                        Configure Provider
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { key: 'brevo', label: 'Brevo', desc: 'Send via Brevo with tracking', configured: hasBrevoConfigured },
                      { key: 'sender', label: 'Sender.net', desc: 'Send via Sender.net', configured: hasSenderConfigured },
                      { key: 'smtp', label: 'Custom SMTP', desc: 'Send via your SMTP server', configured: hasSmtpConfigured },
                    ].map((provider) => (
                      <button
                        key={provider.key}
                        type="button"
                        onClick={() => setDeliveryProvider(provider.key as DeliveryProvider)}
                        disabled={!provider.configured}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          deliveryProvider === provider.key 
                            ? 'border-foreground' 
                            : provider.configured 
                              ? 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700' 
                              : 'border-stone-200 dark:border-stone-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm">{provider.label}</span>
                          {provider.configured ? (
                            deliveryProvider === provider.key ? (
                              <Icon icon="solar:check-circle-linear" className="h-4 w-4" />
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Not Set Up</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{provider.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Brevo List Selection */}
                {deliveryProvider === 'brevo' && hasBrevoConfigured && (
                  <div className="mt-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 space-y-2">
                    <Label className="text-xs">Sync to Brevo List (optional)</Label>
                    {isLoadingBrevoLists ? (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <Select value={selectedBrevoListId} onValueChange={setSelectedBrevoListId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Create new list" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__new__">Create new list</SelectItem>
                          {brevoLists.map((list) => (
                            <SelectItem key={list.id} value={String(list.id)}>
                              {list.name} ({list.totalSubscribers.toLocaleString()} existing)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Sender List Selection */}
                {deliveryProvider === 'sender' && hasSenderConfigured && (
                  <div className="mt-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50 space-y-2">
                    <Label className="text-xs">Sender.net Target List *</Label>
                    {isLoadingSenderLists ? (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <Select value={selectedSenderListId} onValueChange={setSelectedSenderListId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select list..." />
                        </SelectTrigger>
                        <SelectContent>
                          {senderLists.map((list) => (
                            <SelectItem key={list.id} value={list.id}>
                              {list.name} ({list.total.toLocaleString()} existing)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* SMTP Info */}
                {deliveryProvider === 'smtp' && hasSmtpConfigured && (
                  <div className="mt-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                    <p className="text-xs text-muted-foreground">
                      <Icon icon="solar:info-circle-linear" className="h-4 w-4 inline mr-2" />
                      Emails will be sent directly via your SMTP server.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-between">
            <Button variant="outline" onClick={() => setStage(2)} className="h-8 shadow-sm">
              <Icon icon="solar:arrow-left-linear" className="mr-2 h-4 w-4" />
              Back to Review
            </Button>
            
            <Button 
              onClick={handlePublishCampaigns} 
              disabled={
                isPublishing || 
                isSyncing ||
                !selectedInternalListId || 
                !deliveryProvider ||
                (deliveryProvider === 'sender' && !selectedSenderListId)
              }
              className="h-8 shadow-sm"
            >
              {isSyncing ? (
                <>
                  <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : isPublishing ? (
                <>
                  <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Icon icon="solar:plain-linear" className="mr-2 h-4 w-4" />
                  Sync & Publish
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Save as Reusable Template</DialogTitle>
            <DialogDescription className="text-sm">Save this email design as a template to reuse later without AI credits.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-sm">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Flash Sale"
                className="h-9 text-sm w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-sm">Description (optional)</Label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="e.g., Weekend sales"
                className="h-9 text-sm w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => setSaveTemplateDialogOpen(false)} disabled={isSavingTemplate} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAsTemplate} disabled={isSavingTemplate || !templateName.trim()} className="w-full sm:w-auto">
              {isSavingTemplate ? (
                <>
                  <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="solar:bookmark-linear" className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
