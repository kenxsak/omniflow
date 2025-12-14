"use client";

import { useRef, useLayoutEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import SidebarNav from '@/components/layout/sidebar-nav';
import AppHeader from '@/components/layout/app-header';
import AppSidebarHeader from '@/components/layout/app-sidebar-header';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);
  const prevPathname = useRef(pathname);
  
  // Ultra-fast page transition - CSS only, no GSAP delay
  useLayoutEffect(() => {
    if (prevPathname.current !== pathname && mainRef.current) {
      // Instant opacity transition via CSS class
      mainRef.current.style.opacity = '0';
      mainRef.current.style.transform = 'translateY(4px)';
      
      // Use requestAnimationFrame for instant visual update
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
          mainRef.current.style.opacity = '1';
          mainRef.current.style.transform = 'translateY(0)';
        }
      });
      
      prevPathname.current = pathname;
    }
  }, [pathname]);

  if (!appUser && pathname !== '/login' && pathname !== '/signup' && pathname !== '/pricing') {
    return null; 
  }

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border dark:border-transparent">
        <AppSidebarHeader />
        <SidebarContent className="scrollbar-thin">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-3 text-[10px] text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between">
            <span>© {new Date().getFullYear()} OmniFlow</span>
            <span className="opacity-50">v2.0</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen">
        <AppHeader />
        <main 
          ref={mainRef}
          className="flex-1 p-4 sm:p-6 overflow-x-hidden"
        >
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
