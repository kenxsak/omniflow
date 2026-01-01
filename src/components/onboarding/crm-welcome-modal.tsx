'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { seedDemoDataAction, checkDemoDataSeeded } from '@/app/actions/demo-data-actions';
import { useToast } from '@/hooks/use-toast';
import type { Company } from '@/types/saas';
import confetti from 'canvas-confetti';

const CRM_ONBOARDING_STEPS = [
  {
    id: 'step1',
    stepNumber: 1,
    title: 'Import Your Contacts',
    description: 'Add your leads and customers to start building your sales pipeline',
    icon: 'solar:users-group-two-rounded-linear',
    action: 'View Contacts',
    href: '/crm',
    tips: ['Import from CSV or add manually', 'We\'ve added 5 demo contacts to help you explore'],
  },
  {
    id: 'step2',
    stepNumber: 2,
    title: 'Set Up Your Pipeline',
    description: 'Visualize your sales process and track deals through stages',
    icon: 'solar:widget-5-linear',
    action: 'View Pipeline',
    href: '/crm/pipeline',
    tips: ['Drag deals between stages', 'See your total pipeline value at a glance'],
  },
  {
    id: 'step3',
    stepNumber: 3,
    title: 'Start Selling',
    description: 'Create deals, track opportunities, and close more business',
    icon: 'solar:target-linear',
    action: 'View Pipeline',
    href: '/crm/pipeline',
    tips: ['Link deals to contacts', 'Track expected revenue and close dates'],
  },
];

interface CrmWelcomeModalProps {
  company: Company | null;
  onDismiss: () => void;
  onComplete: () => void;
}

export function CrmWelcomeModal({ company, onDismiss, onComplete }: CrmWelcomeModalProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [demoSeeded, setDemoSeeded] = useState(false);

  useEffect(() => {
    const checkAndOpen = async () => {
      if (company && !company.onboardingProgress?.completed && !company.onboardingProgress?.skippedAt) {
        setOpen(true);
        const seeded = await checkDemoDataSeeded(company.id);
        setDemoSeeded(seeded);
      }
    };
    checkAndOpen();
  }, [company]);

  const handleSeedDemoData = async () => {
    if (!company?.id || !appUser?.uid || demoSeeded) return;
    
    setIsSeeding(true);
    try {
      const result = await seedDemoDataAction(
        company.id,
        appUser.uid,
        appUser.name || 'User'
      );
      
      if (result.success) {
        setDemoSeeded(true);
        if (result.contactsCreated && result.contactsCreated > 0) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
          toast({
            title: 'Demo data loaded!',
            description: `Created ${result.contactsCreated} contacts, ${result.tasksCreated} tasks, and ${result.dealsCreated} deals.`,
          });
        }
      } else {
        toast({
          title: 'Could not load demo data',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error seeding demo data:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
    onDismiss();
  };

  const handleComplete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setOpen(false);
    onComplete();
  };

  const handleNextStep = () => {
    if (currentStep < CRM_ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progressPercentage = ((currentStep + 1) / CRM_ONBOARDING_STEPS.length) * 100;
  const currentStepData = CRM_ONBOARDING_STEPS[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="relative border-b border-stone-200 dark:border-stone-800 p-6">
          <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:rocket-2-linear" className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg font-semibold">
                  {currentStep === 0 ? 'Welcome to your CRM!' : `Step ${currentStep + 1}: ${currentStepData.title}`}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {currentStep === 0 
                    ? 'Let\'s set up your sales command center in 3 easy steps'
                    : currentStepData.description
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-mono">SETUP PROGRESS</span>
              <span className="text-xs font-semibold font-mono">{currentStep + 1}/{CRM_ONBOARDING_STEPS.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 p-4 border-b border-stone-200 dark:border-stone-800">
          {CRM_ONBOARDING_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex-1 p-3 rounded-xl border transition-all ${
                index === currentStep 
                  ? 'border-primary bg-primary/5' 
                  : index < currentStep 
                    ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {index < currentStep ? (
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className={`text-sm font-semibold font-mono ${
                    index === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                )}
                <span className={`text-xs font-medium hidden sm:inline ${
                  index === currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="size-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
              <Icon icon={currentStepData.icon} className="h-8 w-8 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{currentStepData.description}</p>
            
            {/* Tips */}
            <div className="space-y-2 w-full mb-4">
              {currentStepData.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-left p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                  <Icon icon="solar:lightbulb-bolt-linear" className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{tip}</span>
                </div>
              ))}
            </div>

            {/* Demo data button */}
            {currentStep === 0 && !demoSeeded && (
              <Button 
                variant="outline" 
                className="mb-3 w-full"
                onClick={handleSeedDemoData}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                    Loading demo data...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:play-linear" className="h-4 w-4 mr-2" />
                    Load Demo Data to Explore
                  </>
                )}
              </Button>
            )}

            {currentStep === 0 && demoSeeded && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">Demo data ready to explore</span>
              </div>
            )}

            <Button asChild className="w-full">
              <Link href={currentStepData.href} className="inline-flex items-center gap-2">
                {currentStepData.action}
                <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <Button variant="ghost" onClick={handleSkip} className="text-sm">
            Skip for now
          </Button>
          <div className="flex gap-2 flex-col-reverse sm:flex-row">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="text-sm">
                Previous
              </Button>
            )}
            {currentStep < CRM_ONBOARDING_STEPS.length - 1 ? (
              <Button onClick={handleNextStep} className="text-sm">
                Next Step
              </Button>
            ) : (
              <Button onClick={handleComplete} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white">
                <Icon icon="solar:check-circle-linear" className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
