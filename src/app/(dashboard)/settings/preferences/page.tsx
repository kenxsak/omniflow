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

type ThemeOption = 'light' | 'dark' | 'system';

// Reusable Settings Card
function SettingsCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <Icon icon={icon} className="h-4.5 w-4.5 text-stone-500 dark:text-stone-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Settings Toggle Row
function SettingsToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800/60 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{label}</p>
        <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

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
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Preferences
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            Customize your experience
          </p>
        </div>
        <div className="h-64 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />
      </div>
    );
  }

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'Pound', flag: '🇬🇧' },
    { code: 'INR', symbol: '₹', name: 'Rupee', flag: '🇮🇳' },
  ];

  const themes: { id: ThemeOption; label: string; icon: string; bgClass: string }[] = [
    {
      id: 'light',
      label: 'Light',
      icon: 'solar:sun-2-linear',
      bgClass: 'bg-white border-stone-200',
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: 'solar:moon-linear',
      bgClass: 'bg-stone-900 border-stone-700',
    },
    {
      id: 'system',
      label: 'System',
      icon: 'solar:monitor-linear',
      bgClass: 'bg-gradient-to-br from-white to-stone-800 border-stone-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Preferences
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
          Customize your workspace appearance and behavior
        </p>
      </div>

      {/* Appearance */}
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
                  'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                  theme === t.id
                    ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-900 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900/50'
                )}
              >
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl border flex items-center justify-center shadow-sm',
                    t.bgClass
                  )}
                >
                  <Icon
                    icon={t.icon}
                    className={cn(
                      'h-6 w-6',
                      t.id === 'dark' ? 'text-stone-300' : 'text-stone-600'
                    )}
                  />
                </div>
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  {t.label}
                </span>
                {theme === t.id && (
                  <div className="absolute top-2 right-2">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="h-5 w-5 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-500 text-center">
            Currently using:{' '}
            <span className="font-medium capitalize">{getAppliedTheme()}</span> mode
          </p>
        </div>
      </SettingsCard>

      {/* Display Settings */}
      <SettingsCard
        title="Display"
        description="Configure how content is displayed"
        icon="solar:monitor-linear"
      >
        <div className="space-y-1">
          <SettingsToggle
            label="Compact Mode"
            description="Reduce spacing and padding for a denser interface"
            checked={compactMode}
            onCheckedChange={handleCompactModeChange}
          />
          <SettingsToggle
            label="Reduce Motion"
            description="Minimize animations for accessibility"
            checked={reducedMotion}
            onCheckedChange={handleReducedMotionChange}
          />
        </div>
      </SettingsCard>

      {/* Currency */}
      <SettingsCard
        title="Currency"
        description="Set your preferred currency for displaying amounts"
        icon="solar:wallet-money-linear"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                currency === curr.code
                  ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-900 shadow-sm'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900/50'
              )}
            >
              <span className="text-2xl">{curr.flag}</span>
              <div className="text-center">
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 block">
                  {curr.symbol} {curr.code}
                </span>
                <span className="text-[10px] text-stone-500">{curr.name}</span>
              </div>
              {currency === curr.code && (
                <div className="absolute top-2 right-2">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="h-4 w-4 text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Keyboard Shortcuts */}
      <SettingsCard
        title="Keyboard Shortcuts"
        description="Navigate faster with keyboard shortcuts"
        icon="solar:keyboard-linear"
      >
        <div className="space-y-4">
          <Button
            onClick={() => setShowShortcuts(true)}
            variant="outline"
            className="w-full justify-between h-12 px-4"
          >
            <div className="flex items-center gap-3">
              <Icon icon="solar:command-linear" className="h-5 w-5 text-stone-500" />
              <span className="text-sm font-medium">View all shortcuts</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 text-[11px] font-mono bg-stone-100 dark:bg-stone-800 rounded-md border border-stone-200 dark:border-stone-700 text-stone-500">
                ?
              </kbd>
              <Icon icon="solar:arrow-right-linear" className="h-4 w-4 text-stone-400" />
            </div>
          </Button>

          {/* Quick shortcuts preview */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Go to Dashboard', keys: ['G', 'H'] },
              { label: 'Toggle Dark Mode', keys: ['⌘', 'D'] },
              { label: 'Quick Search', keys: ['⌘', 'K'] },
              { label: 'New Lead', keys: ['⌘', 'N'] },
            ].map((shortcut) => (
              <div
                key={shortcut.label}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-stone-50 dark:bg-stone-900"
              >
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  {shortcut.label}
                </span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, i) => (
                    <kbd
                      key={i}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
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

      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
