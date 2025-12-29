'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CronJobsSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://omniflow-xi.vercel.app';
  const cronEndpoint = `${appUrl}/api/cron/run-all`;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const testCronEndpoint = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Use the actual CRON_SECRET from environment for testing
      const response = await fetch('/api/cron/run-all', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'a1b2c3d4-super-secret-key-5e6f7g8h-9i0j'}` 
        },
      });
      const data = await response.json();
      setTestResult({ success: response.ok, status: response.status, data });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message || 'Failed to connect' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Cron Jobs Setup</h2>
        <p className="text-sm text-muted-foreground">
          Configure automated tasks for email sequences, campaigns, workflows, and scheduled posts
        </p>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Icon icon="solar:clock-circle-bold" className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Unified Cron Endpoint</CardTitle>
                <CardDescription>One endpoint handles all automations</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-500/30">
              <Icon icon="solar:check-circle-linear" className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-muted-foreground break-all">{cronEndpoint}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cronEndpoint, 'Endpoint URL')}>
                  <Icon icon="solar:copy-linear" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg border">
                <Icon icon="solar:letter-linear" className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-xs font-medium">Email Automations</div>
              </div>
              <div className="p-3 rounded-lg border">
                <Icon icon="solar:mailbox-linear" className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <div className="text-xs font-medium">Campaign Jobs</div>
              </div>
              <div className="p-3 rounded-lg border">
                <Icon icon="solar:routing-2-linear" className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <div className="text-xs font-medium">Workflows</div>
              </div>
              <div className="p-3 rounded-lg border">
                <Icon icon="solar:share-circle-linear" className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                <div className="text-xs font-medium">Social Posts</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cron-job-org" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cron-job-org">cron-job.org (Free)</TabsTrigger>
          <TabsTrigger value="github-actions">GitHub Actions</TabsTrigger>
        </TabsList>

        {/* cron-job.org Setup */}
        <TabsContent value="cron-job-org" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="solar:star-bold" className="h-5 w-5 text-amber-500" />
                Setup with cron-job.org (Recommended)
              </CardTitle>
              <CardDescription>100% free, no credit card required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="font-medium text-sm">Add CRON_SECRET to Vercel</h4>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Go to Vercel Dashboard → Settings → Environment Variables and add:
                  </p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">Name:</Label>
                      <code className="flex-1 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-xs">CRON_SECRET</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard('CRON_SECRET', 'Variable name')}>
                        <Icon icon="solar:copy-linear" className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">Value:</Label>
                      <code className="flex-1 px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-xs">a1b2c3d4-super-secret-key-5e6f7g8h-9i0j</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard('a1b2c3d4-super-secret-key-5e6f7g8h-9i0j', 'Secret value')}>
                        <Icon icon="solar:copy-linear" className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Use any random string. This secures your cron endpoint.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="font-medium text-sm">Create Account on cron-job.org</h4>
                </div>
                <div className="ml-8">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer">
                      <Icon icon="solar:link-round-linear" className="h-4 w-4 mr-2" />
                      Open cron-job.org
                    </a>
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <h4 className="font-medium text-sm">Create Cron Job with these settings</h4>
                </div>
                <div className="ml-8">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b">
                          <td className="px-3 py-2 bg-stone-50 dark:bg-stone-900 font-medium w-32">Title</td>
                          <td className="px-3 py-2">OmniFlow Automations</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-3 py-2 bg-stone-50 dark:bg-stone-900 font-medium">URL</td>
                          <td className="px-3 py-2">
                            <code className="text-xs break-all">{cronEndpoint}</code>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-3 py-2 bg-stone-50 dark:bg-stone-900 font-medium">Schedule</td>
                          <td className="px-3 py-2">Every 5 minutes</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-3 py-2 bg-stone-50 dark:bg-stone-900 font-medium">Method</td>
                          <td className="px-3 py-2">GET</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-3 py-2 bg-stone-50 dark:bg-stone-900 font-medium">Header Name</td>
                          <td className="px-3 py-2">Authorization</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 bg-stone-50 dark:bg-stone-900 font-medium">Header Value</td>
                          <td className="px-3 py-2">
                            <code className="text-xs">Bearer a1b2c3d4-super-secret-key-5e6f7g8h-9i0j</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                  <h4 className="font-medium text-sm">Test the Connection</h4>
                </div>
                <div className="ml-8 space-y-3">
                  <Button onClick={testCronEndpoint} disabled={testing} size="sm">
                    {testing ? (
                      <>
                        <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:play-linear" className="h-4 w-4 mr-2" />
                        Test Cron Endpoint
                      </>
                    )}
                  </Button>
                  {testResult && (
                    <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                      {testResult.success ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                            <span className="font-medium">Success!</span>
                          </div>
                          <pre className="text-xs overflow-auto mt-2">{JSON.stringify(testResult.data, null, 2)}</pre>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
                          <span>{testResult.error || 'Connection failed'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GitHub Actions Setup */}
        <TabsContent value="github-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="mdi:github" className="h-5 w-5" />
                Setup with GitHub Actions
              </CardTitle>
              <CardDescription>Alternative if you prefer GitHub</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a file at <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs">.github/workflows/cron.yml</code>:
              </p>
              <div className="relative">
                <pre className="p-4 bg-stone-900 text-stone-100 rounded-lg text-xs overflow-auto">
{`name: Run Automations

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Automations
        run: |
          curl -X GET "\${{ secrets.APP_URL }}/api/cron/run-all" \\
            -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}"`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`name: Run Automations

on:
  schedule:
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Automations
        run: |
          curl -X GET "\${{ secrets.APP_URL }}/api/cron/run-all" \\
            -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}"`, 'Workflow file')}
                >
                  <Icon icon="solar:copy-linear" className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Add these secrets in GitHub → Settings → Secrets:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs">APP_URL</code> = {appUrl}</li>
                <li>• <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-xs">CRON_SECRET</code> = your secret</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* What Gets Processed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What Gets Processed</CardTitle>
          <CardDescription>Every 5 minutes, the cron job handles:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Icon icon="solar:letter-linear" className="h-4 w-4 text-blue-500" />
                Email Automations
              </h4>
              <p className="text-xs text-muted-foreground">
                Drip sequences, welcome emails, follow-ups based on triggers
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Icon icon="solar:mailbox-linear" className="h-4 w-4 text-purple-500" />
                Campaign Jobs
              </h4>
              <p className="text-xs text-muted-foreground">
                Bulk Email, SMS, and WhatsApp campaigns
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Icon icon="solar:routing-2-linear" className="h-4 w-4 text-orange-500" />
                Workflow Automations
              </h4>
              <p className="text-xs text-muted-foreground">
                Custom workflows with delays, conditions, and actions
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Icon icon="solar:share-circle-linear" className="h-4 w-4 text-pink-500" />
                Scheduled Social Posts
              </h4>
              <p className="text-xs text-muted-foreground">
                Posts scheduled for future publishing to connected accounts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
