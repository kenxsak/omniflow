'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function AISetupPage() {
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
        <h2 className="text-lg font-semibold">AI Services</h2>
        <p className="text-sm text-muted-foreground">
          Configure AI providers for content generation, chat, and image creation
        </p>
      </div>

      {/* Overview */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Icon icon="solar:magic-stick-3-bold" className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">AI-Powered Features</h3>
              <p className="text-sm text-muted-foreground mt-1">
                OmniFlow uses Google Gemini AI for all AI features. Configure your API key to enable:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                <div className="flex items-center gap-2 text-xs">
                  <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-purple-500" />
                  Content Generation
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Icon icon="solar:chat-round-dots-linear" className="h-4 w-4 text-blue-500" />
                  AI Chat Assistant
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Icon icon="solar:gallery-linear" className="h-4 w-4 text-pink-500" />
                  Image Generation
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Icon icon="solar:document-text-linear" className="h-4 w-4 text-green-500" />
                  Landing Page AI
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Gemini Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Icon icon="logos:google-gemini" className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base">Google Gemini AI</CardTitle>
                <CardDescription>Primary AI provider for all features</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-500/30">Required</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</div>
                  Get Google AI API Key
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-3">
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Go to Google AI Studio</li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Get API Key" in the top right</li>
                  <li>Create a new API key or use existing one</li>
                  <li>Copy the API key</li>
                </ol>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                    <Icon icon="solar:link-round-linear" className="h-4 w-4 mr-2" />
                    Open Google AI Studio
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</div>
                  Add to Vercel Environment
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Add this environment variable to Vercel:
                </p>
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-xs">GOOGLE_AI_API_KEY=your_api_key_here</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('GOOGLE_AI_API_KEY', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Go to Vercel Dashboard → Settings → Environment Variables → Add
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3">
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</div>
                  Redeploy Application
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-3">
                <p className="text-sm text-muted-foreground">
                  After adding the environment variable, redeploy your application:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Vercel Dashboard → Deployments</li>
                  <li>Click the three dots on the latest deployment</li>
                  <li>Select "Redeploy"</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* AI Features Enabled */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Features Enabled</CardTitle>
          <CardDescription>Features powered by Google Gemini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:pen-new-square-bold" className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-sm">Social Media Content</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate posts, captions, hashtags for all platforms
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:chat-round-dots-bold" className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-sm">AI Chat Assistant</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Marketing assistant for strategy and content ideas
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:gallery-bold" className="h-5 w-5 text-pink-500" />
                <span className="font-medium text-sm">Image Generation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Create images for social media and marketing
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:document-text-bold" className="h-5 w-5 text-green-500" />
                <span className="font-medium text-sm">Landing Page AI</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate and optimize landing page content
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:letter-bold" className="h-5 w-5 text-orange-500" />
                <span className="font-medium text-sm">Email Content</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate email subject lines and body content
              </p>
            </div>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:clipboard-text-bold" className="h-5 w-5 text-teal-500" />
                <span className="font-medium text-sm">Blog Posts</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate blog articles and SEO content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Hosting */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon icon="solar:gallery-bold" className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">ImgBB - Image Hosting</CardTitle>
              <CardDescription>For storing AI-generated and uploaded images</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="setup">
              <AccordionTrigger className="text-sm">Setup Instructions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">imgbb.com</a></li>
                  <li>Create a free account</li>
                  <li>Go to API section in your account</li>
                  <li>Generate an API key</li>
                </ol>
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <code className="text-xs">IMGBB_API_KEY=your_api_key</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard('IMGBB_API_KEY', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing & Limits</CardTitle>
          <CardDescription>Google Gemini API pricing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                <span className="text-sm font-medium">Free Tier Available</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Google Gemini offers a generous free tier for development and small-scale usage.
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>Gemini 1.5 Flash:</strong> Free up to 15 RPM, 1M TPM</p>
              <p>• <strong>Gemini 1.5 Pro:</strong> Free up to 2 RPM, 32K TPM</p>
              <p>• <strong>Pay-as-you-go:</strong> ~$0.00025 per 1K characters (input)</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer">
                <Icon icon="solar:link-round-linear" className="h-4 w-4 mr-2" />
                View Full Pricing
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Cost Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Usage Tracking</CardTitle>
          <CardDescription>Monitor AI usage across all companies</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            OmniFlow tracks AI usage per company. View detailed reports in:
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/super-admin-ai-costs">
              <Icon icon="solar:wallet-money-linear" className="h-4 w-4 mr-2" />
              View AI Costs Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
