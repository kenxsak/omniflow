'use client';

/**
 * Facebook Lead Ads Settings Component
 * 
 * Allows users to configure Facebook Lead Ads integration,
 * test connection, sync leads, and view webhook logs.
 * 
 * Mobile-first responsive design.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  saveFacebookLeadsConfig,
  getFacebookLeadsConfig,
  testFacebookConnection,
  syncRecentFacebookLeads,
  getFacebookWebhookLogs,
  disconnectFacebookLeads,
} from '@/app/actions/facebook-leads-actions';
import { FacebookWebhookLog } from '@/types/facebook-leads';

export default function FacebookLeadsSettings() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  
  // Form state
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  
  // Config state
  const [verifyToken, setVerifyToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Webhook logs
  const [webhookLogs, setWebhookLogs] = useState<FacebookWebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Webhook URL
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/facebook-leads`
    : '';

  // Load config on mount
  useEffect(() => {
    const loadConfig = async () => {
      if (!appUser?.companyId) {
        setLoading(false);
        return;
      }

      try {
        const result = await getFacebookLeadsConfig(appUser.companyId);
        if (result.success && result.config) {
          setAppId(result.config.appId || '');
          setVerifyToken(result.config.verifyToken);
          setPageId(result.config.pageId || '');
          setPageName(result.config.pageName || '');
          setIsConnected(result.config.isConnected);
          setLastSyncAt(result.config.lastSyncAt || null);
        }
      } catch (error) {
        console.error('Failed to load Facebook config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [appUser?.companyId]);

  // Load webhook logs
  const loadWebhookLogs = async () => {
    if (!appUser?.companyId) return;
    
    setLogsLoading(true);
    try {
      const result = await getFacebookWebhookLogs(appUser.companyId);
      if (result.success && result.logs) {
        setWebhookLogs(result.logs);
      }
    } catch (error) {
      console.error('Failed to load webhook logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Save configuration
  const handleSave = async () => {
    if (!appUser?.companyId) {
      toast({ title: 'Error', description: 'Company ID not found', variant: 'destructive' });
      return;
    }

    if (!appId || !appSecret || !pageAccessToken) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await saveFacebookLeadsConfig(appUser.companyId, {
        appId,
        appSecret,
        pageAccessToken,
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Facebook Lead Ads configuration saved' });
        // Reload config to get updated state
        const configResult = await getFacebookLeadsConfig(appUser.companyId);
        if (configResult.success && configResult.config) {
          setIsConnected(configResult.config.isConnected);
          setPageId(configResult.config.pageId || '');
          setPageName(configResult.config.pageName || '');
          setVerifyToken(configResult.config.verifyToken);
        }
        // Clear sensitive fields after save
        setAppSecret('');
        setPageAccessToken('');
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    if (!appUser?.companyId) return;

    setTesting(true);
    try {
      const result = await testFacebookConnection(appUser.companyId);
      if (result.success) {
        toast({ 
          title: 'Connection Successful', 
          description: `Connected to page: ${result.pageName}` 
        });
        setPageName(result.pageName || '');
        setPageId(result.pageId || '');
        setIsConnected(true);
      } else {
        toast({ 
          title: 'Connection Failed', 
          description: result.error || 'Unable to connect', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Connection test failed', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  // Sync leads
  const handleSyncLeads = async () => {
    if (!appUser?.companyId) return;

    setSyncing(true);
    try {
      const result = await syncRecentFacebookLeads(appUser.companyId);
      if (result.success) {
        toast({ 
          title: 'Sync Complete', 
          description: `Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors}` 
        });
        setLastSyncAt(new Date().toISOString());
      } else {
        toast({ 
          title: 'Sync Failed', 
          description: result.errorMessages?.[0] || 'Unable to sync leads', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Sync failed', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!appUser?.companyId) return;

    setDisconnecting(true);
    try {
      const result = await disconnectFacebookLeads(appUser.companyId);
      if (result.success) {
        toast({ title: 'Disconnected', description: 'Facebook Lead Ads disconnected' });
        setIsConnected(false);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to disconnect', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    } finally {
      setDisconnecting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status */}
      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="logos:facebook" className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold">Facebook Lead Ads</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Automatically sync leads from your Facebook Lead Ad forms
              </CardDescription>
            </div>
            <Badge 
              variant={isConnected ? 'default' : 'secondary'}
              className={`self-start sm:self-center ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}`}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        </CardHeader>

        {isConnected && pageName && (
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900">
              <div className="flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Page: {pageName}</span>
              </div>
              {lastSyncAt && (
                <span className="text-xs text-muted-foreground">
                  Last sync: {new Date(lastSyncAt).toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Webhook Configuration */}
      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base font-semibold">Webhook Configuration</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Use these values when setting up your Facebook App webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          {/* Webhook URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Callback URL</Label>
            <div className="flex gap-2">
              <Input 
                value={webhookUrl} 
                readOnly 
                className="h-9 sm:h-10 text-xs sm:text-sm font-mono bg-stone-50 dark:bg-stone-900"
              />
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
              >
                <Icon icon="solar:copy-linear" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Verify Token</Label>
            <div className="flex gap-2">
              <Input 
                value={verifyToken} 
                readOnly 
                className="h-9 sm:h-10 text-xs sm:text-sm font-mono bg-stone-50 dark:bg-stone-900"
              />
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                onClick={() => copyToClipboard(verifyToken, 'Verify Token')}
              >
                <Icon icon="solar:copy-linear" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base font-semibold">API Configuration</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your Facebook App credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          {/* App ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">App ID</Label>
            <Input 
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="123456789012345"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* App Secret */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">App Secret</Label>
            <div className="relative">
              <Input 
                type={showSecrets ? 'text' : 'password'}
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder={isConnected ? '••••••••••••••••' : 'Enter app secret'}
                className="h-9 sm:h-10 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={showSecrets ? 'solar:eye-closed-linear' : 'solar:eye-linear'} className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Page Access Token */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Page Access Token</Label>
            <div className="relative">
              <Input 
                type={showSecrets ? 'text' : 'password'}
                value={pageAccessToken}
                onChange={(e) => setPageAccessToken(e.target.value)}
                placeholder={isConnected ? '••••••••••••••••' : 'Enter page access token'}
                className="h-9 sm:h-10 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <Icon icon={showSecrets ? 'solar:eye-closed-linear' : 'solar:eye-linear'} className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60">
            <Icon icon="solar:shield-check-linear" className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Credentials are encrypted and stored securely. Never share your App Secret.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            {isConnected && (
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {disconnecting ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon icon="solar:link-broken-linear" className="h-4 w-4 mr-2" />
                )}
                Disconnect
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={saving || (!appId && !appSecret && !pageAccessToken)}
              className="w-full sm:flex-1 h-9 sm:h-10 text-sm"
            >
              {saving ? (
                <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Icon icon="solar:diskette-linear" className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {isConnected && (
        <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-semibold">Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {testing ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon icon="solar:plug-circle-linear" className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button 
                variant="outline"
                onClick={handleSyncLeads}
                disabled={syncing}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {syncing ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon icon="solar:refresh-circle-linear" className="h-4 w-4 mr-2" />
                )}
                Sync Recent Leads (7 days)
              </Button>
              <Button 
                variant="outline"
                onClick={loadWebhookLogs}
                disabled={logsLoading}
                className="w-full sm:w-auto h-9 sm:h-10 text-sm"
              >
                {logsLoading ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon icon="solar:document-text-linear" className="h-4 w-4 mr-2" />
                )}
                View Webhook Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Logs */}
      {webhookLogs.length > 0 && (
        <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-semibold">Recent Webhook Events</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Last {webhookLogs.length} webhook events received
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {/* Mobile: Card view */}
            <div className="sm:hidden space-y-2">
              {webhookLogs.slice(0, 10).map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={log.processed ? 'default' : 'destructive'}
                      className={log.processed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    >
                      {log.processed ? 'Processed' : 'Pending'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div><span className="text-muted-foreground">Event:</span> {log.eventType}</div>
                    {log.facebookLeadId && <div><span className="text-muted-foreground">Lead:</span> {log.facebookLeadId}</div>}
                    {log.error && <div className="text-red-600 dark:text-red-400">{log.error}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Event</TableHead>
                    <TableHead className="text-xs">Lead ID</TableHead>
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge 
                          variant={log.processed ? 'default' : 'destructive'}
                          className={`text-xs ${log.processed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}`}
                        >
                          {log.processed ? 'Processed' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.eventType}</TableCell>
                      <TableCell className="text-xs font-mono">{log.facebookLeadId || '-'}</TableCell>
                      <TableCell className="text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate">
                        {log.error || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      <Card className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl">
        <CardHeader className="p-4 sm:p-6 pb-0">
          <CardTitle className="text-sm sm:text-base font-semibold">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1" className="border-b-0">
              <AccordionTrigger className="text-xs sm:text-sm py-3 hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">1</span>
                  Create a Facebook App
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-3">
                <ol className="list-decimal list-inside space-y-1.5 pl-7">
                  <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook Developers</a></li>
                  <li>Click "Create App" and select "Business" type</li>
                  <li>Enter your app name and contact email</li>
                  <li>Copy the App ID and App Secret from Settings → Basic</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2" className="border-b-0">
              <AccordionTrigger className="text-xs sm:text-sm py-3 hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">2</span>
                  Add Webhooks Product
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-3">
                <ol className="list-decimal list-inside space-y-1.5 pl-7">
                  <li>In your app dashboard, click "Add Product"</li>
                  <li>Find "Webhooks" and click "Set Up"</li>
                  <li>Select "Page" from the dropdown</li>
                  <li>Click "Subscribe to this object"</li>
                  <li>Enter the Callback URL and Verify Token from above</li>
                  <li>Subscribe to "leadgen" field</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3" className="border-b-0">
              <AccordionTrigger className="text-xs sm:text-sm py-3 hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">3</span>
                  Generate Page Access Token
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-3">
                <ol className="list-decimal list-inside space-y-1.5 pl-7">
                  <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Graph API Explorer</a></li>
                  <li>Select your app from the dropdown</li>
                  <li>Click "Get User Access Token"</li>
                  <li>Select permissions: pages_show_list, pages_read_engagement, leads_retrieval, pages_manage_ads</li>
                  <li>Generate token and exchange for a Page Access Token</li>
                  <li>For production, generate a long-lived token via System User</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step4" className="border-b-0">
              <AccordionTrigger className="text-xs sm:text-sm py-3 hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-medium">4</span>
                  Subscribe Page to Webhooks
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-3">
                <ol className="list-decimal list-inside space-y-1.5 pl-7">
                  <li>After saving configuration here, test the connection</li>
                  <li>In Facebook App → Webhooks, click "Test" to verify</li>
                  <li>Create a Lead Ad form on your Facebook Page</li>
                  <li>Submit a test lead - it should appear in your CRM automatically</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
