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
import { Badge } from '@/components/ui/badge';
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
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: string;
  collapsible?: boolean;
  highlight?: boolean;
  items: NavItem[];
}

// Super Admin navigation - Priority based for daily operations
const getSuperAdminNav = (): NavGroup[] => [
  {
    id: 'priority',
    label: '🔥 Priority',
    icon: 'solar:fire-bold',
    highlight: true,
    items: [
      { href: '/settings/support-tickets', label: 'Support Tickets', icon: 'solar:chat-round-dots-bold', badge: 'NEW', badgeColor: 'bg-rose-500' },
      { href: '/transactions', label: 'Transactions', icon: 'solar:card-transfer-bold' },
      { href: '/super-admin-ai-costs', label: 'AI Costs', icon: 'solar:wallet-money-bold' },
      { href: '/settings/invoices', label: 'Invoice & Payments', icon: 'solar:bill-list-linear', badge: 'NEW', badgeColor: 'bg-blue-500' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: 'solar:chart-2-linear',
    items: [
      { href: '/settings/companies', label: 'Companies', icon: 'solar:buildings-2-linear' },
      { href: '/settings/users', label: 'Users', icon: 'solar:users-group-two-rounded-linear' },
    ],
  },
  {
    id: 'messaging',
    label: 'Messaging',
    icon: 'solar:letter-linear',
    collapsible: true,
    items: [
      { href: '/settings/platform-messaging', label: 'Platform Messaging', icon: 'solar:mailbox-bold', badge: 'NEW', badgeColor: 'bg-emerald-500' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    icon: 'solar:shield-star-linear',
    collapsible: true,
    items: [
      { href: '/settings/plans', label: 'Plans & Pricing', icon: 'solar:tag-price-linear' },
      { href: '/settings/features', label: 'Features', icon: 'solar:widget-4-linear' },
      { href: '/settings/trial', label: 'Trial Settings', icon: 'solar:clock-circle-linear' },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    icon: 'solar:settings-linear',
    collapsible: true,
    items: [
      { href: '/settings/payment-gateway', label: 'Payment Gateway', icon: 'solar:card-linear' },
      { href: '/settings/email-sms-setup', label: 'Email Service', icon: 'solar:letter-linear' },
      { href: '/settings/whatsapp-setup', label: 'WhatsApp', icon: 'solar:chat-round-dots-linear' },
      { href: '/settings/ai-setup', label: 'AI Services', icon: 'solar:magic-stick-3-linear' },
      { href: '/settings/ai-calling', label: 'AI Calling', icon: 'solar:phone-calling-linear', badge: 'NEW', badgeColor: 'bg-emerald-500' },
      { href: '/settings/ai-voice-widgets', label: 'AI Voice Widgets', icon: 'solar:microphone-3-linear', badge: 'NEW', badgeColor: 'bg-violet-500' },
      { href: '/settings/cron-jobs', label: 'Cron Jobs', icon: 'solar:clock-circle-linear' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: 'solar:buildings-2-linear',
    collapsible: true,
    items: [
      { href: '/settings/company', label: 'Organization', icon: 'solar:buildings-2-linear' },
      { href: '/settings/agency', label: 'Agency Mode', icon: 'solar:buildings-3-linear', badge: 'NEW', badgeColor: 'bg-violet-500' },
      { href: '/settings/enterprise', label: 'Enterprise', icon: 'solar:shield-star-linear' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: 'solar:user-circle-linear',
    collapsible: true,
    items: [
      { href: '/settings', label: 'Profile', icon: 'solar:user-linear' },
      { href: '/settings/preferences', label: 'Preferences', icon: 'solar:tuning-2-linear' },
    ],
  },
];

// Regular user navigation
const getUserNav = (): NavGroup[] => [
  {
    id: 'setup',
    label: '⚡ Quick Setup',
    icon: 'solar:rocket-2-linear',
    highlight: true,
    items: [
      { href: '/settings/integrations', label: 'Integrations', icon: 'solar:plug-circle-linear', adminOnly: true },
      { href: '/settings/webhooks', label: 'Webhooks', icon: 'solar:programming-linear', adminOnly: true },
      { href: '/settings/ai-calling', label: 'AI Calling', icon: 'solar:phone-calling-linear', adminOnly: true, badge: 'NEW', badgeColor: 'bg-emerald-500' },
      { href: '/settings/invoices', label: 'Invoice & Payments', icon: 'solar:bill-list-linear', adminOnly: true, badge: 'NEW', badgeColor: 'bg-blue-500' },
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
      { href: '/settings/agency', label: 'Agency Mode', icon: 'solar:buildings-3-linear', adminOnly: true, badge: 'NEW', badgeColor: 'bg-violet-500' },
      { href: '/settings/subscription', label: 'Subscription', icon: 'solar:card-linear' },
      { href: '/settings/enterprise', label: 'Enterprise', icon: 'solar:shield-star-linear', adminOnly: true },
    ],
  },
  {
    id: 'account',
    label: 'My Account',
    icon: 'solar:user-circle-linear',
    collapsible: true,
    items: [
      { href: '/settings', label: 'Profile', icon: 'solar:user-linear' },
      { href: '/settings/security', label: 'Security', icon: 'solar:shield-keyhole-linear' },
      { href: '/settings/preferences', label: 'Preferences', icon: 'solar:tuning-2-linear' },
      { href: '/settings/notifications', label: 'Notifications', icon: 'solar:bell-linear' },
    ],
  },
];

function NavItemLink({ item, isActive, onClick, collapsed }: { 
  item: NavItem; 
  isActive: boolean; 
  onClick?: () => void; 
  collapsed?: boolean 
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs sm:text-[13px] transition-all',
        isActive
          ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-medium'
          : 'text-muted-foreground hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon 
        icon={item.icon} 
        className={cn(
          'h-4 w-4 shrink-0', 
          isActive ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground group-hover:text-foreground'
        )} 
      />
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span className={cn('px-1.5 py-0.5 text-[9px] font-bold rounded text-white', item.badgeColor || 'bg-violet-500')}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function SettingsNavigation({ onItemClick, collapsed }: { onItemClick?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const { isSuperAdmin, isAdmin, isManager } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    priority: true,
    monitoring: true,
    platform: false,
    setup: false,
    account: false,
    workspace: true,
  });

  const isActive = (href: string) => (href === '/settings' ? pathname === '/settings' : pathname.startsWith(href));
  const toggleGroup = (groupId: string) => setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  const navGroups = isSuperAdmin ? getSuperAdminNav() : getUserNav();
  
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

        // Priority/Highlight section gets special styling
        if (group.highlight && !collapsed) {
          return (
            <div key={group.id} className="mb-3">
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 border border-violet-200/50 dark:border-violet-800/50 p-2">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  <Icon icon={group.icon} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {group.label}
                </div>
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => (
                    <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} onClick={onItemClick} collapsed={collapsed} />
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (group.collapsible && !collapsed) {
          return (
            <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
              <CollapsibleTrigger className="w-full">
                <div className={cn(
                  'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                  'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                  hasActiveItem && 'text-stone-700 dark:text-stone-300'
                )}>
                  <div className="flex items-center gap-1.5">
                    <Icon icon={group.icon} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    {group.label}
                  </div>
                  <Icon 
                    icon="solar:alt-arrow-down-linear" 
                    className={cn('h-3 w-3 transition-transform duration-200', isOpen && 'rotate-180')} 
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-0.5 space-y-0.5">
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
              <div className="flex justify-center py-1.5" title={group.label}>
                <Icon icon={group.icon} className={cn('h-4 w-4', group.highlight ? 'text-violet-500' : 'text-stone-500')} />
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
          <div key={group.id} className="space-y-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <Icon icon={group.icon} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {group.label}
            </div>
            <div className="space-y-0.5">
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
    const navGroups = isSuperAdmin ? getSuperAdminNav() : getUserNav();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.href === '/settings' && pathname === '/settings') return item.label;
        if (item.href !== '/settings' && pathname.startsWith(item.href)) return item.label;
      }
    }
    return 'Settings';
  };

  return (
    <div className="h-full p-2 sm:p-4 lg:p-6">
      <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-stone-950 rounded-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Desktop Sidebar */}
        <aside className={cn(
          'hidden lg:flex flex-col shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 transition-all duration-300',
          sidebarCollapsed ? 'w-14' : 'w-56'
        )}>
          {/* Sidebar Header */}
          <div className="h-12 flex items-center px-3 border-b border-stone-200 dark:border-stone-800 shrink-0 bg-gradient-to-r from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
            <div className={cn('flex items-center w-full', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                    <Icon icon="solar:settings-bold" className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-sm">Settings</span>
                  {isSuperAdmin && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                      ADMIN
                    </Badge>
                  )}
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded-md text-stone-500 hover:bg-white/80 dark:hover:bg-stone-800 transition-colors"
                title={sidebarCollapsed ? 'Expand' : 'Collapse'}
              >
                <Icon
                  icon={sidebarCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:double-alt-arrow-left-linear'}
                  className="h-3.5 w-3.5"
                />
              </button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto p-2">
            <SettingsNavigation collapsed={sidebarCollapsed} />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-stone-950">
          {/* Mobile Header */}
          <div className="lg:hidden border-b border-stone-200 dark:border-stone-800 px-3 py-2.5 shrink-0 flex items-center justify-between bg-gradient-to-r from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                <Icon icon="solar:settings-bold" className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="font-semibold text-sm">{getCurrentPageTitle()}</span>
                {isSuperAdmin && (
                  <Badge variant="secondary" className="ml-2 text-[8px] px-1 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                    ADMIN
                  </Badge>
                )}
              </div>
            </div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon icon="solar:hamburger-menu-linear" className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <VisuallyHidden>
                  <SheetTitle>Settings Navigation</SheetTitle>
                </VisuallyHidden>
                <div className="h-12 flex items-center px-3 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm">
                      <Icon icon="solar:settings-bold" className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-sm">Settings</span>
                    {isSuperAdmin && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                        ADMIN
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 overflow-y-auto max-h-[calc(100vh-3rem)]">
                  <SettingsNavigation onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex h-11 items-center px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 shrink-0 bg-white dark:bg-stone-950">
            <h1 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {getCurrentPageTitle()}
            </h1>
          </div>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
