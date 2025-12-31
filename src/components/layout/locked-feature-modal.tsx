"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  
  const planName = PLAN_NAMES[minPlan];
  const currentPlanName = PLAN_NAMES[currentPlan];
  const benefits = featureId ? FEATURE_BENEFITS[featureId] : [];

  useEffect(() => {
    if (isOpen) {
      getCurrentPlan().then(setCurrentPlan);
    }
  }, [isOpen, getCurrentPlan]);

  const handleUpgrade = () => {
    onClose();
    router.push("/settings/billing");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-2">
          {/* Feature Icon with Lock */}
          <div className="mx-auto mb-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
              <Icon icon={featureIcon} className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-amber-500 flex items-center justify-center">
              <Icon icon="solar:lock-bold" className="w-3 h-3 text-amber-500" />
            </div>
          </div>

          <DialogTitle className="text-xl font-semibold">
            Unlock {featureName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This feature is available on the{" "}
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {planName} Plan
            </span>{" "}
            and above
          </DialogDescription>
        </DialogHeader>

        {/* Benefits List */}
        {benefits.length > 0 && (
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              What you&apos;ll get:
            </p>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"
                  />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Plan Comparison Mini */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
              <span className="text-muted-foreground">Your Plan</span>
            </div>
            <span className="font-medium">{currentPlanName}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Required</span>
            </div>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {planName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            <Icon icon="solar:rocket-2-bold" className="w-4 h-4 mr-2" />
            Upgrade to {planName}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
