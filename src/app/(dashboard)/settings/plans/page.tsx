'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import PlanManager from '@/components/settings/plan-manager';
import { Icon } from '@iconify/react';

export default function PlansSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();

  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold">Plans & Pricing</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage subscription plans and feature allocations
        </p>
      </div>
      <PlanManager />
    </div>
  );
}
