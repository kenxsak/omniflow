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
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  collapsible?: boolean;
  items: NavItem[];
}

const getNavGroups = (): NavGroup[] => [
  {
    id: 'account',
    label: 'Account',
    icon: 'solar:user-circle-linear',
    items: [
      { href: '/settings', label: 'Profile', icon: 'solar:user-linear' },
      { href: '/settings/preferences', label: 'Preferences', icon: 'solar:tuning-2-linear' },
      { href: '/settings/notifications', label: 'Notifications', icon: 'solar:bell-linear' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: 'solar:buildings-2-linear',
    collapsible: true,
    items: [
      { href: '/settings/company', label: 'Organization', icon: 'solar:buildings-2-linear' },
      { href: '/settings/team', label: 'Team Members', icon: 'solar:users-group-two-rounded-linear', adminOnly: true },
      { href: '/settings/subscription', label: 'Subscription', icon: 'solar:card-linear' },
      { href: '/settings/enterprise', label: 'Enterprise', icon: 'solar:shield-star-linear', adminOnly: true },
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: 'solar:code-linear',
    collapsible: true,
    items: [
      { href: '/settings/integrations', label: 'API Keys', icon: 'solar:key-linear', adminOnly: true },
      { href: '/settings/webhooks', label: 'Webhooks', icon: 'solar:programming-linear', adminOnly: true },
    ],
  },
];

function NavItemLink({ item, isActive, onClick, collapsed }: { item: NavItem; isActive: boolean; onClick?: () => void; collapsed?: boolean }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors',
        isActive
          ? 'bg-stone-100 dark:bg-stone-800 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-stone-50 dark:hover:bg-stone-900 hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon icon={item.icon} className={cn('h-4 w-4 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function SettingsNavigation({ onItemClick, collapsed }: { onItemClick?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const { isSuperAdmin, isAdmin, isManager } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ workspace: true, developer: true });

  const isActive = (href: string) => (href === '/settings' ? pathname === '/settings' : pathname.startsWith(href));
  const toggleGroup = (groupId: string) => setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const navGroups = getNavGroups();
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

        if (group.collapsible && !collapsed) {
          return (
            <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
              <CollapsibleTrigger className="w-full">
                <div className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                  'text-stone-500 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                  hasActiveItem && 'text-stone-700 dark:text-stone-300'
                )}>
                  <div className="flex items-center gap-2">
                    <Icon icon={group.icon} className="h-3.5 w-3.5" />
                    {group.label}
                  </div>
                  <Icon icon="solar:alt-arrow-down-linear" className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-0.5 pl-1">
                {group.items.map((item) => (
                  <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onItemClick} collapsed={collapsed} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        if (collapsed) {
          return (
            <div key={group.id} className="space-y-1">
              <div className="flex justify-center py-2" title={group.label}>
                <Icon icon={group.icon} className="h-4 w-4 text-stone-500" />
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onItemClick} collapsed={collapsed} />
                ))}
              </div>
            </div>
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
                <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onItemClick} collapsed={collapsed} />
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const getCurrentPageTitle = () => {
    const navGroups = getNavGroups();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === '/settings' && pathname === '/settings') return item.label;
        if (item.href !== '/settings' && pathname.startsWith(item.href)) return item.label;
      }
    }
    return 'Settings';
  };

  return (
    <div className="h-full flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col shrink-0 border-r border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-stone-200/60 dark:border-stone-800/60 shrink-0">
          <div className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Icon icon="solar:settings-linear" className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Settings</h2>
                  <p className="text-[10px] text-muted-foreground">Manage preferences</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Icon 
                icon={sidebarCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'} 
                className="h-4 w-4 text-stone-600 dark:text-stone-400" 
              />
            </button>
          </div>
        </div>
        
        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <SettingsNavigation collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden border-b border-stone-200/60 dark:border-stone-800/60 bg-white dark:bg-stone-950 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <Icon icon="solar:settings-linear" className="h-4 w-4 text-stone-600 dark:text-stone-400" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">Settings</h1>
                <p className="text-[10px] text-muted-foreground">{getCurrentPageTitle()}</p>
              </div>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Icon icon="solar:hamburger-menu-linear" className="h-4 w-4" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Icon icon="solar:settings-linear" className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-semibold">Settings</h2>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
                  <SettingsNavigation onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
