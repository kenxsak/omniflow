"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  getJustDialSettingsAction,
  saveJustDialSettingsAction,
  generateJustDialKeyAction,
  getJustDialStatsAction,
} from '@/app/actions/justdial-actions';
import type { JustDialSettings } from '@/types/justdial';

export default function JustDialSettingsPage() {
  const [settings, setSettings] = useState<JustDialSettings | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [stats, setStats] = useState({ totalLeads: 0, thisMonth: 0, lastSync: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const { toast } = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    loadSettings();
  }, [appUser?.idToken]);

  async function loadSettings() {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const [settingsResult, statsResult] = await Promise.all([
        getJustDialSettingsAction({ idToken: appUser.idToken }),
        getJustDialStatsAction({ idToken: appUser.idToken }),
      ]);

      if (settingsResult.success && settingsResult.settings) {
        setSettings(settingsResult.settings);
        setWebhookUrl(settingsResult.webhookUrl || '');
      }
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ title: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!appUser?.idToken || !settings) return;
    
    setIsSaving(true);
    try {
      const result = await saveJustDialSettingsAction({
        idToken: appUser.idToken,
        settings,
      });

      if (result.success) {
        toast({ title: 'Settings saved successfully' });
      } else {
        toast({ title: result.error || 'Failed to save', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateKey() {
    if (!appUser?.idToken) return;
    
    try {
      const result = await generateJustDialKeyAction({ idToken: appUser.idToken });
      if (result.success && result.apiKey) {
        setSettings(prev => prev ? { ...prev, apiKey: result.apiKey! } : null);
        toast({ title: 'New API key generated' });
      } else {
        toast({ title: result.error || 'Failed to generate key', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to generate key', variant: 'destructive' });
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  }

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon icon="mdi:phone-search" className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">JustDial Integration</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Auto-sync leads from JustDial to your CRM
            </p>
          </div>
        </div>
        <Badge variant={settings?.enabled ? 'default' : 'secondary'} className="w-fit">
          {settings?.enabled ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="solar:users-group-rounded-bold" className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
              <p className="text-lg font-semibold">{stats.totalLeads}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Icon icon="solar:calendar-bold" className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-lg font-semibold">{stats.thisMonth}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Icon icon="solar:refresh-bold" className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium truncate">
                {stats.lastSync ? new Date(stats.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Enable/Disable */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Enable Integration</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Automatically receive leads from JustDial
              </CardDescription>
            </div>
            <Switch
              checked={settings?.enabled || false}
              onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, enabled: checked } : null)}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Webhook URL */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Webhook URL</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Add this URL in your JustDial business settings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              readOnly
              className="h-9 sm:h-10 text-sm font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(webhookUrl)}
              className="h-9 sm:h-10 px-3"
            >
              <Icon icon="solar:copy-linear" className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Contact JustDial support to enable webhook integration for your business listing
          </p>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base sm:text-lg">API Key (Optional)</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Secure your webhook with an API key
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                value={settings?.apiKey || ''}
                readOnly
                placeholder="No API key set"
                className="h-9 sm:h-10 text-sm font-mono pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <Icon icon={showKey ? 'solar:eye-closed-linear' : 'solar:eye-linear'} className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => settings?.apiKey && copyToClipboard(settings.apiKey)}
              disabled={!settings?.apiKey}
              className="h-9 sm:h-10 px-3"
            >
              <Icon icon="solar:copy-linear" className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateKey} className="h-8 text-xs">
            <Icon icon="solar:refresh-linear" className="w-3 h-3 mr-1" />
            Generate New Key
          </Button>
        </CardContent>
      </Card>

      {/* Lead Settings */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base sm:text-lg">Lead Settings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure how JustDial leads are handled
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-create leads</Label>
              <p className="text-xs text-muted-foreground">Automatically add leads to your CRM</p>
            </div>
            <Switch
              checked={settings?.autoCreateLead || false}
              onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, autoCreateLead: checked } : null)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Notify on new lead</Label>
              <p className="text-xs text-muted-foreground">Get notified when a new lead arrives</p>
            </div>
            <Switch
              checked={settings?.notifyOnNewLead || false}
              onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, notifyOnNewLead: checked } : null)}
            />
          </div>

          {settings?.notifyOnNewLead && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Notification Email</Label>
                <Input
                  type="email"
                  value={settings?.notifyEmail || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, notifyEmail: e.target.value } : null)}
                  placeholder="your@email.com"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">WhatsApp Number</Label>
                <Input
                  type="tel"
                  value={settings?.notifyWhatsApp || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, notifyWhatsApp: e.target.value } : null)}
                  placeholder="+91 98765 43210"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
        >
          {isSaving ? (
            <>
              <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 mr-1.5" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
