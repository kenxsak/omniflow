'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveAICallingConfig, getAICallingConfig } from '@/app/actions/ai-calling-actions';

// Bland.ai voice options
const BLAND_VOICES = [
  { id: 'maya', name: 'Maya', description: 'Friendly female voice' },
  { id: 'josh', name: 'Josh', description: 'Professional male voice' },
  { id: 'matt', name: 'Matt', description: 'Casual male voice' },
  { id: 'ryan', name: 'Ryan', description: 'Energetic male voice' },
  { id: 'tina', name: 'Tina', description: 'Warm female voice' },
];

// Script templates
const SCRIPT_TEMPLATES = [
  {
    id: 'sales_followup',
    name: 'Sales Follow-up',
    script: `You are a friendly sales representative from {{company_name}}. You're calling {{lead_name}} to follow up on their recent inquiry about our products/services.

Your goals:
1. Greet them warmly and introduce yourself
2. Ask if they have any questions about {{product_service}}
3. Understand their needs and timeline
4. Schedule a demo or meeting if interested
5. Thank them for their time

Key information:
- Company: {{company_name}}
- Product/Service: {{product_service}}
- Special offer: {{special_offer}}

Be conversational, helpful, and never pushy. If they're not interested, thank them politely and end the call.`,
  },
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    script: `You are calling from {{company_name}} to remind {{lead_name}} about their upcoming appointment.

Your goals:
1. Confirm the appointment date and time
2. Ask if they need to reschedule
3. Provide any preparation instructions
4. Answer basic questions

Appointment details:
- Date: {{appointment_date}}
- Time: {{appointment_time}}
- Location/Link: {{appointment_location}}

Be brief and professional. If they need to reschedule, offer to help find a new time.`,
  },
  {
    id: 'customer_feedback',
    name: 'Customer Feedback',
    script: `You are calling from {{company_name}} to gather feedback from {{lead_name}} about their recent experience with us.

Your goals:
1. Thank them for being a customer
2. Ask about their overall satisfaction (1-10)
3. Ask what we did well
4. Ask what we could improve
5. Thank them for their feedback

Be warm and appreciative. Listen actively and acknowledge their feedback. Keep the call under 5 minutes.`,
  },
];

export default function AICallingSettingsPage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState({
    enabled: true,
    defaultProvider: 'bland' as 'bland' | 'vapi',
    companyName: '',
    productService: '',
    specialOffer: '',
    defaultScript: '',
    voice: 'maya',
    maxCallDuration: 300, // 5 minutes
    webhookEnabled: true,
    recordCalls: true,
    language: 'en',
  });

  useEffect(() => {
    loadConfig();
  }, [company?.id]);

  const loadConfig = async () => {
    if (!company?.id) return;
    setIsLoading(true);
    try {
      const result = await getAICallingConfig(company.id);
      if (result.success && result.config) {
        setConfig(prev => ({ ...prev, ...result.config }));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!company?.id) return;
    setIsSaving(true);
    try {
      const result = await saveAICallingConfig(company.id, config);
      if (result.success) {
        toast({ title: 'Settings Saved', description: 'AI calling configuration updated successfully.' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const applyTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    let script = template.script;
    script = script.replace(/\{\{company_name\}\}/g, config.companyName || '[Your Company]');
    script = script.replace(/\{\{product_service\}\}/g, config.productService || '[Your Product/Service]');
    script = script.replace(/\{\{special_offer\}\}/g, config.specialOffer || '[Current Offer]');
    setConfig(prev => ({ ...prev, defaultScript: script }));
    toast({ title: 'Template Applied', description: `${template.name} template loaded. Customize it for your needs.` });
  };

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/bland`
    : '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">AI Calling Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Configure your AI voice agent for automated phone calls
        </p>
      </div>

      <Tabs defaultValue="script" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="script" className="text-xs">Script</TabsTrigger>
          <TabsTrigger value="voice" className="text-xs">Voice & Settings</TabsTrigger>
          <TabsTrigger value="webhook" className="text-xs">Webhook</TabsTrigger>
        </TabsList>

        {/* Script Configuration */}
        <TabsContent value="script" className="space-y-4">
          {/* Business Info Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:buildings-2-linear" className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                This info will be used in your AI call scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Name</Label>
                  <Input
                    value={config.companyName}
                    onChange={(e) => setConfig(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Acme Solutions"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Product/Service</Label>
                  <Input
                    value={config.productService}
                    onChange={(e) => setConfig(prev => ({ ...prev, productService: e.target.value }))}
                    placeholder="e.g., CRM Software, Marketing Services"
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Special Offer (Optional)</Label>
                <Input
                  value={config.specialOffer}
                  onChange={(e) => setConfig(prev => ({ ...prev, specialOffer: e.target.value }))}
                  placeholder="e.g., 20% off for new customers this month"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Script Templates */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:document-text-linear" className="h-5 w-5" />
                Script Templates
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Start with a template and customize it
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SCRIPT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors text-left"
                  >
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {template.script.substring(0, 80)}...
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Script */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:pen-new-square-linear" className="h-5 w-5" />
                AI Agent Script
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Define what your AI agent should say and do during calls
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              <Textarea
                value={config.defaultScript}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultScript: e.target.value }))}
                placeholder="Enter your AI agent's script and instructions here...

Example:
You are a friendly sales representative from [Company]. Your goal is to:
1. Greet the customer warmly
2. Ask about their needs
3. Explain how our product can help
4. Answer questions
5. Schedule a follow-up if interested"
                className="min-h-[250px] text-sm font-mono"
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                <span>Use {"{{lead_name}}"} to personalize with the contact's name</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice & Settings */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:microphone-3-linear" className="h-5 w-5" />
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">AI Voice</Label>
                <Select
                  value={config.voice}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, voice: value }))}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLAND_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <span>{voice.name}</span>
                          <span className="text-[10px] text-muted-foreground">- {voice.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Max Call Duration (seconds)</Label>
                <Input
                  type="number"
                  value={config.maxCallDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxCallDuration: parseInt(e.target.value) || 300 }))}
                  min={60}
                  max={1800}
                  className="h-9 sm:h-10 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  {Math.floor(config.maxCallDuration / 60)} minutes max per call
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">Record Calls</Label>
                  <p className="text-[10px] text-muted-foreground">Save call recordings for review</p>
                </div>
                <Switch
                  checked={config.recordCalls}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, recordCalls: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Configuration */}
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:link-linear" className="h-5 w-5" />
                Bland.ai Webhook
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Receive call transcripts and recordings automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Setup Instructions
                </h4>
                <ol className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    Go to <a href="https://app.bland.ai/dashboard?page=webhooks" target="_blank" rel="noopener" className="underline">Bland.ai Webhooks</a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    Click "Add Webhook"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    Paste this URL and enable all events:
                  </li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="h-9 sm:h-10 text-sm font-mono bg-muted/50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 sm:h-10 px-3"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast({ title: 'Copied!', description: 'Webhook URL copied to clipboard' });
                    }}
                  >
                    <Icon icon="solar:copy-linear" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">Enable Webhook</Label>
                  <p className="text-[10px] text-muted-foreground">Receive call data in Omniflow</p>
                </div>
                <Switch
                  checked={config.webhookEnabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, webhookEnabled: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="h-9 sm:h-10">
          {isSaving && <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
