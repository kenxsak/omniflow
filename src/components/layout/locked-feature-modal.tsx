"use client";

import { Dialog, DialogContent, DialogTitle, DialogBody, DialogFooter, DialogCloseButton } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PLAN_NAMES, FEATURE_BENEFITS, type PlanTier } from "@/lib/menu-config";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

interface LockedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureIcon?: string;
  minPlan: PlanTier;
  featureId?: string;
}

// Plan tier hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

export function LockedFeatureModal({
  isOpen,
  onClose,
  featureName,
  featureIcon = "solar:lock-linear",
  minPlan,
  featureId,
}: LockedFeatureModalProps) {
  const router = useRouter();
  const { getCurrentPlan } = useFeatureFlag();
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  
  const planName = PLAN_NAMES[minPlan];
  const currentPlanName = PLAN_NAMES[currentPlan];
  const benefits = featureId ? FEATURE_BENEFITS[featureId] : [];
  
  // Check if user already has the required plan or higher
  const hasRequiredPlan = PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[minPlan];

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getCurrentPlan().then((plan) => {
        setCurrentPlan(plan);
        setIsLoading(false);
      });
    }
  }, [isOpen, getCurrentPlan]);

  const handleUpgrade = () => {
    onClose();
    router.push("/settings/billing");
  };

  const handleContactSupport = () => {
    onClose();
    router.push("/help-center");
  };

  // If user has the required plan, show a different message
  if (!isLoading && hasRequiredPlan) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-[420px] p-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Feature Available - {featureName}</DialogTitle>
          </VisuallyHidden>
          <DialogCloseButton />
          
          {/* Success Header with Gradient */}
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-5 sm:p-6 text-white text-center">
            <div className="relative inline-flex mb-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Icon icon={featureIcon} className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-1">Feature Available!</h2>
            <p className="text-sm text-emerald-100">
              {featureName} is included in your {currentPlanName} plan
            </p>
          </div>

          <DialogBody className="p-4 sm:p-5 space-y-4">
            {/* Info Box */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                  <Icon icon="solar:info-circle-bold" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                    Feature Access Issue?
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs leading-relaxed">
                    If you&apos;re seeing this lock unexpectedly, it may be a sync issue. 
                    Try refreshing the page or contact support if the problem persists.
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Status */}
            <div className="bg-stone-100 dark:bg-stone-900 rounded-xl p-3 sm:p-4 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-stone-600 dark:text-stone-400">Your Plan</span>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentPlanName}</span>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="p-4 sm:p-5 pt-0 flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => window.location.reload()}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md"
            >
              <Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
            <Button
              variant="ghost"
              onClick={handleContactSupport}
              className="w-full text-stone-500 hover:text-stone-700 dark:text-stone-400"
            >
              <Icon icon="solar:chat-round-line-linear" className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[420px] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Unlock {featureName}</DialogTitle>
        </VisuallyHidden>
        <DialogCloseButton />
        
        {/* Premium Header with Gradient */}
        <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 p-5 sm:p-6 text-white text-center">
          <div className="relative inline-flex mb-3">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Icon icon={featureIcon} className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
              <Icon icon="solar:lock-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-900" />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mb-1">Unlock {featureName}</h2>
          <p className="text-sm text-violet-200">
            Available on <span className="font-semibold text-amber-300">{planName}</span> and above
          </p>
        </div>

        <DialogBody className="p-4 sm:p-5 space-y-4">
          {/* Benefits List */}
          {benefits.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                <Icon icon="solar:star-bold" className="w-4 h-4 text-amber-500" />
                What you&apos;ll unlock:
              </p>
              <ul className="space-y-2.5">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon
                        icon="solar:check-bold"
                        className="w-3 h-3 text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Plan Comparison */}
          <div className="bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-900 dark:to-stone-950 rounded-xl p-3 sm:p-4 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between text-xs sm:text-sm pb-2.5 mb-2.5 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-400 dark:bg-stone-600" />
                <span className="text-stone-500 dark:text-stone-400">Current Plan</span>
              </div>
              <span className="font-medium text-stone-700 dark:text-stone-300 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-md text-xs">
                {currentPlanName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
                <span className="text-stone-500 dark:text-stone-400">Required</span>
              </div>
              <span className="font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {planName}
              </span>
            </div>
          </div>

          {/* Upgrade Incentive */}
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 justify-center">
            <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-emerald-500" />
            <span>30-day money-back guarantee</span>
          </div>
        </DialogBody>

        {/* Action Buttons */}
        <DialogFooter className="p-4 sm:p-5 pt-0 flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            size="lg"
            className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 hover:from-violet-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Icon icon="solar:rocket-2-bold" className="w-4 h-4 mr-2" />
            Upgrade to {planName}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
