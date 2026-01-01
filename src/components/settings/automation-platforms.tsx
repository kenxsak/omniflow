'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface AutomationPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  pricing: string;
  bestFor: string;
  region: 'global' | 'india' | 'both';
  docUrl: string;
  features: string[];
}

const AUTOMATION_PLATFORMS: AutomationPlatform[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    icon: 'simple-icons:zapier',
    color: 'orange',
    description: 'The most popular automation platform with 5000+ app integrations',
    pricing: '$29.99/mo+',
    bestFor: 'Global companies, enterprise',
    region: 'global',
    docUrl: 'https://zapier.com/apps/webhook/integrations',
    features: ['5000+ apps', 'Easy to use', 'Multi-step Zaps', 'Filters & formatters'],
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    icon: 'simple-icons:integromat',
    color: 'violet',
    description: 'Visual automation builder with powerful data transformation',
    pricing: 'Free tier + $9/mo',
    bestFor: 'Technical users, complex workflows',
    region: 'global',
    docUrl: 'https://www.make.com/en/help/tools/webhooks',
    features: ['Visual builder', 'Complex logic', 'Data mapping', 'Error handling'],
  },
  {
    id: 'n8n',
    name: 'n8n',
    icon: 'simple-icons:n8n',
    color: 'rose',
    description: 'Open-source workflow automation - self-host for free',
    pricing: 'Free (self-hosted)',
    bestFor: 'Developers, privacy-focused',
    region: 'global',
    docUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/',
    features: ['Self-hosted', 'Open source', 'Full control', 'No limits'],
  },
  {
    id: 'pabbly',
    name: 'Pabbly Connect',
    icon: 'solar:link-round-bold',
    color: 'blue',
    description: 'Indian automation platform with lifetime deals - best value for Indian businesses',
    pricing: '₹1,999/mo (lifetime deals available)',
    bestFor: 'Indian SMEs, cost-conscious',
    region: 'india',
    docUrl: 'https://www.pabbly.com/connect/',
    features: ['Lifetime deals', 'Indian support', 'Unlimited workflows', 'No task limits'],
  },
  {
    id: 'integrately',
    name: 'Integrately',
    icon: 'solar:bolt-circle-bold',
    color: 'cyan',
    description: 'One-click automations with pre-built templates',
    pricing: '$19.99/mo',
    bestFor: 'Non-technical users',
    region: 'both',
    docUrl: 'https://integrately.com/',
    features: ['1-click setup', '8M+ automations', 'Pre-built templates', 'Easy UI'],
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  orange: { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', light: 'bg-orange-50 dark:bg-orange-950/30' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', light: 'bg-violet-50 dark:bg-violet-950/30' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', light: 'bg-rose-50 dark:bg-rose-950/30' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', light: 'bg-blue-50 dark:bg-blue-950/30' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', light: 'bg-cyan-50 dark:bg-cyan-950/30' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', light: 'bg-amber-50 dark:bg-amber-950/30' },
};

interface WebhookEndpoint {
  id: string;
  name: string;
  method: 'POST' | 'GET';
  path: string;
  description: string;
  triggerType: 'incoming' | 'outgoing';
  payloadExample: object;
}

const WEBHOOK_ENDPOINTS: WebhookEndpoint[] = [
  {
    id: 'new-lead',
    name: 'New Lead Created',
    method: 'POST',
    path: '/api/webhooks/triggers/new-lead',
    description: 'Triggered when a new lead is added to your CRM',
    triggerType: 'outgoing',
    payloadExample: {
      event: 'lead.created',
      data: {
        id: 'lead_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+919876543210',
        source: 'website',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  },
  {
    id: 'lead-updated',
    name: 'Lead Status Changed',
    method: 'POST',
    path: '/api/webhooks/triggers/lead-updated',
    description: 'Triggered when a lead status or stage changes',
    triggerType: 'outgoing',
    payloadExample: {
      event: 'lead.updated',
      data: {
        id: 'lead_123',
        previousStatus: 'new',
        newStatus: 'qualified',
        updatedAt: '2024-01-15T11:00:00Z',
      },
    },
  },
  {
    id: 'appointment-booked',
    name: 'Appointment Booked',
    method: 'POST',
    path: '/api/webhooks/triggers/appointment-booked',
    description: 'Triggered when a new appointment is scheduled',
    triggerType: 'outgoing',
    payloadExample: {
      event: 'appointment.created',
      data: {
        id: 'apt_456',
        leadId: 'lead_123',
        dateTime: '2024-01-20T14:00:00Z',
        duration: 30,
        type: 'consultation',
      },
    },
  },
  {
    id: 'create-lead',
    name: 'Create Lead',
    method: 'POST',
    path: '/api/webhooks/actions/create-lead',
    description: 'Create a new lead in your CRM from external apps',
    triggerType: 'incoming',
    payloadExample: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+919876543210',
      source: 'zapier',
      notes: 'From Facebook Lead Ad',
    },
  },
  {
    id: 'update-lead',
    name: 'Update Lead',
    method: 'POST',
    path: '/api/webhooks/actions/update-lead',
    description: 'Update an existing lead in your CRM',
    triggerType: 'incoming',
    payloadExample: {
      leadId: 'lead_123',
      status: 'qualified',
      notes: 'Interested in Pro plan',
    },
  },
  {
    id: 'send-email',
    name: 'Send Email',
    method: 'POST',
    path: '/api/webhooks/actions/send-email',
    description: 'Send an email to a lead via your configured email provider',
    triggerType: 'incoming',
    payloadExample: {
      to: 'customer@example.com',
      subject: 'Welcome to our service',
      body: 'Thank you for signing up!',
      templateId: 'welcome_email',
    },
  },
  {
    id: 'send-sms',
    name: 'Send SMS',
    method: 'POST',
    path: '/api/webhooks/actions/send-sms',
    description: 'Send an SMS to a lead via MSG91/Fast2SMS',
    triggerType: 'incoming',
    payloadExample: {
      to: '+919876543210',
      message: 'Your appointment is confirmed for tomorrow at 2 PM',
    },
  },
  {
    id: 'send-whatsapp',
    name: 'Send WhatsApp',
    method: 'POST',
    path: '/api/webhooks/actions/send-whatsapp',
    description: 'Send a WhatsApp message via your configured provider',
    triggerType: 'incoming',
    payloadExample: {
      to: '+919876543210',
      templateName: 'appointment_reminder',
      variables: ['John', 'Tomorrow 2 PM'],
    },
  },
];

export function AutomationPlatforms() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const apiKey = appUser?.companyId ? `omni_${appUser.companyId.slice(0, 8)}_live` : 'omni_your_api_key';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: 'Copied!', description: 'Copied to clipboard' });
    });
  };

  const incomingEndpoints = WEBHOOK_ENDPOINTS.filter(e => e.triggerType === 'incoming');
  const outgoingEndpoints = WEBHOOK_ENDPOINTS.filter(e => e.triggerType === 'outgoing');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Automation Platforms</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Connect OmniFlow with 5000+ apps via Zapier, Make, Pabbly, and more
          </p>
        </div>
        <Badge className="w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          <Icon icon="solar:verified-check-bold" className="w-3 h-3 mr-1" />
          API Ready
        </Badge>
      </div>

      {/* API Key Card */}
      <Card className="border-2 border-violet-200 dark:border-violet-800">
        <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b border-violet-200 dark:border-violet-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Icon icon="solar:key-minimalistic-bold" className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base">Your API Key</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use this key to authenticate requests from Zapier, Make, Pabbly, etc.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 text-xs sm:text-sm bg-stone-900 text-violet-400 p-3 rounded-xl font-mono break-all border border-stone-700">
              {apiKey}
            </code>
            <Button
              size="sm"
              onClick={() => handleCopy(apiKey, 'api-key')}
              className={cn(
                'h-10 sm:h-auto shrink-0',
                copiedId === 'api-key' ? 'bg-green-500' : 'bg-violet-600 hover:bg-violet-700'
              )}
            >
              <Icon icon={copiedId === 'api-key' ? 'solar:check-circle-bold' : 'solar:copy-linear'} className="h-4 w-4 mr-1.5" />
              {copiedId === 'api-key' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Add this as <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">Authorization: Bearer {'{api_key}'}</code> header in your requests
          </p>
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Icon icon="solar:widget-5-linear" className="w-4 h-4 text-muted-foreground" />
          Supported Platforms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AUTOMATION_PLATFORMS.map((platform) => {
            const colors = colorClasses[platform.color];
            return (
              <Card key={platform.id} className={cn('hover:shadow-md transition-shadow', colors.border)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', colors.bg)}>
                      <Icon icon={platform.icon} className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{platform.name}</h4>
                        {platform.region === 'india' && (
                          <Badge className="text-[9px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                            🇮🇳 India
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{platform.pricing}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{platform.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {platform.features.slice(0, 3).map((feature, i) => (
                      <span key={i} className={cn('text-[10px] px-2 py-0.5 rounded-full', colors.light, colors.text)}>
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs">
                    <a href={platform.docUrl} target="_blank" rel="noopener noreferrer">
                      <Icon icon="solar:document-text-linear" className="w-3 h-3 mr-1.5" />
                      Setup Guide
                      <Icon icon="solar:arrow-right-up-linear" className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Webhook Endpoints */}
      <Tabs defaultValue="triggers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="triggers" className="text-xs sm:text-sm">
            <Icon icon="solar:arrow-right-up-linear" className="w-4 h-4 mr-1.5" />
            Triggers (Outgoing)
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs sm:text-sm">
            <Icon icon="solar:arrow-left-down-linear" className="w-4 h-4 mr-1.5" />
            Actions (Incoming)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground mb-3">
            These webhooks send data FROM OmniFlow TO your automation platform when events occur.
          </p>
          {outgoingEndpoints.map((endpoint) => (
            <WebhookEndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              baseUrl={baseUrl}
              isExpanded={expandedEndpoint === endpoint.id}
              onToggle={() => setExpandedEndpoint(expandedEndpoint === endpoint.id ? null : endpoint.id)}
              onCopy={handleCopy}
              copiedId={copiedId}
            />
          ))}
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground mb-3">
            These webhooks receive data FROM your automation platform TO OmniFlow to perform actions.
          </p>
          {incomingEndpoints.map((endpoint) => (
            <WebhookEndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              baseUrl={baseUrl}
              isExpanded={expandedEndpoint === endpoint.id}
              onToggle={() => setExpandedEndpoint(expandedEndpoint === endpoint.id ? null : endpoint.id)}
              onCopy={handleCopy}
              copiedId={copiedId}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Quick Setup Guide */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 sm:p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Icon icon="solar:rocket-2-bold" className="w-4 h-4 text-blue-600" />
            Quick Setup for Zapier/Pabbly
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { step: 1, title: 'Create Zap/Workflow', desc: 'Start a new automation' },
              { step: 2, title: 'Choose Webhook', desc: 'Select "Webhooks by Zapier" or similar' },
              { step: 3, title: 'Paste URL', desc: 'Copy endpoint URL from above' },
              { step: 4, title: 'Add API Key', desc: 'Add Authorization header' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-2 p-3 rounded-lg bg-white/60 dark:bg-stone-900/40 border border-blue-200/50 dark:border-blue-800/50">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {item.step}
                </span>
                <div>
                  <p className="text-xs font-medium">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Link */}
      <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
        <Icon icon="solar:question-circle-linear" className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Need help setting up automations?</span>
        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
          <Link href="/help-center">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}

function WebhookEndpointCard({
  endpoint,
  baseUrl,
  isExpanded,
  onToggle,
  onCopy,
  copiedId,
}: {
  endpoint: WebhookEndpoint;
  baseUrl: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  const fullUrl = `${baseUrl}${endpoint.path}`;
  const isIncoming = endpoint.triggerType === 'incoming';

  return (
    <div className={cn(
      'rounded-xl border transition-all overflow-hidden',
      isExpanded 
        ? (isIncoming ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20')
        : 'border-stone-200 dark:border-stone-800'
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center text-white',
            isIncoming ? 'bg-emerald-500' : 'bg-blue-500'
          )}>
            <Icon icon={isIncoming ? 'solar:arrow-left-down-bold' : 'solar:arrow-right-up-bold'} className="h-4 w-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{endpoint.name}</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {endpoint.method}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{endpoint.description}</p>
          </div>
        </div>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')}
        />
      </button>

      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-stone-200/60 dark:border-stone-800/60">
          {/* URL */}
          <div className="pt-3 space-y-1.5">
            <p className="text-xs font-medium">Endpoint URL</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 text-[10px] sm:text-xs bg-stone-900 text-green-400 p-2.5 rounded-lg font-mono break-all border border-stone-700">
                {fullUrl}
              </code>
              <Button
                size="sm"
                onClick={() => onCopy(fullUrl, endpoint.id)}
                className={cn('h-9 shrink-0', copiedId === endpoint.id ? 'bg-green-500' : '')}
              >
                <Icon icon={copiedId === endpoint.id ? 'solar:check-circle-bold' : 'solar:copy-linear'} className="h-3.5 w-3.5 mr-1" />
                {copiedId === endpoint.id ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Payload Example */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium">{isIncoming ? 'Request Body Example' : 'Payload Example'}</p>
            <pre className="text-[10px] bg-stone-900 text-stone-300 p-3 rounded-lg overflow-auto max-h-40 border border-stone-700">
              {JSON.stringify(endpoint.payloadExample, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
