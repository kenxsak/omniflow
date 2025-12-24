'use client';

import { Icon } from '@iconify/react';
import { useCurrency } from '@/contexts/currency-context';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcuts,
} from '@/components/ui/keyboard-shortcuts-modal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SettingsCard, SettingsRow } from '@/components/settings/settings-ui';

type ThemeOption = 'light' | 'dark' | 'system';

export default function PreferencesPage() {
  const { currency, setCurrency } = useCurrency();
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeOption>('system');
  const [compactMode, setCompactMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      setThemeState(stored);
    } else {
      setThemeState('system');
    }
    // Load other preferences
    setCompactMode(localStorage.getItem('compactMode') === 'true');
    setReducedMotion(localStorage.getItem('reducedMotion') === 'true');
  }, []);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setThemeState(newTheme);
    if (newTheme === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const handleCompactModeChange = (checked: boolean) => {
    setCompactMode(checked);
    localStorage.setItem('compactMode', String(checked));
    toast({ title: checked ? 'Compact mode enabled' : 'Compact mode disabled' });
  };

  const handleReducedMotionChange = (checked: boolean) => {
    setReducedMotion(checked);
    localStorage.setItem('reducedMotion', String(checked));
    if (checked) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    toast({ title: checked ? 'Reduced motion enabled' : 'Reduced motion disabled' });
  };

  const getAppliedTheme = () => {
    if (theme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return theme;
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="max-w-4xl h-64 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-xl" />
      </div>
    );
  }

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'Pound', flag: '🇬🇧' },
    { code: 'INR', symbol: '₹', name: 'Rupee', flag: '🇮🇳' },
  ];

  const themes: { id: ThemeOption; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: 'solar:sun-2-linear' },
    { id: 'dark', label: 'Dark', icon: 'solar:moon-linear' },
    { id: 'system', label: 'System', icon: 'solar:monitor-linear' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Appearance Group */}
        <div className="space-y-4">
          <SettingsCard
            title="Appearance"
            description="Choose your preferred color theme"
            icon="solar:pallete-2-linear"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                      theme === t.id
                        ? 'border-foreground bg-stone-50 dark:bg-stone-900'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900'
                    )}
                  >
                    <Icon icon={t.icon} className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{t.label}</span>
                    {theme === t.id && (
                      <div className="absolute top-2 right-2">
                        <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Currently using: <span className="font-medium capitalize">{getAppliedTheme()}</span> mode
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Display"
            description="Configure how content is displayed"
            icon="solar:monitor-linear"
          >
            <div className="space-y-1">
              <SettingsRow
                label="Compact Mode"
                description="Reduce spacing and padding for a denser interface"
                border={true}
              >
                <Switch checked={compactMode} onCheckedChange={handleCompactModeChange} />
              </SettingsRow>
              <SettingsRow
                label="Reduce Motion"
                description="Minimize animations for accessibility"
                border={false}
              >
                <Switch checked={reducedMotion} onCheckedChange={handleReducedMotionChange} />
              </SettingsRow>
            </div>
          </SettingsCard>
        </div>

        {/* Curency & Shortcuts Group */}
        <div className="space-y-4">
          <SettingsCard
            title="Currency"
            description="Set your preferred currency for displaying amounts"
            icon="solar:wallet-money-linear"
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => setCurrency(curr.code)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                    currency === curr.code
                      ? 'border-foreground bg-stone-50 dark:bg-stone-900'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900'
                  )}
                >
                  <span className="text-xl">{curr.flag}</span>
                  <div className="text-center">
                    <span className="text-sm font-medium block">{curr.symbol} {curr.code}</span>
                    <span className="text-[10px] text-muted-foreground">{curr.name}</span>
                  </div>
                  {currency === curr.code && (
                    <div className="absolute top-2 right-2">
                      <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard
            title="Keyboard Shortcuts"
            description="Navigate faster with keyboard shortcuts"
            icon="solar:keyboard-linear"
          >
            <div className="space-y-4">
              <Button
                onClick={() => setShowShortcuts(true)}
                variant="outline"
                className="w-full justify-between h-10 px-4"
              >
                <div className="flex items-center gap-2">
                  <Icon icon="solar:command-linear" className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">View all shortcuts</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-100 dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-muted-foreground">
                    ?
                  </kbd>
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>

              {/* Quick shortcuts preview */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Go to Dashboard', keys: ['G', 'H'] },
                  { label: 'Toggle Dark Mode', keys: ['⌘', 'D'] },
                  { label: 'Quick Search', keys: ['⌘', 'K'] },
                ].map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900"
                  >
                    <span className="text-xs text-muted-foreground">{shortcut.label}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>

      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
