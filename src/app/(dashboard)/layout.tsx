"use client";

import { AuthProvider } from '@/contexts/auth-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { WhiteLabelProvider } from '@/hooks/use-white-label';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/toaster';
import DashboardGate from '@/components/auth/dashboard-gate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <WhiteLabelProvider>
          <DashboardGate>
            <AppShell>{children}</AppShell>
          </DashboardGate>
          <Toaster />
        </WhiteLabelProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
