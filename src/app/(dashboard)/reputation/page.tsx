"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  getReputationSettingsAction,
  saveReputationSettingsAction,
  getReputationStatsAction,
  sendReviewRequestAction,
  getReviewRequestsAction,
} from '@/app/actions/reputation-actions';
import type { ReputationSettings, ReputationStats, ReviewRequest, ReviewPlatform } from '@/types/reputation';

export default function ReputationPage() {
  const [settings, setSettings] = useState<ReputationSettings | null>(null);
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  const { toast } = useToast();
  const { appUser } = useAuth();

  useEffect(() => {
    loadData();
  }, [appUser?.idToken]);

  async function loadData() {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const [settingsResult, statsResult, requestsResult] = await Promise.all([
        getReputationSettingsAction({ idToken: appUser.idToken }),
        getReputationStatsAction({ idToken: appUser.idToken }),
        getReviewRequestsAction({ idToken: appUser.idToken, limit: 20 }),
      ]);

      if (settingsResult.success && settingsResult.settings) {
        setSettings(settingsResult.settings);
      }
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
      if (requestsResult.success && requestsResult.requests) {
        setRequests(requestsResult.requests);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings() {
    if (!appUser?.idToken || !settings) return;
    
    setIsSaving(true);
    try {
      const result = await saveReputationSettingsAction({
        idToken: appUser.idToken,
        settings,
      });

      if (result.success) {
        toast({ title: 'Settings saved' });
      } else {
        toast({ title: result.error || 'Failed to save', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            icon={star <= rating ? 'solar:star-bold' : 'solar:star-linear'}
            className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-stone-300'}`}
          />
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Reputation Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track reviews and request feedback from customers
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)} className="h-9 sm:h-10 w-full sm:w-auto">
          <Icon icon="solar:star-shine-bold" className="w-4 h-4 mr-1.5" />
          Request Review
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon icon="solar:star-bold" className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
              <p className="text-lg font-semibold">{stats?.averageRating || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="solar:chat-round-dots-bold" className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
              <p className="text-lg font-semibold">{stats?.totalReviews || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Icon icon="solar:letter-bold" className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requests Sent</p>
              <p className="text-lg font-semibold">{stats?.totalRequests || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Icon icon="solar:chart-2-bold" className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversion</p>
              <p className="text-lg font-semibold">{stats?.conversionRate || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Rating Distribution */}
      {stats && stats.totalReviews > 0 && (
        <Card className="p-3 sm:p-4">
          <h3 className="text-sm font-medium mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats[`${['one', 'two', 'three', 'four', 'five'][rating - 1]}StarCount` as keyof ReputationStats] as number || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs w-3">{rating}</span>
                  <Icon icon="solar:star-bold" className="w-3 h-3 text-amber-400" />
                  <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="requests" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Recent Requests
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 sm:flex-none text-xs sm:text-sm">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3">
          {requests.length === 0 ? (
            <Card className="p-8 text-center">
              <Icon icon="solar:star-shine-linear" className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium mb-1">No review requests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start collecting reviews from your happy customers
              </p>
              <Button onClick={() => setShowRequestDialog(true)} variant="outline">
                <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-1.5" />
                Send First Request
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <Card key={request.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{request.recipientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.recipientEmail || request.recipientPhone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {request.platform}
                      </Badge>
                      <Badge 
                        variant={request.status === 'reviewed' ? 'default' : 'secondary'}
                        className="text-[10px] capitalize"
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Sent {new Date(request.createdAt).toLocaleDateString()} via {request.channel}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Review Links */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base sm:text-lg">Review Links</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Add your business review links
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Icon icon="logos:google-icon" className="w-3.5 h-3.5" />
                  Google Review Link
                </Label>
                <Input
                  value={settings?.googleReviewLink || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, googleReviewLink: e.target.value } : null)}
                  placeholder="https://g.page/r/..."
                  className="h-9 sm:h-10 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Find this in Google Business Profile → Get more reviews
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Icon icon="logos:facebook" className="w-3.5 h-3.5" />
                  Facebook Review Link
                </Label>
                <Input
                  value={settings?.facebookReviewLink || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, facebookReviewLink: e.target.value } : null)}
                  placeholder="https://facebook.com/yourpage/reviews"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Custom Review Link</Label>
                <Input
                  value={settings?.customReviewLink || ''}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, customReviewLink: e.target.value } : null)}
                  placeholder="https://..."
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto-Request Settings */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Auto-Request Reviews</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Automatically request reviews after a deal is won
                  </CardDescription>
                </div>
                <Switch
                  checked={settings?.autoRequestEnabled || false}
                  onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, autoRequestEnabled: checked } : null)}
                />
              </div>
            </CardHeader>
            {settings?.autoRequestEnabled && (
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Delay (days)</Label>
                    <Input
                      type="number"
                      value={settings?.autoRequestDelay || 3}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, autoRequestDelay: parseInt(e.target.value) || 3 } : null)}
                      min={1}
                      max={30}
                      className="h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Channel</Label>
                    <Select
                      value={settings?.autoRequestChannel || 'email'}
                      onValueChange={(v) => setSettings(prev => prev ? { ...prev, autoRequestChannel: v as any } : null)}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          >
            {isSaving ? (
              <>
                <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 mr-1.5" />
                Save Settings
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Request Review Dialog */}
      <ReviewRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        settings={settings}
        onSuccess={() => {
          loadData();
          setShowRequestDialog(false);
        }}
      />
    </div>
  );
}


// Review Request Dialog Component
function ReviewRequestDialog({
  open,
  onOpenChange,
  settings,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ReputationSettings | null;
  onSuccess: () => void;
}) {
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    platform: 'google' as ReviewPlatform,
    channel: 'email' as 'email' | 'sms' | 'whatsapp',
    customMessage: '',
  });
  
  const { toast } = useToast();
  const { appUser } = useAuth();

  const handleSubmit = async () => {
    if (!appUser?.idToken) return;
    
    if (!formData.recipientName) {
      toast({ title: 'Please enter recipient name', variant: 'destructive' });
      return;
    }

    if (formData.channel === 'email' && !formData.recipientEmail) {
      toast({ title: 'Please enter email address', variant: 'destructive' });
      return;
    }

    if ((formData.channel === 'sms' || formData.channel === 'whatsapp') && !formData.recipientPhone) {
      toast({ title: 'Please enter phone number', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendReviewRequestAction({
        idToken: appUser.idToken,
        request: formData,
      });

      if (result.success) {
        toast({ title: 'Review request sent!' });
        onSuccess();
        // Reset form
        setFormData({
          recipientName: '',
          recipientEmail: '',
          recipientPhone: '',
          platform: 'google',
          channel: 'email',
          customMessage: '',
        });
      } else {
        toast({ title: result.error || 'Failed to send', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to send request', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  // Check if platform has a configured link
  const hasGoogleLink = !!settings?.googleReviewLink;
  const hasFacebookLink = !!settings?.facebookReviewLink;
  const hasCustomLink = !!settings?.customReviewLink;
  const hasAnyLink = hasGoogleLink || hasFacebookLink || hasCustomLink;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:star-shine-bold" className="w-5 h-5 text-amber-500" />
            Request a Review
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Send a review request to a customer
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!hasAnyLink && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <Icon icon="solar:danger-triangle-linear" className="w-4 h-4 inline mr-1" />
                Please configure at least one review link in Settings first.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Customer Name *</Label>
            <Input
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
              placeholder="John Doe"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Platform</Label>
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData({ ...formData, platform: v as ReviewPlatform })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google" disabled={!hasGoogleLink}>
                    <span className="flex items-center gap-1.5">
                      <Icon icon="logos:google-icon" className="w-3.5 h-3.5" />
                      Google
                    </span>
                  </SelectItem>
                  <SelectItem value="facebook" disabled={!hasFacebookLink}>
                    <span className="flex items-center gap-1.5">
                      <Icon icon="logos:facebook" className="w-3.5 h-3.5" />
                      Facebook
                    </span>
                  </SelectItem>
                  <SelectItem value="custom" disabled={!hasCustomLink}>
                    <span className="flex items-center gap-1.5">
                      <Icon icon="solar:link-linear" className="w-3.5 h-3.5" />
                      Custom
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Send Via</Label>
              <Select
                value={formData.channel}
                onValueChange={(v) => setFormData({ ...formData, channel: v as any })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.channel === 'email' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email Address *</Label>
              <Input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                placeholder="customer@email.com"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          )}

          {(formData.channel === 'sms' || formData.channel === 'whatsapp') && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone Number *</Label>
              <Input
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Custom Message (optional)</Label>
            <Textarea
              value={formData.customMessage}
              onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
              placeholder="Add a personal note..."
              className="min-h-[60px] text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t bg-muted/30">
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSending || !hasAnyLink}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isSending ? (
                <>
                  <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Icon icon="solar:letter-bold" className="w-4 h-4 mr-1.5" />
                  Send Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
