'use client';

import { Loader2 } from 'lucide-react';

export default function AuthLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* OmniFlow Logo */}
        <div className="flex items-center gap-2">
          {/* Light theme logo */}
          <img
            src="/favicon-light/android-chrome-192x192.png"
            alt="OmniFlow"
            className="h-10 w-10 object-contain dark:hidden"
          />
          {/* Dark theme logo */}
          <img
            src="/favicon-dark/android-chrome-192x192.png"
            alt="OmniFlow"
            className="h-10 w-10 object-contain hidden dark:block"
          />
          <span className="text-xl font-semibold text-stone-900 dark:text-stone-100">OmniFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    </div>
  );
}
