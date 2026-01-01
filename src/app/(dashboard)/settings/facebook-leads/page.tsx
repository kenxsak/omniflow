'use client';

import FacebookLeadsSettings from '@/components/settings/facebook-leads-settings';

export default function FacebookLeadsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold">Facebook Lead Ads</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Automatically sync leads from your Facebook Lead Ad forms to your CRM
        </p>
      </div>
      
      <FacebookLeadsSettings />
    </div>
  );
}
