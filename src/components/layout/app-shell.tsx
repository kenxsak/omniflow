"use client";

import { useEffect, useRef } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import AppHeader from '@/components/layout/app-header';
import AppSidebarHeader from '@/components/layout/app-sidebar-header';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import gsap from 'gsap';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const prevPathname = useRef(pathname);
  
  // Page transition animation
  useEffect(() => {
    if (prevPathname.current !== pathname && mainRef.current) {
      // Animate page content on route change
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
      prevPathname.current = pathname;
    }
  }, [pathname]);

  if (!appUser && pathname !== '/login' && pathname !== '/signup' && pathname !== '/pricing') {
    return null; 
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border/50">
        <AppSidebarHeader />
        <SidebarContent className="scrollbar-thin">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden border-t border-sidebar-border/50">
          <div className="flex items-center justify-between">
            <span>© {new Date().getFullYear()} OmniFlow</span>
            <span className="text-[10px] opacity-60">v2.0</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader />
        <main 
          ref={mainRef}
          className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden safe-area-inset"
        >
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
