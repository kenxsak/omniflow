'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import PaymentGatewayConfig from '@/components/settings/payment-gateway-config';
import { Icon } from '@iconify/react';

export default function PaymentGatewaySettingsPage() {
  const { isSuperAdmin, loading } = useAuth();

  // Redirect non-super admins
  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold">Payment Gateway</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Configure Stripe and Razorpay payments
        </p>
      </div>
      <PaymentGatewayConfig />
    </div>
  );
}
