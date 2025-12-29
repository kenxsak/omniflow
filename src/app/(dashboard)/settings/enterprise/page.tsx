'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AutoDistributionSettings } from '@/components/enterprise/auto-distribution-settings';
import { AuditLogViewer } from '@/components/enterprise/audit-log-viewer';
import { WhiteLabelSettingsPanel } from '@/components/enterprise/white-label-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useFeatureFlag } from '@/hooks/use-feature-flag';
import { cn } from '@/lib/utils';

// Reusable Settings Card
function SettingsCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex-shrink-0">
            <Icon icon={icon} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-stone-600 dark:text-stone-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold truncate">{title}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  );
}

export default function EnterpriseSettingsPage() {
  const { isAdmin } = useAuth();
  const { isFeatureEnabled } = useFeatureFlag();
  const [hasEnterpriseFeature, setHasEnterpriseFeature] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'distribution' | 'audit' | 'sso' | 'whitelabel'>('distribution');

  useEffect(() => {
    isFeatureEnabled('feat_enterprise_team').then(setHasEnterpriseFeature);
  }, [isFeatureEnabled]);

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Enterprise</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Advanced settings for enterprise customers
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
          <Icon icon="solar:danger-triangle-linear" className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Access Denied</p>
            <p className="text-xs text-red-600 dark:text-red-400">Only administrators can access enterprise settings.</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasEnterpriseFeature === false) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Enterprise</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Advanced features for large teams
          </p>
        </div>
        <SettingsCard
          title="Enterprise Plan Required"
          description="Upgrade to unlock advanced features"
          icon="solar:crown-linear"
        >
          <div className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Icon icon="solar:lock-linear" className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span className="font-medium">Lead Claiming</span>
                  <span className="text-muted-foreground"> - Prevent duplicate work</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Icon icon="solar:shield-check-linear" className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="font-medium">Audit Trail</span>
                  <span className="text-muted-foreground"> - Full compliance logging</span>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Icon icon="solar:shuffle-linear" className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="font-medium">Auto-Distribution</span>
                  <span className="text-muted-foreground"> - Fair lead assignment</span>
                </div>
              </li>
            </ul>
            <Button size="sm" className="h-8" asChild>
              <a href="/settings/subscription">Upgrade to Enterprise</a>
            </Button>
          </div>
        </SettingsCard>
      </div>
    );
  }

  if (hasEnterpriseFeature === null) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Enterprise</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Loading...</p>
        </div>
        <div className="h-48 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-xl" />
      </div>
    );
  }

  const tabs = [
    { id: 'distribution' as const, label: 'Auto-Distribution', icon: 'solar:shuffle-linear' },
    { id: 'audit' as const, label: 'Audit Trail', icon: 'solar:document-text-linear' },
    { id: 'whitelabel' as const, label: 'White-Label', icon: 'solar:palette-linear' },
    { id: 'sso' as const, label: 'SSO Setup', icon: 'solar:key-linear' },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-semibold">Enterprise</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure advanced features for team collaboration and compliance
        </p>
      </div>

      {/* Feature Status Cards - Scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-5 min-w-max sm:min-w-0">
          <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl p-2.5 sm:p-3 bg-white dark:bg-stone-900/50 min-w-[140px] sm:min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex-shrink-0">
                <Icon icon="solar:lock-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Lead Claiming</p>
                <Badge className="mt-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0 text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5">
                  <Icon icon="solar:check-circle-bold" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>

          <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl p-2.5 sm:p-3 bg-white dark:bg-stone-900/50 min-w-[140px] sm:min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
                <Icon icon="solar:shield-check-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Audit Trail</p>
                <Badge className="mt-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0 text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5">
                  <Icon icon="solar:check-circle-bold" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>

          <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl p-2.5 sm:p-3 bg-white dark:bg-stone-900/50 min-w-[140px] sm:min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex-shrink-0">
                <Icon icon="solar:shuffle-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Distribution</p>
                <Badge className="mt-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0 text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5">
                  <Icon icon="solar:check-circle-bold" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Available
                </Badge>
              </div>
            </div>
          </div>

          <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl p-2.5 sm:p-3 bg-white dark:bg-stone-900/50 min-w-[140px] sm:min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex-shrink-0">
                <Icon icon="solar:key-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">SSO</p>
                <Badge variant="outline" className="mt-0.5 text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5">
                  Contact
                </Badge>
              </div>
            </div>
          </div>

          <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl p-2.5 sm:p-3 bg-white dark:bg-stone-900/50 min-w-[140px] sm:min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex-shrink-0">
                <Icon icon="solar:palette-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">White-Label</p>
                <Badge className="mt-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0 text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5">
                  <Icon icon="solar:check-circle-bold" className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  Available
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs - Scrollable */}
      <div className="border-b border-stone-200/60 dark:border-stone-800/60 -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav className="flex gap-0.5 sm:gap-1 overflow-x-auto pb-px scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-stone-600 dark:text-stone-400 border-b-2 border-transparent hover:text-stone-900 dark:hover:text-stone-200'
              )}
            >
              <Icon icon={tab.icon} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              <span className="xs:hidden sm:hidden">{tab.label.split('-')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'distribution' && <AutoDistributionSettings />}

      {activeTab === 'audit' && <AuditLogViewer />}

      {activeTab === 'whitelabel' && (
        <SettingsCard
          title="White-Label Branding"
          description="Customize the platform with your own branding"
          icon="solar:palette-linear"
        >
          <WhiteLabelSettingsPanel />
        </SettingsCard>
      )}

      {activeTab === 'sso' && (
        <SettingsCard
          title="Single Sign-On (SSO)"
          description="Enterprise SSO integration"
          icon="solar:key-linear"
        >
          <div className="space-y-4 sm:space-y-5">
            {/* Info Alert */}
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60">
              <Icon icon="solar:shield-check-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium">Enterprise Feature</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  SSO is available for Enterprise plan customers. Contact sales to enable SAML 2.0, OAuth 2.0, or OpenID Connect.
                </p>
              </div>
            </div>

            {/* Identity Providers */}
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm font-medium">Supported Identity Providers</p>
              <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
                    <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">Microsoft Entra ID</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">Azure AD</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex-shrink-0">
                    <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">Google Workspace</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">SAML/OIDC</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex-shrink-0">
                    <Icon icon="solar:users-group-rounded-linear" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">Okta</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">SAML 2.0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Auth */}
            <div className="pt-3 sm:pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
              <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Current Authentication</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
                Your team uses Firebase Authentication:
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">Email/Password</Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">Google</Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">GitHub</Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">Microsoft</Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] h-4 sm:h-5">Apple</Badge>
              </div>
            </div>

            {/* CTA */}
            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto">
              <Icon icon="solar:link-round-linear" className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
              Contact Sales for SSO
            </Button>
          </div>
        </SettingsCard>
      )}
    </div>
  );
}
