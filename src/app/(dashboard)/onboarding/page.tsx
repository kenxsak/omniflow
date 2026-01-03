'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ProgressIndicator } from '@/components/onboarding/progress-indicator';
import { Step1AddLead } from '@/components/onboarding/step1-add-lead';
import { Step2ConnectTool } from '@/components/onboarding/step2-connect-tool';
import { Step3CreateMessage } from '@/components/onboarding/step3-create-message';
import { Step4Success } from '@/components/onboarding/step4-success';
import { getFriendlyLoading } from '@/lib/friendly-messages';
import {
  completeOnboardingAction,
  updateChecklistItemAction,
  getOnboardingProgressAction,
  setupCompanyLocaleAction,
} from '@/app/actions/onboarding-client-actions';
import type { OnboardingProgress, ChecklistItem } from '@/app/actions/onboarding-actions';
import { addStoredLead } from '@/lib/mock-data';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { useGeoDetection } from '@/hooks/use-geo-detection';
import { getSupportedCountries } from '@/lib/geo-detection';

export default function OnboardingPage() {
  const { appUser, company, refreshAuthContext } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState({
    leadsAdded: false,
    toolConnected: false,
    messageCreated: false,
    dashboardViewed: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [localeSetupDone, setLocaleSetupDone] = useState(false);
  const { geoData, isLoading: geoLoading } = useGeoDetection();

  // Auto-setup company locale from geo-detection or signup data
  useEffect(() => {
    const setupLocale = async () => {
      if (!appUser?.companyId || localeSetupDone || geoLoading) return;
      
      // Check if company already has locale settings
      if (company?.countryCode && company?.timezone && company?.currencyCode) {
        setLocaleSetupDone(true);
        return;
      }

      // Try to get signup geo data first (stored during signup)
      let localeData: {
        country?: string;
        countryCode?: string;
        timezone?: string;
        currencyCode?: string;
        callingCode?: string;
      } | null = null;

      try {
        const signupGeoData = sessionStorage.getItem('signup_geo_data');
        if (signupGeoData) {
          const parsed = JSON.parse(signupGeoData);
          localeData = {
            country: parsed.countryName,
            countryCode: parsed.countryCode,
            timezone: parsed.timezone,
            currencyCode: parsed.currency,
            callingCode: parsed.callingCode,
          };
          // Clear the signup data after use
          sessionStorage.removeItem('signup_geo_data');
        }
      } catch {
        // Ignore parsing errors
      }

      // Fall back to geo-detection if no signup data
      if (!localeData && geoData) {
        localeData = {
          country: geoData.country,
          countryCode: geoData.countryCode,
          timezone: geoData.timezone,
          currencyCode: geoData.currency,
          callingCode: geoData.callingCode,
        };
      }

      // Set up locale if we have data
      if (localeData && localeData.countryCode) {
        try {
          const result = await setupCompanyLocaleAction(appUser.companyId, localeData);
          if (result.success) {
            // Refresh auth context to get updated company data
            refreshAuthContext();
          }
        } catch (error) {
          console.error('Failed to setup company locale:', error);
        }
      }

      setLocaleSetupDone(true);
    };

    setupLocale();
  }, [appUser?.companyId, company, geoData, geoLoading, localeSetupDone, refreshAuthContext]);

  useEffect(() => {
    const loadProgress = async () => {
      if (appUser?.companyId) {
        const progress = await getOnboardingProgressAction(appUser.companyId);
        if (progress) {
          if (progress.completed) {
            router.push('/dashboard');
            return;
          }
          
          const completed = {
            leadsAdded: progress.checklist?.addedContacts || false,
            toolConnected: false,
            messageCreated: progress.checklist?.sentFirstCampaign || false,
            dashboardViewed: false,
          };
          
          setCompletedSteps(completed);
          
          let resumeStep = 1;
          if (completed.messageCreated) {
            resumeStep = 4;
          } else if (completed.toolConnected) {
            resumeStep = 3;
          } else if (completed.leadsAdded) {
            resumeStep = 2;
          }
          
          setCurrentStep(resumeStep);
        }
      }
    };
    
    loadProgress();
  }, [appUser, router]);

  const handleLeadAdded = async (leadData: any) => {
    if (!appUser?.companyId) {
      toast({
        title: 'Error',
        description: 'Company information not found',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addStoredLead(appUser.companyId, {
        ...leadData,
        status: 'New' as const,
        source: 'Onboarding Wizard',
        assignedTo: appUser.email,
      });
      
      await updateChecklistItemAction(appUser.companyId, 'addedContacts' as ChecklistItem, true);
      
      setCompletedSteps(prev => ({ ...prev, leadsAdded: true }));
      
      toast({
        title: 'Success!',
        description: 'Your first contact has been added',
      });
      
      setCurrentStep(2);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolConnected = async (toolId: string) => {
    if (!appUser?.companyId) return;
    
    setCompletedSteps(prev => ({ ...prev, toolConnected: true }));
    
    toast({
      title: 'Great!',
      description: `You can set up ${toolId} in the integrations page`,
    });
    
    setCurrentStep(3);
  };

  const handleMessageCreated = async (content: string) => {
    if (!appUser?.companyId) return;
    
    await updateChecklistItemAction(appUser.companyId, 'sentFirstCampaign' as ChecklistItem, true);
    
    setCompletedSteps(prev => ({ ...prev, messageCreated: true }));
    
    toast({
      title: 'Excellent!',
      description: 'Your first message draft has been saved',
    });
    
    setCurrentStep(4);
  };

  const handleComplete = async () => {
    if (!appUser?.companyId) return;

    await completeOnboardingAction(appUser.companyId);
    
    toast({
      title: 'Onboarding Complete! 🎉',
      description: 'Welcome to OmniFlow',
    });
  };

  const handleSkip = async () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      toast({
        title: 'Step Skipped',
        description: 'You can complete this step later',
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1AddLead onLeadAdded={handleLeadAdded} onSkip={handleSkip} />;
      case 2:
        return <Step2ConnectTool onToolConnected={handleToolConnected} onSkip={handleSkip} />;
      case 3:
        return <Step3CreateMessage onMessageCreated={handleMessageCreated} onSkip={handleSkip} />;
      case 4:
        return <Step4Success completedSteps={completedSteps} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  if (!appUser || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">{getFriendlyLoading('data/loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-muted/20 py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Welcome to OmniFlow! 👋
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Let&apos;s get you set up in 5 minutes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 sm:mb-8">
          <ProgressIndicator currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="mb-4 sm:mb-6">{renderStep()}</div>

        {/* Navigation */}
        {currentStep > 1 && currentStep < 4 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center pt-4 gap-4">
              <Button
                variant="outline"
                size="default"
                onClick={handleBack}
                disabled={isLoading}
                className="text-sm sm:text-base"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                Step {currentStep} of 4
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
          <p>Need help? Contact our support team anytime</p>
        </div>
      </div>

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="onboarding" />
    </div>
  );
}
