'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const MOCK_WEBHOOK_BASE_URL = 'https://api.omniflow.example.com/automatic-updates';

interface WebhookEndpoint {
  id: string;
  name: string;
  description: string;
  url?: string;
  eventExamples: string[];
  setupSteps?: string[];
  category: 'ecommerce' | 'calendar' | 'contact';
  icon: string;
}

const webhookEndpoints: WebhookEndpoint[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'solar:bag-4-linear',
    description: 'Automatically capture customers and orders from your Shopify store as new contacts in OmniFlow.',
    eventExamples: ['New order placed', 'New customer registered', 'Order status updated'],
    category: 'ecommerce',
    setupSteps: [
      'Go to Shopify Admin → Settings → Webhooks',
      'Click "Create webhook"',
      'Event: Select "Order created" or "Customer created"',
      'Paste the webhook URL below',
      'Save and test the webhook',
    ],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: 'solar:cart-large-2-linear',
    description: 'Sync your WordPress WooCommerce orders and customers directly to OmniFlow contacts.',
    eventExamples: ['Order completed', 'New customer registration', 'Customer data updated'],
    category: 'ecommerce',
    setupSteps: [
      'Go to WooCommerce → Settings → Webhooks',
      'Click "Create webhook"',
      'Event: Select "Order created" or "Customer created"',
      'Paste the webhook URL below',
      'Save and test',
    ],
  },
  {
    id: 'wordpress',
    name: 'WordPress (Custom)',
    icon: 'solar:code-square-linear',
    description: 'Connect custom WordPress plugins or forms to automatically send contact data to OmniFlow.',
    eventExamples: ['Form submission', 'User registration', 'Custom event trigger'],
    category: 'ecommerce',
    setupSteps: [
      'Configure your WordPress plugin to send data to OmniFlow',
      'Send POST requests with name, email, phone, and action',
      'Format: {"name": "...", "email": "...", "phone": "...", "action": "..."}',
      'OmniFlow will automatically create/update contacts',
    ],
  },
  {
    id: 'calendar-booking',
    name: 'Cal.com Bookings',
    icon: 'solar:calendar-linear',
    description: 'Turn your Cal.com appointment bookings into automatic contacts in OmniFlow.',
    eventExamples: ['New booking created', 'Appointment scheduled', 'Meeting confirmed'],
    category: 'calendar',
    setupSteps: [
      'Go to Cal.com → Settings → Webhooks/Integrations',
      'Click "Add New Webhook"',
      'Event: Select "Booking Created"',
      'Paste the webhook URL below',
      'Click "Ping test" to verify (should return 200 OK)',
    ],
  },
  {
    id: 'new-contact',
    name: 'Voice Chat AI',
    icon: 'solar:microphone-3-linear',
    description: 'Automatically capture customer information from Voice Chat AI voice calls.',
    eventExamples: ['New voice call completed', 'Customer information recorded', 'AI transcription saved'],
    category: 'contact',
    setupSteps: [
      'Go to Voice Chat AI settings',
      'Find "Webhook" or "Automatic Updates" section',
      'Paste the webhook URL below',
      'Save configuration',
    ],
  },
  {
    id: 'email-unsubscribe',
    name: 'Email Unsubscribe',
    icon: 'solar:letter-unread-linear',
    description: 'When a contact unsubscribes from your email platform, automatically update their preferences in OmniFlow.',
    eventExamples: ['Someone clicks "unsubscribe" in Brevo', 'Person opts out of emails in Mailchimp'],
    category: 'contact',
  },
  {
    id: 'payment-received',
    name: 'Payment Received',
    icon: 'solar:card-recive-linear',
    description: 'When a payment is successfully received, automatically update the contact status or trigger next steps.',
    eventExamples: ['Successful payment via Stripe', 'Completed PayPal transaction'],
    category: 'contact',
  },
];

const CATEGORIES = [
  { id: 'ecommerce', name: 'E-Commerce Integrations', icon: 'solar:shop-linear' },
  { id: 'calendar', name: 'Calendar & Scheduling', icon: 'solar:calendar-linear' },
  { id: 'contact', name: 'Voice & Communication', icon: 'solar:phone-calling-linear' },
];

interface WebhookGroupProps {
  category: { id: string; name: string; icon: string };
  endpoints: WebhookEndpoint[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onCopy: (text: string) => void;
}

function WebhookGroup({ category, endpoints, expandedId, onToggle, onCopy }: WebhookGroupProps) {
  if (endpoints.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Icon icon={category.icon} className="h-5 w-5 text-foreground" />
        <h3 className="text-base font-semibold text-foreground">{category.name}</h3>
      </div>

      <div className="space-y-2">
        {endpoints.map(endpoint => {
          const isExpanded = expandedId === endpoint.id;
          return (
            <div
              key={endpoint.id}
              className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden bg-white dark:bg-stone-900/50"
            >
              <button
                onClick={() => onToggle(endpoint.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Icon icon={endpoint.icon} className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="font-medium text-sm text-foreground">{endpoint.name}</span>
                </div>
                <Icon
                  icon="solar:alt-arrow-down-linear"
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-stone-200/60 dark:border-stone-800/60">
                  <p className="text-sm text-muted-foreground pt-3">{endpoint.description}</p>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">Events Captured</p>
                    <ul className="space-y-1">
                      {endpoint.eventExamples.map((ex, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon icon="solar:check-circle-linear" className="h-3 w-3 text-stone-500" />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {endpoint.setupSteps && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Setup Steps</p>
                      <ol className="space-y-1.5">
                        {endpoint.setupSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="w-4 h-4 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {endpoint.url && (
                    <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
                      <p className="text-xs font-medium text-foreground">Webhook URL</p>
                      <div className="flex gap-2">
                        <code className="text-xs bg-white dark:bg-stone-800 p-2.5 rounded-lg flex-1 overflow-auto text-foreground break-all border border-stone-200/60 dark:border-stone-700/60 font-mono">
                          {endpoint.url}
                        </code>
                        <Button size="sm" variant="outline" onClick={() => onCopy(endpoint.url!)} className="shrink-0 rounded-lg">
                          <Icon icon="solar:copy-linear" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WebhookInfo() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [generatedEndpoints, setGeneratedEndpoints] = useState<WebhookEndpoint[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/automatic-updates` : MOCK_WEBHOOK_BASE_URL;
    const accountId = appUser?.companyId || 'your-account-id';

    setGeneratedEndpoints(
      webhookEndpoints.map(endpoint => ({
        ...endpoint,
        url: `${baseUrl}/${endpoint.id}?account=${accountId}`,
      }))
    );
  }, [appUser?.companyId]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({ title: 'Copied!', description: 'Connection link copied to clipboard.' });
      })
      .catch(err => {
        toast({ title: 'Copy Failed', description: 'Could not copy link to clipboard.', variant: 'destructive' });
        console.error('Failed to copy text: ', err);
      });
  };

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  const ecommerceEndpoints = generatedEndpoints.filter(e => e.category === 'ecommerce');
  const calendarEndpoints = generatedEndpoints.filter(e => e.category === 'calendar');
  const contactEndpoints = generatedEndpoints.filter(e => e.category === 'contact');

  return (
    <div className="space-y-6">
      {/* How Webhooks Work */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
        <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">How Webhooks Work</p>
          <p className="text-xs text-muted-foreground">
            When something happens in your store or app (new order, customer signup, booking), that app sends the information to OmniFlow.
            Your contacts are automatically created and updated in real-time.
          </p>
        </div>
      </div>

      {/* Secret Token */}
      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl overflow-hidden">
        <CardHeader className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200/60 dark:border-stone-800/60 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Icon icon="solar:key-linear" className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Your Webhook Secret Token</CardTitle>
              <CardDescription className="text-sm mt-0.5">Use this token in your store's webhook settings for authentication</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <div className="flex gap-2">
            <code className="text-sm bg-stone-50 dark:bg-stone-900 p-3 rounded-xl flex-1 overflow-auto border border-stone-200/60 dark:border-stone-800/60 text-foreground font-mono break-all">
              omniflow_webhook_secure_token
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyToClipboard('omniflow_webhook_secure_token')}
              className="h-auto rounded-xl px-3"
            >
              <Icon icon="solar:copy-linear" className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this token secret. When setting up webhooks in your store settings, you may be asked for a "Secret", "Token", or
            "Authorization Header". Paste this value there.
          </p>
        </CardContent>
      </Card>

      {/* Webhook Categories */}
      <div className="space-y-6">
        <WebhookGroup
          category={CATEGORIES[0]}
          endpoints={ecommerceEndpoints}
          expandedId={expandedId}
          onToggle={handleToggle}
          onCopy={handleCopyToClipboard}
        />
        <WebhookGroup
          category={CATEGORIES[1]}
          endpoints={calendarEndpoints}
          expandedId={expandedId}
          onToggle={handleToggle}
          onCopy={handleCopyToClipboard}
        />
        <WebhookGroup
          category={CATEGORIES[2]}
          endpoints={contactEndpoints}
          expandedId={expandedId}
          onToggle={handleToggle}
          onCopy={handleCopyToClipboard}
        />
      </div>

      {/* Ready Status */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
        <Icon icon="solar:check-circle-linear" className="h-5 w-5 text-stone-600 dark:text-stone-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Ready to Connect</p>
          <p className="text-xs text-muted-foreground">
            All webhooks are active and ready to receive data from your stores and applications. Follow the setup steps above for each
            platform you want to connect.
          </p>
        </div>
      </div>
    </div>
  );
}
