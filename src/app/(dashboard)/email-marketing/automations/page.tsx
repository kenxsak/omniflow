"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getStoredAutomations, updateStoredAutomation } from '@/lib/automations-data';
import type { AutomationStep, EmailAutomation } from '@/types/automations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateEmailContent } from '@/ai/flows/generate-email-content-flow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

// --- Configuration Dialog Component ---
interface ConfigureAutomationDialogProps {
  automation: EmailAutomation;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedAutomation: EmailAutomation) => void;
}

function ConfigureAutomationDialog({ automation, isOpen, onOpenChange, onSave }: ConfigureAutomationDialogProps) {
  const [config, setConfig] = useState<EmailAutomation['config']>(automation.config);
  const [isGenerating, setIsGenerating] = useState<number | null>(null);
  const { toast } = useToast();
  const { company } = useAuth();

  useEffect(() => {
    if (isOpen && automation && company) {
      const businessName = company.name || '[Your Company Name]';
      const profileName = company.ownerId;
      const websiteUrl = company.website || 'https://omniflow.example.com';

      const personalizedConfig = JSON.parse(JSON.stringify(automation.config));

      personalizedConfig.steps = personalizedConfig.steps.map((step: AutomationStep) => {
        if (step.type === 'email') {
          step.subject = step.subject.replace(/\[Your Company Name\]/g, businessName);
          step.content = step.content
            .replace(/\[Your Company Name\]/g, businessName)
            .replace(/\[Your Name\]/g, profileName)
            .replace(/The \[Your Company Name\] Team/g, `The ${businessName} Team`)
            .replace(/\[Your Website URL\]/g, websiteUrl)
            .replace(/\[Link to Your Offer or Pricing Page\]/g, `${websiteUrl}/pricing`)
            .replace(/\[Link to Cart\]/g, `${websiteUrl}/cart`)
            .replace(/\[Link to Cart with Discount Applied\]/g, `${websiteUrl}/cart`)
            .replace(/\[Link to Quick Start Guide\]/g, `${websiteUrl}/docs/quick-start`)
            .replace(/\[Link to Video Tutorials\]/g, `${websiteUrl}/tutorials`)
            .replace(/\[Link to Help Center\]/g, `${websiteUrl}/help`)
            .replace(/\[Link to Feature Documentation\]/g, `${websiteUrl}/docs/features`)
            .replace(/\[Link to Main Article\]/g, `${websiteUrl}/blog`)
            .replace(/\[Link to Your Store\]/g, `${websiteUrl}/store`);
        }
        return step;
      });

      setConfig(personalizedConfig);
    }
  }, [automation, isOpen, company]);

  const handleStepChange = (index: number, field: string, value: string | number) => {
    const newSteps = [...config.steps];
    const step = newSteps[index] as any;
    step[field] = value;
    setConfig({ ...config, steps: newSteps });
  };

  const handleGenerateAIStepContent = async (index: number) => {
    const step = config.steps[index];
    if (step.type !== 'email') return;

    setIsGenerating(index);
    try {
      const result = await generateEmailContent({
        campaignGoal: `Email ${Math.floor(index / 2) + 1} of the "${automation.name}" sequence.`,
        targetAudience: "New leads or subscribers",
        keyPoints: step.content.substring(0, 200) || "Welcome the user, introduce key benefit, ask a question.",
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
    let newStep: AutomationStep;
    if (type === 'email') {
      newStep = {
        type: 'email',
        subject: 'New Email Step Subject',
        content: `<h1>Hi {{ contact.FIRSTNAME }},</h1><p>This is a new email step. Add your content here.</p>`,
      };
    } else {
      newStep = {
        type: 'delay',
        duration: 1,
        unit: 'days',
      };
    }
    setConfig(prevConfig => ({ ...prevConfig, steps: [...prevConfig.steps, newStep] }));
  };

  const handleDeleteStep = (index: number) => {
    const newSteps = [...config.steps];
    newSteps.splice(index, 1);
    setConfig(prevConfig => ({ ...prevConfig, steps: newSteps }));
    toast({ title: "Step Removed" });
  };

  const handleSave = () => {
    onSave({ ...automation, config });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-5xl max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle>Set Up: {automation.name}</DialogTitle>
          <DialogDescription>{automation.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
          {config.steps.length > 0 ? (
            config.steps.map((step, index) => (
              <Card key={index} className="p-4 relative group border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteStep(index)} title="Delete this step">
                  <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4 text-destructive" />
                </Button>
                {step.type === 'email' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-md">Step {index + 1}: Send Email</h4>
                    <div>
                      <Label htmlFor={`subject-${index}`}>Subject</Label>
                      <Input id={`subject-${index}`} value={step.subject} onChange={(e) => handleStepChange(index, 'subject', e.target.value)} className="rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`content-editor-${index}`}>Message Content</Label>
                        <Textarea
                          id={`content-editor-${index}`}
                          value={step.content}
                          onChange={(e) => handleStepChange(index, 'content', e.target.value)}
                          rows={8}
                          className="min-h-[158px] w-full font-mono text-xs rounded-lg"
                        />
                      </div>
                      <div>
                        <Label>Preview</Label>
                        <div
                          className="p-2 border border-stone-200/60 dark:border-stone-800/60 rounded-lg bg-background min-h-[158px] prose dark:prose-invert max-w-none text-sm h-full w-full"
                          dangerouslySetInnerHTML={{ __html: step.content || '<p class="text-xs text-muted-foreground">Start typing...</p>' }}
                        />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleGenerateAIStepContent(index)} disabled={isGenerating === index} className="rounded-lg">
                      {isGenerating === index ? <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" /> : <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-4 w-4" />}
                      Draft with AI
                    </Button>
                  </div>
                )}
                {step.type === 'delay' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-md">Step {index + 1}: Wait</h4>
                    <div className="flex items-center gap-2">
                      <Input type="number" id={`duration-${index}`} value={step.duration} onChange={(e) => handleStepChange(index, 'duration', parseInt(e.target.value, 10) || 1)} className="w-20 rounded-lg" min="1" />
                      <Label htmlFor={`duration-${index}`}>{step.unit}(s)</Label>
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
              <p className="font-medium">This automation has no steps yet.</p>
              <p className="text-sm mt-1">Start by adding an email or a delay step below.</p>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4 border-t border-stone-200/60 dark:border-stone-800/60 flex-wrap justify-between items-center">
          <div className="flex gap-2 mb-2 sm:mb-0">
            <Button variant="outline" onClick={() => handleAddStep('email')} className="rounded-lg"><Icon icon="solar:letter-linear" className="mr-2 h-4 w-4" /> Add Email</Button>
            <Button variant="outline" onClick={() => handleAddStep('delay')} className="rounded-lg"><Icon icon="solar:clock-circle-linear" className="mr-2 h-4 w-4" /> Add Delay</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Configuration</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmailAutomationsPage() {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState<EmailAutomation | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const { appUser } = useAuth();

  const loadAutomations = useCallback(async () => {
    if (!appUser?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const stored = await getStoredAutomations(appUser.companyId);
    setAutomations(stored);
    setIsLoading(false);
  }, [appUser]);

  useEffect(() => {
    if (appUser) {
      loadAutomations();
    }
  }, [appUser, loadAutomations]);

  const handleConfigure = (automation: EmailAutomation) => {
    setSelectedAutomation(automation);
    setIsConfigDialogOpen(true);
  };

  const handleSaveAutomation = async (updatedAutomation: EmailAutomation) => {
    if (!appUser?.companyId) return;
    await updateStoredAutomation(appUser.companyId, updatedAutomation);
    await loadAutomations();
    toast({ title: "Configuration Saved", description: `${updatedAutomation.name} has been updated.` });
  };

  const handleToggleActivation = (automation: EmailAutomation) => {
    const newStatus: 'active' | 'inactive' = automation.status === 'active' ? 'inactive' : 'active';
    const updatedAutomation: EmailAutomation = { ...automation, status: newStatus };
    handleSaveAutomation(updatedAutomation);
    toast({
      title: `Automation ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
      description: `${updatedAutomation.name} is now ${newStatus}.`,
    });
  };

  const getAutomationIcon = (id: string) => {
    switch (id) {
      case 'new-lead-nurturing': return 'solar:handshake-linear';
      case 'customer-onboarding': return 'solar:star-linear';
      case 'periodic-engagement': return 'solar:rss-linear';
      case 'abandoned-cart': return 'solar:cart-large-2-linear';
      case 'birthday-offer': return 'solar:gift-linear';
      default: return 'solar:bolt-linear';
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="rounded-xl">
          <Link href="/email-marketing"><Icon icon="solar:arrow-left-linear" className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Email Automations</h1>
          <p className="text-sm text-muted-foreground">Set up automated email workflows to engage your audience at the right moment.</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl bg-stone-50 dark:bg-stone-900/50">
        <CardContent className="p-4 flex gap-3">
          <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-sm text-foreground">Automation Backend Status</p>
            <p className="text-sm text-muted-foreground">
              You can now configure and activate automations, and your settings will be saved to the database. The system is designed to create automation sequences for new leads and customers.
            </p>
            <p className="text-sm text-muted-foreground">
              For the emails to be sent automatically on schedule, a backend process (like a cron job) needs to call the app&apos;s API endpoint.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {automations.map((automation) => (
            <Card key={automation.id} className="flex flex-col border border-stone-200/60 dark:border-stone-800/60 rounded-2xl">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl">
                    <Icon icon={getAutomationIcon(automation.id)} className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{automation.name}</CardTitle>
                </div>
                <CardDescription className="text-sm">{automation.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-4 sm:p-6 pt-0">
                <div className="flex flex-wrap gap-2">
                  {automation.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg border border-stone-200/60 dark:border-stone-700/60">{tag}</span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row flex-wrap justify-between items-center gap-2">
                <Badge className={cn(
                  "mb-2 sm:mb-0 rounded-lg px-2.5 py-1 border",
                  automation.status === 'active'
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-200/60 dark:border-stone-700/60'
                    : 'bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200/60 dark:border-stone-700/60'
                )}>
                  Status: <span className="font-semibold ml-1">{automation.status}</span>
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleConfigure(automation)} className="rounded-lg">
                    <Icon icon="solar:settings-linear" className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                  <Button size="sm" onClick={() => handleToggleActivation(automation)} className="rounded-lg">
                    <Icon icon="solar:play-circle-linear" className="mr-2 h-4 w-4" />
                    {automation.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedAutomation && (
        <ConfigureAutomationDialog
          automation={selectedAutomation}
          isOpen={isConfigDialogOpen}
          onOpenChange={setIsConfigDialogOpen}
          onSave={handleSaveAutomation}
        />
      )}
    </div>
  );
}
