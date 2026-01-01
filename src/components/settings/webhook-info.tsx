'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const MOCK_WEBHOOK_BASE_URL = 'https://api.example.com/automatic-updates';

interface WebhookEndpoint {
  id: string;
  name: string;
  description: string;
  url?: string;
  eventExamples: string[];
  setupSteps?: string[];
  category: 'ecommerce' | 'calendar' | 'contact';
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium';
}

const webhookEndpoints: WebhookEndpoint[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'simple-icons:shopify',
    color: 'green',
    difficulty: 'easy',
    description: 'Automatically capture customers and orders from your Shopify store as new leads in your CRM.',
    eventExamples: ['New order placed', 'New customer registered', 'Order status updated'],
    category: 'ecommerce',
    setupSteps: [
      'Login to your Shopify Admin panel',
      'Go to Settings → Notifications → Webhooks',
      'Click "Create webhook" button',
      'Select event: "Order creation" or "Customer creation"',
      'Paste the webhook URL (copy from below)',
      'Format: JSON',
      'Click "Save webhook" and test it',
    ],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: 'simple-icons:woo',
    color: 'purple',
    difficulty: 'easy',
    description: 'Sync your WordPress WooCommerce orders and customers directly to your CRM leads.',
    eventExamples: ['Order completed', 'New customer registration', 'Customer data updated'],
    category: 'ecommerce',
    setupSteps: [
      'Login to your WordPress Admin',
      'Go to WooCommerce → Settings → Advanced → Webhooks',
      'Click "Add webhook" button',
      'Name: "CRM Sync"',
      'Status: Active',
      'Topic: Select "Order created" or "Customer created"',
      'Delivery URL: Paste the webhook URL below',
      'Secret: Paste your webhook token',
      'Click "Save webhook"',
    ],
  },
  {
    id: 'wordpress',
    name: 'WordPress Forms',
    icon: 'simple-icons:wordpress',
    color: 'blue',
    difficulty: 'medium',
    description: 'Connect Contact Form 7, WPForms, or any WordPress form plugin to capture leads automatically.',
    eventExamples: ['Contact form submission', 'User registration', 'Custom form entry'],
    category: 'ecommerce',
    setupSteps: [
      'Install a webhook plugin (e.g., "WP Webhooks" or "Zapier for WordPress")',
      'Configure the plugin to send data on form submission',
      'Set the webhook URL to the URL below',
      'Map form fields: name, email, phone',
      'Test by submitting a form',
    ],
  },
  {
    id: 'calendar-booking',
    name: 'Cal.com',
    icon: 'simple-icons:caldotcom',
    color: 'indigo',
    difficulty: 'easy',
    description: 'Turn your Cal.com appointment bookings into automatic leads in your CRM.',
    eventExamples: ['New booking created', 'Appointment scheduled', 'Meeting confirmed'],
    category: 'calendar',
    setupSteps: [
      'Login to Cal.com',
      'Go to Settings → Developer → Webhooks',
      'Click "New Webhook"',
      'Subscriber URL: Paste the webhook URL below',
      'Event Triggers: Select "Booking Created"',
      'Click "Create Webhook"',
      'Use "Send test ping" to verify (should return 200 OK)',
    ],
  },
  {
    id: 'new-contact',
    name: 'Voice Chat AI',
    icon: 'solar:microphone-3-linear',
    color: 'cyan',
    difficulty: 'easy',
    description: 'Automatically capture customer information from Voice Chat AI voice calls as leads.',
    eventExamples: ['Voice call completed', 'Customer info captured', 'AI conversation saved'],
    category: 'contact',
    setupSteps: [
      'Login to Voice Chat AI dashboard',
      'Go to Settings → Integrations',
      'Find "Webhook" or "CRM Integration" section',
      'Paste the webhook URL below',
      'Enable "Send lead data on call completion"',
      'Save and test with a sample call',
    ],
  },
  {
    id: 'email-unsubscribe',
    name: 'Email Unsubscribe',
    icon: 'solar:letter-unread-linear',
    color: 'amber',
    difficulty: 'medium',
    description: 'When someone unsubscribes from your emails, automatically update their preferences in your CRM.',
    eventExamples: ['Unsubscribe from Brevo', 'Opt-out from Mailchimp', 'Email preference change'],
    category: 'contact',
    setupSteps: [
      'Go to your email provider settings (Brevo, Mailchimp, etc.)',
      'Find Webhooks or API settings',
      'Add webhook for "Unsubscribe" event',
      'Paste the webhook URL below',
      'Save configuration',
    ],
  },
  {
    id: 'payment-received',
    name: 'Payment Received',
    icon: 'solar:card-recive-linear',
    color: 'emerald',
    difficulty: 'medium',
    description: 'When a payment is received, automatically update lead status or trigger follow-up actions.',
    eventExamples: ['Stripe payment success', 'PayPal transaction complete', 'Razorpay payment confirmed'],
    category: 'contact',
    setupSteps: [
      'Go to your payment provider dashboard (Stripe, PayPal, etc.)',
      'Navigate to Developers → Webhooks',
      'Add endpoint with the webhook URL below',
      'Select events: "payment_intent.succeeded" or similar',
      'Save and verify the webhook',
    ],
  },
];

const CATEGORIES = [
  { id: 'ecommerce', name: 'E-Commerce & Stores', icon: 'solar:shop-linear', color: 'violet', description: 'Connect your online stores to capture orders and customers' },
  { id: 'calendar', name: 'Calendar & Bookings', icon: 'solar:calendar-linear', color: 'blue', description: 'Sync appointment bookings as leads automatically' },
  { id: 'contact', name: 'Communication & Payments', icon: 'solar:phone-calling-linear', color: 'emerald', description: 'Voice calls, emails, and payment notifications' },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; light: string }> = {
  green: { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800', light: 'bg-green-50 dark:bg-green-950/30' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', light: 'bg-purple-50 dark:bg-purple-950/30' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', light: 'bg-blue-50 dark:bg-blue-950/30' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', light: 'bg-indigo-50 dark:bg-indigo-950/30' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', light: 'bg-cyan-50 dark:bg-cyan-950/30' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', light: 'bg-amber-50 dark:bg-amber-950/30' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  violet: { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', light: 'bg-violet-50 dark:bg-violet-950/30' },
};

interface WebhookCardProps {
  endpoint: WebhookEndpoint;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string) => void;
}

function WebhookCard({ endpoint, isExpanded, onToggle, onCopy }: WebhookCardProps) {
  const colors = colorClasses[endpoint.color] || colorClasses.blue;

  return (
    <div className={cn(
      'rounded-xl border transition-all overflow-hidden',
      isExpanded ? colors.border : 'border-stone-200 dark:border-stone-800',
      isExpanded && colors.light
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', colors.bg)}>
            <Icon icon={endpoint.icon} className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">{endpoint.name}</span>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                endpoint.difficulty === 'easy' 
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                  : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
              )}>
                {endpoint.difficulty === 'easy' ? '✓ Easy Setup' : '⚙ Medium'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{endpoint.description}</p>
          </div>
        </div>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={cn('h-5 w-5 text-muted-foreground transition-transform shrink-0 ml-2', isExpanded && 'rotate-180')}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-stone-200/60 dark:border-stone-800/60">
          {/* Description */}
          <p className="text-sm text-muted-foreground pt-4">{endpoint.description}</p>

          {/* What Gets Captured */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Icon icon="solar:checklist-minimalistic-linear" className={cn('h-4 w-4', colors.text)} />
              What Gets Captured
            </p>
            <div className="flex flex-wrap gap-2">
              {endpoint.eventExamples.map((ex, idx) => (
                <span key={idx} className={cn('text-xs px-2.5 py-1 rounded-lg', colors.light, colors.text)}>
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Setup Steps */}
          {endpoint.setupSteps && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Icon icon="solar:document-text-linear" className={cn('h-4 w-4', colors.text)} />
                Step-by-Step Setup Guide
              </p>
              <div className="space-y-2 bg-white dark:bg-stone-950 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
                {endpoint.setupSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white',
                      colors.bg
                    )}>
                      {idx + 1}
                    </span>
                    <p className="text-sm text-stone-700 dark:text-stone-300 pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhook URL */}
          {endpoint.url && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Icon icon="solar:link-circle-linear" className={cn('h-4 w-4', colors.text)} />
                Your Webhook URL (Copy This)
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <code className="text-xs bg-stone-900 dark:bg-stone-950 text-green-400 p-3 rounded-xl flex-1 overflow-auto break-all font-mono border border-stone-700">
                  {endpoint.url}
                </code>
                <Button 
                  size="sm" 
                  onClick={() => onCopy(endpoint.url!)} 
                  className={cn('shrink-0 h-10 sm:h-auto', colors.bg, 'hover:opacity-90 text-white')}
                >
                  <Icon icon="solar:copy-linear" className="h-4 w-4 mr-1.5" />
                  Copy URL
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface WebhookGroupProps {
  category: typeof CATEGORIES[0];
  endpoints: WebhookEndpoint[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onCopy: (text: string) => void;
}

function WebhookGroup({ category, endpoints, expandedId, onToggle, onCopy }: WebhookGroupProps) {
  if (endpoints.length === 0) return null;
  const colors = colorClasses[category.color] || colorClasses.blue;

  return (
    <div className="space-y-3">
      <div className={cn('flex items-center gap-3 p-3 rounded-xl', colors.light)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', colors.bg)}>
          <Icon icon={category.icon} className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <div className="space-y-2 pl-0 sm:pl-2">
        {endpoints.map(endpoint => (
          <WebhookCard
            key={endpoint.id}
            endpoint={endpoint}
            isExpanded={expandedId === endpoint.id}
            onToggle={() => onToggle(endpoint.id)}
            onCopy={onCopy}
          />
        ))}
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
  const [tokenCopied, setTokenCopied] = useState(false);

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

  const handleCopyToClipboard = (text: string, isToken = false) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (isToken) {
          setTokenCopied(true);
          setTimeout(() => setTokenCopied(false), 2000);
        }
        toast({ title: 'Copied!', description: 'Copied to clipboard successfully.' });
      })
      .catch(err => {
        toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
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
      {/* What Are Webhooks - Simple Explanation */}
      <Alert className="border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <Icon icon="solar:lightbulb-bolt-linear" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm ml-2">
          <span className="font-semibold text-blue-900 dark:text-blue-100 block mb-1">What are Webhooks? (Simple Explanation)</span>
          <span className="text-blue-800 dark:text-blue-200">
            Webhooks automatically send customer data from your other apps (like Shopify, WooCommerce, Cal.com) to your CRM. 
            When someone places an order or books an appointment, they become a lead in your CRM instantly — no manual work needed!
          </span>
        </AlertDescription>
      </Alert>

      {/* Quick Start Guide */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-900/50 dark:to-stone-950 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="solar:rocket-2-linear" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">Quick Start (3 Simple Steps)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</span>
            <div>
              <p className="text-xs font-medium text-foreground">Copy Token</p>
              <p className="text-[11px] text-muted-foreground">Copy your secret token below</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</span>
            <div>
              <p className="text-xs font-medium text-foreground">Copy Webhook URL</p>
              <p className="text-[11px] text-muted-foreground">Expand any integration below</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <span className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</span>
            <div>
              <p className="text-xs font-medium text-foreground">Paste in Your App</p>
              <p className="text-[11px] text-muted-foreground">Follow the setup steps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Token - More Prominent */}
      <Card className="border-2 border-amber-200 dark:border-amber-800 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-b border-amber-200 dark:border-amber-800 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Icon icon="solar:key-linear" className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Your Secret Token
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-medium">IMPORTANT</span>
              </CardTitle>
              <CardDescription className="text-sm mt-0.5">This token authenticates your webhooks. Keep it private!</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="text-sm bg-stone-900 dark:bg-stone-950 text-amber-400 p-3 rounded-xl flex-1 overflow-auto border border-stone-700 font-mono break-all">
              webhook_secure_token
            </code>
            <Button
              size="sm"
              onClick={() => handleCopyToClipboard('webhook_secure_token', true)}
              className={cn(
                'h-10 sm:h-auto px-4 transition-all',
                tokenCopied 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              )}
            >
              <Icon icon={tokenCopied ? 'solar:check-circle-bold' : 'solar:copy-linear'} className="h-4 w-4 mr-1.5" />
              {tokenCopied ? 'Copied!' : 'Copy Token'}
            </Button>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <Icon icon="solar:shield-warning-linear" className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-medium">Where to paste this:</span> When setting up webhooks in Shopify, WooCommerce, or other apps, 
              look for fields labeled "Secret", "Token", "API Key", or "Authorization Header" and paste this value there.
            </p>
          </div>
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

      {/* Need Help Section */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Icon icon="solar:chat-round-dots-linear" className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">Need Help Setting Up?</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                Our support team can help you connect your apps. Just share which platform you're using!
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 h-10 shrink-0">
            <Link href="/help-center">
              <Icon icon="solar:question-circle-linear" className="h-4 w-4 mr-1.5" />
              Get Help
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-green-900 dark:text-green-100">All Webhooks Active & Ready</p>
          <p className="text-xs text-green-700 dark:text-green-300">Your webhook endpoints are live and waiting for data from your connected apps.</p>
        </div>
      </div>
    </div>
  );
}
