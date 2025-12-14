'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { AiChatbotIcon } from '@/components/icons/ai-chatbot-icon';
import { CodeBlock } from '@/components/ui/code-block';

interface WebsiteEmbedCodesProps {
  cardUsername: string;
  calcomUsername?: string;
  calcomEventSlug?: string;
  voiceChatEnabled?: boolean;
  contactFormEnabled?: boolean;
  calendarBookingEnabled?: boolean;
  primaryColor?: string;
  businessName?: string;
}

export default function WebsiteEmbedCodes({
  cardUsername,
  calcomUsername,
  calcomEventSlug,
  voiceChatEnabled,
  primaryColor = '#3B82F6',
  businessName = 'My Business'
}: WebsiteEmbedCodesProps) {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}` 
    : 'https://app.omniflow.wmart.in';
  
  const digitalCardUrl = `${baseUrl}/card/${cardUsername}`;
  const calcomUrl = calcomEventSlug 
    ? `https://cal.com/${calcomUsername}/${calcomEventSlug}`
    : `https://cal.com/${calcomUsername}`;

  const digitalCardEmbedCode = `<!-- OmniFlow Digital Card Embed -->
<iframe 
  src="${digitalCardUrl}" 
  width="100%" 
  height="800" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 450px;">
</iframe>`;

  const digitalCardButtonCode = `<!-- Link to Digital Card -->
<a href="${digitalCardUrl}" 
   target="_blank"
   style="display: inline-block; background: ${primaryColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-family: Arial, sans-serif; font-weight: 500;">
  💬 Contact ${businessName}
</a>`;

  const calcomInlineCode = calcomUsername ? `<!-- Cal.com Inline Booking Calendar -->
<div style="position: relative; width: 100%; max-width: 100%; overflow: hidden;">
  <iframe 
    src="${calcomUrl}?embed=true&theme=light" 
    width="100%" 
    height="600" 
    frameborder="0"
    style="border-radius: 8px; min-width: 280px; max-width: 100%; border: none;"
    loading="lazy">
  </iframe>
</div>` : '';

  const calcomPopupCode = calcomUsername ? `<!-- Cal.com Popup Booking Button -->
<script src="https://app.cal.com/embed/embed.js" async></script>
<button 
  data-cal-link="${calcomUsername}${calcomEventSlug ? '/' + calcomEventSlug : ''}" 
  style="background: ${primaryColor}; color: white; padding: 14px 28px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
  📅 Book Appointment
</button>` : '';

  const calcomFloatingCode = calcomUsername ? `<!-- Cal.com Floating Button -->
<script src="https://app.cal.com/embed/embed.js" async></script>
<script>
  Cal("floatingButton", {
    calLink: "${calcomUsername}${calcomEventSlug ? '/' + calcomEventSlug : ''}",
    buttonText: "Book Now",
    buttonColor: "${primaryColor}",
    buttonTextColor: "#ffffff"
  });
</script>` : '';

  const directLinksCode = `Your Digital Card URL:
${digitalCardUrl}
${calcomUsername ? `
Your Booking URL:
${calcomUrl}

Embeddable Booking URL:
${calcomUrl}?embed=true` : ''}

Share these links anywhere:
• Email signatures
• Social media bios
• WhatsApp/SMS messages
• QR codes`;

  const voiceChatInstructions = `Voice Chat AI is configured company-wide in Settings.

To add Voice AI to any external website:

1. Go to Settings → API Integrations
2. Scroll to "Voice Chat AI" section
3. Copy your widget embed code
4. Paste it into your website's HTML (before </body> tag)

The widget provides:
• Live voice chat in 109+ languages
• AI-powered conversations 24/7
• Automatic lead capture
• Direct CRM integration`;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon icon="solar:code-linear" className="h-5 w-5 text-muted-foreground" />
          Website Embed Codes
        </CardTitle>
        <CardDescription>
          Copy these codes to add booking and lead capture to any website
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!cardUsername && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please set a username in the Basic Info tab first to generate embed codes.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="links" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="links" className="gap-1.5">
              <Icon icon="solar:link-linear" className="h-4 w-4" />
              <span className="hidden sm:inline">Links</span>
            </TabsTrigger>
            <TabsTrigger value="calcom" className="gap-1.5">
              <Icon icon="solar:calendar-linear" className="h-4 w-4" />
              <span className="hidden sm:inline">Booking</span>
            </TabsTrigger>
            <TabsTrigger value="card" className="gap-1.5">
              <Icon icon="solar:chat-square-linear" className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="voicechat" className="gap-1.5">
              <AiChatbotIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Voice AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4">
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-primary shrink-0" />
                No coding required! Share these URLs directly via email, social media, or QR codes.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Direct URLs</p>
              <p className="text-xs text-muted-foreground">Share these links anywhere without any code</p>
              <CodeBlock code={directLinksCode} language="text" />
            </div>
          </TabsContent>

          <TabsContent value="calcom" className="space-y-4">
            {calcomUsername ? (
              <>
                <div className="p-3 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-primary shrink-0" />
                    Cal.com is configured! Bookings will sync to OmniFlow CRM automatically.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Popup Button (Recommended)</p>
                  <p className="text-xs text-muted-foreground">Opens calendar in a modal when clicked</p>
                  <CodeBlock code={calcomPopupCode} language="html" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Inline Calendar</p>
                  <p className="text-xs text-muted-foreground">Shows the full calendar directly on your page</p>
                  <CodeBlock code={calcomInlineCode} language="html" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Floating Button</p>
                  <p className="text-xs text-muted-foreground">Fixed button in bottom corner of page</p>
                  <CodeBlock code={calcomFloatingCode} language="html" />
                </div>
              </>
            ) : (
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Cal.com is not configured. Enable Calendar Booking in the Lead Capture tab and enter your Cal.com username to get booking embed codes.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="card" className="space-y-4">
            <div className="p-3 bg-muted/50 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-primary shrink-0" />
                Leads submitted through your Digital Card go directly to your OmniFlow CRM.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Contact Button (Recommended)</p>
              <p className="text-xs text-muted-foreground">Opens your Digital Card in a new tab</p>
              <CodeBlock code={digitalCardButtonCode} language="html" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Embedded Card</p>
              <p className="text-xs text-muted-foreground">Shows your full Digital Card on your website</p>
              <CodeBlock code={digitalCardEmbedCode} language="html" />
            </div>
          </TabsContent>

          <TabsContent value="voicechat" className="space-y-4">
            {voiceChatEnabled ? (
              <>
                <div className="p-3 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-primary shrink-0" />
                    Voice Chat AI is enabled! Get your widget code from Settings → API Integrations.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">How to Add Voice AI</p>
                  <p className="text-xs text-muted-foreground">Your personalized embed code is available in Settings</p>
                  <CodeBlock code={voiceChatInstructions} language="text" />
                </div>
                <div className="p-4 bg-muted/50 border border-border rounded-lg">
                  <p className="text-sm text-foreground mb-3">
                    Go to Settings → API Integrations → Voice Chat AI to copy your ready-to-use embed code.
                  </p>
                  <a 
                    href="/crm/integrations" 
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    <Icon icon="solar:settings-linear" className="h-4 w-4" />
                    Open API Integrations
                  </a>
                </div>
              </>
            ) : (
              <div className="p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Voice Chat AI is not enabled on this card. Enable it in the Lead Capture tab to use Voice AI for lead capture.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
          <h4 className="font-medium text-sm text-foreground mb-2">How Leads Flow to OmniFlow:</h4>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <Icon icon="solar:calendar-linear" className="h-3.5 w-3.5 text-primary" />
              Cal.com Bookings → Sync in CRM → Appointments
            </li>
            <li className="flex items-center gap-2">
              <Icon icon="solar:chat-square-linear" className="h-3.5 w-3.5 text-primary" />
              Digital Card Form → Directly added to CRM → Leads
            </li>
            <li className="flex items-center gap-2">
              <AiChatbotIcon className="h-3.5 w-3.5 text-primary" />
              Voice Chat AI → Captures contact info → Creates leads automatically
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
