"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface SidebarUpgradeBannerProps {
  className?: string;
}

export function SidebarUpgradeBanner({ className }: SidebarUpgradeBannerProps) {
  const router = useRouter();
  const { company, appUser } = useAuth();

  // Don't show for super admins
  if (appUser?.role === "superadmin") {
    return null;
  }

  // Get plan info
  const planId = company?.planId || "plan_free";
  const isFreePlan = planId === "plan_free" || planId.includes("free");
  const isEnterprise = planId.includes("enterprise");

  // Don't show upgrade banner for enterprise users
  if (isEnterprise) {
    return null;
  }

  // Get display name for current plan
  const getPlanDisplayName = () => {
    if (isFreePlan) return "Free Plan";
    if (planId.includes("starter")) return "Starter Plan";
    if (planId.includes("pro")) return "Pro Plan";
    return "Current Plan";
  };

  // Get plan badge color
  const getPlanBadgeStyle = () => {
    if (isFreePlan) return "bg-muted text-muted-foreground";
    if (planId.includes("starter")) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (planId.includes("pro")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  };

  const handleUpgrade = () => {
    router.push("/settings/billing");
  };

  return (
    <div
      className={cn(
        "mx-2 mb-2 p-3 rounded-lg border",
        isFreePlan
          ? "bg-gradient-to-br from-amber-500/5 to-violet-500/5 border-amber-500/20"
          : "bg-muted/50 border-border",
        className
      )}
    >
      {/* Current Plan Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full",
            getPlanBadgeStyle()
          )}
        >
          {getPlanDisplayName()}
        </span>
        {isFreePlan && (
          <Icon
            icon="solar:star-bold"
            className="w-4 h-4 text-amber-500 animate-pulse"
          />
        )}
      </div>

      {/* Upgrade Message */}
      {isFreePlan ? (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            Unlock all features and grow your business faster
          </p>
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="w-full bg-gradient-to-r from-amber-500 to-violet-500 hover:from-amber-600 hover:to-violet-600 text-white text-xs h-8"
          >
            <Icon icon="solar:rocket-2-bold" className="w-3.5 h-3.5 mr-1.5" />
            Upgrade Now
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            Get more features with a higher plan
          </p>
          <Button
            onClick={handleUpgrade}
            size="sm"
            variant="outline"
            className="w-full text-xs h-8"
          >
            <Icon icon="solar:arrow-up-linear" className="w-3.5 h-3.5 mr-1.5" />
            View Plans
          </Button>
        </>
      )}
    </div>
  );
}
