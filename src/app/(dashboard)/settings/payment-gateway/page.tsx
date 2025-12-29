'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import PaymentGatewayConfig from '@/components/settings/payment-gateway-config';

export default function PaymentGatewaySettingsPage() {
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
        <h2 className="text-lg font-semibold">Payment Gateway</h2>
        <p className="text-sm text-muted-foreground">
          Configure Stripe and Razorpay payment integrations
        </p>
      </div>
      <PaymentGatewayConfig />
    </div>
  );
}
