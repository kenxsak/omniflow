'use client';

import { Icon } from '@iconify/react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  settings: NotificationSetting[];
}

// Reusable Settings Card
function SettingsCard({
  title,
  description,
  icon,
  children,
  headerAction,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
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
        {headerAction}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'email',
      title: 'Email Notifications',
      description: 'Receive updates via email',
      icon: 'solar:letter-linear',
      settings: [
        {
          id: 'email_new_lead',
          title: 'New Lead',
          description: 'Get notified when a new lead is added to your CRM',
          enabled: true,
        },
        {
          id: 'email_deal_won',
          title: 'Deal Won',
          description: 'Get notified when a deal is marked as won',
          enabled: true,
        },
        {
          id: 'email_task_reminder',
          title: 'Task Reminders',
          description: 'Receive reminders for upcoming and overdue tasks',
          enabled: true,
        },
        {
          id: 'email_weekly_report',
          title: 'Weekly Report',
          description: 'Receive a weekly summary of your CRM activity',
          enabled: false,
        },
        {
          id: 'email_monthly_analytics',
          title: 'Monthly Analytics',
          description: 'Get monthly performance insights and trends',
          enabled: false,
        },
      ],
    },
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Real-time browser alerts',
      icon: 'solar:bell-linear',
      settings: [
        {
          id: 'push_messages',
          title: 'Messages',
          description: 'Get instant notifications for new messages',
          enabled: true,
        },
        {
          id: 'push_mentions',
          title: 'Mentions',
          description: 'Get notified when someone mentions you',
          enabled: true,
        },
        {
          id: 'push_appointments',
          title: 'Appointment Reminders',
          description: '15-minute reminder before scheduled appointments',
          enabled: true,
        },
        {
          id: 'push_updates',
          title: 'Product Updates',
          description: 'Receive notifications about new features and updates',
          enabled: false,
        },
      ],
    },
    {
      id: 'marketing',
      title: 'Marketing & Tips',
      description: 'Product news and tips',
      icon: 'solar:lightbulb-linear',
      settings: [
        {
          id: 'marketing_tips',
          title: 'Tips & Best Practices',
          description: 'Receive tips on how to get the most out of OmniFlow',
          enabled: true,
        },
        {
          id: 'marketing_newsletter',
          title: 'Newsletter',
          description: 'Monthly newsletter with product updates and industry insights',
          enabled: false,
        },
        {
          id: 'marketing_events',
          title: 'Events & Webinars',
          description: 'Invitations to exclusive webinars and events',
          enabled: false,
        },
      ],
    },
  ]);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            settings: cat.settings.map((setting) => ({
              ...setting,
              enabled: parsed[setting.id] ?? setting.enabled,
            })),
          }))
        );
      } catch (e) {
        console.error('Failed to parse notification preferences');
      }
    }
  }, []);

  const toggleSetting = (categoryId: string, settingId: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
            ...cat,
            settings: cat.settings.map((setting) =>
              setting.id === settingId
                ? { ...setting, enabled: !setting.enabled }
                : setting
            ),
          }
          : cat
      )
    );
    setHasChanges(true);
  };

  const toggleAllInCategory = (categoryId: string, enabled: boolean) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
            ...cat,
            settings: cat.settings.map((setting) => ({ ...setting, enabled })),
          }
          : cat
      )
    );
    setHasChanges(true);
  };

  const getCategoryStatus = (category: NotificationCategory) => {
    const enabledCount = category.settings.filter((s) => s.enabled).length;
    if (enabledCount === 0) return 'none';
    if (enabledCount === category.settings.length) return 'all';
    return 'some';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      const prefs: Record<string, boolean> = {};
      categories.forEach((cat) => {
        cat.settings.forEach((setting) => {
          prefs[setting.id] = setting.enabled;
        });
      });
      localStorage.setItem('notificationPreferences', JSON.stringify(prefs));

      // In a real app, you would also save to the database here
      // await saveNotificationPreferences({ userId: appUser?.uid, preferences: prefs });

      toast({ title: 'Notification preferences saved' });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Notifications
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            Choose how you want to be notified about activity
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-9">
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-linear" className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setCategories((prev) =>
              prev.map((cat) => ({
                ...cat,
                settings: cat.settings.map((s) => ({ ...s, enabled: true })),
              }))
            );
            setHasChanges(true);
          }}
        >
          <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5 mr-1.5" />
          Enable All
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setCategories((prev) =>
              prev.map((cat) => ({
                ...cat,
                settings: cat.settings.map((s) => ({ ...s, enabled: false })),
              }))
            );
            setHasChanges(true);
          }}
        >
          <Icon icon="solar:close-circle-linear" className="h-3.5 w-3.5 mr-1.5" />
          Disable All
        </Button>
      </div>

      {/* Notification Categories */}
      {categories.map((category) => {
        const status = getCategoryStatus(category);
        return (
          <SettingsCard
            key={category.id}
            title={category.title}
            description={category.description}
            icon={category.icon}
            headerAction={
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md',
                    status === 'all'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : status === 'some'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-500'
                  )}
                >
                  {status === 'all'
                    ? 'All On'
                    : status === 'some'
                      ? `${category.settings.filter((s) => s.enabled).length}/${category.settings.length}`
                      : 'Off'}
                </span>
                <Switch
                  checked={status === 'all'}
                  onCheckedChange={(checked) => toggleAllInCategory(category.id, checked)}
                />
              </div>
            }
          >
            <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {category.settings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {setting.title}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
                      {setting.description}
                    </p>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => toggleSetting(category.id, setting.id)}
                  />
                </div>
              ))}
            </div>
          </SettingsCard>
        );
      })}

      {/* Email Delivery Info */}
      <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Email delivery address
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
              All email notifications will be sent to{' '}
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {appUser?.email || 'your registered email'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
