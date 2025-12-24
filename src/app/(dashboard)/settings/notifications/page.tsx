'use client';

import { Icon } from '@iconify/react';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { SettingsCard } from '@/components/settings/settings-ui';

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
      {/* Page Actions */}
      <div className="flex items-center justify-end">
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8">
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        )}
      </div>

      {/* Quick Actions & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            Disable All
          </Button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Icon icon="solar:letter-linear" className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Emails sent to <span className="font-medium text-foreground">{appUser?.email || 'your email'}</span>
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((category) => {
          const status = getCategoryStatus(category);
          return (
            <SettingsCard
              key={category.id}
              title={category.title}
              description={category.description}
              icon={category.icon}
              action={
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium text-muted-foreground">
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
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {category.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium">{setting.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
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
      </div>
    </div>
  );
}
