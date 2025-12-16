'use client';

import { ReactNode, useState } from 'react';
import SettingsSidebar from '@/components/settings/settings-sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6 pb-10">
      {/* Settings Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <SettingsSidebar />
        </aside>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Icon icon="solar:hamburger-menu-linear" className="size-4" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SettingsSidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

