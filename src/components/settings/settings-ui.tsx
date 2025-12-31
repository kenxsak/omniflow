'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// Color configurations for settings cards - semantic colors matching dashboard theme
const cardColorConfig: Record<string, { gradient: string; iconBg: string; iconColor: string; accentBar: string }> = {
  // User/Profile related
  'solar:user-circle-linear': { gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', accentBar: '#3b82f6' },
  'solar:user-linear': { gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', accentBar: '#3b82f6' },
  // Info/Account
  'solar:info-circle-linear': { gradient: 'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30', iconBg: 'bg-sky-100 dark:bg-sky-900/50', iconColor: 'text-sky-600 dark:text-sky-400', accentBar: '#0ea5e9' },
  // Security
  'solar:shield-keyhole-linear': { gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', accentBar: '#10b981' },
  'solar:shield-star-linear': { gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-400', accentBar: '#8b5cf6' },
  // Danger
  'solar:danger-triangle-linear': { gradient: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400', accentBar: '#f43f5e' },
  // Notifications
  'solar:bell-linear': { gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', accentBar: '#f59e0b' },
  // Settings/Preferences
  'solar:tuning-2-linear': { gradient: 'from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30', iconBg: 'bg-indigo-100 dark:bg-indigo-900/50', iconColor: 'text-indigo-600 dark:text-indigo-400', accentBar: '#6366f1' },
  // Team/Users
  'solar:users-group-two-rounded-linear': { gradient: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30', iconBg: 'bg-teal-100 dark:bg-teal-900/50', iconColor: 'text-teal-600 dark:text-teal-400', accentBar: '#14b8a6' },
  // Organization/Company
  'solar:buildings-2-linear': { gradient: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30', iconBg: 'bg-purple-100 dark:bg-purple-900/50', iconColor: 'text-purple-600 dark:text-purple-400', accentBar: '#a855f7' },
  // Billing/Payment
  'solar:card-linear': { gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', accentBar: '#10b981' },
  'solar:tag-price-linear': { gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', accentBar: '#10b981' },
  // API/Integrations
  'solar:key-linear': { gradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', accentBar: '#f59e0b' },
  'solar:programming-linear': { gradient: 'from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30', iconBg: 'bg-cyan-100 dark:bg-cyan-900/50', iconColor: 'text-cyan-600 dark:text-cyan-400', accentBar: '#06b6d4' },
  // AI/Magic
  'solar:magic-stick-3-linear': { gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-400', accentBar: '#8b5cf6' },
  // Email/Letter
  'solar:letter-linear': { gradient: 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', accentBar: '#3b82f6' },
  // Chat/WhatsApp
  'solar:chat-round-dots-linear': { gradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30', iconBg: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-400', accentBar: '#22c55e' },
  // Social
  'solar:share-circle-linear': { gradient: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30', iconBg: 'bg-pink-100 dark:bg-pink-900/50', iconColor: 'text-pink-600 dark:text-pink-400', accentBar: '#ec4899' },
  // Clock/Time
  'solar:clock-circle-linear': { gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', iconBg: 'bg-orange-100 dark:bg-orange-900/50', iconColor: 'text-orange-600 dark:text-orange-400', accentBar: '#f97316' },
  // Features/Widgets
  'solar:widget-4-linear': { gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', iconBg: 'bg-indigo-100 dark:bg-indigo-900/50', iconColor: 'text-indigo-600 dark:text-indigo-400', accentBar: '#6366f1' },
  // Wallet/Money
  'solar:wallet-money-linear': { gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', accentBar: '#10b981' },
  // Transactions
  'solar:card-transfer-linear': { gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', accentBar: '#3b82f6' },
  // Appearance/Theme
  'solar:pallete-2-linear': { gradient: 'from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30', iconBg: 'bg-pink-100 dark:bg-pink-900/50', iconColor: 'text-pink-600 dark:text-pink-400', accentBar: '#ec4899' },
  'solar:palette-linear': { gradient: 'from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30', iconBg: 'bg-pink-100 dark:bg-pink-900/50', iconColor: 'text-pink-600 dark:text-pink-400', accentBar: '#ec4899' },
  // Monitor/Display
  'solar:monitor-linear': { gradient: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30', iconBg: 'bg-slate-100 dark:bg-slate-900/50', iconColor: 'text-slate-600 dark:text-slate-400', accentBar: '#64748b' },
  // Keyboard
  'solar:keyboard-linear': { gradient: 'from-stone-50 to-zinc-50 dark:from-stone-950/30 dark:to-zinc-950/30', iconBg: 'bg-stone-100 dark:bg-stone-800', iconColor: 'text-stone-600 dark:text-stone-400', accentBar: '#78716c' },
  // Map/Location
  'solar:map-point-linear': { gradient: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400', accentBar: '#f43f5e' },
  // Phone
  'solar:phone-linear': { gradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30', iconBg: 'bg-green-100 dark:bg-green-900/50', iconColor: 'text-green-600 dark:text-green-400', accentBar: '#22c55e' },
  // Lightbulb/Tips
  'solar:lightbulb-linear': { gradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30', iconBg: 'bg-yellow-100 dark:bg-yellow-900/50', iconColor: 'text-yellow-600 dark:text-yellow-400', accentBar: '#eab308' },
  // Crown/Premium
  'solar:crown-linear': { gradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', accentBar: '#f59e0b' },
  // Chart/Analytics
  'solar:chart-linear': { gradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', iconBg: 'bg-indigo-100 dark:bg-indigo-900/50', iconColor: 'text-indigo-600 dark:text-indigo-400', accentBar: '#6366f1' },
  // Shuffle/Distribution
  'solar:shuffle-linear': { gradient: 'from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-400', accentBar: '#8b5cf6' },
  // Document/Text
  'solar:document-text-linear': { gradient: 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', accentBar: '#3b82f6' },
};

// Default fallback colors
const defaultColors = { gradient: 'from-stone-50 to-stone-100 dark:from-stone-900/30 dark:to-stone-800/30', iconBg: 'bg-stone-100 dark:bg-stone-800', iconColor: 'text-stone-600 dark:text-stone-400', accentBar: '#78716c' };

export function SettingsCard({
    title,
    description,
    icon,
    children,
    action,
    footer,
}: {
    title: string;
    description: string;
    icon: string;
    children: ReactNode;
    action?: ReactNode;
    footer?: ReactNode;
}) {
    const colors = cardColorConfig[icon] || defaultColors;
    
    return (
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Accent bar at top */}
            <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: colors.accentBar }} />
            
            <div className={cn(
                'px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between',
                `bg-gradient-to-r ${colors.gradient}`
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl', colors.iconBg)}>
                        <Icon icon={icon} className={cn('h-4.5 w-4.5', colors.iconColor)} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
            {footer && (
                <div className="px-5 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                    {footer}
                </div>
            )}
        </div>
    );
}

export function SettingsRow({
    label,
    description,
    children,
    border = true,
}: {
    label: string;
    description?: string;
    children: ReactNode;
    border?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between py-3',
                border && 'border-b border-stone-200 dark:border-stone-800 last:border-0'
            )}
        >
            <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium">{label}</p>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}
