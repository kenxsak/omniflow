'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import WebhookInfo from '@/components/settings/webhook-info';
import { AutomationPlatforms } from '@/components/settings/automation-platforms';

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Webhooks & API</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Connect OmniFlow with external apps via webhooks and automation platforms
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="webhooks" className="text-xs sm:text-sm">
            <Icon icon="solar:link-round-linear" className="w-4 h-4 mr-1.5" />
            Direct Webhooks
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs sm:text-sm">
            <Icon icon="solar:bolt-circle-linear" className="w-4 h-4 mr-1.5" />
            Zapier / Pabbly / Make
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="mt-4">
          <WebhookInfo />
        </TabsContent>

        <TabsContent value="automation" className="mt-4">
          <AutomationPlatforms />
        </TabsContent>
      </Tabs>
    </div>
  );
}
