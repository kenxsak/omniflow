"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { openWhatsApp } from '@/lib/open-external-link';
import type { Lead } from '@/lib/mock-data';

interface AIFollowupGeneratorProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MessageTemplate {
  id: string;
  name: string;
  icon: string;
  tone: 'friendly' | 'professional' | 'casual';
  whatsapp: string;
  email: { subject: string; body: string };
}

// AI-generated templates based on lead context
function generateTemplates(lead: Lead): MessageTemplate[] {
  const firstName = lead.name.split(' ')[0];
  const company = lead.attributes?.COMPANY_NAME || 'your company';
  
  // Calculate context
  let daysSinceContact = 0;
  if (lead.lastContacted) {
    const lastDate = lead.lastContacted?.toDate ? lead.lastContacted.toDate() : new Date(lead.lastContacted);
    daysSinceContact = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const templates: MessageTemplate[] = [];

  // Based on status
  if (lead.status === 'New') {
    templates.push({
      id: 'welcome',
      name: 'Welcome Message',
      icon: 'solar:hand-shake-bold',
      tone: 'friendly',
      whatsapp: `Hi ${firstName}! 👋\n\nThanks for your interest! I'm excited to connect with you.\n\nI'd love to learn more about what you're looking for. When would be a good time for a quick chat?\n\nLooking forward to hearing from you! 😊`,
      email: {
        subject: `Nice to meet you, ${firstName}!`,
        body: `Hi ${firstName},\n\nThank you for reaching out! I'm thrilled to connect with you.\n\nI'd love to learn more about your needs and how we can help ${company} achieve its goals.\n\nWould you be available for a quick 15-minute call this week? I'm flexible with timing.\n\nLooking forward to speaking with you!\n\nBest regards`,
      },
    });
  }

  if (lead.status === 'Contacted' || daysSinceContact >= 3) {
    templates.push({
      id: 'followup',
      name: 'Friendly Follow-up',
      icon: 'solar:refresh-bold',
      tone: 'friendly',
      whatsapp: `Hey ${firstName}! 😊\n\nJust checking in to see if you had any questions about what we discussed.\n\nNo pressure at all - I'm here whenever you're ready to chat!\n\nHave a great day! 🌟`,
      email: {
        subject: `Quick check-in, ${firstName}`,
        body: `Hi ${firstName},\n\nI hope this email finds you well! I wanted to follow up on our previous conversation.\n\nI understand you might be busy, so I just wanted to check if you had any questions or if there's anything I can help clarify.\n\nFeel free to reach out whenever works best for you.\n\nBest regards`,
      },
    });
  }

  if (lead.status === 'Qualified') {
    templates.push({
      id: 'demo',
      name: 'Demo Invitation',
      icon: 'solar:monitor-bold',
      tone: 'professional',
      whatsapp: `Hi ${firstName}! 🎯\n\nI'd love to show you exactly how we can help ${company}.\n\nWould you be free for a quick 20-minute demo this week? I can walk you through everything and answer any questions.\n\nLet me know what works for you! 📅`,
      email: {
        subject: `Let's schedule your personalized demo, ${firstName}`,
        body: `Hi ${firstName},\n\nBased on our conversations, I believe we have a great solution for ${company}'s needs.\n\nI'd love to schedule a personalized demo to show you exactly how we can help you achieve your goals.\n\nWould you be available for a 20-minute call this week? I'm flexible with timing.\n\nLooking forward to showing you what we can do!\n\nBest regards`,
      },
    });
  }

  // Value-add template
  templates.push({
    id: 'value',
    name: 'Share Value',
    icon: 'solar:gift-bold',
    tone: 'professional',
    whatsapp: `Hi ${firstName}! 💡\n\nI came across something that might be helpful for ${company}.\n\nWould you like me to share some insights that could help with your goals?\n\nNo strings attached - just thought it might be useful! 😊`,
    email: {
      subject: `Something useful for ${company}`,
      body: `Hi ${firstName},\n\nI was thinking about our conversation and came across some insights that might be valuable for ${company}.\n\nI'd be happy to share them with you - no obligation, just thought it might help with what you're working on.\n\nLet me know if you'd like me to send them over!\n\nBest regards`,
    },
  });

  // Re-engagement for cold leads
  if (daysSinceContact >= 14 || lead.temperature === 'cold') {
    templates.push({
      id: 'reengage',
      name: 'Re-engagement',
      icon: 'solar:restart-bold',
      tone: 'casual',
      whatsapp: `Hey ${firstName}! 👋\n\nIt's been a while since we connected. Hope all is well!\n\nJust wanted to check in and see if there's anything I can help with.\n\nNo worries if now isn't the right time - I'm here whenever you need! 😊`,
      email: {
        subject: `Still here for you, ${firstName}!`,
        body: `Hi ${firstName},\n\nI hope you're doing well! It's been a little while since we last connected.\n\nI wanted to reach out and see how things are going at ${company}. If your priorities have changed or if there's anything new I can help with, I'd love to hear about it.\n\nNo pressure at all - just wanted you to know I'm here if you need anything.\n\nWarm regards`,
      },
    });
  }

  // Closing template
  templates.push({
    id: 'close',
    name: 'Soft Close',
    icon: 'solar:cup-star-bold',
    tone: 'professional',
    whatsapp: `Hi ${firstName}! 🎯\n\nI wanted to check if you've had a chance to think about moving forward.\n\nIs there anything holding you back that I can help address?\n\nI'm here to make this as easy as possible for you! 💪`,
    email: {
      subject: `Ready when you are, ${firstName}`,
      body: `Hi ${firstName},\n\nI wanted to follow up and see if you've had a chance to consider our discussion.\n\nIf there are any concerns or questions holding you back, I'd be happy to address them. My goal is to make sure this is the right fit for ${company}.\n\nPlease let me know how I can help move things forward.\n\nBest regards`,
    },
  });

  return templates;
}

export function AIFollowupGenerator({ lead, open, onOpenChange }: AIFollowupGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const templates = generateTemplates(lead);

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setCustomMessage(activeTab === 'whatsapp' ? template.whatsapp : template.email.body);
  };

  const handleSendWhatsApp = () => {
    if (!lead.phone) {
      toast({ title: 'No phone number', variant: 'destructive' });
      return;
    }
    openWhatsApp(lead.phone, customMessage);
    toast({ title: 'Opening WhatsApp...' });
    onOpenChange(false);
  };

  const handleSendEmail = () => {
    if (!lead.email) {
      toast({ title: 'No email address', variant: 'destructive' });
      return;
    }
    const subject = selectedTemplate?.email.subject || 'Following up';
    window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(customMessage)}`;
    toast({ title: 'Opening email client...' });
    onOpenChange(false);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a ${activeTab === 'whatsapp' ? 'short WhatsApp message' : 'professional email'} for follow-up`,
          leadName: lead.name,
          leadEmail: lead.email,
          companyName: lead.attributes?.COMPANY_NAME,
          context: `Lead status: ${lead.status}, Temperature: ${lead.temperature || 'warm'}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomMessage(data.body || data.subject || '');
        toast({ title: 'AI message generated!' });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ title: 'Using template instead', description: 'AI unavailable' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toneColors = {
    friendly: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    professional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    casual: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] sm:max-w-[540px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Icon icon="solar:magic-stick-3-bold" className="w-3.5 h-3.5 text-white" />
            </div>
            AI Follow-up for {lead.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose a template or let AI generate a personalized message
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setCustomMessage(''); setSelectedTemplate(null); }} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 sm:mx-5 grid grid-cols-2 h-9">
            <TabsTrigger value="whatsapp" className="text-xs sm:text-sm" disabled={!lead.phone}>
              <Icon icon="logos:whatsapp-icon" className="w-3.5 h-3.5 mr-1.5" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm" disabled={!lead.email}>
              <Icon icon="solar:letter-bold" className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
              Email
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3">
            {/* AI Generate Button */}
            <Button
              variant="outline"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="w-full h-9 text-xs border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              {isGenerating ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon icon="solar:magic-stick-3-linear" className="w-4 h-4 mr-1.5" />
                  Generate with AI
                </>
              )}
            </Button>

            {/* Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Templates
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-2.5 border rounded-lg text-left hover:bg-accent transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon icon={template.icon} className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] sm:text-xs font-medium truncate">{template.name}</span>
                    </div>
                    <Badge className={`text-[8px] h-3.5 px-1 ${toneColors[template.tone]}`}>
                      {template.tone}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Editor */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Your Message
              </span>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={`Write your ${activeTab === 'whatsapp' ? 'WhatsApp message' : 'email'}...`}
                className="min-h-[150px] sm:min-h-[180px] text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                {customMessage.length} characters
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 pt-3 border-t bg-muted/30">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              {activeTab === 'whatsapp' ? (
                <Button
                  onClick={handleSendWhatsApp}
                  disabled={!customMessage.trim() || !lead.phone}
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-[#25d366] hover:bg-[#20bd5a]"
                >
                  <Icon icon="logos:whatsapp-icon" className="w-4 h-4 mr-1.5" />
                  Send WhatsApp
                </Button>
              ) : (
                <Button
                  onClick={handleSendEmail}
                  disabled={!customMessage.trim() || !lead.email}
                  className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                >
                  <Icon icon="solar:letter-bold" className="w-4 h-4 mr-1.5" />
                  Send Email
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
