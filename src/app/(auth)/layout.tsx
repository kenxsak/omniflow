"use client";

import { Toaster } from '@/components/ui/toaster';
import { PublicWhiteLabelProvider } from '@/components/providers/public-white-label-provider';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicWhiteLabelProvider>
      {children}
      <Toaster />
    </PublicWhiteLabelProvider>
  );
}
