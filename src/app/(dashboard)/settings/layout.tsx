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

const navGroups: NavGroup[] = [
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
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200',
        'hover:bg-stone-100 dark:hover:bg-stone-800/60',
        isActive
          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
      )}
    >
      <Icon
        icon={item.icon}
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive
            ? 'text-white dark:text-stone-900'
            : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'
        )}
      />
      <span className="font-medium">{item.label}</span>
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

  // Get current page title
  const getCurrentPageTitle = () => {
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
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center shadow-sm">
                <Icon
                  icon="solar:settings-linear"
                  className="h-5 w-5 text-stone-600 dark:text-stone-400"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Settings
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-500">
                  Manage your account and workspace preferences
                </p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Icon icon="solar:hamburger-menu-linear" className="h-4 w-4" />
                    {getCurrentPageTitle()}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                    <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Settings
                    </h2>
                  </div>
                  <div className="p-3 overflow-y-auto max-h-[calc(100vh-5rem)]">
                    <SettingsNavigation
                      onItemClick={() => setMobileMenuOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 min-h-[calc(100vh-8rem)]">
          <div className="sticky top-0 p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <SettingsNavigation />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
