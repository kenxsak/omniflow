"use client";

import { useSidebar } from '@/components/ui/sidebar';
import { SheetTitle } from '@/components/ui/sheet';
import { SidebarHeader as CustomSidebarHeaderDiv } from '@/components/ui/sidebar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LogoIcon } from '@/components/ui/logo';
import { useAuth } from '@/hooks/use-auth';
import { useWhiteLabel } from '@/hooks/use-white-label';

// Map planId to display name
const planDisplayNames: Record<string, string> = {
  'plan_free': 'Free',
  'plan_starter': 'Starter',
  'plan_pro': 'Pro',
  'plan_enterprise': 'Enterprise',
};

// Map planId to badge variant/color
const planBadgeStyles: Record<string, string> = {
  'plan_free': 'bg-muted text-muted-foreground',
  'plan_starter': 'bg-info-muted text-info-muted-foreground',
  'plan_pro': 'bg-primary/10 text-primary',
  'plan_enterprise': 'bg-warning-muted text-warning-muted-foreground',
};

export default function AppSidebarHeader() {
  const { isMobile } = useSidebar();
  const { company } = useAuth();
  
  // Get white-label brand name
  let brandName = 'OmniFlow';
  try {
    const whiteLabel = useWhiteLabel();
    brandName = whiteLabel.brandName;
  } catch {
    // WhiteLabelProvider not available
  }

  const planId = company?.planId || 'plan_free';
  const planName = planDisplayNames[planId] || planId.replace('plan_', '').charAt(0).toUpperCase() + planId.replace('plan_', '').slice(1);

  return (
    <CustomSidebarHeaderDiv className="px-3 py-4">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2 group" 
        aria-label="Go to Dashboard"
      >
        <div className="relative shrink-0">
          <LogoIcon size={24} />
        </div>
        {isMobile ? (
          <SheetTitle asChild>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground uppercase tracking-wide">{brandName}</h1>
            </div>
          </SheetTitle>
        ) : (
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <h1 className="text-sm font-semibold text-foreground uppercase tracking-wide">{brandName}</h1>
          </div>
        )}
      </Link>
    </CustomSidebarHeaderDiv>
  );
}
