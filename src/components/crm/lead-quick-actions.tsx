'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeadQuickActionsProps {
  lead: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    companyId: string;
  };
  onActivityLogged?: () => void;
}

export function LeadQuickActions({ lead, onActivityLogged }: LeadQuickActionsProps) {
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Format phone for WhatsApp (remove spaces, dashes, etc. but keep the number clean)
  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
  };

  // Open WhatsApp via wa.me link (works on mobile and desktop)
  const handleWhatsAppDirect = () => {
    if (!lead.phone) {
      toast({ title: 'No phone number', description: 'This contact has no phone number.', variant: 'destructive' });
      return;
    }
    const phone = formatPhoneForWhatsApp(lead.phone);
    const message = encodeURIComponent(`Hi ${lead.name}, `);
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank') || (window.location.href = whatsappUrl);
    toast({ title: 'Opening WhatsApp', description: `Starting chat with ${lead.name}` });
    logActivity('whatsapp_opened', `Opened WhatsApp chat with ${lead.name}`);
  };

  // Open WhatsApp Web with pre-filled message
  const handleWhatsAppWeb = () => {
    if (!lead.phone) {
      toast({ title: 'No phone number', description: 'This contact has no phone number.', variant: 'destructive' });
      return;
    }
    const phone = formatPhoneForWhatsApp(lead.phone);
    const message = encodeURIComponent(`Hi ${lead.name}, `);
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${message}`, '_blank');
    logActivity('whatsapp_web_opened', `Opened WhatsApp Web chat with ${lead.name}`);
  };

  // Send email via your email service
  const handleSendEmail = async () => {
    if (!lead.email) {
      toast({ title: 'No email', description: 'This contact has no email address.', variant: 'destructive' });
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill in subject and message.', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/email/send-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          toName: lead.name,
          subject: emailSubject,
          htmlContent: emailBody.replace(/\n/g, '<br>'),
          contactId: lead.id,
          companyId: lead.companyId,
        }),
      });

      if (response.ok) {
        toast({ title: 'Email sent!', description: `Email sent to ${lead.name}` });
        logActivity('email_sent', `Sent email: "${emailSubject}" to ${lead.name}`);
        setEmailDialogOpen(false);
        setEmailSubject('');
        setEmailBody('');
        onActivityLogged?.();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Open default email client
  const handleEmailClient = () => {
    if (!lead.email) {
      toast({ title: 'No email', description: 'This contact has no email address.', variant: 'destructive' });
      return;
    }
    window.location.href = `mailto:${lead.email}?subject=Following up&body=Hi ${lead.name},%0D%0A%0D%0A`;
    logActivity('email_client_opened', `Opened email client for ${lead.name}`);
  };

  // Make phone call
  const handleCall = () => {
    if (!lead.phone) {
      toast({ title: 'No phone number', description: 'This contact has no phone number.', variant: 'destructive' });
      return;
    }
    window.location.href = `tel:${lead.phone}`;
    logActivity('call_initiated', `Initiated call to ${lead.name}`);
  };

  // Log activity to the system
  const logActivity = async (type: string, description: string) => {
    try {
      await fetch('/api/crm/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: lead.id,
          companyId: lead.companyId,
          type,
          description,
          timestamp: new Date().toISOString(),
        }),
      });
      onActivityLogged?.();
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  };

  return (
    <>
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }} />
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2" style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))' }}>
          <Icon icon="solar:chat-round-dots-linear" className="h-4 w-4" style={{ color: '#6366f1' }} />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Quick Actions
          </span>
        </div>
        <div className="p-4 sm:p-5 space-y-2">
          {/* WhatsApp Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 border-stone-200 dark:border-stone-700 hover:bg-muted/50" 
                disabled={!lead.phone}
              >
                <Icon icon="logos:whatsapp-icon" className="h-4 w-4" />
                <span className="flex-1 text-left text-sm">WhatsApp</span>
                <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleWhatsAppDirect}>
                <Icon icon="solar:link-linear" className="h-4 w-4 mr-2" />
                Send via wa.me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsAppWeb}>
                <Icon icon="solar:monitor-linear" className="h-4 w-4 mr-2" />
                Open WhatsApp Web
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Email Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 border-stone-200 dark:border-stone-700 hover:bg-muted/50" 
                disabled={!lead.email}
              >
                <Icon icon="solar:letter-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
                <span className="flex-1 text-left text-sm">Email</span>
                <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
                <Icon icon="solar:plain-linear" className="h-4 w-4 mr-2" />
                Compose & Send
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmailClient}>
                <Icon icon="solar:mailbox-linear" className="h-4 w-4 mr-2" />
                Open Email Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Phone Call */}
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-10 border-stone-200 dark:border-stone-700 hover:bg-muted/50" 
            onClick={handleCall}
            disabled={!lead.phone}
          >
            <Icon icon="solar:phone-linear" className="h-4 w-4" style={{ color: '#10b981' }} />
            <span className="flex-1 text-left text-sm truncate">
              Call {lead.phone ? lead.phone : '(No phone)'}
            </span>
          </Button>

          {/* Quick Info */}
          <div className="pt-3 mt-3 border-t border-stone-200 dark:border-stone-700">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              All communications are logged to the activity timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Email Compose Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Email to {lead.name}</DialogTitle>
            <DialogDescription>
              Compose and send an email directly. This will be logged in the activity timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input value={lead.email || ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Following up on our conversation..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder={`Hi ${lead.name},\n\n`}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
