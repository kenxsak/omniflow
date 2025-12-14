'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { 
  getOnboardingProgressAction, 
  skipOnboardingAction,
  detectOnboardingProgressAction, 
  syncOnboardingProgressAction, 
  type OnboardingDetectionResult 
} from '@/app/actions/onboarding-client-actions';
import type { ChecklistItem } from '@/app/actions/onboarding-actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';

interface ChecklistItemConfig {
  key: ChecklistItem;
  label: string;
  description: string;
  icon: string;
  actionLabel: string;
  actionLink: string;
}

const CHECKLIST_ITEMS: ChecklistItemConfig[] = [
  {
    key: 'addedContacts',
    label: 'Add Your First Contacts',
    description: 'Import or add contacts to build your audience',
    icon: 'solar:users-group-two-rounded-linear',
    actionLabel: 'Add Contacts',
    actionLink: '/crm',
  },
  {
    key: 'createdDigitalCard',
    label: 'Create Your Digital Business Card',
    description: 'Build a professional digital presence to share',
    icon: 'solar:card-linear',
    actionLabel: 'Create Card',
    actionLink: '/digital-card/create',
  },
  {
    key: 'sentFirstCampaign',
    label: 'Send Your First Email Campaign',
    description: 'Reach your audience with email marketing',
    icon: 'solar:letter-linear',
    actionLabel: 'Create Campaign',
    actionLink: '/email-marketing/create-campaign',
  },
  {
    key: 'invitedTeamMember',
    label: 'Invite Team Members',
    description: 'Collaborate with your team on projects',
    icon: 'solar:user-plus-linear',
    actionLabel: 'Invite Team',
    actionLink: '/team-management',
  },
  {
    key: 'triedAI',
    label: 'Try AI Content Generation',
    description: 'Let AI help write your marketing content',
    icon: 'solar:magic-stick-3-linear',
    actionLabel: 'Try AI Writer',
    actionLink: '/ai-content-writer',
  },
  {
    key: 'setupAutomation',
    label: 'Set Up Email Automation',
    description: 'Automate follow-ups and nurture sequences',
    icon: 'solar:routing-2-linear',
    actionLabel: 'Create Automation',
    actionLink: '/email-marketing/automations',
  },
  {
    key: 'launchedMultiChannel',
    label: 'Launch Multi-Channel Campaign',
    description: 'Reach customers via email, SMS, and WhatsApp',
    icon: 'solar:share-circle-linear',
    actionLabel: 'Campaign Studio',
    actionLink: '/ai-campaign-manager',
  },
];

export default function OnboardingChecklist() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<Record<ChecklistItem, boolean>>({
    addedContacts: false,
    sentFirstCampaign: false,
    createdDigitalCard: false,
    invitedTeamMember: false,
    triedAI: false,
    setupAutomation: false,
    launchedMultiChannel: false,
  });
  const [detection, setDetection] = useState<OnboardingDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadProgress = useCallback(async () => {
    if (!appUser?.companyId) return;
    
    try {
      const progress = await getOnboardingProgressAction(appUser.companyId);
      if (progress && progress.checklist) {
        setChecklist(progress.checklist);
        // Only mark as completed if ALL 7 tasks are actually done
        const allTasksComplete = Object.values(progress.checklist).every(Boolean);
        setIsCompleted(allTasksComplete);
        // NEVER auto-dismiss - only dismiss when user clicks dismiss button in this session
        // Ignore skippedAt from database to always show checklist
      }

      const detected = await detectOnboardingProgressAction(appUser.companyId);
      if (detected) {
        setDetection(detected);
        // Auto-update checklist based on detection
        const newChecklist = { ...checklist };
        let hasChanges = false;
        for (const key of Object.keys(detected) as ChecklistItem[]) {
          if (detected[key].completed && !newChecklist[key]) {
            newChecklist[key] = true;
            hasChanges = true;
          }
        }
        if (hasChanges) {
          setChecklist(newChecklist);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [appUser?.companyId]);

  // Load progress on mount
  useEffect(() => {
    if (appUser?.companyId) {
      loadProgress();
    }
  }, [appUser?.companyId, loadProgress]);

  // Auto-refresh every 30 seconds (only when visible)
  useEffect(() => {
    if (appUser?.companyId && !isDismissed && !isCompleted) {
      syncIntervalRef.current = setInterval(() => {
        loadProgress();
      }, 30000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [appUser?.companyId, isDismissed, isCompleted, loadProgress]);

  const handleSync = async () => {
    if (!appUser?.companyId || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await syncOnboardingProgressAction(appUser.companyId);
      if (result.success && result.detection) {
        setDetection(result.detection);
        const newChecklist = { ...checklist };
        for (const key of Object.keys(result.detection) as ChecklistItem[]) {
          if (result.detection[key].completed) {
            newChecklist[key] = true;
          }
        }
        setChecklist(newChecklist);
        
        if (result.updated.length > 0) {
          toast({
            title: 'Progress Updated',
            description: `${result.updated.length} step(s) marked as complete!`,
          });
        }
      }
    } catch (error) {
      console.error('Error syncing progress:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDismiss = async () => {
    if (!appUser?.companyId) return;
    
    try {
      const result = await skipOnboardingAction(appUser.companyId);
      if (result.success) {
        setIsDismissed(true);
        setShowDismissDialog(false);
        toast({
          title: 'Setup Guide Hidden',
          description: 'You can find help in Settings anytime.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss checklist',
        variant: 'destructive',
      });
    }
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const nextStep = CHECKLIST_ITEMS.find(item => !checklist[item.key]);

  // Only hide if user explicitly dismissed in this session
  if (isDismissed) {
    return null;
  }

  return (
    <>
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between gap-3">
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 cursor-pointer min-w-0"
            >
              <div className="flex items-center gap-2">
                <p className="text-foreground font-semibold text-sm">
                  Hey {appUser?.name?.split(' ')[0] || 'there'}, let's get you set up
                </p>
                <span className="flex items-center gap-1.5">
                  <span className={cn(
                    "size-2 border-[1.5px] rounded-full",
                    completedCount > 0 ? "bg-emerald-300 border-emerald-700" : "bg-amber-300 border-amber-700"
                  )} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                    {completedCount}/{totalCount}
                  </span>
                </span>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {nextStep ? `Next: ${nextStep.label}` : 'Complete setup to unlock OmniFlow'}
              </p>
              <div className="mt-2 h-1 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="hidden sm:flex h-7 w-7 rounded-md items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                title="Refresh progress"
              >
                <Icon icon="solar:refresh-linear" className={cn("h-3.5 w-3.5 text-muted-foreground", isSyncing && "animate-spin")} />
              </button>
              <button
                type="button"
                onClick={() => setShowDismissDialog(true)}
                className="hidden sm:flex h-7 w-7 rounded-md items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Hide setup guide"
              >
                <Icon icon="solar:close-circle-linear" className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "size-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center transition-transform duration-300 hover:bg-stone-200 dark:hover:bg-stone-700",
                  isExpanded ? "rotate-180" : "rotate-0"
                )}
              >
                <Icon icon="solar:alt-arrow-down-linear" className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Checklist items - thinner rows */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}>
          {CHECKLIST_ITEMS.map((item, index) => {
            const showAsComplete = checklist[item.key] || detection?.[item.key]?.completed;
            
            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-stone-100 dark:border-stone-800/50 last:border-b-0",
                  showAsComplete && "bg-stone-50/50 dark:bg-stone-900/20 opacity-60"
                )}
              >
                {/* Step number/check */}
                <div className={cn(
                  "size-7 rounded-full flex items-center justify-center shrink-0",
                  showAsComplete ? "bg-emerald-500" : "bg-stone-200 dark:bg-stone-800"
                )}>
                  {showAsComplete ? (
                    <Icon icon="solar:check-read-linear" className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <span className="text-foreground font-semibold text-xs font-mono">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "font-medium text-sm",
                      showAsComplete ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {item.label}
                    </p>
                    <span className="flex items-center gap-1">
                      <span className={cn(
                        "size-1.5 border rounded-full",
                        showAsComplete ? "bg-emerald-400 border-emerald-600" : "bg-stone-300 border-stone-500"
                      )} />
                      <span className={cn(
                        "text-[9px] font-semibold uppercase tracking-wide font-mono",
                        showAsComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )}>
                        {showAsComplete ? 'Done' : 'Pending'}
                      </span>
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </div>

                {/* Action button - right aligned */}
                {!showAsComplete && (
                  <Button asChild size="sm" variant="outline" className="h-7 text-[10px] px-3 shrink-0">
                    <Link href={item.actionLink} className="inline-flex items-center gap-1">
                      {item.actionLabel}
                      <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
                
                {showAsComplete && (
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[10px] px-3 shrink-0 opacity-50">
                    <Link href={item.actionLink} className="inline-flex items-center gap-1">
                      View
                      <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dismiss confirmation dialog */}
      <Dialog open={showDismissDialog} onOpenChange={setShowDismissDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hide Setup Guide?</DialogTitle>
            <DialogDescription>
              You can safely close this setup guide if you're already familiar with dashboard software like this. You can always find help in Settings later.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-stone-100 dark:bg-stone-900">
              <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                This guide helps new users get started. If you're an experienced user, feel free to continue without it.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <button 
              type="button"
              onClick={() => setShowDismissDialog(false)}
              className="px-4 py-2 text-sm font-semibold font-mono uppercase tracking-wide text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              Keep Guide
            </button>
            <Button onClick={handleDismiss} className="h-9 text-xs font-mono uppercase tracking-wide">
              I'm Familiar, Hide It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}