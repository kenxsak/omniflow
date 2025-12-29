'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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

const getNavGroups = (isSuperAdmin: boolean): NavGroup[] => {
  // Super admin gets different navigation
  if (isSuperAdmin) {
    return [
      {
        id: 'platform',
        label: 'Platform Management',
        icon: 'solar:shield-star-linear',
        items: [
          { href: '/settings', label: 'Profile', icon: 'solar:user-linear' },
          { href: '/settings/plans', label: 'Plans & Pricing', icon: 'solar:tag-price-linear' },
          { href: '/settings/features', label: 'Features', icon: 'solar:widget-4-linear' },
        ],
      },
      {
        id: 'integrations',
        label: 'Platform Setup',
        icon: 'solar:settings-linear',
        collapsible: true,
        items: [
          { href: '/settings/payment-gateway', label: 'Payment Gateway', icon: 'solar:card-linear' },
          { href: '/settings/email-sms-setup', label: 'Email Service', icon: 'solar:letter-linear' },
          { href: '/settings/whatsapp-setup', label: 'WhatsApp (Notifications)', icon: 'solar:chat-round-dots-linear' },
          { href: '/settings/social-media-setup', label: 'Social Media', icon: 'solar:share-circle-linear' },
          { href: '/settings/ai-setup', label: 'AI Services', icon: 'solar:magic-stick-3-linear' },
          { href: '/settings/cron-jobs', label: 'Cron Jobs', icon: 'solar:clock-circle-linear' },
        ],
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        icon: 'solar:chart-2-linear',
        collapsible: true,
        items: [
          { href: '/settings/companies', label: 'All Companies', icon: 'solar:buildings-2-linear' },
          { href: '/settings/users', label: 'All Users', icon: 'solar:users-group-two-rounded-linear' },
          { href: '/super-admin-ai-costs', label: 'AI Costs', icon: 'solar:wallet-money-linear' },
          { href: '/transactions', label: 'Transactions', icon: 'solar:card-transfer-linear' },
        ],
      },
      {
        id: 'system',
        label: 'System',
        icon: 'solar:settings-linear',
        collapsible: true,
        items: [
          { href: '/settings/trial', label: 'Trial Settings', icon: 'solar:clock-circle-linear' },
          { href: '/settings/preferences', label: 'Preferences', icon: 'solar:tuning-2-linear' },
        ],
      },
    ];
  }

  // Regular user navigation
  return [
    {
      id: 'account',
      label: 'Account',
      icon: 'solar:user-circle-linear',
      items: [
        { href: '/settings', label: 'Profile', icon: 'solar:user-linear' },
        { href: '/settings/security', label: 'Security', icon: 'solar:shield-keyhole-linear' },
        { href: '/settings/preferences', label: 'Preferences', icon: 'solar:tuning-2-linear' },
        { href: '/settings/notifications', label: 'Notifications', icon: 'solar:bell-linear' },
      ],
    },
    {
      id: 'connections',
      label: 'Connections',
      icon: 'solar:link-circle-linear',
      collapsible: true,
      items: [
        { href: '/settings/connected-accounts', label: 'Social Media', icon: 'solar:share-circle-linear' },
        { href: '/settings/integrations', label: 'API Keys', icon: 'solar:key-linear', adminOnly: true },
        { href: '/settings/webhooks', label: 'Webhooks', icon: 'solar:programming-linear', adminOnly: true },
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
  ];
};

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ workspace: true, connections: true, platform: true, monitoring: true, system: true, integrations: true });

  const isActive = (href: string) => (href === '/settings' ? pathname === '/settings' : pathname.startsWith(href));
  const toggleGroup = (groupId: string) => setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const navGroups = getNavGroups(isSuperAdmin);
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
  const { isSuperAdmin } = useAuth();

  const getCurrentPageTitle = () => {
    const navGroups = getNavGroups(isSuperAdmin);
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === '/settings' && pathname === '/settings') return item.label;
        if (item.href !== '/settings' && pathname.startsWith(item.href)) return item.label;
      }
    }
    return 'Settings';
  };

  return (
    <div className="h-full p-4 lg:p-6">
      <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Desktop Sidebar */}
        <aside className={cn(
          'hidden lg:flex flex-col shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}>
          {/* Sidebar Header */}
          <div className="h-14 flex items-center px-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
            <div className={cn('flex items-center w-full', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Icon icon="solar:settings-bold" className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-semibold text-sm">Settings</span>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Icon
                  icon={sidebarCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:double-alt-arrow-left-linear'}
                  className="h-4 w-4"
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
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-stone-950">
          {/* Mobile Header */}
          <div className="lg:hidden border-b border-stone-200 dark:border-stone-800 px-4 py-3 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Icon icon="solar:settings-bold" className="h-4.5 w-4.5" />
              </div>
              <span className="font-semibold text-sm">{getCurrentPageTitle()}</span>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon icon="solar:hamburger-menu-linear" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <VisuallyHidden>
                  <SheetTitle>Settings Navigation</SheetTitle>
                </VisuallyHidden>
                <div className="h-14 flex items-center px-4 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      <Icon icon="solar:settings-bold" className="h-4.5 w-4.5" />
                    </div>
                    <span className="font-semibold text-sm">Settings</span>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
                  <SettingsNavigation onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex h-14 items-center px-6 border-b border-stone-200 dark:border-stone-800 shrink-0 bg-white dark:bg-stone-950">
            <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {getCurrentPageTitle()}
            </h1>
          </div>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
