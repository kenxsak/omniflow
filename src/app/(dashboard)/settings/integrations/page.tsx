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
  category: 'AI' | 'Voice & Chatbot' | 'Communication' | 'Email' | 'SMS' | 'WhatsApp' | 'CRM' | 'Social Media' | 'Other';
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
  },
  // Lead Generation
  {
    id: 'facebookLeads',
    name: 'Facebook Lead Ads',
    description: 'Auto-sync leads from Facebook Lead Ad forms to your CRM',
    category: 'CRM',
    icon: 'logos:facebook',
    docLink: 'https://developers.facebook.com/docs/marketing-api/guides/lead-ads/',
    fields: [
      { key: 'appId', label: 'App ID', placeholder: '123456789012345', type: 'text', help: 'Find in Facebook Developer Console > Your App > Settings > Basic' },
      { key: 'appSecret', label: 'App Secret', placeholder: '...', type: 'password', help: 'Find in Facebook Developer Console > Your App > Settings > Basic' },
      { key: 'pageAccessToken', label: 'Page Access Token', placeholder: 'EAABsbCS1iHgBO...', type: 'password', help: 'Generate via Graph API Explorer with pages_read_engagement, leads_retrieval permissions' }
    ]
  }
  // Note: Social Media publishing uses Copy & Paste approach (Settings > Connections > Social Media)
  // Buffer API closed to new developers since 2019
];

// --- Components ---

function IntegrationCard({
  integration,
  savedValues,
  onSave,
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

      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-stone-200 dark:border-stone-800 shadow-2xl max-h-[90vh] sm:max-h-[85vh]">
        <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white dark:bg-stone-950 shadow-sm border border-stone-100 dark:border-stone-800 text-stone-900 dark:text-stone-100 p-2 sm:p-2.5 shrink-0">
              <IntegrationIcon icon={integration.icon} className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <DialogTitle className="text-base sm:text-lg font-semibold truncate">{integration.name}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm line-clamp-2">{integration.description}</DialogDescription>
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

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Standard API Key Integration */}
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

          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-3 sm:p-4 flex gap-2 sm:gap-3 border border-indigo-100 dark:border-indigo-900/50">
            <Icon icon="solar:shield-check-linear" className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">
              Your credentials are encrypted securely.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/10 flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto h-10 font-sans normal-case text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto h-10 font-sans normal-case px-6 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
          >
            {loading ? (
              <>
                <Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Connect'
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load keys on mount
  useEffect(() => {
    const load = async () => {
      if (!appUser?.companyId || !appUser?.uid) return;
      try {
        const { fetchCompanyApiKeysAction } = await import('@/app/actions/api-keys-actions');
        // We also need to get voice chat config manually since it's separate
        const { getVoiceChatConfig } = await import('@/app/actions/voice-chat-actions');
        // Get Facebook Leads config
        const { getFacebookLeadsConfig } = await import('@/app/actions/facebook-leads-actions');

        const [keysResult, voiceChatResult, facebookLeadsResult] = await Promise.all([
          fetchCompanyApiKeysAction(appUser.companyId),
          getVoiceChatConfig(appUser.companyId),
          getFacebookLeadsConfig(appUser.companyId),
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

        // Merge Facebook Leads config if exists
        if (facebookLeadsResult.success && facebookLeadsResult.config?.isConnected) {
          loadedKeys = {
            ...loadedKeys,
            facebookLeads: {
              appId: facebookLeadsResult.config.appId || '',
              // Don't expose secrets, just mark as configured
              configured: 'true'
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
  }, [appUser?.companyId, appUser?.uid]);

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
      } else if (integrationId === 'facebookLeads') {
        // Special handling for Facebook Lead Ads
        const { saveFacebookLeadsConfig } = await import('@/app/actions/facebook-leads-actions');
        const result = await saveFacebookLeadsConfig(appUser.companyId, {
          appId: values.appId || '',
          appSecret: values.appSecret || '',
          pageAccessToken: values.pageAccessToken || '',
        });
        success = result.success;
        error = result.error || 'Failed';
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

  // Check which essential integrations are configured
  const isConfigured = (id: string) => apiKeys[id] && Object.keys(apiKeys[id]).length > 0 && Object.values(apiKeys[id]).some(v => !!v);
  const hasEmailProvider = isConfigured('brevo') || isConfigured('smtp') || isConfigured('sender');
  const hasSmsProvider = isConfigured('twilio') || isConfigured('msg91') || isConfigured('fast2sms');
  const hasWhatsAppProvider = isConfigured('metaWhatsApp') || isConfigured('msg91WhatsApp') || isConfigured('gupshup') || isConfigured('aisensy') || isConfigured('authkey');
  const hasAiProvider = isConfigured('googleAi');

  // Get active email provider name
  const getActiveEmailProvider = () => {
    if (isConfigured('brevo')) return 'Brevo';
    if (isConfigured('smtp')) return 'Custom SMTP';
    if (isConfigured('sender')) return 'Sender.net';
    return null;
  };

  // Group by category
  // Order categories logically
  const ORDERED_CATEGORIES = ['AI', 'Voice & Chatbot', 'Communication', 'Email', 'SMS', 'WhatsApp', 'CRM', 'Other'];
  const availableCategories = Array.from(new Set(INTEGRATIONS.map(i => i.category)));
  const sortedCategories = ORDERED_CATEGORIES.filter(c => availableCategories.includes(c as any));

  // Filter integrations based on search and category
  const filteredIntegrations = INTEGRATIONS.filter(integration => {
    const matchesSearch = searchQuery === '' || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get filtered categories (only show categories that have matching integrations)
  const filteredCategories = sortedCategories.filter(cat => 
    filteredIntegrations.some(i => i.category === cat)
  );

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
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      {/* Quick Setup Status Banner */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-900/50 dark:to-stone-950 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="solar:rocket-2-linear" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">Quick Setup Status</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">Essential integrations for your CRM to work properly</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Email Status */}
          <div className={cn(
            'rounded-lg p-3 border transition-colors',
            hasEmailProvider 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Icon 
                icon={hasEmailProvider ? 'solar:check-circle-bold' : 'solar:danger-triangle-linear'} 
                className={cn('h-4 w-4', hasEmailProvider ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400')} 
              />
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Email</span>
            </div>
            <p className={cn('text-[10px]', hasEmailProvider ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300')}>
              {hasEmailProvider ? getActiveEmailProvider() : 'Not configured'}
            </p>
          </div>

          {/* SMS Status */}
          <div className={cn(
            'rounded-lg p-3 border transition-colors',
            hasSmsProvider 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
              : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Icon 
                icon={hasSmsProvider ? 'solar:check-circle-bold' : 'solar:chat-line-linear'} 
                className={cn('h-4 w-4', hasSmsProvider ? 'text-green-600 dark:text-green-400' : 'text-stone-400')} 
              />
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">SMS</span>
            </div>
            <p className={cn('text-[10px]', hasSmsProvider ? 'text-green-700 dark:text-green-300' : 'text-stone-500')}>
              {hasSmsProvider ? 'Connected' : 'Optional'}
            </p>
          </div>

          {/* WhatsApp Status */}
          <div className={cn(
            'rounded-lg p-3 border transition-colors',
            hasWhatsAppProvider 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
              : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Icon 
                icon={hasWhatsAppProvider ? 'solar:check-circle-bold' : 'solar:chat-round-dots-linear'} 
                className={cn('h-4 w-4', hasWhatsAppProvider ? 'text-green-600 dark:text-green-400' : 'text-stone-400')} 
              />
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">WhatsApp</span>
            </div>
            <p className={cn('text-[10px]', hasWhatsAppProvider ? 'text-green-700 dark:text-green-300' : 'text-stone-500')}>
              {hasWhatsAppProvider ? 'Connected' : 'Optional'}
            </p>
          </div>

          {/* AI Status */}
          <div className={cn(
            'rounded-lg p-3 border transition-colors',
            hasAiProvider 
              ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
              : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          )}>
            <div className="flex items-center gap-2 mb-1">
              <Icon 
                icon={hasAiProvider ? 'solar:check-circle-bold' : 'solar:magic-stick-3-linear'} 
                className={cn('h-4 w-4', hasAiProvider ? 'text-green-600 dark:text-green-400' : 'text-stone-400')} 
              />
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">AI</span>
            </div>
            <p className={cn('text-[10px]', hasAiProvider ? 'text-green-700 dark:text-green-300' : 'text-stone-500')}>
              {hasAiProvider ? 'Connected' : 'Optional'}
            </p>
          </div>
        </div>

        {!hasEmailProvider && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-medium">Email provider required</span> for task reminders, appointment notifications, and email campaigns. 
              Configure <button onClick={() => setSearchQuery('brevo')} className="font-semibold underline underline-offset-2">Brevo</button> (free 300 emails/day) or <button onClick={() => setSearchQuery('smtp')} className="font-semibold underline underline-offset-2">Custom SMTP</button> below.
            </p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Icon icon="solar:close-circle-linear" className="h-4 w-4 text-stone-400" />
            </button>
          )}
        </div>
        
        {/* Category Filter Pills - All categories with horizontal scroll and colors */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="h-9 text-xs whitespace-nowrap shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {sortedCategories.map(cat => {
            const isSelected = selectedCategory === cat;
            // Category-specific colors
            const categoryButtonColors: Record<string, { selected: string; unselected: string }> = {
              'AI': { 
                selected: 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600', 
                unselected: 'border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50' 
              },
              'Voice & Chatbot': { 
                selected: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600', 
                unselected: 'border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50' 
              },
              'Email': { 
                selected: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600', 
                unselected: 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50' 
              },
              'SMS': { 
                selected: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600', 
                unselected: 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50' 
              },
              'WhatsApp': { 
                selected: 'bg-green-600 hover:bg-green-700 text-white border-green-600', 
                unselected: 'border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50' 
              },
              'CRM': { 
                selected: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600', 
                unselected: 'border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50' 
              },
              'Other': { 
                selected: 'bg-stone-600 hover:bg-stone-700 text-white border-stone-600', 
                unselected: 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900' 
              },
            };
            const colors = categoryButtonColors[cat] || categoryButtonColors['Other'];
            
            return (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 text-xs whitespace-nowrap shrink-0 transition-colors",
                  isSelected ? colors.selected : colors.unselected
                )}
                onClick={() => setSelectedCategory(isSelected ? null : cat)}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || selectedCategory) && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500">
            Showing {filteredIntegrations.length} of {INTEGRATIONS.length} integrations
            {selectedCategory && <span className="font-medium"> in {selectedCategory}</span>}
          </p>
          {(searchQuery || selectedCategory) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* No results message */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Icon icon="solar:magnifer-zoom-out-linear" className="h-12 w-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">No integrations found</h3>
          <p className="text-xs text-stone-500">Try adjusting your search or filter</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {filteredCategories.map(cat => {
        // Category color mapping
        const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
          'AI': { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
          'Voice & Chatbot': { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
          'Communication': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
          'Email': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
          'SMS': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
          'WhatsApp': { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
          'CRM': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
          'Other': { bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-600 dark:text-stone-400', border: 'border-stone-200 dark:border-stone-700' },
        };
        const colors = categoryColors[cat] || categoryColors['Other'];
        const categoryIntegrations = filteredIntegrations.filter(i => i.category === cat);
        
        return (
        <div key={cat} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className={cn('p-2 rounded-lg', colors.bg)}>
              <Icon icon={cat === 'AI' ? 'solar:magic-stick-3-linear' : cat === 'Email' ? 'solar:letter-linear' : cat === 'SMS' ? 'solar:chat-line-linear' : cat === 'WhatsApp' ? 'solar:chat-round-dots-linear' : cat === 'CRM' ? 'solar:users-group-rounded-linear' : cat === 'Voice & Chatbot' ? 'solar:microphone-3-linear' : 'solar:widget-4-linear'} className={cn('h-4 w-4', colors.text)} />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider">{cat}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
              {categoryIntegrations.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {categoryIntegrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                savedValues={apiKeys[integration.id]}
                onSave={handleSaveKeys}
              />
            ))}
          </div>
        </div>
      )})}
    </div>
  );
}
