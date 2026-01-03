'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user dismissed the prompt recently (within 7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show prompt if dismissed within 7 days
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual instructions after a delay
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds on iOS
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  // Don't show if already installed or prompt not available
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-[360px] z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Icon icon="solar:rocket-bold" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              Install OmniFlow App
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isIOS 
                ? 'Add to Home Screen for the best experience'
                : 'Install for quick access & offline support'
              }
            </p>
            
            {isIOS ? (
              // iOS Instructions
              <div className="mt-2 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>Tap</span>
                  <Icon icon="solar:share-linear" className="w-4 h-4" />
                  <span>then "Add to Home Screen"</span>
                </p>
              </div>
            ) : (
              // Android/Desktop Install Button
              <div className="flex items-center gap-2 mt-2.5">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="h-8 text-xs sm:text-sm px-3 bg-blue-600 hover:bg-blue-700"
                >
                  <Icon icon="solar:download-minimalistic-linear" className="w-4 h-4 mr-1.5" />
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs sm:text-sm px-2 text-muted-foreground"
                >
                  Not now
                </Button>
              </div>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <Icon icon="solar:close-circle-linear" className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
