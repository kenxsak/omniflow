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
      <div className="flex items-center justify-center h-48">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold">Platform Email Setup</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Configure email for platform notifications
        </p>
      </div>

      {/* Purpose Explanation */}
      <Alert className="p-3">
        <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
        <AlertDescription className="text-[11px] sm:text-xs">
          <strong>Platform communications only.</strong> Users set up their own email providers in Integrations.
        </AlertDescription>
      </Alert>

      {/* Sender.net - Recommended */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                <Icon icon="solar:letter-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base">Sender.net</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Free: 15,000 emails/month</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600 text-[9px] sm:text-xs w-fit">Recommended</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Accordion type="single" collapsible defaultValue="setup">
            <AccordionItem value="setup" className="border-none">
              <AccordionTrigger className="text-xs sm:text-sm font-medium py-2">Setup Instructions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ol className="text-[11px] sm:text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Create free account at <a href="https://www.sender.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">sender.net</a></li>
                  <li>Verify your email domain</li>
                  <li>Go to <strong>Settings → API Tokens</strong></li>
                  <li>Create new API token</li>
                  <li>Copy token and add to Vercel</li>
                </ol>
                
                <div className="p-2 sm:p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Environment Variable:</p>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border gap-2">
                    <code className="text-[10px] sm:text-xs font-mono break-all">SENDER_API_KEY=your_key</code>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyToClipboard('SENDER_API_KEY=', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-3.5 w-3.5" />
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
        <CardHeader className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Icon icon="solar:letter-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base">Brevo (Sendinblue)</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Free: 300 emails/day</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="setup" className="border-none">
              <AccordionTrigger className="text-xs sm:text-sm font-medium py-2">Setup Instructions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ol className="text-[11px] sm:text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Create account at <a href="https://www.brevo.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">brevo.com</a></li>
                  <li>Go to <strong>SMTP & API → API Keys</strong></li>
                  <li>Generate new API key</li>
                  <li>Copy and add to Vercel</li>
                </ol>
                
                <div className="p-2 sm:p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Environment Variable:</p>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border gap-2">
                    <code className="text-[10px] sm:text-xs font-mono break-all">BREVO_API_KEY=your_key</code>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyToClipboard('BREVO_API_KEY=', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-3.5 w-3.5" />
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
        <CardHeader className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              <Icon icon="solar:server-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-stone-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base">Custom SMTP</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Gmail, Outlook, etc.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="setup" className="border-none">
              <AccordionTrigger className="text-xs sm:text-sm font-medium py-2">SMTP Configuration</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="p-2 sm:p-3 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-2">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Environment Variables:</p>
                  {[
                    { key: 'SMTP_HOST', value: 'smtp.gmail.com', desc: 'SMTP server' },
                    { key: 'SMTP_PORT', value: '587', desc: 'Port (587 TLS)' },
                    { key: 'SMTP_USER', value: 'email@gmail.com', desc: 'Email' },
                    { key: 'SMTP_PASSWORD', value: 'app_password', desc: 'App password' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border gap-2">
                      <div className="min-w-0 flex-1">
                        <code className="text-[10px] sm:text-xs font-mono">{item.key}={item.value}</code>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyToClipboard(`${item.key}=`, 'Variable')}>
                        <Icon icon="solar:copy-linear" className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Alert className="p-2 sm:p-3">
                  <Icon icon="solar:danger-triangle-linear" className="h-3.5 w-3.5" />
                  <AlertDescription className="text-[10px] sm:text-xs">
                    For Gmail, enable 2FA and create App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myaccount.google.com</a>
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Final Step */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Icon icon="solar:check-circle-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Final Step: Redeploy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            After adding environment variables in Vercel, click <strong>"Redeploy"</strong> to apply changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
