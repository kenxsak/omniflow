'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { sendPlatformEmail, sendPlatformWhatsApp, getPlatformUsers, getPlatformCompanies } from '@/app/actions/platform-messaging-actions';

interface UserTarget {
  id: string;
  email: string;
  name: string;
  companyName: string;
  planId: string;
}

interface CompanyTarget {
  id: string;
  name: string;
  adminEmail: string;
  planId: string;
  userCount: number;
}

export default function PlatformMessagingPage() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<UserTarget[]>([]);
  const [companies, setCompanies] = useState<CompanyTarget[]>([]);
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailTargetType, setEmailTargetType] = useState<'all' | 'plan' | 'selected'>('all');
  const [emailTargetPlan, setEmailTargetPlan] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  
  // WhatsApp form state
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [whatsappParams, setWhatsappParams] = useState('');
  const [whatsappTargetType, setWhatsappTargetType] = useState<'all' | 'plan' | 'selected'>('all');
  const [whatsappTargetPlan, setWhatsappTargetPlan] = useState('');
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, companiesResult] = await Promise.all([
        getPlatformUsers(),
        getPlatformCompanies(),
      ]);
      
      if (usersResult.success) setUsers(usersResult.users || []);
      if (companiesResult.success) setCompanies(companiesResult.companies || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast({ title: 'Error', description: 'Subject and content are required', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const result = await sendPlatformEmail({
        subject: emailSubject,
        content: emailContent,
        targetType: emailTargetType,
        targetPlan: emailTargetPlan,
        selectedEmails: emailTargetType === 'selected' ? selectedEmails : undefined,
      });

      if (result.success) {
        toast({ 
          title: 'Emails Sent', 
          description: `Successfully sent to ${result.sentCount} recipients` 
        });
        setEmailSubject('');
        setEmailContent('');
        setSelectedEmails([]);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send emails', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappTemplate.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const result = await sendPlatformWhatsApp({
        templateName: whatsappTemplate,
        parameters: whatsappParams.split(',').map(p => p.trim()).filter(Boolean),
        targetType: whatsappTargetType,
        targetPlan: whatsappTargetPlan,
        selectedPhones: whatsappTargetType === 'selected' ? selectedPhones : undefined,
      });

      if (result.success) {
        toast({ 
          title: 'WhatsApp Messages Sent', 
          description: `Successfully sent to ${result.sentCount} recipients` 
        });
        setWhatsappTemplate('');
        setWhatsappParams('');
        setSelectedPhones([]);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send WhatsApp messages', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const uniquePlans = [...new Set(companies.map(c => c.planId))].filter(Boolean);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Icon icon="solar:mailbox-bold" className="h-5 w-5 text-primary" />
            Platform Messaging
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Send announcements to all users or specific segments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {users.length} Users
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {companies.length} Companies
          </Badge>
        </div>
      </div>

      {/* Platform Credentials Status */}
      <Card className="p-3 sm:p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Icon icon="solar:shield-check-bold" className="h-4 w-4 text-emerald-500" />
            Platform Credentials
          </CardTitle>
          <CardDescription className="text-[11px] sm:text-xs">
            These credentials are used for platform-wide messaging
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Icon icon="solar:letter-bold" className={`h-4 w-4 mx-auto mb-1 ${process.env.NEXT_PUBLIC_HAS_BREVO ? 'text-emerald-500' : 'text-stone-400'}`} />
              <p className="text-[10px] font-medium">Brevo</p>
              <p className="text-[9px] text-muted-foreground">Email</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Icon icon="solar:chat-round-dots-bold" className="h-4 w-4 mx-auto mb-1 text-stone-400" />
              <p className="text-[10px] font-medium">CPaaS</p>
              <p className="text-[9px] text-muted-foreground">WhatsApp</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Icon icon="solar:phone-bold" className="h-4 w-4 mx-auto mb-1 text-stone-400" />
              <p className="text-[10px] font-medium">MSG91</p>
              <p className="text-[9px] text-muted-foreground">SMS</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Icon icon="solar:chat-line-bold" className="h-4 w-4 mx-auto mb-1 text-stone-400" />
              <p className="text-[10px] font-medium">AiSensy</p>
              <p className="text-[9px] text-muted-foreground">WhatsApp</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Configure credentials in Setup → Email Service / WhatsApp
          </p>
        </CardContent>
      </Card>

      {/* Messaging Tabs */}
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="w-full h-auto p-1 grid grid-cols-2 gap-1">
          <TabsTrigger value="email" className="text-[11px] sm:text-xs h-8">
            <Icon icon="solar:letter-bold" className="mr-1.5 h-3.5 w-3.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-[11px] sm:text-xs h-8">
            <Icon icon="solar:chat-round-dots-bold" className="mr-1.5 h-3.5 w-3.5" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-3 space-y-3">
          <Card className="p-3 sm:p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm sm:text-base">Send Platform Email</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">
                Send announcements, updates, or notifications to users
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {/* Target Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs">Target Audience</Label>
                <Select value={emailTargetType} onValueChange={(v: any) => setEmailTargetType(v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users ({users.length})</SelectItem>
                    <SelectItem value="plan">By Plan</SelectItem>
                    <SelectItem value="selected">Selected Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {emailTargetType === 'plan' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Plan</Label>
                  <Select value={emailTargetPlan} onValueChange={setEmailTargetPlan}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choose plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniquePlans.map(plan => (
                        <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {emailTargetType === 'selected' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Users ({selectedEmails.length} selected)</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {users.slice(0, 50).map(user => (
                      <label key={user.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                        <Checkbox
                          checked={selectedEmails.includes(user.email)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmails([...selectedEmails, user.email]);
                            } else {
                              setSelectedEmails(selectedEmails.filter(e => e !== user.email));
                            }
                          }}
                        />
                        <span className="truncate">{user.email}</span>
                        <Badge variant="outline" className="text-[8px] ml-auto">{user.planId}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Content */}
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Important Update from OmniFlow"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Content (HTML supported)</Label>
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="<p>Hello {{name}},</p><p>We have an exciting update...</p>"
                  rows={6}
                  className="text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  Variables: {'{{name}}'}, {'{{email}}'}, {'{{company}}'}
                </p>
              </div>

              <Button 
                onClick={handleSendEmail} 
                disabled={sending || !emailSubject || !emailContent}
                className="w-full sm:w-auto h-9 text-sm"
              >
                {sending ? (
                  <><Icon icon="solar:refresh-linear" className="mr-1.5 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Icon icon="solar:plain-bold" className="mr-1.5 h-4 w-4" />Send Email</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="mt-3 space-y-3">
          <Card className="p-3 sm:p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-sm sm:text-base">Send Platform WhatsApp</CardTitle>
              <CardDescription className="text-[11px] sm:text-xs">
                Send WhatsApp template messages to users
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {/* Target Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs">Target Audience</Label>
                <Select value={whatsappTargetType} onValueChange={(v: any) => setWhatsappTargetType(v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users with Phone</SelectItem>
                    <SelectItem value="plan">By Plan</SelectItem>
                    <SelectItem value="selected">Selected Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {whatsappTargetType === 'plan' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Select Plan</Label>
                  <Select value={whatsappTargetPlan} onValueChange={setWhatsappTargetPlan}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Choose plan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniquePlans.map(plan => (
                        <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* WhatsApp Content */}
              <div className="space-y-1.5">
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  placeholder="platform_announcement"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Use approved WhatsApp template name
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Template Parameters (comma-separated)</Label>
                <Input
                  value={whatsappParams}
                  onChange={(e) => setWhatsappParams(e.target.value)}
                  placeholder="New Feature, Check it out!"
                  className="h-9 text-sm"
                />
              </div>

              <Alert className="p-2.5">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
                <AlertDescription className="text-[11px] ml-2">
                  WhatsApp requires pre-approved templates. Create templates in your WhatsApp Business Manager first.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleSendWhatsApp} 
                disabled={sending || !whatsappTemplate}
                className="w-full sm:w-auto h-9 text-sm"
              >
                {sending ? (
                  <><Icon icon="solar:refresh-linear" className="mr-1.5 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Icon icon="solar:plain-bold" className="mr-1.5 h-4 w-4" />Send WhatsApp</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Campaigns (placeholder) */}
      <Card className="p-3 sm:p-4">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Icon icon="solar:history-linear" className="h-4 w-4" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-6 text-muted-foreground">
            <Icon icon="solar:inbox-linear" className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No campaigns sent yet</p>
            <p className="text-[10px]">Campaign history will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
