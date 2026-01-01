'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseButton,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToImgBB } from '@/lib/imgbb-upload';

interface LeadQuickActionsProps {
  lead: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    companyId: string;
  };
  onActivityLogged?: () => void;
  compact?: boolean;
}

// Quick emojis for WhatsApp messages
const quickEmojis = ['👋', '🎉', '✨', '🔥', '💯', '❤️', '👍', '🙏', '📢', '🎁', '💰', '⭐', '🚀', '📞', '💬', '✅'];

// Quick message templates
const messageTemplates = [
  { label: 'Greeting', icon: 'solar:hand-shake-linear', text: 'Hi {{name}} 👋,\n\nHope you\'re doing well! Just wanted to check in.\n\nBest regards' },
  { label: 'Follow-up', icon: 'solar:refresh-linear', text: 'Hi {{name}} 👋,\n\nFollowing up on our previous conversation. Would love to hear your thoughts!\n\nLooking forward to your response 🙏' },
  { label: 'Invoice', icon: 'solar:bill-list-linear', text: 'Hi {{name}} 👋,\n\nPlease find your invoice attached below:\n\n📄 *Invoice Link:* [Paste link here]\n\nLet me know if you have any questions! ✨' },
  { label: 'Quotation', icon: 'solar:document-text-linear', text: 'Hi {{name}} 👋,\n\nAs discussed, here\'s the quotation for your review:\n\n📋 *Quotation:* [Paste link here]\n\nFeel free to reach out for any clarifications 🙏' },
  { label: 'Catalog/Brochure', icon: 'solar:gallery-linear', text: 'Hi {{name}} 👋,\n\nHere\'s our latest catalog for you:\n\n📸 *View Catalog:* [Paste link here]\n\nLet me know what catches your eye! ✨' },
  { label: 'Meeting Link', icon: 'solar:videocamera-linear', text: 'Hi {{name}} 👋,\n\nHere\'s the meeting link as scheduled:\n\n🎥 *Join Meeting:* [Paste link here]\n\nSee you there! 🚀' },
];

export function LeadQuickActions({ lead, onActivityLogged, compact = false }: LeadQuickActionsProps) {
  const { toast } = useToast();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const whatsappTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // WhatsApp form state
  const [whatsappMessage, setWhatsappMessage] = useState('');
  
  // Link insertion state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState<'image' | 'pdf' | 'video' | 'link'>('link');

  // Format phone for WhatsApp (remove spaces, dashes, etc. but keep the number clean)
  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
  };

  // Insert text at cursor position in WhatsApp message
  const insertAtCursor = (textToInsert: string) => {
    const textarea = whatsappTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = whatsappMessage.substring(0, start) + textToInsert + whatsappMessage.substring(end);
      setWhatsappMessage(newMessage);
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 0);
    } else {
      // Fallback: append to end
      setWhatsappMessage(prev => prev + textToInsert);
    }
  };

  // Insert emoji into WhatsApp message at cursor position
  const insertEmoji = (emoji: string) => {
    insertAtCursor(emoji);
    setShowEmojiPicker(false);
  };

  // Insert link with formatting at cursor position
  const insertLink = () => {
    if (!linkUrl.trim()) {
      toast({ title: 'Enter a URL', variant: 'destructive' });
      return;
    }
    
    const linkLabels: Record<string, string> = {
      image: '📸 *Image:*',
      pdf: '📄 *Document:*',
      video: '🎥 *Video:*',
      link: '🔗 *Link:*',
    };
    
    const formattedLink = `\n\n${linkLabels[linkType]} ${linkUrl}`;
    insertAtCursor(formattedLink);
    setLinkUrl('');
    setLinkDialogOpen(false);
    toast({ title: 'Link added', description: 'Link inserted into message' });
  };

  // Apply message template
  const applyTemplate = (template: string) => {
    const personalizedTemplate = template.replace(/\{\{name\}\}/g, lead.name);
    setWhatsappMessage(personalizedTemplate);
  };

  // Handle image upload to ImgBB
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be less than 5MB.', variant: 'destructive' });
      return;
    }

    // Store cursor position before upload
    const textarea = whatsappTextareaRef.current;
    const cursorPos = textarea ? textarea.selectionStart : whatsappMessage.length;

    setIsUploadingImage(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        try {
          const imageUrl = await uploadImageToImgBB(base64Data);
          const formattedLink = `\n\n📸 *Image:* ${imageUrl}`;
          // Insert at stored cursor position
          setWhatsappMessage(prev => {
            return prev.substring(0, cursorPos) + formattedLink + prev.substring(cursorPos);
          });
          toast({ title: 'Image uploaded!', description: 'Link added to message.' });
        } catch (uploadError: any) {
          toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.onerror = () => {
        toast({ title: 'Error', description: 'Failed to read file.', variant: 'destructive' });
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setIsUploadingImage(false);
    }

    // Reset input
    if (event.target) event.target.value = '';
  };

  // Open WhatsApp compose dialog
  const handleOpenWhatsAppCompose = () => {
    setWhatsappMessage(`Hi ${lead.name} 👋,\n\n`);
    setWhatsappDialogOpen(true);
  };

  // Send WhatsApp message via api.whatsapp.com (FREE - opens WhatsApp with pre-filled message)
  const handleSendWhatsApp = () => {
    if (!lead.phone) {
      toast({ title: 'No phone number', description: 'This contact has no phone number.', variant: 'destructive' });
      return;
    }
    if (!whatsappMessage.trim()) {
      toast({ title: 'Empty message', description: 'Please enter a message.', variant: 'destructive' });
      return;
    }
    
    const phone = formatPhoneForWhatsApp(lead.phone);
    
    // Normalize and encode message for proper emoji support
    const normalizedMessage = whatsappMessage.normalize('NFC');
    const encodedMessage = encodeURIComponent(normalizedMessage);
    
    // Use api.whatsapp.com/send for better emoji/unicode support (FREE - not Business API)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }
    
    toast({ title: 'Opening WhatsApp', description: `Message ready for ${lead.name}` });
    logActivity('whatsapp_message', `Sent WhatsApp message to ${lead.name}`);
    setWhatsappDialogOpen(false);
    setWhatsappMessage('');
  };

  // Quick WhatsApp - opens directly without compose dialog
  const handleWhatsAppDirect = () => {
    if (!lead.phone) {
      toast({ title: 'No phone number', description: 'This contact has no phone number.', variant: 'destructive' });
      return;
    }
    const phone = formatPhoneForWhatsApp(lead.phone);
    const message = `Hi ${lead.name} 👋,\n\n`.normalize('NFC');
    const encodedMessage = encodeURIComponent(message);
    
    // Use api.whatsapp.com/send for better emoji support
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
    
    const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }
    
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
    const message = `Hi ${lead.name} 👋,\n\n`.normalize('NFC');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`, '_blank');
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
                className="w-full justify-start gap-2 h-11 sm:h-10 border-stone-200 dark:border-stone-700 hover:bg-muted/50 hover:border-green-300 dark:hover:border-green-700" 
                disabled={!lead.phone}
              >
                <Icon icon="logos:whatsapp-icon" className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="flex-1 text-left text-sm font-medium">WhatsApp</span>
                <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleOpenWhatsAppCompose} className="py-2.5">
                <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 mr-2" />
                Compose Message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsAppDirect} className="py-2.5">
                <Icon icon="solar:link-linear" className="h-4 w-4 mr-2" />
                Quick Send
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleWhatsAppWeb} className="py-2.5">
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
                className="w-full justify-start gap-2 h-11 sm:h-10 border-stone-200 dark:border-stone-700 hover:bg-muted/50 hover:border-blue-300 dark:hover:border-blue-700" 
                disabled={!lead.email}
              >
                <Icon icon="solar:letter-linear" className="h-5 w-5 sm:h-4 sm:w-4" style={{ color: '#3b82f6' }} />
                <span className="flex-1 text-left text-sm font-medium">Email</span>
                <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setEmailDialogOpen(true)} className="py-2.5">
                <Icon icon="solar:plain-linear" className="h-4 w-4 mr-2" />
                Compose & Send
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmailClient} className="py-2.5">
                <Icon icon="solar:mailbox-linear" className="h-4 w-4 mr-2" />
                Open Email Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Phone Call */}
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 h-11 sm:h-10 border-stone-200 dark:border-stone-700 hover:bg-muted/50 hover:border-emerald-300 dark:hover:border-emerald-700" 
            onClick={handleCall}
            disabled={!lead.phone}
          >
            <Icon icon="solar:phone-linear" className="h-5 w-5 sm:h-4 sm:w-4" style={{ color: '#10b981' }} />
            <span className="flex-1 text-left text-sm font-medium truncate">
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[500px] p-4 sm:p-6 rounded-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="relative space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Send Email to {lead.name}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Compose and send an email directly. This will be logged in the activity timeline.
            </DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-3 sm:space-y-4 py-3 sm:py-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">To</Label>
              <Input value={lead.email || ''} disabled className="bg-muted/50 h-9 sm:h-10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-medium">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Following up on our conversation..."
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body" className="text-xs font-medium">Message</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder={`Hi ${lead.name},\n\n`}
                rows={5}
                className="min-h-[100px] text-sm resize-none"
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEmailDialogOpen(false)} className="w-full sm:w-auto h-9 sm:h-10">
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sending}
              className="w-full sm:w-auto h-9 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Compose Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[520px] p-4 sm:p-6 rounded-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="relative space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="logos:whatsapp-icon" className="h-5 w-5" />
              WhatsApp to {lead.name}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Compose message with emojis & links. Opens WhatsApp with pre-filled text (FREE).
            </DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-3 py-3 sm:py-4 flex-1 overflow-y-auto">
            {/* Quick Templates */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quick Templates</Label>
              <div className="flex flex-wrap gap-1.5">
                {messageTemplates.map((template) => (
                  <Button
                    key={template.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template.text)}
                    className="h-7 text-[10px] px-2 border-stone-200 dark:border-stone-700"
                  >
                    <Icon icon={template.icon} className="h-3 w-3 mr-1" />
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">To</Label>
              <Input value={lead.phone || ''} disabled className="bg-muted/50 h-9 sm:h-10 text-sm" />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="wa-message" className="text-xs font-medium">Message</Label>
                <div className="flex items-center gap-1">
                  {/* Emoji Picker */}
                  <div className="relative">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-7 px-2 text-[10px]"
                    >
                      <Icon icon="solar:sticker-smile-circle-linear" className="h-3.5 w-3.5 mr-1" />
                      Emoji
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute right-0 top-8 z-50 p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg">
                        <div className="grid grid-cols-8 gap-1 w-[200px]">
                          {quickEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="w-6 h-6 flex items-center justify-center text-base hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Image */}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="h-7 px-2 text-[10px]"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Icon icon="solar:upload-linear" className="h-3.5 w-3.5 mr-1" />
                    )}
                    Upload
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {/* Add Link/Attachment */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                        <Icon icon="solar:link-linear" className="h-3.5 w-3.5 mr-1" />
                        Link
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => { setLinkType('image'); setLinkDialogOpen(true); }}>
                        <Icon icon="solar:gallery-linear" className="h-4 w-4 mr-2" style={{ color: '#8b5cf6' }} />
                        Image Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setLinkType('pdf'); setLinkDialogOpen(true); }}>
                        <Icon icon="solar:document-linear" className="h-4 w-4 mr-2" style={{ color: '#ef4444' }} />
                        PDF / Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setLinkType('video'); setLinkDialogOpen(true); }}>
                        <Icon icon="solar:videocamera-linear" className="h-4 w-4 mr-2" style={{ color: '#3b82f6' }} />
                        Video Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setLinkType('link'); setLinkDialogOpen(true); }}>
                        <Icon icon="solar:link-linear" className="h-4 w-4 mr-2" style={{ color: '#10b981' }} />
                        Any URL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Textarea
                ref={whatsappTextareaRef}
                id="wa-message"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder={`Hi ${lead.name} 👋,\n\nYour message here...`}
                rows={6}
                className="min-h-[140px] text-sm resize-none"
              />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>*bold*</code> for bold</span>
                <span><code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>_italic_</code> for italic</span>
                <span>Upload 📸 or paste any link 🔗</span>
              </div>
            </div>

            {/* Info about attachments */}
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
                <p className="text-[10px] font-medium" style={{ color: '#1e40af' }}>How to Share Attachments</p>
              </div>
              <div className="text-[10px] text-blue-800 dark:text-blue-200 space-y-1 ml-6">
                <p><span className="font-medium">📸 Images:</span> Click "Upload" to host image & auto-insert link</p>
                <p><span className="font-medium">📄 PDFs:</span> Upload to Google Drive → Share → Copy link → Use "Link" button</p>
                <p><span className="font-medium">🎥 Videos:</span> YouTube/Vimeo link → Use "Link" button</p>
                <p className="text-[9px] opacity-80 pt-1">Free method sends text + links. Recipient clicks to view.</p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button variant="ghost" onClick={() => setWhatsappDialogOpen(false)} className="w-full sm:w-auto h-9 sm:h-10">
              Cancel
            </Button>
            <Button 
              onClick={handleSendWhatsApp}
              className="w-full sm:w-auto h-9 sm:h-10 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Icon icon="logos:whatsapp-icon" className="h-4 w-4 mr-2" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] sm:max-w-[420px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="relative space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon 
                icon={linkType === 'image' ? 'solar:gallery-linear' : linkType === 'pdf' ? 'solar:document-linear' : linkType === 'video' ? 'solar:videocamera-linear' : 'solar:link-linear'} 
                className="h-5 w-5" 
                style={{ color: linkType === 'image' ? '#8b5cf6' : linkType === 'pdf' ? '#ef4444' : linkType === 'video' ? '#3b82f6' : '#10b981' }}
              />
              Add {linkType === 'image' ? 'Image' : linkType === 'pdf' ? 'Document' : linkType === 'video' ? 'Video' : 'Link'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Paste a shareable URL. Recipient will click to view/download.
            </DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-3 py-3 sm:py-4">
            <div className="space-y-1.5">
              <Label htmlFor="link-url" className="text-xs font-medium">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={
                  linkType === 'image' ? 'https://drive.google.com/file/...' :
                  linkType === 'pdf' ? 'https://drive.google.com/file/invoice.pdf' :
                  linkType === 'video' ? 'https://youtube.com/watch?v=...' :
                  'https://example.com/...'
                }
                className="h-9 sm:h-10 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                {linkType === 'image' && 'Use Google Drive, Dropbox, or any image hosting URL'}
                {linkType === 'pdf' && 'Use Google Drive, Dropbox, or direct PDF link'}
                {linkType === 'video' && 'YouTube, Vimeo, Google Drive, or direct video URL'}
                {linkType === 'link' && 'Any shareable web URL'}
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button variant="ghost" onClick={() => setLinkDialogOpen(false)} className="w-full sm:w-auto h-9 sm:h-10">
              Cancel
            </Button>
            <Button onClick={insertLink} className="w-full sm:w-auto h-9 sm:h-10">
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-2" />
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
