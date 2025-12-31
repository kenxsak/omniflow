"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendSingleSmsQuickAction } from '@/app/actions/send-single-sms-quick-action';
import { generateTrackedSmsContentAction } from '@/app/actions/tracked-ai-content-actions';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import TemplateBrowser from '@/components/templates/template-browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseButton } from '@/components/ui/dialog';
import { getFriendlyLabel } from '@/lib/friendly-labels';
import { cn } from '@/lib/utils';

// Calculate SMS segments (GSM-7 = 160 chars for 1 segment, 153 for multi; Unicode = 70/67)
function calculateSmsSegments(text: string): { segments: number; charsLeft: number; encoding: string } {
  if (!text) return { segments: 0, charsLeft: 160, encoding: 'GSM-7' };
  
  // Check if text contains non-GSM characters (simplified check)
  const hasUnicode = /[^\x00-\x7F]/.test(text);
  const encoding = hasUnicode ? 'Unicode' : 'GSM-7';
  
  const singleLimit = hasUnicode ? 70 : 160;
  const multiLimit = hasUnicode ? 67 : 153;
  
  if (text.length <= singleLimit) {
    return { segments: 1, charsLeft: singleLimit - text.length, encoding };
  }
  
  const segments = Math.ceil(text.length / multiLimit);
  const charsLeft = (segments * multiLimit) - text.length;
  return { segments, charsLeft, encoding };
}

export default function SendSmsForm() {
  const [toPhoneNumber, setToPhoneNumber] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftingWithAi, setIsDraftingWithAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'template' | 'ai' | 'manual'>('manual');
  
  const [fast2smsConfigured, setFast2smsConfigured] = useState(false);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);

  const { toast } = useToast();
  const { appUser, company } = useAuth();

  const [aiRecipientName, setAiRecipientName] = useState('');
  const [aiMessageContext, setAiMessageContext] = useState('');
  const [aiDesiredOutcome, setAiDesiredOutcome] = useState('');
  const [businessName, setBusinessName] = useState('');

  // SMS segment calculation
  const smsInfo = calculateSmsSegments(messageBody);

  useEffect(() => {
    if (company) {
      const fast2smsKeys = company.apiKeys?.fast2sms;
      if (fast2smsKeys?.apiKey) {
        setFast2smsConfigured(true);
      }
      setBusinessName(company.name || 'Your Company');
    }
  }, [company]);

  const handleAiDraftSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiMessageContext || !aiDesiredOutcome) {
      toast({ title: 'Missing Info', description: "Please tell us what the message is about and what you'd like to happen.", variant: "destructive" });
      return;
    }
    if (!appUser) {
      toast({ title: 'Login Required', description: 'Please log in to use AI features.', variant: "destructive" });
      return;
    }
    setIsDraftingWithAi(true);
    try {
      const result = await generateTrackedSmsContentAction(appUser.companyId, appUser.uid, {
        recipientName: aiRecipientName,
        messageContext: aiMessageContext,
        desiredOutcome: aiDesiredOutcome,
        businessName: businessName,
      });
      if (result.success && result.data) {
        setMessageBody(result.data.suggestedSmsBody);
        setActiveTab('manual'); // Switch to manual tab to show the generated message
        toast({ 
          title: `AI Message Generated`, 
          description: `1 credit used. Message ready to send!`,
        });
      } else {
        throw new Error(result.error || 'Failed to generate SMS draft.');
      }
    } catch (error: any) {
      toast({ title: 'AI Generation Failed', description: error.message || "We had trouble creating your message.", variant: "destructive"});
    } finally {
      setIsDraftingWithAi(false);
    }
  };

  const handleApplyTemplate = (_subject: string | undefined, content: string) => {
    setMessageBody(content);
    setIsTemplateBrowserOpen(false);
    setActiveTab('manual'); // Switch to manual tab to show the template
    toast({ title: 'Template Applied', description: 'Message ready to customize and send!' });
  };

  const handleSendSmsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!toPhoneNumber || !messageBody) {
      toast({ title: 'Missing Info', description: 'Please add a phone number and message.', variant: 'destructive' });
      return;
    }
    if (!fast2smsConfigured || !appUser?.idToken) {
      toast({ title: 'Not Configured', description: 'Fast2SMS not configured. Add your API key in Settings.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await sendSingleSmsQuickAction({
        idToken: appUser.idToken,
        toPhoneNumber: toPhoneNumber,
        message: messageBody,
      });
      if (result.success) {
        toast({ title: 'SMS Sent!', description: `Message delivered to ${toPhoneNumber}` });
        setToPhoneNumber('');
        setMessageBody('');
      } else {
        toast({ title: 'Send Failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick message templates
  const quickTemplates = [
    { label: 'Reminder', text: 'Hi! This is a friendly reminder about your upcoming appointment. Reply YES to confirm.' },
    { label: 'Thank You', text: 'Thank you for your business! We appreciate your trust in us. Have a great day!' },
    { label: 'Promo', text: 'Special offer just for you! Get 20% off your next purchase. Use code SAVE20. Limited time only!' },
  ];

  return (
    <div className="space-y-5 pb-20">
      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:letter-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Segments</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{smsInfo.segments || '-'}</p>
          <p className="text-[10px] text-muted-foreground">{smsInfo.encoding}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:text-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Characters</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{messageBody.length}</p>
          <p className="text-[10px] text-muted-foreground">{smsInfo.charsLeft} left</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:shield-check-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Provider</span>
          </div>
          <p className="text-sm font-medium truncate">{fast2smsConfigured ? 'Fast2SMS' : 'Not Set'}</p>
          <p className={cn("text-[10px]", fast2smsConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
            {fast2smsConfigured ? 'Ready' : 'Configure'}
          </p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:bolt-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Mode</span>
          </div>
          <p className="text-sm font-medium">Quick SMS</p>
          <p className="text-[10px] text-amber-500">Premium</p>
        </div>
      </div>

      {/* Clerk-style Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('manual')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'manual' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:pen-linear" className="h-4 w-4" />
              Compose
            </span>
            {activeTab === 'manual' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'ai' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4" />
              AI Draft
            </span>
            {activeTab === 'ai' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'template' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:document-text-linear" className="h-4 w-4" />
              Templates
            </span>
            {activeTab === 'template' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          {/* Message Composer */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:pen-linear" className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Compose Message</h3>
              </div>
              {messageBody && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setMessageBody('')}
                >
                  Clear
                </Button>
              )}
            </div>
            
            {/* Quick Templates */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickTemplates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMessageBody(t.text)}
                  className="px-2.5 py-1 text-xs rounded-full border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Textarea 
              value={messageBody} 
              onChange={(e) => setMessageBody(e.target.value)} 
              placeholder="Type your SMS message here..."
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">
                {smsInfo.segments > 1 && (
                  <span className="text-amber-500">Multi-segment message ({smsInfo.segments} SMS)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {messageBody.length} chars · {smsInfo.charsLeft} left
              </p>
            </div>
          </div>

          {/* Recipient & Send */}
          {messageBody && (
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
              <form onSubmit={handleSendSmsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sms-to" className="text-xs text-muted-foreground">
                    {getFriendlyLabel('phone_number').label} *
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="sms-to" 
                      value={toPhoneNumber} 
                      onChange={(e) => setToPhoneNumber(e.target.value)} 
                      placeholder={getFriendlyLabel('phone_number').placeholder}
                      required 
                      type="tel"
                      className="h-9 flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !toPhoneNumber || !messageBody || !fast2smsConfigured} 
                      className="h-9"
                    >
                      {isLoading ? (
                        <Icon icon="solar:refresh-bold" className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Icon icon="solar:plain-linear" className="mr-1.5 h-4 w-4" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">AI SMS Drafter</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-muted-foreground">1 credit</span>
          </div>
          <form onSubmit={handleAiDraftSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-recipient-name" className="text-xs text-muted-foreground">Recipient Name (Optional)</Label>
              <Input 
                id="ai-recipient-name" 
                value={aiRecipientName} 
                onChange={e => setAiRecipientName(e.target.value)} 
                placeholder="e.g., Jane Doe"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-message-context" className="text-xs text-muted-foreground">What's this message about? *</Label>
              <Input 
                id="ai-message-context" 
                value={aiMessageContext} 
                onChange={e => setAiMessageContext(e.target.value)} 
                placeholder="e.g., Appointment reminder for tomorrow" 
                required
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-desired-outcome" className="text-xs text-muted-foreground">What should they do? *</Label>
              <Input 
                id="ai-desired-outcome" 
                value={aiDesiredOutcome} 
                onChange={e => setAiDesiredOutcome(e.target.value)} 
                placeholder="e.g., Confirm by replying YES" 
                required
                className="h-9"
              />
            </div>
            <Button type="submit" disabled={isDraftingWithAi || !aiMessageContext || !aiDesiredOutcome} className="h-9">
              {isDraftingWithAi ? (
                <>
                  <Icon icon="solar:refresh-bold" className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-4 w-4" />
                  Generate Message
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {activeTab === 'template' && (
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:library-linear" className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Templates Library</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose from pre-made templates to quickly compose your message.
          </p>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsTemplateBrowserOpen(true)}
            className="w-full h-9"
          >
            <Icon icon="solar:folder-open-linear" className="mr-2 h-4 w-4" />
            Browse Templates
          </Button>
        </div>
      )}

          {/* Provider Status - Compact */}
          {!fast2smsConfigured && (
            <div className="flex items-center gap-2 p-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950">
              <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <Link href="/settings?tab=integrations" className="text-foreground underline">Configure Fast2SMS</Link> to send messages.
              </p>
            </div>
          )}
        </div>

        {/* Phone Preview - Sticky on desktop */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-4">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">Live Preview</p>
            
            {/* Phone Frame */}
            <div className="mx-auto w-[260px] h-[520px] bg-stone-900 rounded-[2.5rem] p-2.5 shadow-xl border-4 border-stone-800">
              {/* Phone Inner Frame */}
              <div className="w-full h-full bg-[#0f172a] rounded-[2rem] overflow-hidden flex flex-col">
                {/* Phone Notch */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-16 h-4 bg-stone-900 rounded-full" />
                </div>
                
                {/* Phone Status Bar */}
                <div className="flex items-center justify-between px-5 py-1 text-[9px] text-stone-400">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:wifi-wave-bold" className="w-3 h-3" />
                    <Icon icon="solar:battery-full-bold" className="w-3 h-3" />
                  </div>
                </div>
                
                {/* Messages Header - SMS themed with teal accent */}
                <div className="px-3 py-2 border-b border-stone-800 bg-[#1e293b]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0d9488' }}>
                      <Icon icon="solar:chat-round-line-linear" className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-stone-200">{toPhoneNumber || 'Recipient'}</p>
                      <p className="text-[9px]" style={{ color: '#5eead4' }}>Quick SMS</p>
                    </div>
                  </div>
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 p-2.5 overflow-y-auto bg-[#0f172a]">
                  {messageBody ? (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-xl rounded-tl-sm px-2.5 py-1.5 shadow-sm" style={{ backgroundColor: '#1e3a5f' }}>
                        <p className="text-[11px] text-stone-200 whitespace-pre-wrap break-words leading-relaxed">
                          {messageBody}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className="text-[8px] text-stone-400">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <svg className="w-2.5 h-2.5" style={{ color: '#38bdf8' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Icon icon="solar:chat-round-line-linear" className="w-6 h-6 mx-auto mb-1.5" style={{ color: '#0d9488' }} />
                        <p className="text-[10px] text-stone-500">Type a message</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Message Stats - with teal accent */}
                <div className="px-2.5 py-1.5 border-t border-stone-800 bg-[#1e293b]">
                  <div className="flex items-center justify-between text-[9px]">
                    <span style={{ color: '#5eead4' }}>{messageBody.length} chars</span>
                    <span className="text-stone-400">{smsInfo.segments} segment{smsInfo.segments !== 1 ? 's' : ''}</span>
                    <span style={{ color: '#38bdf8' }}>{smsInfo.encoding}</span>
                  </div>
                </div>
                
                {/* Home Indicator */}
                <div className="flex justify-center py-1.5 bg-[#0f172a]">
                  <div className="w-20 h-1 bg-stone-700 rounded-full" />
                </div>
              </div>
            </div>
            
            {/* Preview Info */}
            <div className="mt-3 p-2.5 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Preview shows how your SMS will appear. {smsInfo.segments > 1 && <span style={{ color: '#f59e0b' }}>Multi-segment messages may cost more.</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Status - Mobile only (already shown in main content for desktop) */}
      <div className="lg:hidden">
        {!fast2smsConfigured && (
          <div className="flex items-center gap-2 p-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950">
            <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <Link href="/settings?tab=integrations" className="text-foreground underline">Configure Fast2SMS</Link> to send messages.
            </p>
          </div>
        )}
      </div>

      {/* Template Browser Dialog */}
      <Dialog open={isTemplateBrowserOpen} onOpenChange={setIsTemplateBrowserOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className="relative">
            <DialogTitle>Select an SMS Template</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="max-h-[60vh] overflow-y-auto">
            <TemplateBrowser filterType="sms" onApply={handleApplyTemplate} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
