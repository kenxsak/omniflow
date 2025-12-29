'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmailSetupPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Platform Email Setup</h2>
        <p className="text-sm text-muted-foreground">
          Configure email service for platform notifications (welcome emails, billing alerts, password resets)
        </p>
      </div>

      {/* Purpose Explanation */}
      <Alert>
        <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
        <AlertDescription>
          <strong>This is for platform communications only.</strong> Users will set up their own email providers 
          in Settings → Integrations for their marketing campaigns.
        </AlertDescription>
      </Alert>

      {/* Sender.net - Recommended */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Icon icon="solar:letter-bold" className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Sender.net</CardTitle>
                <CardDescription>Recommended - Free tier available (15,000 emails/month)</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">Recommended</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible defaultValue="setup">
            <AccordionItem value="setup">
              <AccordionTrigger className="text-sm font-medium">Setup Instructions</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                  <li>Create free account at <a href="https://www.sender.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">sender.net</a></li>
                  <li>Verify your email domain (recommended for deliverability)</li>
                  <li>Go to <strong>Settings → API Tokens</strong></li>
                  <li>Click "Create new API token"</li>
                  <li>Copy the token and add to Vercel</li>
                </ol>
                
                <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Add to Vercel Environment Variables:</p>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border">
                    <code className="text-sm font-mono">SENDER_API_KEY=your_api_key_here</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('SENDER_API_KEY=', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Brevo - Alternative */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="solar:letter-bold" className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">Brevo (Sendinblue)</CardTitle>
              <CardDescription>Alternative - Free tier (300 emails/day)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="setup">
              <AccordionTrigger className="text-sm font-medium">Setup Instructions</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                  <li>Create account at <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">brevo.com</a></li>
                  <li>Go to <strong>SMTP & API → API Keys</strong></li>
                  <li>Generate new API key</li>
                  <li>Copy and add to Vercel</li>
                </ol>
                
                <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Add to Vercel Environment Variables:</p>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border">
                    <code className="text-sm font-mono">BREVO_API_KEY=your_api_key_here</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('BREVO_API_KEY=', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Custom SMTP */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Icon icon="solar:server-bold" className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <CardTitle className="text-base">Custom SMTP</CardTitle>
              <CardDescription>Use your own SMTP server (Gmail, Outlook, etc.)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="setup">
              <AccordionTrigger className="text-sm font-medium">SMTP Configuration</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Add to Vercel Environment Variables:</p>
                  {[
                    { key: 'SMTP_HOST', value: 'smtp.gmail.com', desc: 'SMTP server hostname' },
                    { key: 'SMTP_PORT', value: '587', desc: 'Usually 587 (TLS) or 465 (SSL)' },
                    { key: 'SMTP_USER', value: 'your_email@gmail.com', desc: 'Your email address' },
                    { key: 'SMTP_PASSWORD', value: 'your_app_password', desc: 'App password (not regular password)' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border">
                      <div>
                        <code className="text-sm font-mono">{item.key}={item.value}</code>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${item.key}=`, 'Variable')}>
                        <Icon icon="solar:copy-linear" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <Icon icon="solar:danger-triangle-linear" className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    For Gmail, enable 2FA and create an App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com/apppasswords</a>
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Final Step */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-primary" />
            Final Step: Redeploy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            After adding environment variables in Vercel, click <strong>"Redeploy"</strong> to apply changes.
            The platform will automatically use the configured email service for notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
