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
      <div className="flex items-center justify-center h-48">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-muted-foreground" />
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
      name: 'WMart CPaaS',
      description: 'India WhatsApp provider',
      icon: 'solar:chat-round-dots-bold',
      badge: 'Primary',
      url: 'https://cpaas.wmart.in',
      envVars: [
        { key: 'AUTHKEY_API_KEY', desc: 'API Key' },
      ],
    },
    {
      id: 'aisensy',
      name: 'AiSensy',
      description: 'WhatsApp marketing',
      icon: 'solar:chat-round-dots-bold',
      url: 'https://aisensy.com',
      envVars: [
        { key: 'AISENSY_API_KEY', desc: 'API Key' },
        { key: 'AISENSY_CAMPAIGN_NAME', desc: 'Campaign Name' },
      ],
    },
    {
      id: 'gupshup',
      name: 'Gupshup',
      description: 'Conversational messaging',
      icon: 'solar:chat-round-dots-bold',
      url: 'https://www.gupshup.io',
      envVars: [
        { key: 'GUPSHUP_API_KEY', desc: 'API Key' },
        { key: 'GUPSHUP_APP_NAME', desc: 'App Name' },
      ],
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold">WhatsApp Setup</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Configure WhatsApp for platform notifications
        </p>
      </div>

      {/* Purpose Alert */}
      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs">
              <p className="font-medium text-amber-900 dark:text-amber-100">Platform communications only</p>
              <p className="text-amber-800 dark:text-amber-200 mt-0.5">
                Users configure their own WhatsApp in Integrations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Icon icon="logos:whatsapp-icon" className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">WhatsApp Business API</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Multiple providers supported. CPaaS primary, AiSensy secondary, Gupshup tertiary.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="secondary" className="text-[9px] sm:text-[10px]">Bulk Messaging</Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px]">Templates</Badge>
                <Badge variant="secondary" className="text-[9px] sm:text-[10px]">Automation</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="space-y-2 sm:space-y-3">
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Icon icon={provider.icon} className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-xs sm:text-sm">{provider.name}</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs">{provider.description}</CardDescription>
                  </div>
                </div>
                {provider.badge && (
                  <Badge variant="outline" className="text-[9px] text-green-600 border-green-500/30 shrink-0">
                    {provider.badge}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Accordion type="single" collapsible>
                <AccordionItem value="setup" className="border-none">
                  <AccordionTrigger className="text-[11px] sm:text-xs py-2">Setup</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto">
                      <a href={provider.url} target="_blank" rel="noopener noreferrer">
                        <Icon icon="solar:link-round-linear" className="h-3.5 w-3.5 mr-1.5" />
                        Open {provider.name}
                      </a>
                    </Button>

                    <div className="space-y-1.5">
                      <div className="text-[10px] sm:text-xs font-medium">Environment Variables:</div>
                      <div className="p-2 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-1.5">
                        {provider.envVars.map(env => (
                          <div key={env.key} className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <code className="text-[9px] sm:text-[10px]">{env.key}</code>
                              <span className="text-[9px] text-muted-foreground ml-1">({env.desc})</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(env.key, 'Variable')}>
                              <Icon icon="solar:copy-linear" className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {provider.webhookUrl && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] sm:text-xs font-medium">Webhook URL:</div>
                        <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900 rounded">
                          <code className="text-[9px] sm:text-[10px] flex-1 break-all">{provider.webhookUrl}</code>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(provider.webhookUrl!, 'Webhook URL')}>
                            <Icon icon="solar:copy-linear" className="h-3 w-3" />
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
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Icon icon="logos:meta-icon" className="h-4 w-4 sm:h-5 sm:w-5" />
            Meta WhatsApp - Detailed Setup
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Official WhatsApp Business API</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</div>
                  Create Meta Business Account
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <ol className="text-[10px] sm:text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://business.facebook.com" target="_blank" className="text-primary hover:underline">business.facebook.com</a></li>
                  <li>Create Business Account</li>
                  <li>Verify your business</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</div>
                  Create WhatsApp Business App
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <ol className="text-[10px] sm:text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" className="text-primary hover:underline">developers.facebook.com</a></li>
                  <li>Create App → Select "Business"</li>
                  <li>Add "WhatsApp" product</li>
                  <li>Link Business Account</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">3</div>
                  Configure Webhook
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">In WhatsApp → Configuration → Webhook:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900 rounded text-[10px]">
                    <span className="font-medium w-16 shrink-0">URL:</span>
                    <code className="flex-1 break-all">{appUrl}/api/webhooks/meta-whatsapp</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard(`${appUrl}/api/webhooks/meta-whatsapp`, 'Webhook URL')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-stone-50 dark:bg-stone-900 rounded text-[10px]">
                    <span className="font-medium w-16 shrink-0">Token:</span>
                    <code className="flex-1">omniflow_whatsapp_verify</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard('omniflow_whatsapp_verify', 'Verify Token')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Environment Variables Summary */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">All Environment Variables</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Add to Vercel → Settings → Environment Variables</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="p-2 sm:p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-0.5 font-mono text-[9px] sm:text-[10px] overflow-x-auto">
            <div className="text-muted-foreground"># Meta WhatsApp</div>
            <div>META_WHATSAPP_PHONE_ID=</div>
            <div>META_WHATSAPP_ACCESS_TOKEN=</div>
            <div className="pt-1.5 text-muted-foreground"># CPaaS (Primary)</div>
            <div>AUTHKEY_API_KEY=</div>
            <div className="pt-1.5 text-muted-foreground"># AiSensy (Secondary)</div>
            <div>AISENSY_API_KEY=</div>
            <div className="pt-1.5 text-muted-foreground"># Gupshup (Tertiary)</div>
            <div>GUPSHUP_API_KEY=</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
