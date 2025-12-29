'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SocialMediaSetupPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniflow-xi.vercel.app';

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
        <h2 className="text-lg font-semibold">Social Media Integration</h2>
        <p className="text-sm text-muted-foreground">
          Set up Buffer integration so users can publish to their social accounts
        </p>
      </div>

      {/* How it works */}
      <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
        <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong>Simple Setup:</strong> We use Buffer to handle all social media publishing. 
          You create ONE Buffer app, and all your users can connect their own Buffer accounts (free tier: 3 channels).
        </AlertDescription>
      </Alert>

      {/* Buffer Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Buffer OAuth App</CardTitle>
                <CardDescription>Required for social media publishing</CardDescription>
              </div>
            </div>
            <Badge>One-time setup</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
            <li>
              Go to{' '}
              <a 
                href="https://buffer.com/developers/apps" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline font-medium"
              >
                Buffer Developers
              </a>
            </li>
            <li>Click <strong>"Create an App"</strong></li>
            <li>Fill in your app details:
              <ul className="ml-6 mt-1 space-y-1 list-disc">
                <li>App Name: Your platform name (e.g., "OmniFlow")</li>
                <li>Description: Brief description of your app</li>
                <li>Organization: Your company name</li>
              </ul>
            </li>
            <li>Add the Callback URL:</li>
          </ol>
          
          <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
            <div className="flex items-center justify-between">
              <code className="text-xs break-all">{appUrl}/api/auth/buffer/callback</code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(`${appUrl}/api/auth/buffer/callback`, 'Callback URL')}
              >
                <Icon icon="solar:copy-linear" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside" start={5}>
            <li>After creating, copy the <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            <li>Add to your Vercel Environment Variables:</li>
          </ol>

          <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-lg space-y-2">
            {[
              { key: 'BUFFER_CLIENT_ID', desc: 'Your Buffer Client ID' },
              { key: 'BUFFER_CLIENT_SECRET', desc: 'Your Buffer Client Secret' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border">
                <div>
                  <code className="text-sm font-mono">{item.key}=</code>
                  <span className="text-xs text-muted-foreground ml-2">({item.desc})</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(`${item.key}=`, 'Variable name')}
                >
                  <Icon icon="solar:copy-linear" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* What Users Get */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="solar:users-group-rounded-linear" className="h-5 w-5 text-primary" />
            What Your Users Get
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Free Buffer Account</p>
                <p className="text-xs text-muted-foreground">3 social channels included</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">One-Click Connect</p>
                <p className="text-xs text-muted-foreground">Simple OAuth login</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">All Major Platforms</p>
                <p className="text-xs text-muted-foreground">FB, IG, LinkedIn, Twitter, Pinterest</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Scheduling Built-in</p>
                <p className="text-xs text-muted-foreground">Buffer handles scheduling</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Publish Alternative */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">Quick Publish (No Setup Needed)</p>
              <p className="text-blue-800 dark:text-blue-200">
                Users can also use "Quick Publish" buttons to copy content and open platforms directly. 
                This works without any Buffer connection and supports all platforms.
              </p>
            </div>
          </div>
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
            After adding the environment variables in Vercel, click <strong>"Redeploy"</strong> to apply changes.
            Users will then see the "Connect Buffer" option in Settings → Connected Accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
