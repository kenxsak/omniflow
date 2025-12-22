'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  collapsible?: boolean;
  items: NavItem[];
}

// Dynamic navigation configuration
const getNavGroups = (): NavGroup[] => [
  {
    id: 'account',
    label: 'Account',
    icon: 'solar:user-circle-linear',
    items: [
      {
        href: '/settings',
        label: 'Profile',
        icon: 'solar:user-linear',
        description: 'Your personal information',
      },
      {
        href: '/settings/preferences',
        label: 'Preferences',
        icon: 'solar:tuning-2-linear',
        description: 'Theme, currency & shortcuts',
      },
      {
        href: '/settings/notifications',
        label: 'Notifications',
        icon: 'solar:bell-linear',
        description: 'Email & push notifications',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: 'solar:buildings-2-linear',
    collapsible: true,
    items: [
      {
        href: '/settings/company',
        label: 'Organization',
        icon: 'solar:buildings-2-linear',
        description: 'Company profile & branding',
      },
      {
        href: '/settings/team',
        label: 'Team Members',
        icon: 'solar:users-group-two-rounded-linear',
        description: 'Manage team access',
        adminOnly: true,
      },
      {
        href: '/settings/subscription',
        label: 'Subscription',
        icon: 'solar:card-linear',
        description: 'Plan & billing',
      },
      {
        href: '/settings/enterprise',
        label: 'Enterprise',
        icon: 'solar:shield-star-linear',
        description: 'Enterprise features',
        adminOnly: true,
      },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: 'solar:code-linear',
    collapsible: true,
    items: [
      {
        href: '/settings/integrations',
        label: 'API Keys',
        icon: 'solar:key-linear',
        description: 'Manage API credentials',
        adminOnly: true,
      },
      {
        href: '/settings/webhooks',
        label: 'Webhooks',
        icon: 'solar:programming-linear',
        description: 'Event notifications',
        adminOnly: true,
      },
    ],
  },
];

function NavItemLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors',
        isActive
          ? 'bg-stone-100 dark:bg-stone-800 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-foreground'
      )}
    >
      <Icon
        icon={item.icon}
        className={cn(
          'h-4 w-4 shrink-0',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

function SettingsNavigation({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { isSuperAdmin, isAdmin, isManager } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    developer: true,
  });

  const isActive = (href: string) => {
    if (href === '/settings') {
      return pathname === '/settings';
    }
    return pathname.startsWith(href);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Get dynamic navigation groups
  const navGroups = getNavGroups();

  // Filter items based on role
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isSuperAdmin) return true;
        if (item.adminOnly && !isAdmin && !isManager) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav className="space-y-1">
      {filteredGroups.map((group) => {
        const hasActiveItem = group.items.some((item) => isActive(item.href));
        const isOpen = openGroups[group.id] ?? true;

        if (group.collapsible) {
          return (
            <Collapsible
              key={group.id}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                    'text-stone-500 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                    hasActiveItem && 'text-stone-700 dark:text-stone-300'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon={group.icon} className="h-3.5 w-3.5" />
                    {group.label}
                  </div>
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5 pl-1">
                {group.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={onItemClick}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <div key={group.id} className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-500">
              <Icon icon={group.icon} className="h-3.5 w-3.5" />
              {group.label}
            </div>
            <div className="space-y-0.5 pl-1">
              {group.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  isActive={isActive(item.href)}
                  onClick={onItemClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Get current page title dynamically
  const getCurrentPageTitle = () => {
    const navGroups = getNavGroups();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === '/settings' && pathname === '/settings') {
          return item.label;
        }
        if (item.href !== '/settings' && pathname.startsWith(item.href)) {
          return item.label;
        }
      }
    }
    return 'Settings';
  };

  return (
    <div className="h-full p-4 sm:p-6">
      {/* Outer Rounded Container */}
      <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-stone-950 rounded-2xl border border-stone-200/60 dark:border-stone-800/60 shadow-sm">
        {/* Header */}
        <div className="border-b border-stone-200/60 dark:border-stone-800/60 shrink-0">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800">
                  <Icon icon="solar:settings-linear" className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                </div>
                <div>
                  <h1 className="text-base font-semibold">Settings</h1>
                  <p className="text-xs text-muted-foreground">
                    Manage your account and workspace preferences
                  </p>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                      <Icon icon="solar:hamburger-menu-linear" className="h-4 w-4" />
                      {getCurrentPageTitle()}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                      <h2 className="text-sm font-semibold">Settings</h2>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
                      <SettingsNavigation onItemClick={() => setMobileMenuOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 border-r border-stone-200/60 dark:border-stone-800/60 bg-stone-50/30 dark:bg-stone-900/20">
            <div className="h-full p-4 overflow-y-auto">
              <SettingsNavigation />
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

