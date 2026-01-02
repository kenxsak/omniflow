'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { generateEmbedAccessKey, getEmbedAccessKey } from '@/app/actions/embed-form-actions';

// Common country codes for phone input
const COUNTRY_CODES = [
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+1', country: 'US', name: 'USA/Canada' },
  { code: '+44', country: 'GB', name: 'UK' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia' },
  { code: '+65', country: 'SG', name: 'Singapore' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+81', country: 'JP', name: 'Japan' },
  { code: '+86', country: 'CN', name: 'China' },
  { code: '+55', country: 'BR', name: 'Brazil' },
  { code: '+27', country: 'ZA', name: 'South Africa' },
  { code: '+234', country: 'NG', name: 'Nigeria' },
  { code: '+254', country: 'KE', name: 'Kenya' },
];

export function EmbedFormGenerator() {
  const { toast } = useToast();
  const { company, appUser } = useAuth();
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSource, setCustomSource] = useState('Website Contact Form');
  const [showMessage, setShowMessage] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [defaultCountryCode, setDefaultCountryCode] = useState('+91');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.omniflow.wmart.in';

  useEffect(() => {
    if (appUser?.idToken) {
      loadAccessKey();
    }
  }, [appUser?.idToken]);

  const loadAccessKey = async () => {
    if (!appUser?.idToken) return;
    setIsLoading(true);
    try {
      const result = await getEmbedAccessKey(appUser.idToken);
      if (result.success && result.accessKey) {
        setAccessKey(result.accessKey);
      }
    } catch (error) {
      console.error('Error loading access key:', error);
    }
    setIsLoading(false);
  };

  const handleGenerateKey = async () => {
    if (!appUser?.idToken) return;
    setIsGenerating(true);
    try {
      const result = await generateEmbedAccessKey(appUser.idToken);
      if (result.success && result.accessKey) {
        setAccessKey(result.accessKey);
        toast({ title: 'Access Key Generated!', description: 'You can now use embed forms on any website.' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to generate key', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate key', variant: 'destructive' });
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} Copied!` });
  };

  // Generate HTML form code with country code selector
  const generateHtmlCode = () => {
    const countryOptions = COUNTRY_CODES.map(c => 
      `<option value="${c.code}" ${c.code === defaultCountryCode ? 'selected' : ''}>${c.country} ${c.code}</option>`
    ).join('\n              ');
    
    return `<!-- Lead Capture Form -->
<form action="${appUrl}/api/embed-lead" method="POST" style="max-width:400px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" onsubmit="return validateEmbedForm(this)">
  <input type="hidden" name="access_key" value="${accessKey}">
  <input type="hidden" name="source" value="${customSource}">
  <input type="text" name="_honeypot" style="display:none" tabindex="-1" autocomplete="off">
  
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:6px;">Name <span style="color:#ef4444">*</span></label>
    <input type="text" name="name" required placeholder="Your name" 
      style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
  </div>
  
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:6px;">Email <span style="color:#ef4444">*</span></label>
    <input type="email" name="email" required placeholder="you@example.com"
      style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
  </div>
  
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:6px;">Phone <span style="color:#ef4444">*</span></label>
    <div style="display:flex;gap:8px;">
      <select name="country_code" required style="width:100px;padding:10px 8px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;background:#fff;">
              ${countryOptions}
      </select>
      <input type="tel" name="phone_number" required placeholder="9876543210" pattern="[0-9]{6,15}"
        style="flex:1;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">
    </div>
    <p style="margin-top:4px;font-size:11px;color:#9ca3af;">Select country code and enter phone number</p>
  </div>
  ${showMessage ? `
  <div style="margin-bottom:16px;">
    <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:6px;">Message <span style="color:#9ca3af;font-weight:400">(optional)</span></label>
    <textarea name="message" rows="3" placeholder="How can we help you?"
      style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea>
  </div>` : ''}
  
  <button type="submit" 
    style="width:100%;padding:12px;background:${primaryColor};color:#fff;font-size:15px;font-weight:600;border:none;border-radius:8px;cursor:pointer;">
    Send Message
  </button>
  
  <p style="margin-top:12px;font-size:11px;color:#9ca3af;text-align:center;">
    Powered by <a href="${appUrl}" target="_blank" style="color:#6366f1;text-decoration:none;">${company?.name || 'OmniFlow'}</a>
  </p>
</form>

<script>
function validateEmbedForm(form) {
  var countryCode = form.country_code.value;
  var phoneNumber = form.phone_number.value.replace(/\\D/g, '');
  // Combine country code and phone number into hidden field
  var fullPhone = countryCode + phoneNumber;
  var phoneInput = document.createElement('input');
  phoneInput.type = 'hidden';
  phoneInput.name = 'phone';
  phoneInput.value = fullPhone;
  form.appendChild(phoneInput);
  return true;
}
</script>`;
  };

  // Generate React/Next.js code with country code selector
  const generateReactCode = () => {
    return `// Lead Capture Form - React Component
import { useState } from 'react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+1', country: 'US', name: 'USA/Canada' },
  { code: '+44', country: 'GB', name: 'UK' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+966', country: 'SA', name: 'Saudi Arabia' },
  { code: '+65', country: 'SG', name: 'Singapore' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+49', country: 'DE', name: 'Germany' },
];

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countryCode, setCountryCode] = useState('${defaultCountryCode}');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const phoneNumber = formData.get('phone_number');
    const fullPhone = countryCode + phoneNumber.replace(/\\D/g, '');
    
    try {
      const res = await fetch('${appUrl}/api/embed-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '${accessKey}',
          source: '${customSource}',
          name: formData.get('name'),
          email: formData.get('email'),
          phone: fullPhone,
          message: formData.get('message'),
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return <div>Thank you! We'll be in touch soon.</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="name" placeholder="Name *" required />
      <input type="email" name="email" placeholder="Email *" required />
      <div style={{ display: 'flex', gap: '8px' }}>
        <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required>
          {COUNTRY_CODES.map(c => (
            <option key={c.code} value={c.code}>{c.country} {c.code}</option>
          ))}
        </select>
        <input type="tel" name="phone_number" placeholder="Phone Number *" required pattern="[0-9]{6,15}" />
      </div>
      ${showMessage ? `<textarea name="message" placeholder="Message (optional)" />` : ''}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}`;
  };

  // Generate WordPress shortcode info
  const generateWordPressCode = () => {
    return `<!-- WordPress: Add this to your theme's functions.php or use a plugin like "Insert Headers and Footers" -->

<!-- Option 1: Direct HTML (paste in any page/post using HTML block) -->
${generateHtmlCode()}

<!-- Option 2: Using Contact Form 7 with webhook -->
<!-- Install "Contact Form 7" and "CF7 to Webhook" plugins -->
<!-- Set webhook URL to: ${appUrl}/api/embed-lead -->
<!-- Add hidden field: [hidden access_key "${accessKey}"] -->

<!-- Option 3: Using WPForms or Gravity Forms -->
<!-- Use the webhook/API addon and point to: ${appUrl}/api/embed-lead -->
<!-- Include access_key field with value: ${accessKey} -->`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Icon icon="solar:code-square-bold" className="h-5 w-5" />
              Embed Lead Capture Form
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Add a contact form to any website. Leads go directly to your CRM with email notifications.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs w-fit shrink-0">
            <Icon icon="solar:shield-check-bold" className="h-3 w-3 mr-1" />
            Spam Protected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
        {/* Access Key Section */}
        <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <Label className="text-sm font-medium">Your Access Key</Label>
            {accessKey && (
              <Button variant="ghost" size="sm" className="h-7 text-xs w-fit" onClick={handleGenerateKey}>
                <Icon icon="solar:refresh-linear" className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            )}
          </div>
          
          {accessKey ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 px-3 py-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs sm:text-sm font-mono break-all overflow-hidden">
                {accessKey}
              </code>
              <Button variant="outline" size="sm" className="h-9 sm:h-10 shrink-0" onClick={() => copyToClipboard(accessKey, 'Access Key')}>
                <Icon icon="solar:copy-linear" className="h-4 w-4 mr-1.5 sm:mr-0" />
                <span className="sm:hidden">Copy Key</span>
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateKey} disabled={isGenerating} className="w-full sm:w-auto">
              {isGenerating ? (
                <>
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon icon="solar:key-bold" className="h-4 w-4 mr-2" />
                  Generate Access Key
                </>
              )}
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            Keep this key secret. Anyone with this key can submit leads to your CRM.
          </p>
        </div>

        {accessKey && (
          <>
            {/* Customization Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Source Label</Label>
                <Input 
                  value={customSource} 
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Website Contact Form"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Default Country</Label>
                <Select value={defaultCountryCode} onValueChange={setDefaultCountryCode}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.country} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Button Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 sm:h-10 w-14 p-1 cursor-pointer"
                  />
                  <Input 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 sm:h-10 text-sm font-mono flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Optional Fields</Label>
                <Button 
                  variant={showMessage ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-9 sm:h-10 text-xs w-full"
                  onClick={() => setShowMessage(!showMessage)}
                >
                  {showMessage ? '✓ Message Field' : 'Add Message Field'}
                </Button>
              </div>
            </div>

            {/* Code Tabs */}
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                <TabsTrigger value="html" className="text-[10px] sm:text-xs py-2">
                  <Icon icon="solar:code-linear" className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">HTML</span>
                </TabsTrigger>
                <TabsTrigger value="react" className="text-[10px] sm:text-xs py-2">
                  <Icon icon="logos:react" className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">React</span>
                </TabsTrigger>
                <TabsTrigger value="wordpress" className="text-[10px] sm:text-xs py-2">
                  <Icon icon="logos:wordpress-icon" className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">WordPress</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="mt-4">
                <div className="relative">
                  <pre className="p-3 sm:p-4 bg-stone-950 text-stone-100 rounded-xl text-[10px] sm:text-xs overflow-x-auto max-h-[250px] sm:max-h-[300px]">
                    <code>{generateHtmlCode()}</code>
                  </pre>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute top-2 right-2 h-7 text-[10px] sm:text-xs"
                    onClick={() => copyToClipboard(generateHtmlCode(), 'HTML Code')}
                  >
                    <Icon icon="solar:copy-linear" className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="react" className="mt-4">
                <div className="relative">
                  <pre className="p-3 sm:p-4 bg-stone-950 text-stone-100 rounded-xl text-[10px] sm:text-xs overflow-x-auto max-h-[250px] sm:max-h-[300px]">
                    <code>{generateReactCode()}</code>
                  </pre>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute top-2 right-2 h-7 text-[10px] sm:text-xs"
                    onClick={() => copyToClipboard(generateReactCode(), 'React Code')}
                  >
                    <Icon icon="solar:copy-linear" className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="wordpress" className="mt-4">
                <div className="relative">
                  <pre className="p-3 sm:p-4 bg-stone-950 text-stone-100 rounded-xl text-[10px] sm:text-xs overflow-x-auto max-h-[250px] sm:max-h-[300px]">
                    <code>{generateWordPressCode()}</code>
                  </pre>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="absolute top-2 right-2 h-7 text-[10px] sm:text-xs"
                    onClick={() => copyToClipboard(generateWordPressCode(), 'WordPress Code')}
                  >
                    <Icon icon="solar:copy-linear" className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { icon: 'solar:shield-check-bold', label: 'Spam Protected', color: 'text-green-600' },
                { icon: 'solar:letter-bold', label: 'Email Alerts', color: 'text-blue-600' },
                { icon: 'solar:database-bold', label: 'CRM Sync', color: 'text-purple-600' },
                { icon: 'solar:infinity-bold', label: 'Unlimited', color: 'text-orange-600' },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon icon={feature.icon} className={`h-4 w-4 ${feature.color}`} />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
