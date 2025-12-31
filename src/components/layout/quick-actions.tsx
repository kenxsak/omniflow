"use client";

import { useState, useEffect, useCallback, KeyboardEvent } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { LockedFeatureModal } from "./locked-feature-modal";
import type { PlanTier } from "@/lib/menu-config";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: () => void;
  featureId?: string;
  minPlan?: PlanTier;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "add-contact",
    label: "Add Contact",
    icon: "solar:user-plus-linear",
    href: "/crm?action=add",
    featureId: "feat_core_crm",
  },
  {
    id: "send-campaign",
    label: "Send Campaign",
    icon: "solar:letter-linear",
    href: "/campaigns?action=new",
    featureId: "feat_email_marketing",
    minPlan: "starter",
  },
  {
    id: "create-content",
    label: "Create Content",
    icon: "solar:pen-new-square-linear",
    href: "/social-media",
    featureId: "feat_ai_content_gen",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "solar:calendar-add-linear",
    href: "/appointments?action=new",
    featureId: "feat_core_crm",
  },
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [actionStates, setActionStates] = useState<Record<string, { accessible: boolean; locked: boolean }>>({});
  const router = useRouter();
  const { isFeatureEnabled } = useFeatureFlag();

  // Locked feature modal state
  const [lockedModal, setLockedModal] = useState<{
    isOpen: boolean;
    featureName: string;
    featureIcon: string;
    minPlan: PlanTier;
    featureId?: string;
  }>({
    isOpen: false,
    featureName: "",
    featureIcon: "",
    minPlan: "starter",
  });

  // Check feature access for all actions
  useEffect(() => {
    const checkAccess = async () => {
      const states: Record<string, { accessible: boolean; locked: boolean }> = {};
      
      for (const action of QUICK_ACTIONS) {
        if (action.featureId) {
          const accessible = await isFeatureEnabled(action.featureId);
          states[action.id] = {
            accessible,
            locked: !accessible && !!action.minPlan,
          };
        } else {
          states[action.id] = { accessible: true, locked: false };
        }
      }
      
      setActionStates(states);
    };

    checkAccess();
  }, [isFeatureEnabled]);

  const handleActionClick = useCallback((action: QuickAction) => {
    const state = actionStates[action.id];
    
    // If locked, show upgrade modal
    if (state?.locked) {
      setLockedModal({
        isOpen: true,
        featureName: action.label,
        featureIcon: action.icon,
        minPlan: action.minPlan || "starter",
        featureId: action.featureId,
      });
      return;
    }

    // If not accessible and not locked, do nothing
    if (!state?.accessible) {
      return;
    }

    // Execute action or navigate
    if (action.action) {
      action.action();
    } else if (action.href) {
      router.push(action.href);
    }
  }, [actionStates, router]);

  // Keyboard handler for quick action buttons
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, action: QuickAction) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActionClick(action);
    }
  }, [handleActionClick]);

  return (
    <>
      <div className={cn("px-2 mb-1", className)} role="region" aria-label="Quick actions">
        {/* Header with collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="quick-actions-grid"
          className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded"
        >
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:bolt-linear" className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quick Actions</span>
          </div>
          <Icon
            icon="solar:alt-arrow-down-linear"
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
            aria-hidden="true"
          />
        </button>

        {/* Actions grid */}
        <div
          id="quick-actions-grid"
          className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            isExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
          )}
          role="group"
          aria-label="Quick action buttons"
        >
          <div className="grid grid-cols-2 gap-1.5 pt-1 pb-2">
            {QUICK_ACTIONS.map((action) => {
              const state = actionStates[action.id];
              const isLocked = state?.locked;
              const isAccessible = state?.accessible;

              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  onKeyDown={(e) => handleKeyDown(e, action)}
                  aria-label={isLocked ? `${action.label} - Locked, click to upgrade` : action.label}
                  aria-disabled={!isAccessible && !isLocked}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all duration-150",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    "hover:bg-card hover:border-border hover:shadow-sm",
                    isLocked
                      ? "border-dashed border-amber-500/30 bg-amber-500/5 opacity-70"
                      : "border-transparent bg-muted/30",
                    !isAccessible && !isLocked && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!isAccessible && !isLocked}
                >
                  <div className="relative">
                    <Icon
                      icon={action.icon}
                      className={cn(
                        "w-4 h-4",
                        isLocked ? "text-amber-500" : "text-primary"
                      )}
                      aria-hidden="true"
                    />
                    {isLocked && (
                      <Icon
                        icon="solar:lock-bold"
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-amber-500"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight text-center",
                      isLocked ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    )}
                  >
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mt-1" aria-hidden="true" />
      </div>

      {/* Locked Feature Modal */}
      <LockedFeatureModal
        isOpen={lockedModal.isOpen}
        onClose={() => setLockedModal((prev) => ({ ...prev, isOpen: false }))}
        featureName={lockedModal.featureName}
        featureIcon={lockedModal.featureIcon}
        minPlan={lockedModal.minPlan}
        featureId={lockedModal.featureId}
      />
    </>
  );
}
