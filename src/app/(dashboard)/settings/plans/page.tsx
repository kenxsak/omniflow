'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import PlanManager from '@/components/settings/plan-manager';

export default function PlansSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();

  // Redirect non-super admins
  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Plans & Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Manage subscription plans, pricing, and feature allocations
        </p>
      </div>
      <PlanManager />
    </div>
  );
}
