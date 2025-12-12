"use client";

import { useSidebar } from '@/components/ui/sidebar';
import { SheetTitle } from '@/components/ui/sheet';
import { SidebarHeader as CustomSidebarHeaderDiv } from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function AppSidebarHeader() {
  const { isMobile } = useSidebar();

  return (
    <CustomSidebarHeaderDiv className="p-3 sm:p-4 border-b border-sidebar-border/50">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2.5 sm:gap-3 group" 
        aria-label="Go to Dashboard"
      >
        <div className="relative shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-md group-hover:shadow-lg transition-shadow">
            <div className="h-full w-full rounded-[10px] bg-sidebar flex items-center justify-center overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="OmniFlow Logo" 
                width={28} 
                height={28} 
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
        {isMobile ? (
          <SheetTitle asChild>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold gradient-text">OmniFlow</h1>
              <Badge variant="secondary" size="sm" className="text-[10px]">Pro</Badge>
            </div>
          </SheetTitle>
        ) : (
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg sm:text-xl font-bold gradient-text">OmniFlow</h1>
            <Badge variant="secondary" size="sm" className="text-[10px]">Pro</Badge>
          </div>
        )}
      </Link>
    </CustomSidebarHeaderDiv>
  );
}
