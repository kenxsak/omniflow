'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function WhatsAppSetupPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniflow-xi.vercel.app';

  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const providers = [
    {
      id: 'meta',
      name: 'Meta WhatsApp Cloud API',
      description: 'Official WhatsApp Business API',
      icon: 'logos:whatsapp-icon',
      color: 'green',
      badge: 'Official',
      url: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
      envVars: [
        { key: 'META_WHATSAPP_PHONE_ID', desc: 'Phone Number ID' },
        { key: 'META_WHATSAPP_ACCESS_TOKEN', desc: 'Access Token' },
        { key: 'META_WHATSAPP_BUSINESS_ACCOUNT_ID', desc: 'Business Account ID' },
      ],
      webhookUrl: `${appUrl}/api/webhooks/meta-whatsapp`,
    },
    {
      id: 'authkey',
      name: 'Authkey',
      description: 'India WhatsApp provider',
      icon: 'solar:chat-round-dots-bold',
      color: 'blue',
      badge: 'Primary',
      url: 'https://authkey.io',
      envVars: [
        { key: 'AUTHKEY_API_KEY', desc: 'API Key' },
      ],
    },
    {
      id: 'aisensy',
      name: 'AiSensy',
      description: 'WhatsApp marketing platform',
      icon: 'solar:chat-round-dots-bold',
      color: 'purple',
      url: 'https://aisensy.com',
      envVars: [
        { key: 'AISENSY_API_KEY', desc: 'API Key' },
        { key: 'AISENSY_CAMPAIGN_NAME', desc: 'Campaign Name' },
        { key: 'AISENSY_DESTINATION', desc: 'Destination' },
      ],
    },
    {
      id: 'gupshup',
      name: 'Gupshup',
      description: 'Conversational messaging',
      icon: 'solar:chat-round-dots-bold',
      color: 'orange',
      url: 'https://www.gupshup.io',
      envVars: [
        { key: 'GUPSHUP_API_KEY', desc: 'API Key' },
        { key: 'GUPSHUP_APP_NAME', desc: 'App Name' },
      ],
    },
    {
      id: 'wati',
      name: 'WATI',
      description: 'WhatsApp Team Inbox',
      icon: 'solar:chat-round-dots-bold',
      color: 'teal',
      url: 'https://www.wati.io',
      envVars: [
        { key: 'WATI_API_ENDPOINT', desc: 'API Endpoint URL' },
        { key: 'WATI_API_KEY', desc: 'API Key' },
      ],
    },
    {
      id: 'msg91',
      name: 'MSG91 WhatsApp',
      description: 'MSG91 WhatsApp channel',
      icon: 'solar:chat-round-dots-bold',
      color: 'red',
      url: 'https://msg91.com',
      envVars: [
        { key: 'MSG91_WHATSAPP_AUTH_KEY', desc: 'WhatsApp Auth Key' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Platform WhatsApp Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Configure WhatsApp for platform notifications (billing alerts, plan upgrades, important announcements)
        </p>
      </div>

      {/* Purpose Alert */}
      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">This is for platform communications only</p>
              <p className="text-amber-800 dark:text-amber-200 mt-1">
                Users will configure their own WhatsApp providers in Settings → Integrations for their marketing campaigns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon icon="logos:whatsapp-icon" className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">WhatsApp Business API</h3>
              <p className="text-sm text-muted-foreground mt-1">
                OmniFlow supports multiple WhatsApp providers. Configure at least one to enable WhatsApp messaging.
                The system uses Authkey as primary, AiSensy as secondary, and Gupshup as tertiary fallback.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">Bulk Messaging</Badge>
                <Badge variant="secondary" className="text-xs">Template Messages</Badge>
                <Badge variant="secondary" className="text-xs">Workflow Automation</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-4">
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${provider.color}-100 dark:bg-${provider.color}-900/30 flex items-center justify-center`}>
                    <Icon icon={provider.icon} className={`h-5 w-5 text-${provider.color}-600`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                </div>
                {provider.badge && (
                  <Badge variant="outline" className="text-green-600 border-green-500/30">
                    {provider.badge}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="setup" className="border-none">
                  <AccordionTrigger className="text-sm py-2">Setup Instructions</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={provider.url} target="_blank" rel="noopener noreferrer">
                          <Icon icon="solar:link-round-linear" className="h-4 w-4 mr-2" />
                          Open {provider.name}
                        </a>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Environment Variables:</div>
                      <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-2">
                        {provider.envVars.map(env => (
                          <div key={env.key} className="flex items-center justify-between">
                            <div>
                              <code className="text-xs">{env.key}</code>
                              <span className="text-xs text-muted-foreground ml-2">({env.desc})</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(env.key, 'Variable')}>
                              <Icon icon="solar:copy-linear" className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {provider.webhookUrl && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Webhook URL:</div>
                        <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900 rounded">
                          <code className="text-xs flex-1 break-all">{provider.webhookUrl}</code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(provider.webhookUrl!, 'Webhook URL')}>
                            <Icon icon="solar:copy-linear" className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meta WhatsApp Detailed Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="logos:meta-icon" className="h-5 w-5" />
            Meta WhatsApp Cloud API - Detailed Setup
          </CardTitle>
          <CardDescription>Official WhatsApp Business API from Meta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</div>
                  Create Meta Business Account
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://business.facebook.com" target="_blank" className="text-primary hover:underline">business.facebook.com</a></li>
                  <li>Create a Business Account if you don't have one</li>
                  <li>Verify your business</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</div>
                  Create WhatsApp Business App
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" className="text-primary hover:underline">developers.facebook.com</a></li>
                  <li>Create App → Select "Business" type</li>
                  <li>Add "WhatsApp" product to your app</li>
                  <li>Link your Business Account</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</div>
                  Get API Credentials
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <p className="text-sm text-muted-foreground">From WhatsApp → API Setup:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>Phone Number ID</strong> - Under "From" phone number</li>
                  <li><strong>Access Token</strong> - Generate permanent token</li>
                  <li><strong>Business Account ID</strong> - In WhatsApp Business Account settings</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step4">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</div>
                  Configure Webhook
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-3">
                <p className="text-sm text-muted-foreground">In WhatsApp → Configuration → Webhook:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900 rounded">
                    <span className="text-xs font-medium w-24">Callback URL:</span>
                    <code className="text-xs flex-1">{appUrl}/api/webhooks/meta-whatsapp</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${appUrl}/api/webhooks/meta-whatsapp`, 'Webhook URL')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900 rounded">
                    <span className="text-xs font-medium w-24">Verify Token:</span>
                    <code className="text-xs flex-1">omniflow_whatsapp_verify</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('omniflow_whatsapp_verify', 'Verify Token')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Subscribe to: messages, message_templates</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Environment Variables Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All WhatsApp Environment Variables</CardTitle>
          <CardDescription>Add to Vercel Dashboard → Settings → Environment Variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-1 font-mono text-xs">
            <div># Meta WhatsApp Cloud API</div>
            <div>META_WHATSAPP_PHONE_ID=</div>
            <div>META_WHATSAPP_ACCESS_TOKEN=</div>
            <div>META_WHATSAPP_BUSINESS_ACCOUNT_ID=</div>
            <div className="pt-2"># Authkey (Primary)</div>
            <div>AUTHKEY_API_KEY=</div>
            <div className="pt-2"># AiSensy (Secondary)</div>
            <div>AISENSY_API_KEY=</div>
            <div>AISENSY_CAMPAIGN_NAME=</div>
            <div className="pt-2"># Gupshup (Tertiary)</div>
            <div>GUPSHUP_API_KEY=</div>
            <div>GUPSHUP_APP_NAME=</div>
            <div className="pt-2"># WATI (Optional)</div>
            <div>WATI_API_ENDPOINT=</div>
            <div>WATI_API_KEY=</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
