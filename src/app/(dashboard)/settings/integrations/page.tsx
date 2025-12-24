'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyApiKeys } from '@/hooks/use-company-api-keys';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GeminiIcon, BrevoIcon, TwilioIcon, WhatsAppIcon, ZohoIcon, CalComIcon, Fast2SMSIcon } from '@/components/icons/brand-icons';
import Image from 'next/image';
import { saveApiKeysAction } from '@/app/actions/api-keys-actions';

// --- Types ---

interface IntegrationField {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password';
  help?: string;
}

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode | string;
  category: 'AI' | 'Voice & Chatbot' | 'Communication' | 'Email' | 'SMS' | 'WhatsApp' | 'CRM' | 'Other';
  docLink: string;
  fields: IntegrationField[];
}

// --- Icons Helper ---
const IntegrationIcon = ({ icon, className }: { icon: React.ReactNode | string; className?: string }) => {
  const [error, setError] = useState(false);

  if (typeof icon === 'string') {
    if (icon.startsWith('http')) {
      if (error) {
        // Fallback if image fails
        return <Icon icon="solar:command-linear" className={cn("w-full h-full text-stone-400", className)} />;
      }
      // Check if this is a white logo that needs inversion in light mode
      const isWhiteLogo = icon.includes('sender-logo-white') || icon.includes('logo-white');
      return (
        <img
          src={icon}
          alt="Icon"
          className={cn(
            "w-full h-full object-contain rounded-sm",
            isWhiteLogo && "invert dark:invert-0",
            className
          )}
          onError={() => setError(true)}
        />
      );
    }
    // Check if this icon needs scaling
    const needsScaleDown = icon.includes('hubspot');
    return <Icon icon={icon} className={cn("w-full h-full", needsScaleDown && "scale-75", className)} />;
  }
  return <div className={cn("w-full h-full", className)}>{icon}</div>;
};

// --- Integration Definitions ---

const INTEGRATIONS: IntegrationDef[] = [
  // LLM AI
  {
    id: 'googleAi',
    name: 'Google Gemini',
    description: 'Generative AI models for content and automation',
    category: 'AI',
    icon: <GeminiIcon />,
    docLink: 'https://aistudio.google.com/app/apikey',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...', type: 'password', help: 'Create an API key in Google AI Studio' }
    ]
  },

  // Voice & Chatbot
  {
    id: 'voiceChat',
    name: 'Voice Chat AI Widget',
    description: 'AI-powered voice chatbot for digital cards and websites',
    category: 'Voice & Chatbot',
    icon: 'solar:microphone-3-linear',
    docLink: 'https://app.voicechatai.wmart.in/dashboard?tab=embed',
    fields: [
      { key: 'widgetId', label: 'Agent ID', placeholder: 'e.g., agent_1755699726191', type: 'text', help: 'Step 1: Create an account. Step 2: Go to "Agents" section. Step 3: Copy your Agent ID.' },
      { key: 'apiKey', label: 'Embed Script Code', placeholder: '<script src="...', type: 'text', help: 'Step 4: Go to "Embed Widget on Your Website". Step 5: Copy the full script code.' }
    ]
  },

  // Email
  {
    id: 'brevo',
    name: 'Brevo',
    description: 'Send professional email campaigns with tracking (Free: 300 emails/day)',
    category: 'Email',
    icon: <BrevoIcon />,
    docLink: 'https://app.brevo.com/settings/keys/api',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'xkeysib-...', type: 'password', help: 'Create API Key in Brevo Settings > SMTP & API.' },
      { key: 'senderEmail', label: 'Sender Email', placeholder: 'noreply@example.com', type: 'text', help: 'Must be a verified sender email in your Brevo account.' },
      { key: 'senderName', label: 'Sender Name', placeholder: 'Your Company', type: 'text' },
      { key: 'defaultListId', label: 'Default Contact Group (Optional)', placeholder: 'e.g., 2', type: 'text' }
    ]
  },
  {
    id: 'sender',
    name: 'Sender.net',
    description: 'Email marketing with generous free tier (Free: 2,500 emails/month)',
    category: 'Email',
    icon: 'https://www.sender.net/assets/brand-assets/sender-logo-stacked.png',
    docLink: 'https://app.sender.net/settings/api',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '...', type: 'password', help: 'Settings > API > Generate API Key' },
      { key: 'senderEmail', label: 'Sender Email', placeholder: 'me@company.com', type: 'text', help: 'Must be verified sender email.' },
      { key: 'senderName', label: 'Sender Name', placeholder: 'Your Company', type: 'text' }
    ]
  },
  {
    id: 'smtp',
    name: 'Custom SMTP',
    description: 'Use your own SMTP server (Gmail, Amazon SES, etc.)',
    category: 'Email',
    icon: 'solar:server-linear',
    docLink: 'https://support.google.com/accounts/answer/185833',
    fields: [
      { key: 'host', label: 'SMTP Host', placeholder: 'smtp.gmail.com', type: 'text' },
      { key: 'port', label: 'SMTP Port', placeholder: '587', type: 'text' },
      { key: 'username', label: 'Username/Email', placeholder: 'your-email@gmail.com', type: 'text' },
      { key: 'password', label: 'Password/App Password', placeholder: '...', type: 'password', help: 'For Gmail, use an App Password.' },
      { key: 'fromEmail', label: 'From Email', placeholder: 'noreply@yourcompany.com', type: 'text' },
      { key: 'fromName', label: 'From Name', placeholder: 'Your Company', type: 'text' }
    ]
  },

  // SMS
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Premium global SMS with high reliability',
    category: 'SMS',
    icon: <TwilioIcon />,
    docLink: 'https://console.twilio.com/us1/account/keys-credentials/api-keys',
    fields: [
      { key: 'accountSid', label: 'Account SID', placeholder: 'AC...', type: 'text' },
      { key: 'authToken', label: 'Auth Token', placeholder: '...', type: 'password' },
      { key: 'phoneNumber', label: 'Phone Number', placeholder: '+1...', type: 'text' }
    ]
  },
  {
    id: 'msg91',
    name: 'MSG91',
    description: 'Affordable bulk SMS for India & global with DLT compliance',
    category: 'SMS',
    icon: 'https://ps.w.org/msg91-for-woocommerce/assets/icon-256x256.png?rev=3358441',
    docLink: 'https://control.msg91.com/app/settings/authkey',
    fields: [
      { key: 'authKey', label: 'Auth Key', placeholder: '...', type: 'password', help: 'Settings > Authkey' },
      { key: 'senderId', label: 'Sender ID', placeholder: 'e.g., OMNIFL', type: 'text', help: '6-character DLT Sender ID.' }
    ]
  },
  {
    id: 'fast2sms',
    name: 'Fast2SMS',
    description: 'Fast & affordable SMS for India',
    category: 'SMS',
    icon: 'https://play-lh.googleusercontent.com/5a4-4OanJiMO5NV5jST5KC1eXM2Zr2-i3qBQwylTp5XuuO5_-ezjtGivFwq2bNqtxus',
    docLink: 'https://www.fast2sms.com/dashboard/dev-api',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '...', type: 'password', help: 'Go to Dev API section to find your key.' },
      { key: 'senderId', label: 'Sender ID (Optional)', placeholder: 'e.g., FSTSMS', type: 'text' }
    ]
  },

  // WhatsApp
  {
    id: 'metaWhatsApp',
    name: 'WhatsApp Cloud API',
    description: 'Official WhatsApp Business API integration',
    category: 'WhatsApp',
    icon: <WhatsAppIcon />,
    docLink: 'https://developers.facebook.com/apps/',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '...', type: 'text' },
      { key: 'accessToken', label: 'Access Token', placeholder: '...', type: 'password' },
      { key: 'wabaId', label: 'WABA ID (Optional)', placeholder: '...', type: 'text' }
    ]
  },
  {
    id: 'msg91WhatsApp',
    name: 'MSG91 WhatsApp',
    description: 'WhatsApp messaging through MSG91 for India',
    category: 'WhatsApp',
    icon: 'https://ps.w.org/msg91-for-woocommerce/assets/icon-256x256.png?rev=3358441',
    docLink: 'https://control.msg91.com/app/whatsapp-new/dashboard',
    fields: [
      { key: 'authKey', label: 'Auth Key', placeholder: '...', type: 'password' },
      { key: 'integratedNumber', label: 'WhatsApp Number', placeholder: '9199...', type: 'text' }
    ]
  },
  {
    id: 'fast2smsWhatsApp',
    name: 'Fast2SMS WhatsApp',
    description: 'WhatsApp via Fast2SMS for India',
    category: 'WhatsApp',
    icon: 'https://play-lh.googleusercontent.com/5a4-4OanJiMO5NV5jST5KC1eXM2Zr2-i3qBQwylTp5XuuO5_-ezjtGivFwq2bNqtxus',
    docLink: 'https://www.fast2sms.com/dashboard/whatsapp',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '...', type: 'password' }
    ]
  },
  {
    id: 'gupshup',
    name: 'Gupshup',
    description: 'Enterprise WhatsApp - Great for high volume messaging',
    category: 'WhatsApp',
    icon: 'https://i.ibb.co/ycpkn4cN/gupshup.png',
    docLink: 'https://www.gupshup.io/developer/home',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '...', type: 'password' },
      { key: 'appName', label: 'App ID', placeholder: '...', type: 'text' },
      { key: 'srcName', label: 'App Name', placeholder: '...', type: 'text' },
      { key: 'phoneNumber', label: 'Business Number', placeholder: '...', type: 'text' }
    ]
  },
  {
    id: 'aisensy',
    name: 'AiSensy',
    description: 'WhatsApp automation with AI chatbot capabilities',
    category: 'WhatsApp',
    icon: 'https://i.ibb.co/Wpz0w0TK/Chat-GPT-Image-Dec-24-2025-06-44-20-PM.png',
    docLink: 'https://app.aisensy.com/settings/api-settings',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '...', type: 'password', help: 'Settings > API Settings' },
      { key: 'campaignName', label: 'Campaign Name (Optional)', placeholder: '...', type: 'text' }
    ]
  },
  {
    id: 'authkey',
    name: 'WMart CPaaS',
    description: 'Multi-channel CPaaS platform (WhatsApp, SMS, Email)',
    category: 'WhatsApp',
    icon: 'https://i.ibb.co/Xfbv0vdV/Wmart-Logo-removebg-preview.png',
    docLink: 'https://wmart.in/cpaas/',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '...', type: 'password', help: 'Visit wmart.in/cpaas > Settings > API Keys' }
    ]
  },

  // Other Tools
  {
    id: 'calcom',
    name: 'Cal.com',
    description: 'Automated appointment booking with calendar sync',
    category: 'Other',
    icon: 'simple-icons:caldotcom',
    docLink: 'https://app.cal.com/settings/developer/api-keys',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'cal_...', type: 'password' }
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and deals from HubSpot CRM',
    category: 'CRM',
    icon: 'simple-icons:hubspot',
    docLink: 'https://app.hubspot.com/private-apps',
    fields: [
      { key: 'apiKey', label: 'Access Token', placeholder: '...', type: 'password', help: 'Private Apps > Create > Copy Access Token' },
      { key: 'portalId', label: 'Portal ID', placeholder: '...', type: 'text' }
    ]
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Customer relationship management suite',
    category: 'CRM',
    icon: 'simple-icons:zoho',
    docLink: 'https://api-console.zoho.com/',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: '...', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: '...', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', placeholder: '...', type: 'password' },
      { key: 'domain', label: 'API Domain', placeholder: 'www.zohoapis.com', type: 'text' }
    ]
  },
  {
    id: 'bitrix24',
    name: 'Bitrix24',
    description: 'Social enterprise platform workspace',
    category: 'CRM',
    icon: 'https://www.linxys.de/wp-content/uploads/2019/02/bitrix24-Social-Intranet-L%C3%B6sung-LINXYS.png',
    docLink: 'https://helpdesk.bitrix24.com/open/12357770/',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://b24-....bitrix24.com/rest/...', type: 'text' },
      { key: 'userId', label: 'User ID (Optional)', placeholder: '...', type: 'text' }
    ]
  }
];

// --- Components ---

function IntegrationCard({
  integration,
  savedValues,
  onSave
}: {
  integration: IntegrationDef;
  savedValues: Record<string, string> | undefined;
  onSave: (id: string, values: Record<string, string>) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const isConfigured = savedValues && Object.keys(savedValues).length > 0 && Object.values(savedValues).some(v => !!v);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormValues(savedValues || {});
    }
  }, [isOpen, savedValues]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(integration.id, formValues);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="group relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/50 hover:border-stone-300 dark:hover:border-stone-700 h-full flex flex-col">
          <CardHeader className="p-5 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-stone-100 dark:bg-stone-900 shadow-sm border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 p-1.5">
                <IntegrationIcon icon={integration.icon} className="w-full h-full" />
              </div>
              {isConfigured && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-green-600 dark:text-green-400 text-[10px] font-medium border border-green-500 dark:border-green-600">
                  <Icon icon="solar:check-circle-bold" className="w-3 h-3" />
                  <span>Active</span>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-1">
              <CardTitle className="text-base font-semibold text-stone-900 dark:text-stone-100">
                {integration.name}
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 line-clamp-2">
                {integration.description}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-stone-200 dark:border-stone-800 shadow-2xl">
        <div className="px-6 py-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-stone-950 shadow-sm border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 p-2.5">
              <IntegrationIcon icon={integration.icon} className="w-full h-full" />
            </div>
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-lg font-semibold">{integration.name}</DialogTitle>
              <DialogDescription className="text-sm">{integration.description}</DialogDescription>
              {integration.docLink && (
                <a
                  href={integration.docLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline pt-1"
                >
                  <Icon icon="solar:book-bookmark-linear" className="w-3.5 h-3.5" />
                  Documentation
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {integration.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {field.label}
                </label>
                <div className="relative">
                  {field.label.toLowerCase().includes('script') || field.label.toLowerCase().includes('webhook') ? (
                    <textarea
                      value={formValues[field.key] || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs leading-relaxed"
                    />
                  ) : (
                    <Input
                      type={field.type || 'text'}
                      value={formValues[field.key] || ''}
                      onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="h-10 text-sm font-sans"
                    />
                  )}
                </div>
                {field.help && (
                  <p className="text-[12px] text-stone-500 leading-normal">{field.help}</p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4 flex gap-3 border border-indigo-100 dark:border-indigo-900/50">
            <Icon icon="solar:shield-check-linear" className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">
              Your credentials are encrypted securely. {integration.name} will only be used to power your configured automations.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/10">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="h-10 font-sans normal-case text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-10 font-sans normal-case px-6 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
          >
            {loading ? (
              <>
                <Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Connect Integration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page Component ---

export default function IntegrationsPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  // Load keys on mount
  useEffect(() => {
    const load = async () => {
      if (!appUser?.companyId) return;
      try {
        const { fetchCompanyApiKeysAction } = await import('@/app/actions/api-keys-actions');
        // We also need to get voice chat config manually since it's separate
        const { getVoiceChatConfig } = await import('@/app/actions/voice-chat-actions');

        const [keysResult, voiceChatResult] = await Promise.all([
          fetchCompanyApiKeysAction(appUser.companyId),
          getVoiceChatConfig(appUser.companyId)
        ]);

        let loadedKeys = keysResult.success && keysResult.apiKeys ? keysResult.apiKeys : {};

        // Merge voice chat config if exists
        if (voiceChatResult.success && voiceChatResult.config) {
          loadedKeys = {
            ...loadedKeys,
            voiceChat: {
              widgetId: voiceChatResult.config.chatbotId || '',
              apiKey: voiceChatResult.config.widgetScript || ''
            }
          };
        }

        setApiKeys(loadedKeys);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appUser?.companyId]);

  const handleSaveKeys = async (integrationId: string, values: Record<string, string>) => {
    if (!appUser?.companyId) return;
    try {
      let success = false;
      let error = '';

      if (integrationId === 'voiceChat') {
        // Special handling for Voice Chat
        const { saveVoiceChatConfig } = await import('@/app/actions/voice-chat-actions');
        const widgetScript = values.apiKey || ''; // We mapped 'apiKey' input to widgetScript in definitions
        const result = await saveVoiceChatConfig(appUser.companyId, widgetScript);
        success = result.success;
        error = result.message || 'Failed';
      } else {
        // Standard handling
        const res = await saveApiKeysAction(appUser.companyId, integrationId, values);
        success = res.success;
        error = res.error || 'Failed';
      }

      if (success) {
        setApiKeys(prev => ({
          ...prev,
          [integrationId]: values
        }));
        toast({ title: 'Success', description: `${integrationId} configuration saved.` });
      } else {
        throw new Error(error);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save integration settings', variant: 'destructive' });
    }
  };

  // Group by category
  // Order categories logically
  const ORDERED_CATEGORIES = ['AI', 'Voice & Chatbot', 'Communication', 'Email', 'SMS', 'WhatsApp', 'CRM', 'Other'];
  const availableCategories = Array.from(new Set(INTEGRATIONS.map(i => i.category)));
  const sortedCategories = ORDERED_CATEGORIES.filter(c => availableCategories.includes(c as any));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 rounded-xl bg-stone-100 dark:bg-stone-900 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Integrations Directory</h2>
          <p className="text-sm text-stone-500">Connect and manage your third-party tools and services</p>
        </div>
      </div>

      {sortedCategories.map(cat => (
        <div key={cat} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
            <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 uppercase tracking-wider">{cat}</h3>
            <span className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
              {INTEGRATIONS.filter(i => i.category === cat).length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {INTEGRATIONS.filter(i => i.category === cat).map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                savedValues={apiKeys[integration.id]}
                onSave={handleSaveKeys}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
