'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAIVoiceWidgetSettings, saveAIVoiceWidgetSettings, type AIVoiceWidgetSettings } from '@/app/actions/ai-voice-widget-actions';

const DEFAULT_SETTINGS: AIVoiceWidgetSettings = {
  // Sales Widget (Homepage)
  salesWidget: {
    enabled: false,
    embedCode: '',
    position: 'bottom-right',
    welcomeMessage: 'Hi! I\'m your AI sales assistant. How can I help you learn about OmniFlow today?',
    primaryColor: '#7c3aed',
  },
  // Support Widget (Help Center)
  supportWidget: {
    enabled: false,
    embedCode: '',
    position: 'bottom-right',
    welcomeMessage: 'Hello! I\'m here to help you with any questions about using OmniFlow.',
    primaryColor: '#3b82f6',
  },
};

export default function AIVoiceWidgetsPage() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AIVoiceWidgetSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await getAIVoiceWidgetSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveAIVoiceWidgetSettings(settings);
      if (result.success) {
        toast({ title: 'Settings Saved', description: 'AI Voice Widget settings have been updated.' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <Icon icon="solar:lock-linear" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Only Super Admins can access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">AI Voice Widgets</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Configure AI voice assistants for sales (website) and support (help center)
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <Icon icon="solar:microphone-3-bold" className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-violet-900 dark:text-violet-100">How it works</h3>
              <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                Paste your AI voice widget embed code (from ElevenLabs, Vapi, Voiceflow, etc.) and we'll display it on the appropriate pages. 
                The Sales widget appears on the public homepage, while the Support widget appears in the Help Center for logged-in users.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="sales" className="text-xs sm:text-sm">
            <Icon icon="solar:shop-2-linear" className="w-4 h-4 mr-1.5" />
            Sales Widget
          </TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm">
            <Icon icon="solar:headphones-round-linear" className="w-4 h-4 mr-1.5" />
            Support Widget
          </TabsTrigger>
        </TabsList>

        {/* Sales Widget Tab */}
        <TabsContent value="sales" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Icon icon="solar:shop-2-bold" className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Sales AI Assistant</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Appears on the public homepage for website visitors
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.salesWidget.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      salesWidget: { ...prev.salesWidget, enabled: checked }
                    }))}
                  />
                  <Badge variant={settings.salesWidget.enabled ? 'default' : 'secondary'} className="text-xs">
                    {settings.salesWidget.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Embed Code</Label>
                <Textarea
                  value={settings.salesWidget.embedCode}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    salesWidget: { ...prev.salesWidget, embedCode: e.target.value }
                  }))}
                  placeholder="Paste your AI voice widget embed code here (e.g., from ElevenLabs, Vapi, Voiceflow)"
                  className="min-h-[120px] text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  This code will be injected into the homepage. Supports script tags and iframe embeds.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Welcome Message (Optional)</Label>
                <Input
                  value={settings.salesWidget.welcomeMessage}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    salesWidget: { ...prev.salesWidget, welcomeMessage: e.target.value }
                  }))}
                  placeholder="Hi! How can I help you today?"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Icon icon="solar:info-circle-linear" className="w-4 h-4 shrink-0" />
                  <span>This widget will help convert website visitors into leads by answering product questions.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Widget Tab */}
        <TabsContent value="support" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Icon icon="solar:headphones-round-bold" className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Support AI Assistant</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Appears in the Help Center for logged-in users
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.supportWidget.enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      supportWidget: { ...prev.supportWidget, enabled: checked }
                    }))}
                  />
                  <Badge variant={settings.supportWidget.enabled ? 'default' : 'secondary'} className="text-xs">
                    {settings.supportWidget.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Embed Code</Label>
                <Textarea
                  value={settings.supportWidget.embedCode}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    supportWidget: { ...prev.supportWidget, embedCode: e.target.value }
                  }))}
                  placeholder="Paste your AI voice widget embed code here (e.g., from ElevenLabs, Vapi, Voiceflow)"
                  className="min-h-[120px] text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  This code will be injected into the Help Center page for logged-in users.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Welcome Message (Optional)</Label>
                <Input
                  value={settings.supportWidget.welcomeMessage}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    supportWidget: { ...prev.supportWidget, welcomeMessage: e.target.value }
                  }))}
                  placeholder="Hello! How can I help you today?"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Icon icon="solar:info-circle-linear" className="w-4 h-4 shrink-0" />
                  <span>This widget will help users get instant support without waiting for ticket responses.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-10">
          {isSaving ? (
            <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Icon icon="solar:diskette-bold" className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Provider Suggestions */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-sm sm:text-base">Recommended AI Voice Providers</CardTitle>
          <CardDescription className="text-xs">
            Popular services that provide embeddable AI voice widgets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'ElevenLabs', desc: 'Realistic AI voices', url: 'https://elevenlabs.io', icon: '🎙️' },
              { name: 'Vapi', desc: 'Voice AI for developers', url: 'https://vapi.ai', icon: '🤖' },
              { name: 'Voiceflow', desc: 'Conversational AI platform', url: 'https://voiceflow.com', icon: '💬' },
              { name: 'Bland AI', desc: 'AI phone agents', url: 'https://bland.ai', icon: '📞' },
            ].map((provider) => (
              <a
                key={provider.name}
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
              >
                <span className="text-xl">{provider.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.desc}</p>
                </div>
                <Icon icon="solar:arrow-right-up-linear" className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
