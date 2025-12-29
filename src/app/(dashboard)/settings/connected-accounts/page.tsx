'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Inline icon component to avoid any import issues
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

interface BufferProfile {
  id: string;
  service: string;
  formatted_username?: string;
  username?: string;
  avatar?: string;
}

function ConnectedAccountsContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, company } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bufferConnected, setBufferConnected] = useState(false);
  const [bufferName, setBufferName] = useState('');
  const [bufferPlan, setBufferPlan] = useState('');
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([]);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const profiles = searchParams.get('profiles');

    if (success === 'buffer_connected') {
      toast({
        title: 'Buffer Connected!',
        description: profiles ? `${profiles} social channels are now available.` : 'Your Buffer account is now connected.',
      });
      window.history.replaceState({}, '', '/settings/connected-accounts');
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_company: 'Company information is missing.',
        buffer_not_configured: 'Buffer is not configured. Please contact support.',
        invalid_state: 'Invalid authorization state. Please try again.',
        state_expired: 'Authorization expired. Please try again.',
        token_exchange_failed: 'Failed to connect to Buffer. Please try again.',
        user_fetch_failed: 'Failed to get Buffer account info. Please try again.',
        storage_failed: 'Failed to save connection. Please try again.',
        access_denied: 'You denied access to Buffer.',
      };
      toast({
        title: 'Connection Failed',
        description: errorMessages[error] || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', '/settings/connected-accounts');
    }
  }, [searchParams, toast]);

  useEffect(() => {
    loadBufferConnection();
  }, [user?.uid, company?.id]);

  const loadBufferConnection = async () => {
    if (!user?.uid || !company?.id) {
      setIsLoading(false);
      return;
    }
    try {
      const { getBufferConnectionAction } = await import('@/app/actions/buffer-actions');
      const result = await getBufferConnectionAction(user.uid, company.id);
      if (result.success && result.data) {
        setBufferConnected(result.data.connected);
        setBufferName(result.data.bufferName || '');
        setBufferPlan(result.data.bufferPlan || 'free');
        setBufferProfiles(result.data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading Buffer connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectBuffer = () => {
    if (!company?.id) {
      toast({ title: 'Error', description: 'Company not found', variant: 'destructive' });
      return;
    }
    window.location.href = `/api/auth/buffer?companyId=${company.id}`;
  };

  const handleDisconnect = async () => {
    if (!user?.uid || !company?.id) return;
    setIsDisconnecting(true);
    try {
      const { disconnectBufferAction } = await import('@/app/actions/buffer-actions');
      const result = await disconnectBufferAction(user.uid, company.id);
      if (result.success) {
        setBufferConnected(false);
        setBufferProfiles([]);
        setBufferName('');
        toast({ title: 'Disconnected', description: 'Buffer has been disconnected.' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disconnect', variant: 'destructive' });
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white">
              <ShareIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Connected Social Accounts</CardTitle>
              <CardDescription>
                Connect Buffer to publish content to all your social media accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Buffer Connection Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Connect via Buffer
              </h3>
              <Card className={`border-2 transition-colors ${bufferConnected ? "border-green-500/30 bg-green-500/5" : "border-dashed"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold">Buffer</h4>
                        {bufferConnected ? (
                          <Badge variant="outline" className="text-green-600 border-green-500/30 text-xs">
                            ✓ Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Free: 3 channels</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {bufferConnected 
                          ? `Connected as ${bufferName}` 
                          : 'Publish to Facebook, Instagram, LinkedIn, Twitter, Pinterest & more'}
                      </p>
                    </div>
                  </div>

                  {bufferConnected ? (
                    <div className="mt-4 space-y-4">
                      {bufferProfiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Connected Channels ({bufferProfiles.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {bufferProfiles.map((profile) => (
                              <div
                                key={profile.id}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border text-sm"
                              >
                                {profile.avatar ? (
                                  <img src={profile.avatar} alt="" className="w-5 h-5 rounded-full" />
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                                    {profile.service?.[0]?.toUpperCase()}
                                  </span>
                                )}
                                <span className="font-medium text-xs">
                                  {profile.formatted_username || profile.username || profile.service}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href="https://publish.buffer.com/channels" target="_blank" rel="noopener noreferrer">
                            + Add Channels
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowDisconnectDialog(true)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Disconnect
                        </Button>
                      </div>
                      {bufferPlan === 'free' && (
                        <p className="text-xs text-muted-foreground">
                          Free plan: 3 channels. 
                          <a href="https://buffer.com/pricing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                            Upgrade for more →
                          </a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <Button onClick={handleConnectBuffer} className="w-full sm:w-auto">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Connect Buffer Account
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Don't have Buffer? 
                        <a href="https://buffer.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                          Create free account →
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Publish Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Quick Publish (No Account Needed)
              </h3>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                      <CopyIcon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Copy & Paste</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create content with AI, then copy and paste to any platform. Works everywhere!
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Facebook', url: 'https://www.facebook.com/' },
                          { name: 'Instagram', url: 'https://www.instagram.com/' },
                          { name: 'LinkedIn', url: 'https://www.linkedin.com/feed/' },
                          { name: 'Twitter', url: 'https://twitter.com/compose/tweet' },
                          { name: 'Pinterest', url: 'https://www.pinterest.com/pin-builder/' },
                          { name: 'Threads', url: 'https://www.threads.net/' },
                          { name: 'TikTok', url: 'https://www.tiktok.com/upload' },
                        ].map((platform) => (
                          <a
                            key={platform.name}
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs font-medium"
                            title={`Open ${platform.name}`}
                          >
                            {platform.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1 sm:flex-none">
                <Link href="/social-media">
                  Create Content with AI
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href="/social-media/content-hub">
                  View Content Hub
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">How it works</p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Connect your free Buffer account (3 channels included)</li>
                <li>• Add your social accounts in Buffer (Facebook, Instagram, LinkedIn, etc.)</li>
                <li>• Create content with AI in OmniFlow</li>
                <li>• Publish or schedule directly to all connected channels</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Buffer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect your Buffer account. You'll need to reconnect to publish directly to your social channels.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDisconnect} 
              disabled={isDisconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ConnectedAccountsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ConnectedAccountsContent />
    </Suspense>
  );
}
