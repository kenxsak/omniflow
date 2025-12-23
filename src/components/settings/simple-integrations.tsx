'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { fetchCompanyApiKeysAction, saveApiKeysAction } from '@/app/actions/api-keys-actions';
import { getVoiceChatConfig, saveVoiceChatConfig } from '@/app/actions/voice-chat-actions';
import { GeminiIcon, BrevoIcon, TwilioIcon, Fast2SMSIcon, WhatsAppIcon, ZohoIcon } from '@/components/icons/brand-icons';
import NextImage from 'next/image';

// Custom icon component that handles both Iconify and custom SVG icons
const IntegrationIcon = ({
  integrationId,
  icon,
  className,
  size = 'sm',
}: {
  integrationId: string;
  icon: string;
  className?: string;
  size?: 'sm' | 'lg';
}) => {
  // Map integration IDs to custom icons
  const customIcons: Record<string, React.ReactNode> = {
    googleAi: <GeminiIcon className={className} />,
    brevo: <BrevoIcon className={className} />,
    twilio: <TwilioIcon className={className} />,
    fast2sms: <Fast2SMSIcon className={className} />,
    metaWhatsApp: <WhatsAppIcon className={className} />,
    zoho: <ZohoIcon className={className} />,
  };

  // External logo URLs for services that need images
  const logoUrls: Record<string, string> = {
    aisensy: 'https://unicorn-images.b-cdn.net/fd22de22-b00f-495c-bc0e-36d28dd817e6?optimizer=gif',
    sender: 'https://www.sender.net/assets/brand-assets/sender-logo-default.png',
    gupshup: 'https://stag-smapi.gupshup.io/developer/resources/img/assets/2019/logo_type3.png',
    calcom: 'https://cal.com/logo.svg',
    hubspot: 'https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png',
    bitrix24: 'https://www.bitrix24.com/images/content_en/logo/logo-bitrix24.svg',
  };

  // Bigger sizes: sm = 24px for sidebar, lg = 32px for header
  const imgSize = size === 'lg' ? 32 : 24;

  if (customIcons[integrationId]) {
    return <>{customIcons[integrationId]}</>;
  }

  if (logoUrls[integrationId]) {
    return (
      <NextImage
        src={logoUrls[integrationId]}
        alt={integrationId}
        width={imgSize}
        height={imgSize}
        className="object-contain"
        style={{ width: imgSize, height: imgSize, minWidth: imgSize, minHeight: imgSize }}
        unoptimized
      />
    );
  }

  // Fallback to Iconify icon
  return <Icon icon={icon} className={className} />;
};

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  docLink: string;
  category: string;
  fields: { key: string; label: string; placeholder: string; help?: string }[];
}

const INTEGRATIONS: Integration[] = [
  // LLM AI
  {
    id: 'googleAi',
    name: 'Google AI (Gemini)',
    icon: 'solar:stars-linear',
    description: 'Bring your own API key for unlimited AI content generation, image creation, and automation',
    docLink: 'https://aistudio.google.com/app/apikey',
    category: 'LLM AI',
    fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...', help: 'Step 1: Sign in with Google. Step 2: Click "Create API Key". Step 3: Copy and paste here.' }]
  },
  // Voice & Chatbot
  {
    id: 'voiceChat',
    name: 'Voice Chat AI Widget',
    icon: 'solar:microphone-3-linear',
    description: 'AI-powered voice chatbot for digital cards, websites, and customer interactions',
    docLink: 'https://app.voicechatai.wmart.in/dashboard?tab=embed',
    category: 'Voice & Chatbot',
    fields: [
      { key: 'widgetId', label: 'Agent ID', placeholder: 'e.g., agent_1755699726191', help: 'Step 1: Create an account. Step 2: Go to "Agents" section. Step 3: Copy your Agent ID.' },
      { key: 'apiKey', label: 'Embed Script Code', placeholder: '<script src="https://app.voicechatai.wmart.in/widget.js?..."', help: 'Step 4: Go to "Embed Widget on Your Website". Step 5: Copy the full script code.' }
    ]
  },
  // Email
  {
    id: 'brevo',
    name: 'Brevo',
    icon: 'solar:letter-linear',
    description: 'Send professional email campaigns with tracking and automation (Free: 300 emails/day)',
    docLink: 'https://app.brevo.com/settings/keys/api',
    category: 'Email',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'xkeysib-...', help: 'Step 1: Create account at brevo.com. Step 2: Go to Settings > SMTP & API. Step 3: Create and copy your API Key.' },
      { key: 'senderEmail', label: 'Sender Email', placeholder: 'noreply@example.com', help: 'Must be a verified sender email in your Brevo account.' },
      { key: 'senderName', label: 'Sender Name', placeholder: 'Your Company' },
      { key: 'defaultListId', label: 'Default Contact Group (Optional)', placeholder: 'e.g., 2' }
    ]
  },
  {
    id: 'sender',
    name: 'Sender.net',
    icon: 'solar:mailbox-linear',
    description: 'Email marketing with generous free tier (Free: 2,500 emails/month)',
    docLink: 'https://app.sender.net/settings/api',
    category: 'Email',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '', help: 'Step 1: Create account at sender.net. Step 2: Go to Settings > API. Step 3: Generate and copy your API Key.' },
      { key: 'senderEmail', label: 'Sender Email', placeholder: '', help: 'Must be a verified sender email.' },
      { key: 'senderName', label: 'Sender Name', placeholder: '' }
    ]
  },
  {
    id: 'smtp',
    name: 'Custom SMTP',
    icon: 'solar:server-linear',
    description: 'Send emails using your own SMTP server (Gmail, Amazon SES, etc.)',
    docLink: 'https://support.google.com/accounts/answer/185833',
    category: 'Email',
    fields: [
      { key: 'host', label: 'SMTP Host', placeholder: 'smtp.gmail.com', help: 'For Gmail: smtp.gmail.com. For Amazon SES: email-smtp.[region].amazonaws.com' },
      { key: 'port', label: 'SMTP Port', placeholder: '587', help: 'Usually 587 (TLS) or 465 (SSL)' },
      { key: 'username', label: 'Username/Email', placeholder: 'your-email@gmail.com' },
      { key: 'password', label: 'Password or App Password', placeholder: '', help: 'For Gmail: Create App Password at myaccount.google.com > Security > 2-Step Verification > App passwords' },
      { key: 'fromEmail', label: 'From Email', placeholder: 'noreply@yourcompany.com' },
      { key: 'fromName', label: 'From Name', placeholder: 'Your Company' }
    ]
  },
  // SMS
  {
    id: 'twilio',
    name: 'Twilio',
    icon: 'solar:smartphone-linear',
    description: 'Premium global SMS with high reliability',
    docLink: 'https://console.twilio.com/us1/account/keys-credentials/api-keys',
    category: 'SMS',
    fields: [
      { key: 'accountSid', label: 'Account SID', placeholder: 'AC...', help: 'Step 1: Create account at twilio.com. Step 2: Find Account SID on Console Dashboard.' },
      { key: 'authToken', label: 'Auth Token', placeholder: '', help: 'Step 3: Find Auth Token on Console Dashboard (click to reveal).' },
      { key: 'phoneNumber', label: 'Phone Number', placeholder: '+1...', help: 'Step 4: Buy a phone number in Console > Phone Numbers > Buy a Number.' }
    ]
  },
  {
    id: 'msg91',
    name: 'MSG91',
    icon: 'solar:chat-square-linear',
    description: 'Affordable bulk SMS for India & global with DLT compliance',
    docLink: 'https://control.msg91.com/app/settings/authkey',
    category: 'SMS',
    fields: [
      { key: 'authKey', label: 'Auth Key', placeholder: '', help: 'Step 1: Create account at msg91.com. Step 2: Go to Settings > Authkey. Step 3: Copy your Auth Key.' },
      { key: 'senderId', label: 'Sender ID', placeholder: '', help: 'Step 4: Register Sender ID in Settings > DLT Settings (required for India).' }
    ]
  },
  {
    id: 'fast2sms',
    name: 'Fast2SMS',
    icon: 'solar:bolt-linear',
    description: 'Fast & affordable SMS for India',
    docLink: 'https://www.fast2sms.com/dashboard/dev-api',
    category: 'SMS',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '', help: 'Step 1: Create account at fast2sms.com. Step 2: Go to Dev API. Step 3: Copy your API Authorization Key.' },
      { key: 'senderId', label: 'Sender ID (Optional)', placeholder: 'e.g., FSTSMS', help: 'Register DLT Sender ID for promotional messages in India.' }
    ]
  },
  // WhatsApp
  {
    id: 'metaWhatsApp',
    name: 'Meta WhatsApp Cloud API',
    icon: 'solar:chat-round-line-linear',
    description: 'Official WhatsApp Business API - Zero monthly fees, pay only per message',
    docLink: 'https://developers.facebook.com/apps/',
    category: 'WhatsApp',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', placeholder: '', help: 'Step 1: Create Meta Developer account. Step 2: Create App > Add WhatsApp Product. Step 3: Find Phone Number ID in API Setup.' },
      { key: 'accessToken', label: 'Access Token', placeholder: '', help: 'Step 4: Generate Permanent Access Token in System Users section.' },
      { key: 'wabaId', label: 'WABA ID (Optional)', placeholder: '', help: 'Find WhatsApp Business Account ID in WhatsApp Manager.' }
    ]
  },
  {
    id: 'msg91WhatsApp',
    name: 'MSG91 WhatsApp',
    icon: 'solar:chat-round-dots-linear',
    description: 'WhatsApp messaging through MSG91 for India',
    docLink: 'https://control.msg91.com/app/whatsapp-new/dashboard',
    category: 'WhatsApp',
    fields: [
      { key: 'authKey', label: 'Auth Key', placeholder: '', help: 'Step 1: Login to msg91.com. Step 2: Go to Settings > Authkey. Step 3: Copy your Auth Key.' },
      { key: 'integratedNumber', label: 'WhatsApp Number', placeholder: '', help: 'Step 4: Register your WhatsApp Business number in WhatsApp section.' }
    ]
  },
  {
    id: 'fast2smsWhatsApp',
    name: 'Fast2SMS WhatsApp',
    icon: 'solar:chat-line-linear',
    description: 'WhatsApp via Fast2SMS for India',
    docLink: 'https://www.fast2sms.com/dashboard/whatsapp',
    category: 'WhatsApp',
    fields: [{ key: 'apiKey', label: 'API Key', placeholder: '', help: 'Step 1: Login to fast2sms.com. Step 2: Go to WhatsApp API section. Step 3: Copy your API Key.' }]
  },
  {
    id: 'gupshup',
    name: 'Gupshup',
    icon: 'solar:global-linear',
    description: 'Enterprise WhatsApp - Great for high volume messaging',
    docLink: 'https://www.gupshup.io/developer/home',
    category: 'WhatsApp',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '', help: 'Step 1: Create account at gupshup.io. Step 2: Go to Developer Portal > API Keys.' },
      { key: 'appName', label: 'App ID', placeholder: '', help: 'Step 3: Create an App and copy the App ID.' },
      { key: 'srcName', label: 'App Name', placeholder: '', help: 'Step 4: Copy your App Name from the App settings.' },
      { key: 'phoneNumber', label: 'Business Number', placeholder: '', help: 'Step 5: Register your WhatsApp Business phone number.' }
    ]
  },
  {
    id: 'authkey',
    name: 'WMart CPaaS',
    icon: 'solar:key-linear',
    description: 'Multi-channel CPaaS platform - WhatsApp, SMS, Email, Voice in one API',
    docLink: 'https://wmart.in/cpaas/',
    category: 'All in One',
    fields: [{ key: 'apiKey', label: 'API Key', placeholder: '', help: 'Step 1: Visit wmart.in/cpaas. Step 2: Create your account. Step 3: Go to Settings > API Keys. Step 4: Create and copy your API Key.' }]
  },
  {
    id: 'aisensy',
    name: 'AiSensy',
    icon: 'solar:magic-stick-3-linear',
    description: 'WhatsApp automation with AI chatbot capabilities',
    docLink: 'https://app.aisensy.com/settings/api-settings',
    category: 'WhatsApp',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: '', help: 'Step 1: Create account at aisensy.com. Step 2: Go to Settings > API Settings. Step 3: Copy your API Key.' },
      { key: 'campaignName', label: 'Campaign Name (Optional)', placeholder: '', help: 'Step 4: Create a campaign and use its name for API calls.' }
    ]
  },
  // Other Tools
  {
    id: 'calcom',
    name: 'Cal.com',
    icon: 'solar:calendar-linear',
    description: 'Automated appointment booking with calendar sync',
    docLink: 'https://app.cal.com/settings/developer/api-keys',
    category: 'Other Tools',
    fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'cal_...', help: 'Step 1: Create account at cal.com. Step 2: Go to Settings > Developer > API Keys. Step 3: Create and copy your API Key.' }]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'solar:buildings-2-linear',
    description: 'Sync contacts and deals from HubSpot CRM',
    docLink: 'https://app.hubspot.com/private-apps',
    category: 'Other Tools',
    fields: [
      { key: 'apiKey', label: 'Access Token', placeholder: '', help: 'Step 1: Go to Settings > Integrations > Private Apps. Step 2: Create a Private App. Step 3: Copy the Access Token.' },
      { key: 'portalId', label: 'Portal ID', placeholder: '', help: 'Find Portal ID in Settings > Account Setup > Account Defaults.' }
    ]
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    icon: 'solar:chart-2-linear',
    description: 'Sync contacts and deals from Zoho CRM',
    docLink: 'https://api-console.zoho.com/',
    category: 'Other Tools',
    fields: [
      { key: 'clientId', label: 'Client ID', placeholder: '', help: 'Step 1: Go to api-console.zoho.com. Step 2: Create a Self Client. Step 3: Copy the Client ID.' },
      { key: 'clientSecret', label: 'Client Secret', placeholder: '', help: 'Step 4: Copy the Client Secret from the same page.' },
      { key: 'refreshToken', label: 'Refresh Token', placeholder: '', help: 'Step 5: Generate Refresh Token using the Generate Code button with scope crm.modules.ALL' },
      { key: 'domain', label: 'API Domain', placeholder: 'www.zohoapis.com', help: 'Use zohoapis.com (US), zohoapis.eu (EU), or zohoapis.in (India)' }
    ]
  },
  {
    id: 'bitrix24',
    name: 'Bitrix24',
    icon: 'solar:settings-linear',
    description: 'Sync contacts and deals from Bitrix24 CRM',
    docLink: 'https://helpdesk.bitrix24.com/open/12357770/',
    category: 'Other Tools',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', placeholder: '', help: 'Step 1: Go to Applications > Webhooks > Add Inbound Webhook. Step 2: Select permissions (CRM). Step 3: Copy the Webhook URL.' },
      { key: 'userId', label: 'User ID (Optional)', placeholder: '', help: 'Find your User ID in your Profile settings if needed.' }
    ]
  }
];

const CATEGORIES = ['LLM AI', 'Voice & Chatbot', 'Email', 'SMS', 'WhatsApp', 'All in One', 'Other Tools'];

interface IntegrationGroupProps {
  category: string;
  integrations: Integration[];
  selectedId: string;
  onSelect: (id: string) => void;
  savedKeys: Record<string, Record<string, string>>;
}

function IntegrationGroup({ category, integrations, selectedId, onSelect, savedKeys }: IntegrationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
      >
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">{category}</span>
        <Icon
          icon="solar:alt-arrow-down-linear"
          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-1 pl-1">
          {integrations.map(integration => {
            const hasKeys = savedKeys[integration.id] && Object.values(savedKeys[integration.id]).some(v => v);
            return (
              <button
                key={integration.id}
                onClick={() => onSelect(integration.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-3 border ${
                  selectedId === integration.id
                    ? 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900'
                    : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-900/50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 mt-0.5">
                  <IntegrationIcon integrationId={integration.id} icon={integration.icon} className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{integration.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{integration.description}</div>
                  {hasKeys && (
                    <div className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 font-medium mt-1">
                      <Icon icon="solar:check-circle-linear" className="h-3 w-3" />
                      Configured
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SimpleIntegrations() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [selected, setSelected] = useState('googleAi');
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [showKey, setShowKey] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadKeys = async () => {
      if (!appUser?.companyId) {
        setLoading(false);
        return;
      }
      try {
        const result = await fetchCompanyApiKeysAction(appUser.companyId);
        const keys = result.success && result.apiKeys ? result.apiKeys : {};

        const voiceChatResult = await getVoiceChatConfig(appUser.companyId);
        if (voiceChatResult.success && voiceChatResult.config) {
          const voiceChatConfig = voiceChatResult.config;
          keys.voiceChat = {
            widgetId: voiceChatConfig.chatbotId || '',
            apiKey: voiceChatConfig.widgetScript || ''
          };
        }

        if (Object.keys(keys).length > 0) {
          setFormData(keys);
          setLoading(false);
          return;
        }

        const savedLocal = localStorage.getItem('api_keys');
        if (savedLocal) {
          try {
            const localKeys = JSON.parse(savedLocal);
            for (const [integrationId, keyData] of Object.entries(localKeys)) {
              if (keyData && typeof keyData === 'object') {
                await saveApiKeysAction(appUser.companyId, integrationId, keyData as Record<string, string>);
              }
            }
            const result2 = await fetchCompanyApiKeysAction(appUser.companyId);
            if (result2.success && result2.apiKeys) {
              setFormData(result2.apiKeys);
            }
            localStorage.removeItem('api_keys');
          } catch (migrationError) {
            console.error('Migration failed:', migrationError);
          }
        }
      } catch (e) {
        console.error('Failed to load API keys:', e);
      } finally {
        setLoading(false);
      }
    };
    loadKeys();
  }, [appUser?.companyId]);

  const currentIntegration = INTEGRATIONS.find(i => i.id === selected)!;
  const data = formData[selected] || {};

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [selected]: { ...(prev[selected] || {}), [key]: value }
    }));
  };

  const handleSave = async () => {
    if (!appUser?.companyId) {
      toast({ title: 'Error', description: 'Company ID not found', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (selected === 'voiceChat') {
        const widgetScript = data.apiKey || '';
        const result = await saveVoiceChatConfig(appUser.companyId, widgetScript);
        if (result.success) {
          toast({ title: 'Success', description: 'Voice Chat AI Widget saved securely' });
        } else {
          toast({ title: 'Error', description: result.message || 'Failed to save Voice Chat configuration', variant: 'destructive' });
        }
      } else {
        const result = await saveApiKeysAction(appUser.companyId, selected, data);
        if (result.success) {
          // Reload keys from database to confirm they were saved
          const reloadResult = await fetchCompanyApiKeysAction(appUser.companyId);
          if (reloadResult.success && reloadResult.apiKeys) {
            setFormData(prev => ({
              ...prev,
              ...reloadResult.apiKeys
            }));
          }
          toast({ title: 'Success', description: `${currentIntegration.name} API keys saved securely` });
        } else {
          toast({ title: 'Error', description: result.error || 'Failed to save API keys', variant: 'destructive' });
        }
      }
    } catch (e) {
      console.error('Save error:', e);
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (fieldKey: string) => {
    const newSet = new Set(showKey);
    if (newSet.has(fieldKey)) {
      newSet.delete(fieldKey);
    } else {
      newSet.add(fieldKey);
    }
    setShowKey(newSet);
  };

  const groupedIntegrations = CATEGORIES.reduce((acc, category) => {
    acc[category] = INTEGRATIONS.filter(i => i.category === category);
    return acc;
  }, {} as Record<string, Integration[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 pb-6">
      {/* Left Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-2 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
          {CATEGORIES.map(category => (
            <IntegrationGroup
              key={category}
              category={category}
              integrations={groupedIntegrations[category]}
              selectedId={selected}
              onSelect={setSelected}
              savedKeys={formData}
            />
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-3">
        <Card className="sticky top-4 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl overflow-hidden">
          <CardHeader className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200/60 dark:border-stone-800/60 p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                <IntegrationIcon integrationId={currentIntegration.id} icon={currentIntegration.icon} className="h-7 w-7 text-foreground" size="lg" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold">{currentIntegration.name}</CardTitle>
                <CardDescription className="text-sm mt-1">{currentIntegration.description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Documentation Link */}
            <a
              href={currentIntegration.docLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <Icon icon="solar:square-arrow-right-up-linear" className="h-4 w-4" />
              Get API Key Documentation
            </a>

            {/* Form Fields */}
            <div className="space-y-4">
              {currentIntegration.fields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  {field.help && (
                    <p className="text-xs text-muted-foreground bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800/60">
                      {field.help}
                    </p>
                  )}
                  <div className="relative">
                    <Input
                      type={showKey.has(field.key) ? 'text' : 'password'}
                      placeholder={field.placeholder}
                      value={data[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      className="pr-10 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <Icon icon={showKey.has(field.key) ? 'solar:eye-closed-linear' : 'solar:eye-linear'} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Info */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
              <Icon icon="solar:shield-check-linear" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                API keys are encrypted and stored securely. Never share your API keys with others.
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full rounded-xl" disabled={saving} size="lg">
              {saving ? (
                <>
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="solar:diskette-linear" className="h-4 w-4 mr-2" />
                  Save API Keys
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
