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
        <h2 className="text-base sm:text-lg font-semibold">AI Services</h2>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          Configure AI for content generation and chat
        </p>
      </div>

      {/* Overview */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <Icon icon="solar:magic-stick-3-bold" className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">AI-Powered Features</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Google Gemini AI powers all AI features:
              </p>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <Icon icon="solar:pen-new-square-linear" className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span>Content Gen</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <Icon icon="solar:chat-round-dots-linear" className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>AI Chat</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <Icon icon="solar:gallery-linear" className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                  <span>Image Gen</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                  <Icon icon="solar:document-text-linear" className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>Landing Pages</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Gemini Setup */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Icon icon="logos:google-gemini" className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base">Google Gemini AI</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Primary AI provider</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] sm:text-xs text-green-600 border-green-500/30 w-fit">Required</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</div>
                  Get Google AI API Key
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <ol className="text-[10px] sm:text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Go to Google AI Studio</li>
                  <li>Sign in with Google account</li>
                  <li>Click "Get API Key"</li>
                  <li>Create or use existing key</li>
                  <li>Copy the API key</li>
                </ol>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                    <Icon icon="solar:link-round-linear" className="h-3.5 w-3.5 mr-1.5" />
                    Open Google AI Studio
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</div>
                  Add to Vercel Environment
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Add this environment variable to Vercel:
                </p>
                <div className="p-2 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] sm:text-xs break-all">GOOGLE_AI_API_KEY=your_key</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard('GOOGLE_AI_API_KEY', 'Variable')}>
                      <Icon icon="solar:copy-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  Vercel Dashboard → Settings → Environment Variables
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">3</div>
                  Redeploy Application
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-7 space-y-2">
                <ol className="text-[10px] sm:text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Vercel Dashboard → Deployments</li>
                  <li>Click three dots on latest deployment</li>
                  <li>Select "Redeploy"</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* AI Features Enabled */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">AI Features Enabled</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Powered by Google Gemini</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:pen-new-square-bold" className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-[11px] sm:text-xs">Social Content</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Posts, captions, hashtags</p>
            </div>
            <div className="p-2.5 sm:p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:chat-round-dots-bold" className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-[11px] sm:text-xs">AI Chat</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Marketing assistant</p>
            </div>
            <div className="p-2.5 sm:p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:gallery-bold" className="h-4 w-4 text-pink-500" />
                <span className="font-medium text-[11px] sm:text-xs">Image Gen</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Social media images</p>
            </div>
            <div className="p-2.5 sm:p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:document-text-bold" className="h-4 w-4 text-green-500" />
                <span className="font-medium text-[11px] sm:text-xs">Landing Pages</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Generate & optimize</p>
            </div>
            <div className="p-2.5 sm:p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:letter-bold" className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-[11px] sm:text-xs">Email Content</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Subject lines & body</p>
            </div>
            <div className="p-2.5 sm:p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:clipboard-text-bold" className="h-4 w-4 text-teal-500" />
                <span className="font-medium text-[11px] sm:text-xs">Blog Posts</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Articles & SEO</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Hosting */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Icon icon="solar:gallery-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base">ImgBB - Image Hosting</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">For AI-generated images</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <Accordion type="single" collapsible>
            <AccordionItem value="setup" className="border-none">
              <AccordionTrigger className="text-[11px] sm:text-xs py-2">Setup Instructions</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <ol className="text-[10px] sm:text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Go to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">imgbb.com</a></li>
                  <li>Create free account</li>
                  <li>Go to API section</li>
                  <li>Generate API key</li>
                </ol>
                <div className="p-2 bg-stone-50 dark:bg-stone-900 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[10px] sm:text-xs">IMGBB_API_KEY=your_key</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => copyToClipboard('IMGBB_API_KEY', 'Variable')}>
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
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Pricing & Limits</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Google Gemini API pricing</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <div className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5" />
              <span className="text-[11px] sm:text-xs font-medium">Free Tier Available</span>
            </div>
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 mt-1">
              Generous free tier for development and small-scale usage.
            </p>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5">
            <p>• <strong>Gemini 1.5 Flash:</strong> Free up to 15 RPM</p>
            <p>• <strong>Gemini 1.5 Pro:</strong> Free up to 2 RPM</p>
            <p>• <strong>Pay-as-you-go:</strong> ~$0.00025 per 1K chars</p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto">
            <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer">
              <Icon icon="solar:link-round-linear" className="h-3.5 w-3.5 mr-1.5" />
              View Full Pricing
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* AI Cost Tracking */}
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">AI Usage Tracking</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">Monitor usage across companies</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
            OmniFlow tracks AI usage per company. View detailed reports:
          </p>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs w-full sm:w-auto">
            <a href="/super-admin-ai-costs">
              <Icon icon="solar:wallet-money-linear" className="h-3.5 w-3.5 mr-1.5" />
              View AI Costs Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
