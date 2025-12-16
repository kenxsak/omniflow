'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface NavItem {
    href: string;
    label: string;
    icon: string;
    adminOnly?: boolean;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

export default function SettingsSidebar() {
    const pathname = usePathname();
    const { isSuperAdmin, isAdmin, isManager } = useAuth();

    // Define navigation structure based on OmniFlow features
    const navGroups: NavGroup[] = [
        {
            label: 'Company',
            items: [
                { href: '/settings', label: 'Company Profile', icon: 'solar:buildings-2-linear' },
                { href: '/settings/subscription', label: 'Subscription & Billing', icon: 'solar:card-linear' },
            ],
        },
        {
            label: 'Team',
            items: [
                { href: '/settings/team', label: 'Team Members', icon: 'solar:users-group-two-rounded-linear', adminOnly: true },
            ],
        },
        {
            label: 'Integrations',
            items: [
                { href: '/settings/integrations', label: 'API Keys', icon: 'solar:key-linear', adminOnly: true },
                { href: '/settings/webhooks', label: 'Webhooks', icon: 'solar:programming-linear', adminOnly: true },
            ],
        },
    ];

    // Filter items based on role
    const filteredGroups = navGroups.map(group => ({
        ...group,
        items: group.items.filter(item => {
            if (isSuperAdmin) return true;
            if (item.adminOnly && !isAdmin && !isManager) return false;
            return true;
        }),
    })).filter(group => group.items.length > 0);

    const isActive = (href: string) => {
        if (href === '/settings') {
            return pathname === '/settings';
        }
        return pathname.startsWith(href);
    };

    return (
        <nav className="space-y-6">
            {filteredGroups.map((group) => (
                <div key={group.label}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                        {group.label}
                    </h3>

                    <ul className="space-y-1">
                        {group.items.map((item) => {
                            const active = isActive(item.href);

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                                            active
                                                ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon
                                            icon={item.icon}
                                            className={cn(
                                                "size-4 shrink-0",
                                                active ? "text-primary" : ""
                                            )}
                                        />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

