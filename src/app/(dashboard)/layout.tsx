"use client";

import { AuthProvider } from '@/contexts/auth-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { WhiteLabelProvider } from '@/hooks/use-white-label';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/toaster';
import DashboardGate from '@/components/auth/dashboard-gate';
import FloatingAIButton from '@/components/ai-chat/floating-ai-button';
import KeyboardShortcutsDialog from '@/components/layout/keyboard-shortcuts-dialog';
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <LocaleProvider>
          <WhiteLabelProvider>
            <DashboardGate>
              <AppShell>{children}</AppShell>
              <FloatingAIButton />
              <KeyboardShortcutsDialog />
              <PWAInstallPrompt />
            </DashboardGate>
            <Toaster />
          </WhiteLabelProvider>
        </LocaleProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
