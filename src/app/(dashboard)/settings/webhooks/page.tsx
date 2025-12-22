'use client';

import WebhookInfo from '@/components/settings/webhook-info';

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Webhooks
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
          Configure webhooks for real-time event notifications
        </p>
      </div>

      <WebhookInfo />
    </div>
  );
}
