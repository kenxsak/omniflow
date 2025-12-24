'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { SettingsCard, SettingsRow } from '@/components/settings/settings-ui';

export default function SecuritySettingsPage() {
    return (
        <div className="space-y-6">
            <div className="max-w-4xl">
                <SettingsCard
                    title="Security Preferences"
                    description="Manage your account security settings"
                    icon="solar:shield-keyhole-linear"
                >
                    <div className="divide-y divide-stone-200 dark:divide-stone-800">
                        <SettingsRow label="Password" description="Last changed 30 days ago" border={true}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                Change Password
                            </Button>
                        </SettingsRow>

                        <SettingsRow
                            label="Two-Factor Authentication"
                            description="Add an extra layer of security to your account"
                            border={true}
                        >
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                Enable
                            </Button>
                        </SettingsRow>

                        <SettingsRow
                            label="Active Sessions"
                            description="Manage devices where you're logged in"
                            border={false}
                        >
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                                View All
                                <Icon icon="solar:arrow-right-linear" className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </SettingsRow>
                    </div>
                </SettingsCard>
            </div>
        </div>
    );
}
