"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { getEmailLists, getListTypeLabel, getListTypeColor } from '@/lib/email-list-data';
import type { EmailList, EmailListType, EmailAutomationSequence, EmailAutomationStep, DeliveryProvider, AutomationDeliveryConfig } from '@/types/email-lists';
import { generateEmailContent } from '@/ai/flows/generate-email-content-flow';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';

const DEFAULT_AUTOMATION_TEMPLATES: Omit<EmailAutomationSequence, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>[] = [
  {
    name: 'Free Trial Nurturing',
    description: 'Convert free trial users into paying customers with helpful tips and value reminders.',
    listType: 'free-trial',
    status: 'inactive',
    steps: [
      { id: 'step1', type: 'delay', order: 0, delayDays: 1, delayHours: 0 },
      { id: 'step2', type: 'email', order: 1, subject: 'Welcome! Here\'s How to Get Started', content: '<h2>Welcome to {{company_name}}!</h2><p>Hi {{first_name}},</p><p>Thank you for starting your free trial. We\'re excited to have you!</p><p>Here are 3 quick tips to get the most out of your trial:</p><ol><li>Complete your profile setup</li><li>Explore our key features</li><li>Check out our quick start guide</li></ol><p>Need help? Just reply to this email!</p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step3', type: 'delay', order: 2, delayDays: 3, delayHours: 0 },
      { id: 'step4', type: 'email', order: 3, subject: 'Did you know about this feature?', content: '<h2>Unlock More Value</h2><p>Hi {{first_name}},</p><p>Many of our users miss this powerful feature during their trial...</p><p>{{feature_highlight}}</p><p>This alone can save you hours each week!</p><p>Questions? We\'re here to help.</p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step5', type: 'delay', order: 4, delayDays: 5, delayHours: 0 },
      { id: 'step6', type: 'email', order: 5, subject: 'Your trial is ending soon - Special offer inside', content: '<h2>Don\'t Miss Out!</h2><p>Hi {{first_name}},</p><p>Your free trial is ending soon, and we don\'t want you to lose access to all the great features you\'ve been using.</p><p><strong>Special Offer:</strong> Upgrade now and get 20% off your first 3 months!</p><p><a href="{{upgrade_link}}">Upgrade Now</a></p><p>Best,<br>The {{company_name}} Team</p>' },
    ],
  },
  {
    name: 'Paid Customer Onboarding',
    description: 'Help new paying customers get maximum value and ensure long-term retention.',
    listType: 'paid-customer',
    status: 'inactive',
    steps: [
      { id: 'step1', type: 'delay', order: 0, delayDays: 0, delayHours: 2 },
      { id: 'step2', type: 'email', order: 1, subject: 'Welcome to the {{company_name}} Family!', content: '<h2>Thank You for Your Purchase!</h2><p>Hi {{first_name}},</p><p>Welcome to {{company_name}}! We\'re thrilled to have you as a customer.</p><p>Your account is now fully activated with all premium features.</p><p><strong>What\'s Next:</strong></p><ul><li>Complete your setup in 5 minutes</li><li>Schedule a free onboarding call</li><li>Join our exclusive customer community</li></ul><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step3', type: 'delay', order: 2, delayDays: 7, delayHours: 0 },
      { id: 'step4', type: 'email', order: 3, subject: 'How\'s everything going?', content: '<h2>Quick Check-In</h2><p>Hi {{first_name}},</p><p>It\'s been a week since you joined us. How are you finding {{company_name}}?</p><p>We\'d love to hear your feedback - what\'s working well? What could be better?</p><p>Simply reply to this email with your thoughts.</p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step5', type: 'delay', order: 4, delayDays: 14, delayHours: 0 },
      { id: 'step6', type: 'email', order: 5, subject: 'Pro tips to maximize your results', content: '<h2>Level Up Your Experience</h2><p>Hi {{first_name}},</p><p>Now that you\'re settled in, here are some advanced tips our power users love:</p><ol><li>{{pro_tip_1}}</li><li>{{pro_tip_2}}</li><li>{{pro_tip_3}}</li></ol><p>Happy to schedule a call if you want personalized guidance!</p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step7', type: 'delay', order: 6, delayDays: 30, delayHours: 0 },
      { id: 'step8', type: 'email', order: 7, subject: 'Your first month with us - Celebrate!', content: '<h2>Happy 1-Month Anniversary!</h2><p>Hi {{first_name}},</p><p>You\'ve been with us for a month now! Here\'s a quick summary of what you\'ve achieved:</p><p>{{achievement_summary}}</p><p>Keep up the great work! We\'re here to support you every step of the way.</p><p>Best,<br>The {{company_name}} Team</p>' },
    ],
  },
  {
    name: 'Win-Back Campaign',
    description: 'Re-engage churned customers and inactive leads with special offers and updates.',
    listType: 'churned',
    status: 'inactive',
    steps: [
      { id: 'step1', type: 'delay', order: 0, delayDays: 0, delayHours: 0 },
      { id: 'step2', type: 'email', order: 1, subject: 'We miss you at {{company_name}}!', content: '<h2>It\'s Been a While!</h2><p>Hi {{first_name}},</p><p>We noticed you haven\'t been around lately, and we wanted to check in.</p><p>A lot has changed since you were last here:</p><ul><li>{{new_feature_1}}</li><li>{{new_feature_2}}</li><li>{{improvement_1}}</li></ul><p>We\'d love to have you back!</p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step3', type: 'delay', order: 2, delayDays: 7, delayHours: 0 },
      { id: 'step4', type: 'email', order: 3, subject: 'A special offer just for you', content: '<h2>Welcome Back Offer</h2><p>Hi {{first_name}},</p><p>We really value you as a customer, and we\'d love to win you back.</p><p><strong>Exclusive Offer:</strong> Get 30% off for the next 3 months when you reactivate your account!</p><p>Use code: <strong>WELCOMEBACK30</strong></p><p><a href="{{reactivate_link}}">Reactivate Now</a></p><p>This offer expires in 7 days.</p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step5', type: 'delay', order: 4, delayDays: 14, delayHours: 0 },
      { id: 'step6', type: 'email', order: 5, subject: 'Last chance: Your special offer expires soon', content: '<h2>Final Reminder</h2><p>Hi {{first_name}},</p><p>Just a friendly reminder that your special 30% discount expires in 3 days.</p><p>If there\'s anything holding you back, we\'d love to hear about it. Maybe we can help?</p><p><a href="{{reactivate_link}}">Claim Your Discount</a></p><p>Best,<br>The {{company_name}} Team</p>' },
    ],
  },
  {
    name: 'Newsletter Engagement',
    description: 'Keep newsletter subscribers engaged with valuable content and updates.',
    listType: 'newsletter',
    status: 'inactive',
    steps: [
      { id: 'step1', type: 'delay', order: 0, delayDays: 0, delayHours: 1 },
      { id: 'step2', type: 'email', order: 1, subject: 'Thanks for subscribing to {{company_name}}!', content: '<h2>Welcome to Our Newsletter!</h2><p>Hi {{first_name}},</p><p>Thank you for subscribing! You\'ll now receive our best content directly in your inbox.</p><p>Here\'s what you can expect:</p><ul><li>Weekly tips and insights</li><li>Exclusive offers and early access</li><li>Industry news and updates</li></ul><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step3', type: 'delay', order: 2, delayDays: 7, delayHours: 0 },
      { id: 'step4', type: 'email', order: 3, subject: 'Your weekly dose of insights', content: '<h2>This Week\'s Highlights</h2><p>Hi {{first_name}},</p><p>Here\'s what you might have missed:</p><p>{{weekly_content}}</p><p>See you next week!</p><p>Best,<br>The {{company_name}} Team</p>' },
    ],
  },
  {
    name: 'Prospect Nurturing',
    description: 'Convert prospects into customers with educational content and soft CTAs.',
    listType: 'prospects',
    status: 'inactive',
    steps: [
      { id: 'step1', type: 'delay', order: 0, delayDays: 1, delayHours: 0 },
      { id: 'step2', type: 'email', order: 1, subject: 'Thanks for your interest in {{company_name}}', content: '<h2>Great to Meet You!</h2><p>Hi {{first_name}},</p><p>Thank you for checking out {{company_name}}. We\'re excited to share how we can help you.</p><p>{{value_proposition}}</p><p>Would you like to learn more? Check out our resources:</p><ul><li><a href="{{demo_link}}">Watch a quick demo</a></li><li><a href="{{case_study_link}}">Read customer success stories</a></li></ul><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step3', type: 'delay', order: 2, delayDays: 4, delayHours: 0 },
      { id: 'step4', type: 'email', order: 3, subject: 'How {{company_name}} helped businesses like yours', content: '<h2>Real Results</h2><p>Hi {{first_name}},</p><p>Here\'s how businesses similar to yours have benefited from {{company_name}}:</p><p>{{case_study_highlight}}</p><p>Ready to see similar results? <a href="{{trial_link}}">Start your free trial</a></p><p>Best,<br>The {{company_name}} Team</p>' },
      { id: 'step5', type: 'delay', order: 4, delayDays: 7, delayHours: 0 },
      { id: 'step6', type: 'email', order: 5, subject: 'Got questions? Let\'s chat!', content: '<h2>We\'re Here to Help</h2><p>Hi {{first_name}},</p><p>Choosing the right solution is important, and we want to make sure {{company_name}} is the right fit for you.</p><p>Have any questions? Simply reply to this email or <a href="{{calendar_link}}">schedule a call</a> with our team.</p><p>Best,<br>The {{company_name}} Team</p>' },
    ],
  },
];

interface ConfigureAutomationDialogProps {
  automation: EmailAutomationSequence;
  lists: EmailList[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedAutomation: EmailAutomationSequence, linkedListId?: string) => void;
}

function ConfigureAutomationDialog({ automation, lists, isOpen, onOpenChange, onSave }: ConfigureAutomationDialogProps) {
  const [config, setConfig] = useState<EmailAutomationSequence>(automation);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  const { toast } = useToast();
  const { company } = useAuth();

  const hasBrevoConfigured = !!company?.apiKeys?.brevo?.apiKey;
  const hasSenderConfigured = !!company?.apiKeys?.sender?.apiKey;
  const hasSmtpConfigured = !!company?.apiKeys?.smtp?.host;

  const getDefaultProvider = (): DeliveryProvider => {
    if (automation.deliveryConfig?.provider) return automation.deliveryConfig.provider;
    if (hasBrevoConfigured) return 'brevo';
    if (hasSenderConfigured) return 'sender';
    if (hasSmtpConfigured) return 'smtp';
    return 'smtp';
  };
  
  const [deliveryProvider, setDeliveryProvider] = useState<DeliveryProvider>(getDefaultProvider());

  useEffect(() => {
    if (isOpen && automation && company) {
      const businessName = company.name || '[Your Company Name]';
      const personalizedConfig = JSON.parse(JSON.stringify(automation)) as EmailAutomationSequence;
      
      personalizedConfig.steps = personalizedConfig.steps.map(step => {
        if (step.type === 'email' && step.content) {
          step.subject = step.subject?.replace(/\{\{company_name\}\}/g, businessName) || '';
          step.content = step.content
            .replace(/\{\{company_name\}\}/g, businessName)
            .replace(/\{\{first_name\}\}/g, '{{first_name}}');
        }
        return step;
      });
      
      setConfig(personalizedConfig);
      const savedProvider = automation.deliveryConfig?.provider;
      if (savedProvider) {
        setDeliveryProvider(savedProvider);
      } else if (hasBrevoConfigured) {
        setDeliveryProvider('brevo');
      } else if (hasSenderConfigured) {
        setDeliveryProvider('sender');
      } else if (hasSmtpConfigured) {
        setDeliveryProvider('smtp');
      }
      
      const matchingLists = lists.filter(l => l.type === automation.listType);
      if (matchingLists.length === 1) {
        setSelectedListId(matchingLists[0].id);
      }
    }
  }, [automation, isOpen, company, lists, hasBrevoConfigured, hasSenderConfigured, hasSmtpConfigured]);

  const handleStepChange = (index: number, field: keyof EmailAutomationStep, value: string | number) => {
    const newSteps = [...config.steps];
    const step = newSteps[index];
    (step as any)[field] = value;
    setConfig({ ...config, steps: newSteps });
  };

  const handleGenerateAIStepContent = async (index: number) => {
    const step = config.steps[index];
    if (step.type !== 'email') return;

    setIsGenerating(index);
    try {
      const result = await generateEmailContent({
        campaignGoal: `Email ${Math.floor(index / 2) + 1} of the "${config.name}" sequence for ${getListTypeLabel(config.listType)}.`,
        targetAudience: getListTypeLabel(config.listType),
        keyPoints: step.content?.substring(0, 200) || "Engage the recipient with valuable content.",
        tone: 'Friendly',
        callToAction: "Learn More",
      });
      handleStepChange(index, 'content', result.htmlContent);
      toast({ title: `AI Content Generated for Step ${Math.floor(index / 2) + 1}` });
    } catch (error: any) {
      toast({ title: "AI Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleAddStep = (type: 'email' | 'delay') => {
    const newStep: EmailAutomationStep = type === 'email'
      ? { id: `step${Date.now()}`, type: 'email', order: config.steps.length, subject: 'New Email Step', content: '<h2>Hello {{first_name}},</h2><p>Your content here...</p>' }
      : { id: `step${Date.now()}`, type: 'delay', order: config.steps.length, delayDays: 3, delayHours: 0 };
    setConfig(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
  };

  const handleDeleteStep = (index: number) => {
    const newSteps = config.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i }));
    setConfig(prev => ({ ...prev, steps: newSteps }));
    toast({ title: "Step Removed" });
  };

  const handleSave = () => {
    const updatedConfig = {
      ...config,
      deliveryConfig: {
        provider: deliveryProvider,
      } as AutomationDeliveryConfig,
      linkedListId: selectedListId || undefined,
    };
    onSave(updatedConfig, selectedListId || undefined);
    onOpenChange(false);
  };

  const matchingLists = lists.filter(l => l.type === config.listType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
        {/* Header with accent bar */}
        <div className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="absolute inset-x-12 top-0 h-0.5 rounded-b-full bg-blue-500 dark:bg-blue-400" />
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-semibold pr-8">{config.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">{config.description}</DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
          {/* Link to Email List Section */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-teal-500 dark:bg-teal-400" />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="solar:link-linear" className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Link to Email List</span>
              </div>
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an email list" />
              </SelectTrigger>
              <SelectContent>
                {matchingLists.length > 0 ? (
                  matchingLists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.contactCount} contacts)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No {getListTypeLabel(config.listType)} lists found - create one first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Only lists of type "{getListTypeLabel(config.listType)}" are shown.
              </p>
            </div>
          </div>

          {/* Delivery Provider Section */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center gap-2 mb-1">
                <Icon icon="solar:server-linear" className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Delivery Provider</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 sm:mb-4">
                Choose which email service to use for sending.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryProvider('brevo')}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-all relative",
                    deliveryProvider === 'brevo' 
                      ? 'border-stone-500 dark:border-stone-500 bg-stone-50 dark:bg-stone-900' 
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  )}
                >
                  {deliveryProvider === 'brevo' && (
                    <div className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                  <span className="font-medium text-sm block">Brevo</span>
                  <span className={cn("text-[10px]", hasBrevoConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                    {hasBrevoConfigured ? 'Configured' : 'Not configured'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryProvider('sender')}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-all relative",
                    deliveryProvider === 'sender' 
                      ? 'border-stone-500 dark:border-stone-500 bg-stone-50 dark:bg-stone-900' 
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  )}
                >
                  {deliveryProvider === 'sender' && (
                    <div className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                  <span className="font-medium text-sm block">Sender.net</span>
                  <span className={cn("text-[10px]", hasSenderConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                    {hasSenderConfigured ? 'Configured' : 'Not configured'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryProvider('smtp')}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-all relative",
                    deliveryProvider === 'smtp' 
                      ? 'border-stone-500 dark:border-stone-500 bg-stone-50 dark:bg-stone-900' 
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  )}
                >
                  {deliveryProvider === 'smtp' && (
                    <div className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}
                  <span className="font-medium text-sm block">Custom SMTP</span>
                  <span className={cn("text-[10px]", hasSmtpConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                    {hasSmtpConfigured ? 'Configured' : 'Not configured'}
                  </span>
                </button>
              </div>
              {((deliveryProvider === 'brevo' && !hasBrevoConfigured) || 
                (deliveryProvider === 'sender' && !hasSenderConfigured) || 
                (deliveryProvider === 'smtp' && !hasSmtpConfigured)) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1.5">
                  <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Configure in Settings - API Integrations</span>
                </p>
              )}
            </div>
          </div>

          {/* Email Sequence Steps Section */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-emerald-500 dark:bg-emerald-400" />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:list-check-linear" className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Email Sequence Steps</span>
                </div>
                <span className="text-xs text-muted-foreground">{config.steps.length} steps</span>
              </div>
              
              <div className="space-y-3">
                {config.steps.map((step, index) => (
                  <div key={step.id} className="relative group border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 overflow-hidden">
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        {/* Step number badge */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                          step.type === 'email' 
                            ? "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200" 
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        )}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {step.type === 'email' ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:letter-linear" className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">Send Email</span>
                              </div>
                              <div>
                                <Label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5 block">Subject Line</Label>
                                <Input 
                                  value={step.subject || ''} 
                                  onChange={(e) => handleStepChange(index, 'subject', e.target.value)} 
                                  className="text-sm h-9"
                                  placeholder="Enter email subject..."
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5 block">Email Content (HTML)</Label>
                                <Textarea 
                                  value={step.content || ''} 
                                  onChange={(e) => handleStepChange(index, 'content', e.target.value)} 
                                  rows={4} 
                                  className="font-mono text-xs resize-none"
                                  placeholder="<p>Your email content here...</p>"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5 block">Preview</Label>
                                <div 
                                  className="p-3 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-950 min-h-[100px] max-h-[150px] prose prose-sm dark:prose-invert max-w-none text-xs overflow-y-auto"
                                  dangerouslySetInnerHTML={{ __html: step.content || '<p class="text-muted-foreground italic">Add content to see preview...</p>' }}
                                />
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleGenerateAIStepContent(index)} disabled={isGenerating === index} className="h-8 text-xs">
                                {isGenerating === index ? <Icon icon="solar:refresh-linear" className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-3.5 w-3.5" />}
                                Generate with AI
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:clock-circle-linear" className="h-4 w-4 text-amber-500" />
                                <span className="font-medium text-sm">Wait Period</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    value={step.delayDays || 0} 
                                    onChange={(e) => handleStepChange(index, 'delayDays', parseInt(e.target.value, 10) || 0)} 
                                    className="w-16 h-9 text-sm text-center" 
                                    min="0" 
                                  />
                                  <span className="text-xs text-muted-foreground">days</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    value={step.delayHours || 0} 
                                    onChange={(e) => handleStepChange(index, 'delayHours', parseInt(e.target.value, 10) || 0)} 
                                    className="w-16 h-9 text-sm text-center" 
                                    min="0" 
                                    max="23"
                                  />
                                  <span className="text-xs text-muted-foreground">hours</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Delete button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-50 hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0" 
                          onClick={() => handleDeleteStep(index)}
                        >
                          <Icon icon="solar:trash-bin-minimalistic-linear" className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {config.steps.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg">
                    <Icon icon="solar:inbox-linear" className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No steps configured yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add email or delay steps below</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2">
            <div className="flex gap-2 order-2 sm:order-1">
              <Button variant="outline" size="sm" onClick={() => handleAddStep('email')} className="h-9 sm:h-8 text-xs flex-1 sm:flex-none">
                <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" /> Add Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddStep('delay')} className="h-9 sm:h-8 text-xs flex-1 sm:flex-none">
                <Icon icon="solar:clock-circle-linear" className="mr-1.5 h-3.5 w-3.5" /> Add Delay
              </Button>
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-9 sm:h-8 text-xs flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!selectedListId && matchingLists.length > 0} className="h-9 sm:h-8 text-xs flex-1 sm:flex-none">
                <Icon icon="solar:diskette-linear" className="mr-1.5 h-3.5 w-3.5" />
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function EmailAutomationsPage() {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const [automations, setAutomations] = useState<EmailAutomationSequence[]>([]);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState<EmailAutomationSequence | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<EmailAutomationSequence | null>(null);

  const loadData = useCallback(async () => {
    if (!appUser?.companyId || !db) return;
    setIsLoading(true);
    
    try {
      const [lists, automationsSnapshot] = await Promise.all([
        getEmailLists(appUser.companyId),
        getDocs(collection(db, 'companies', appUser.companyId, 'emailAutomationSequences'))
      ]);
      
      setEmailLists(lists);
      
      let existingAutomations = automationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmailAutomationSequence));
      
      if (existingAutomations.length === 0) {
        for (const template of DEFAULT_AUTOMATION_TEMPLATES) {
          const docRef = await addDoc(
            collection(db, 'companies', appUser.companyId, 'emailAutomationSequences'),
            {
              ...template,
              companyId: appUser.companyId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
          );
          existingAutomations.push({
            id: docRef.id,
            ...template,
            companyId: appUser.companyId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as EmailAutomationSequence);
        }
      } else {
        const seenNames = new Map<string, EmailAutomationSequence>();
        const duplicateIds: string[] = [];
        
        for (const automation of existingAutomations) {
          if (seenNames.has(automation.name)) {
            duplicateIds.push(automation.id);
          } else {
            seenNames.set(automation.name, automation);
          }
        }
        
        if (duplicateIds.length > 0) {
          for (const duplicateId of duplicateIds) {
            const docRef = doc(db, 'companies', appUser.companyId, 'emailAutomationSequences', duplicateId);
            await deleteDoc(docRef);
          }
          existingAutomations = Array.from(seenNames.values());
        }
      }
      
      setAutomations(existingAutomations);
    } catch (error) {
      console.error('Error loading automations:', error);
      toast({ title: 'Error', description: 'Failed to load automations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [appUser, toast]);

  useEffect(() => {
    if (appUser) {
      loadData();
    }
  }, [appUser, loadData]);

  const handleConfigure = (automation: EmailAutomationSequence) => {
    setSelectedAutomation(automation);
    setIsConfigDialogOpen(true);
  };

  const handleSaveAutomation = async (updatedAutomation: EmailAutomationSequence, linkedListId?: string) => {
    if (!appUser?.companyId || !db) return;
    
    try {
      const docRef = doc(db, 'companies', appUser.companyId, 'emailAutomationSequences', updatedAutomation.id);
      await updateDoc(docRef, {
        name: updatedAutomation.name,
        description: updatedAutomation.description,
        steps: updatedAutomation.steps,
        status: updatedAutomation.status,
        deliveryConfig: updatedAutomation.deliveryConfig || null,
        linkedListId: linkedListId || null,
        updatedAt: serverTimestamp(),
      });
      
      if (linkedListId) {
        const listRef = doc(db, 'companies', appUser.companyId, 'emailLists', linkedListId);
        await updateDoc(listRef, {
          automationId: updatedAutomation.id,
          updatedAt: serverTimestamp(),
        });
      }
      
      await loadData();
      toast({ title: "Automation Saved", description: `${updatedAutomation.name} has been updated.` });
    } catch (error) {
      console.error('Error saving automation:', error);
      toast({ title: 'Error', description: 'Failed to save automation', variant: 'destructive' });
    }
  };

  const handleToggleActivation = async (automation: EmailAutomationSequence) => {
    if (!appUser?.companyId || !db) return;
    
    const linkedList = emailLists.find(l => l.automationId === automation.id);
    if (automation.status === 'inactive' && !linkedList) {
      toast({
        title: 'No List Linked',
        description: 'Please configure this automation and link it to an email list before activating.',
        variant: 'destructive'
      });
      return;
    }
    
    const newStatus = automation.status === 'active' ? 'inactive' : 'active';
    
    try {
      const docRef = doc(db, 'companies', appUser.companyId, 'emailAutomationSequences', automation.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      await loadData();
      toast({
        title: `Automation ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        description: `${automation.name} is now ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({ title: 'Error', description: 'Failed to update automation status', variant: 'destructive' });
    }
  };

  const openDeleteDialog = (automation: EmailAutomationSequence) => {
    setAutomationToDelete(automation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!appUser?.companyId || !db || !automationToDelete) return;
    
    try {
      const docRef = doc(db, 'companies', appUser.companyId, 'emailAutomationSequences', automationToDelete.id);
      await deleteDoc(docRef);
      
      await loadData();
      toast({
        title: 'Automation Deleted',
        description: `${automationToDelete.name} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting automation:', error);
      toast({ title: 'Error', description: 'Failed to delete automation', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setAutomationToDelete(null);
    }
  };

  const getAutomationIcon = (listType: EmailListType) => {
    switch (listType) {
      case 'free-trial': return <Icon icon="solar:gift-linear" className="h-5 w-5 text-muted-foreground" />;
      case 'paid-customer': return <Icon icon="solar:card-linear" className="h-5 w-5 text-muted-foreground" />;
      case 'churned': return <Icon icon="solar:user-cross-linear" className="h-5 w-5 text-muted-foreground" />;
      case 'newsletter': return <Icon icon="solar:letter-linear" className="h-5 w-5 text-muted-foreground" />;
      case 'prospects': return <Icon icon="solar:star-shine-linear" className="h-5 w-5 text-muted-foreground" />;
      default: return <Icon icon="solar:users-group-rounded-linear" className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'active') {
      return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>;
    }
    return <span className="text-xs font-medium text-muted-foreground">Inactive</span>;
  };

  const activeCount = automations.filter(a => a.status === 'active').length;
  const totalEmails = automations.reduce((sum, a) => sum + a.steps.filter(s => s.type === 'email').length, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="relative flex w-full flex-col gap-4">
          <div className="flex justify-between gap-x-8 items-center">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-2xl font-semibold text-foreground">Email Automations</h1>
              <p className="text-sm text-muted-foreground">Set up automated email sequences for different customer segments</p>
            </div>
          </div>
        </header>
        <div className="flex justify-center py-12">
          <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="h-8 w-8">
              <Link href="/campaigns/email-lists"><Icon icon="solar:arrow-left-linear" className="h-4 w-4" /></Link>
            </Button>
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-2xl font-semibold text-foreground">Email Automations</h1>
              <p className="text-sm text-muted-foreground">Set up automated email sequences for different customer segments</p>
            </div>
          </div>
        </div>
      </header>

      {/* Info Alert */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-900/50 overflow-hidden">
        <div className="p-4 flex gap-3">
          <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium">How Email Automations Work</p>
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>1. Create Email Lists - Go to Email Lists and create lists for each customer segment (Free Trial, Paid, Churned, etc.)</p>
              <p>2. Configure Automations - Customize the email sequences below and link them to your lists.</p>
              <p>3. Activate - Turn on automations to start sending scheduled follow-up emails automatically.</p>
              <p>4. Cron Job - The system checks for pending emails and sends them based on your configured delays.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-blue-500 dark:bg-blue-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Automations</span>
              <Icon icon="solar:robot-linear" className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{automations.length}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-emerald-500 dark:bg-emerald-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Active</span>
              <Icon icon="solar:play-circle-linear" className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{activeCount}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-amber-500 dark:bg-amber-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Emails</span>
              <Icon icon="solar:letter-linear" className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{totalEmails}</p>
          </div>
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((automation) => {
          const linkedList = emailLists.find(l => l.automationId === automation.id);
          const emailStepsCount = automation.steps.filter(s => s.type === 'email').length;
          
          return (
            <div key={automation.id} className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden flex flex-col">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
              
              {/* Header */}
              <div className="p-4 pt-5 flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                    {getAutomationIcon(automation.listType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{automation.name}</h3>
                    <span className={cn("text-[10px] font-medium", getListTypeColor(automation.listType))}>
                      {getListTypeLabel(automation.listType)}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{automation.description}</p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon icon="solar:letter-linear" className="h-3.5 w-3.5" />
                    <span>{emailStepsCount} emails in sequence</span>
                  </div>
                  {linkedList ? (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5" />
                      <span className="truncate">Linked: {linkedList.name} ({linkedList.contactCount})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                      <span>No list linked yet</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                <div className="flex items-center justify-between mb-3">
                  {getStatusText(automation.status)}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => openDeleteDialog(automation)}
                  >
                    <Icon icon="solar:trash-bin-minimalistic-linear" className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleConfigure(automation)} className="flex-1 h-8 text-xs">
                    <Icon icon="solar:settings-linear" className="mr-1.5 h-3.5 w-3.5" />
                    Configure
                  </Button>
                  <Button 
                    variant={automation.status === 'active' ? 'secondary' : 'default'} 
                    size="sm" 
                    onClick={() => handleToggleActivation(automation)}
                    className="flex-1 h-8 text-xs"
                  >
                    <Icon icon={automation.status === 'active' ? 'solar:pause-linear' : 'solar:play-linear'} className="mr-1.5 h-3.5 w-3.5" />
                    {automation.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAutomation && (
        <ConfigureAutomationDialog
          automation={selectedAutomation}
          lists={emailLists}
          isOpen={isConfigDialogOpen}
          onOpenChange={setIsConfigDialogOpen}
          onSave={handleSaveAutomation}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{automationToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}