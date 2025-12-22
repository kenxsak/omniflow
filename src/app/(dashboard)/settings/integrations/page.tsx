'use client';

import SimpleIntegrations from '@/components/settings/simple-integrations';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          API Keys & Integrations
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
          Connect external services and manage your API credentials securely
        </p>
      </div>

      <SimpleIntegrations />
    </div>
  );
}
