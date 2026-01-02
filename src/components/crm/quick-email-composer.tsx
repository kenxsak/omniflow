"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { logEmailActivity } from '@/app/actions/activity-actions';
import type { Lead } from '@/lib/mock-data';

interface QuickEmailComposerProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSent?: () => void;
}

// Email templates for follow-ups
const EMAIL_TEMPLATES = [
  {
    id: 'follow-up',
    name: 'Follow Up',
    icon: 'solar:refresh-linear',
    subject: 'Following up on our conversation',
    body: `Hi {{name}},

I hope this email finds you well. I wanted to follow up on our recent conversation and see if you had any questions.

Please let me know if there's anything I can help with or if you'd like to schedule a call to discuss further.

Looking forward to hearing from you.

Best regards`,
  },
  {
    id: 'introduction',
    name: 'Introduction',
    icon: 'solar:hand-shake-linear',
    subject: 'Nice to connect with you',
    body: `Hi {{name}},

Thank you for your interest in our services. I'm excited to connect with you and learn more about your needs.

I'd love to schedule a quick call to understand how we can help you achieve your goals.

Would you be available for a 15-minute call this week?

Best regards`,
  },
  {
    id: 'meeting-request',
    name: 'Meeting Request',
    icon: 'solar:calendar-linear',
    subject: 'Let\'s schedule a meeting',
    body: `Hi {{name}},

I hope you're doing well. I'd like to schedule a meeting to discuss how we can work together.

Please let me know your availability for a 30-minute call, or feel free to book directly using my calendar link.

Looking forward to speaking with you.

Best regards`,
  },
  {
    id: 'proposal',
    name: 'Send Proposal',
    icon: 'solar:document-text-linear',
    subject: 'Your customized proposal',
    body: `Hi {{name}},

Thank you for taking the time to discuss your requirements with us.

As promised, please find attached our proposal tailored to your needs. I've included all the details we discussed, along with pricing and timeline.

Please review and let me know if you have any questions or would like to discuss any modifications.

Best regards`,
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    icon: 'solar:heart-linear',
    subject: 'Thank you for your time',
    body: `Hi {{name}},

Thank you so much for taking the time to speak with me today. I really enjoyed our conversation and learning more about your goals.

I'll follow up with the information we discussed shortly.

Please don't hesitate to reach out if you have any questions in the meantime.

Best regards`,
  },
  {
    id: 'check-in',
    name: 'Check In',
    icon: 'solar:chat-round-dots-linear',
    subject: 'Just checking in',
    body: `Hi {{name}},

I hope you're doing well! I wanted to check in and see how things are going.

Is there anything I can help you with or any questions I can answer?

Looking forward to hearing from you.

Best regards`,
  },
];

// AI prompt suggestions for generating emails
const AI_PROMPTS = [
  { label: 'Professional follow-up', prompt: 'Write a professional follow-up email' },
  { label: 'Friendly check-in', prompt: 'Write a friendly check-in email' },
  { label: 'Meeting reminder', prompt: 'Write a meeting reminder email' },
  { label: 'Thank you note', prompt: 'Write a thank you email after a meeting' },
  { label: 'Proposal introduction', prompt: 'Write an email introducing a proposal' },
  { label: 'Re-engagement', prompt: 'Write an email to re-engage a cold lead' },
];

export function QuickEmailComposer({ lead, open, onOpenChange, onEmailSent }: QuickEmailComposerProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'ai'>('compose');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();
  const { appUser } = useAuth();

  // Replace placeholders in template
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\{\{name\}\}/g, lead.name.split(' ')[0]) // First name
      .replace(/\{\{fullName\}\}/g, lead.name)
      .replace(/\{\{company\}\}/g, lead.attributes?.COMPANY_NAME || 'your company')
      .replace(/\{\{email\}\}/g, lead.email);
  };

  // Apply template
  const applyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(replacePlaceholders(template.subject));
    setBody(replacePlaceholders(template.body));
    setSelectedTemplate(template.id);
    setActiveTab('compose');
  };

  // Generate email with AI
  const generateWithAI = async (prompt: string) => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          leadName: lead.name,
          leadEmail: lead.email,
          companyName: lead.attributes?.COMPANY_NAME,
          context: `This is a follow-up email for a sales lead named ${lead.name}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      setSubject(data.subject || 'Following up');
      setBody(data.body || '');
      setActiveTab('compose');
      toast({ title: 'Email generated!', description: 'Review and edit before sending.' });
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback to a template-based generation
      const fallbackBody = `Hi ${lead.name.split(' ')[0]},

${prompt}

Please let me know if you have any questions.

Best regards`;
      setSubject('Following up');
      setBody(fallbackBody);
      setActiveTab('compose');
      toast({ title: 'Generated basic email', description: 'AI unavailable, using template.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Send email
  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: 'Please fill in subject and message', variant: 'destructive' });
      return;
    }

    if (!lead.email) {
      toast({ title: 'No email address', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/email/send-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          toName: lead.name,
          subject,
          htmlContent: body.replace(/\n/g, '<br>'),
          contactId: lead.id,
          companyId: lead.companyId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      // Log activity
      if (appUser) {
        await logEmailActivity(
          lead.companyId,
          lead.id,
          subject,
          body,
          appUser.uid,
          appUser.name || appUser.email || 'Unknown'
        );
      }

      toast({ title: 'Email sent!', description: `Email sent to ${lead.name}` });
      onEmailSent?.();
      onOpenChange(false);
      
      // Reset form
      setSubject('');
      setBody('');
      setSelectedTemplate(null);
    } catch (error: any) {
      toast({ title: 'Failed to send', description: error.message, variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  // Open in email client
  const openInEmailClient = () => {
    const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    toast({ title: 'Opening email client...' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] sm:max-w-[560px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:letter-linear" className="w-5 h-5 text-blue-500" />
            Email {lead.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {lead.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 sm:mx-5 grid grid-cols-3 h-9">
            <TabsTrigger value="compose" className="text-xs sm:text-sm">
              <Icon icon="solar:pen-new-square-linear" className="w-3.5 h-3.5 mr-1.5" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">
              <Icon icon="solar:document-text-linear" className="w-3.5 h-3.5 mr-1.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm">
              <Icon icon="solar:magic-stick-3-linear" className="w-3.5 h-3.5 mr-1.5" />
              AI Help
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <Label className="text-xs font-medium">Message</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Hi ${lead.name.split(' ')[0]},\n\n`}
                className="min-h-[180px] sm:min-h-[220px] text-sm resize-none"
              />
            </div>

            {/* Quick Insert */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Quick Insert</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'First Name', value: lead.name.split(' ')[0] },
                  { label: 'Full Name', value: lead.name },
                  { label: 'Company', value: lead.attributes?.COMPANY_NAME || '' },
                ].filter(i => i.value).map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setBody(prev => prev + item.value)}
                    className="h-7 text-xs px-2"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {EMAIL_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`p-3 border rounded-lg text-left hover:bg-accent transition-colors ${
                    selectedTemplate === template.id ? 'border-primary bg-accent' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon icon={template.icon} className="w-4 h-4 text-primary" />
                    <span className="text-xs sm:text-sm font-medium">{template.name}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                    {template.subject}
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">What kind of email do you want to write?</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., Write a friendly follow-up email asking about their decision on our proposal..."
                className="min-h-[80px] text-sm resize-none"
              />
            </div>

            <Button
              onClick={() => generateWithAI(aiPrompt)}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isGenerating ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon icon="solar:magic-stick-3-linear" className="w-4 h-4 mr-2" />
                  Generate Email
                </>
              )}
            </Button>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Quick Prompts</Label>
              <div className="flex flex-wrap gap-1.5">
                {AI_PROMPTS.map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAiPrompt(item.prompt);
                      generateWithAI(item.prompt);
                    }}
                    disabled={isGenerating}
                    className="h-7 text-xs px-2"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <Icon icon="solar:info-circle-linear" className="w-3.5 h-3.5 inline mr-1" />
                AI will generate a personalized email based on your prompt. You can edit it before sending.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 pt-3 border-t bg-muted/30">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={openInEmailClient}
              disabled={!subject && !body}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              <Icon icon="solar:mailbox-linear" className="w-4 h-4 mr-1.5" />
              Open in Email App
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !body.trim()}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Icon icon="solar:plain-linear" className="w-4 h-4 mr-1.5" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
