'use client';

import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function SettingsCard({
    title,
    description,
    icon,
    children,
    action,
}: {
    title: string;
    description: string;
    icon: string;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-5 py-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800">
                        <Icon icon={icon} className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                </div>
                {action}
            </div>
            <div className="p-5">{children}</div>
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
