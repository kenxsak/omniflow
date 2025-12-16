'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EmailTemplate {
  id: string;
  name: string;
  category: 'promotional' | 'transactional' | 'reminder';
  description: string;
  subject: string;
  body: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  category: 'promotional' | 'transactional' | 'reminder' | 'offer';
  description: string;
  dltFormat: string;
  quickSMSFormat: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'promotional' | 'event' | 'offer' | 'update';
  message: string;
  description: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome-email',
    name: 'Welcome New Customer',
    category: 'promotional',
    description: 'Send to new customers to welcome them',
    subject: 'Welcome to [Your Business Name]! Here\'s 15% OFF',
    body: `Hi [Customer Name],

Welcome! We're thrilled to have you on board.

As a token of our appreciation, enjoy 15% OFF your first purchase with code: WELCOME15

Start shopping: [Website Link]

Best regards,
[Your Business Name]`
  },
  {
    id: 'order-confirmation-email',
    name: 'Order Confirmation',
    category: 'transactional',
    description: 'Send when customer places an order',
    subject: 'Order Confirmed - Order #[ORDER_ID]',
    body: `Hi [Customer Name],

Thank you for your order!

Order Details:
- Order ID: [ORDER_ID]
- Total Amount: [AMOUNT]
- Expected Delivery: [DELIVERY_DATE]

Track your order: [Tracking Link]

Thank you for shopping with us!
[Your Business Name]`
  },
  {
    id: 'promotional-email',
    name: 'Special Promotion',
    category: 'promotional',
    description: 'Announce special offers and sales',
    subject: '🔥 Limited Time: [OFFER]% OFF - Today Only!',
    body: `Hi [Customer Name],

🎉 We're having a FLASH SALE!

Get [OFFER]% OFF on [PRODUCT/SERVICE].

This is a limited-time offer - valid until [DATE].

Shop Now: [Website Link]

Don't miss out!
[Your Business Name]`
  },
  {
    id: 'feedback-email',
    name: 'Feedback Request',
    category: 'transactional',
    description: 'Ask customers for feedback after purchase',
    subject: "We'd love to hear from you!",
    body: `Hi [Customer Name],

Thank you for your recent purchase. Your feedback helps us improve!

How was your experience with us?

Share Your Feedback: [Feedback Link]

As a token of appreciation, get 10% OFF your next purchase when you share feedback.

Thank you!
[Your Business Name]`
  },
  {
    id: 'appointment-reminder-email',
    name: 'Appointment Reminder',
    category: 'reminder',
    description: 'Remind customers about upcoming appointments',
    subject: 'Reminder: Your appointment on [DATE]',
    body: `Hi [Customer Name],

This is a friendly reminder about your upcoming appointment.

📅 Date: [DATE]
⏰ Time: [TIME]
📍 Location: [ADDRESS]

If you need to reschedule, please click here: [Reschedule Link]

Looking forward to seeing you!
[Your Business Name]`
  }
];

const SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'flash-sale-sms',
    name: 'Flash Sale Announcement',
    category: 'promotional',
    description: 'Perfect for announcing limited-time sales',
    dltFormat: '🔥 *FLASH SALE* - Get 50% OFF on all products! Limited time: 24 hours only. Shop now: ##url##. Thank you - ##company##',
    quickSMSFormat: '🔥 Flash Sale! Hi {name}, get 50% OFF now. Limited time only. Shop: [link]. Thank you - Your Business'
  },
  {
    id: 'order-shipped-sms',
    name: 'Order Shipped Update',
    category: 'transactional',
    description: 'Keep customers informed about shipment',
    dltFormat: '📦 ORDER SHIPPED - Your order ##orderno## has been dispatched! Expected delivery: ##date##. Track: ##trackurl##. Thank you!',
    quickSMSFormat: '📦 Hi {name}, your order is on the way! Expected delivery: [date]. Track: [link]. Thank you!'
  },
  {
    id: 'appointment-reminder-sms',
    name: 'Appointment Reminder',
    category: 'reminder',
    description: 'Remind customers about appointments',
    dltFormat: 'APPOINTMENT REMINDER ⏰ Hi ##name##, your appointment is on ##date## at ##time##. Location: ##location##. Reply to reschedule.',
    quickSMSFormat: '⏰ Hi {name}, reminder: Your appointment is on [date] at [time]. Location: [address]. Reply to reschedule.'
  },
  {
    id: 'discount-offer-sms',
    name: 'Special Discount Offer',
    category: 'offer',
    description: 'Send exclusive discount offers',
    dltFormat: '🎉 SPECIAL OFFER FOR YOU - Get 20% OFF your next purchase! Use code ##code## at checkout. Valid till ##date##. Shop: ##url##',
    quickSMSFormat: '🎉 Hi {name}, exclusive offer! Get 20% OFF. Use code [code]. Valid till [date]. Shop: [link]'
  },
  {
    id: 'welcome-sms',
    name: 'Welcome New Customer',
    category: 'promotional',
    description: 'Welcome new customers with offer',
    dltFormat: '👋 WELCOME TO ##COMPANY## - Thank you for joining! Get 15% OFF your first purchase. Use code ##code##. Shop: ##url##',
    quickSMSFormat: '👋 Welcome {name}! Thank you for joining us. Get 15% OFF your first purchase. Code: [code]. Shop: [link]'
  },
  {
    id: 'feedback-sms',
    name: 'Customer Feedback Request',
    category: 'transactional',
    description: 'Collect valuable customer feedback',
    dltFormat: 'FEEDBACK REQUEST 💭 - Hi ##name##, how was your experience? Your feedback helps us improve. Reply with your thoughts.',
    quickSMSFormat: '💭 Hi {name}, we value your feedback! How was your experience? Reply with your thoughts. Thank you!'
  }
];

const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'flash-sale',
    name: 'Flash Sale Announcement',
    category: 'offer',
    message: `Hi *{{name}}*,

🔥 *Flash Sale Alert!*

Get 50% OFF on all products for the next 24 hours only!

Shop now: [Your Website Link]

Best regards,
*Your Business Name*`,
    description: 'Announce limited-time sales'
  },
  {
    id: 'new-product',
    name: 'New Product Launch',
    category: 'promotional',
    message: `Hi *{{name}}*,

🎉 *Exciting News!*

We just launched our new product!

Learn more: [Your Website Link]

Best regards,
*Your Business Name*`,
    description: 'Announce new products'
  },
  {
    id: 'event-invite',
    name: 'Event Invitation',
    category: 'event',
    message: `Hi *{{name}}*,

📅 *You're Invited!*

Join us for an exclusive event on [Date] at [Time].

Register here: [Your Website Link]

*Your Business Name*`,
    description: 'Invite to events or webinars'
  },
  {
    id: 'order-update',
    name: 'Order Status Update',
    category: 'update',
    message: `Hi *{{name}}*,

📦 *Your Order Update*

Your order has been shipped!

Expected delivery: [Date]
Track: [Tracking Link]

*Your Business Name*`,
    description: 'Order status notifications'
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    category: 'update',
    message: `Hi *{{name}}*,

⏰ *Reminder*

Your appointment: [Date] at [Time]
Location: [Address]

Reply to reschedule.

*Your Business Name*`,
    description: 'Appointment reminders'
  },
  {
    id: 'welcome-new',
    name: 'Welcome New Customer',
    category: 'promotional',
    message: `Hi *{{name}}*,

👋 *Welcome!*

Enjoy 15% OFF your first purchase.
Code: WELCOME15

Shop: [Your Website Link]

*Your Business Name*`,
    description: 'Welcome with special offer'
  }
];

export default function TemplatesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCopyTemplate = (message: string, templateId: string, formatType?: string) => {
    navigator.clipboard.writeText(message);
    setCopiedId(templateId);
    toast({
      title: 'Copied!',
      description: formatType ? `${formatType} template ready to use` : 'Template copied to clipboard'
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = {
    email: [
      { value: 'all', label: 'All' },
      { value: 'promotional', label: 'Promotional' },
      { value: 'transactional', label: 'Transactional' },
      { value: 'reminder', label: 'Reminders' }
    ],
    sms: [
      { value: 'all', label: 'All' },
      { value: 'promotional', label: 'Promotional' },
      { value: 'offer', label: 'Offers' },
      { value: 'transactional', label: 'Transactional' },
      { value: 'reminder', label: 'Reminders' }
    ],
    whatsapp: [
      { value: 'all', label: 'All' },
      { value: 'promotional', label: 'Promotional' },
      { value: 'offer', label: 'Offers' },
      { value: 'event', label: 'Events' },
      { value: 'update', label: 'Updates' }
    ]
  };

  const filteredEmailTemplates = selectedCategory === 'all'
    ? EMAIL_TEMPLATES
    : EMAIL_TEMPLATES.filter(t => t.category === selectedCategory);

  const filteredSMSTemplates = selectedCategory === 'all'
    ? SMS_TEMPLATES
    : SMS_TEMPLATES.filter(t => t.category === selectedCategory);

  const filteredWhatsAppTemplates = selectedCategory === 'all'
    ? WHATSAPP_TEMPLATES
    : WHATSAPP_TEMPLATES.filter(t => t.category === selectedCategory);

  const currentCategories = categories[activeTab];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Header */}
      <div className="text-center py-8 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-medium text-muted-foreground mb-4">
          <Icon icon="solar:document-text-bold" className="h-3.5 w-3.5" />
          Template Library
        </div>
        
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
          Message Templates
        </h1>
        
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-4">
          Ready-to-use templates with live preview
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <button
            onClick={() => { setActiveTab('email'); setSelectedCategory('all'); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all",
              activeTab === 'email' 
                ? "bg-foreground text-background" 
                : "bg-stone-100 dark:bg-stone-800 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon="solar:letter-bold" className="w-3.5 h-3.5" />
            {EMAIL_TEMPLATES.length} Email
          </button>
          <button
            onClick={() => { setActiveTab('sms'); setSelectedCategory('all'); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all",
              activeTab === 'sms' 
                ? "bg-foreground text-background" 
                : "bg-stone-100 dark:bg-stone-800 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon="solar:chat-square-bold" className="w-3.5 h-3.5" />
            {SMS_TEMPLATES.length} SMS
          </button>
          <button
            onClick={() => { setActiveTab('whatsapp'); setSelectedCategory('all'); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all",
              activeTab === 'whatsapp' 
                ? "bg-foreground text-background" 
                : "bg-stone-100 dark:bg-stone-800 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon="solar:chat-round-dots-bold" className="w-3.5 h-3.5" />
            {WHATSAPP_TEMPLATES.length} WhatsApp
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Icon 
              icon={activeTab === 'email' ? 'solar:letter-bold' : activeTab === 'sms' ? 'solar:chat-square-bold' : 'solar:chat-round-dots-bold'} 
              className="w-4 h-4 text-muted-foreground" 
            />
            {activeTab === 'email' ? 'Email Templates' : activeTab === 'sms' ? 'SMS Templates' : 'WhatsApp Templates'}
          </h2>
          
          <div className="flex gap-2 flex-wrap">
            {currentCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  selectedCategory === category.value
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent"
                    : "bg-transparent text-muted-foreground border-stone-200 dark:border-stone-700 hover:border-stone-400"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email Templates with Preview */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            {filteredEmailTemplates.map((template) => (
              <div key={template.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Left: Template Info */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Icon icon="solar:letter-bold" className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-muted-foreground uppercase">
                        {template.category}
                      </span>
                    </div>
                    
                    <Button 
                      className={cn(
                        "w-full",
                        copiedId === template.id && "bg-emerald-500 hover:bg-emerald-600"
                      )}
                      onClick={() => handleCopyTemplate(`Subject: ${template.subject}\n\n${template.body}`, template.id)}
                    >
                      {copiedId === template.id ? (
                        <><Icon icon="solar:check-circle-bold" className="mr-2 h-4 w-4" /> Copied!</>
                      ) : (
                        <><Icon icon="solar:copy-bold" className="mr-2 h-4 w-4" /> Copy Template</>
                      )}
                    </Button>
                  </div>
                  
                  {/* Right: Email Preview */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-950">
                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">Live Preview</p>
                    <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden shadow-sm">
                      {/* Email Header */}
                      <div className="bg-stone-100 dark:bg-stone-800 px-4 py-2 border-b border-stone-200 dark:border-stone-700">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-medium">Subject:</span> {template.subject}
                        </div>
                      </div>
                      {/* Email Body */}
                      <div className="bg-white dark:bg-stone-900 p-4 max-h-48 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-muted-foreground">
                          {template.body}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SMS Templates with Phone Preview */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:info-circle-bold" className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Two SMS Formats Available</h3>
                  <p className="text-sm text-muted-foreground">
                    DLT format is TRAI-approved for India. Quick SMS requires no approval.
                  </p>
                </div>
              </div>
            </div>

            {filteredSMSTemplates.map((template) => (
              <div key={template.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Left: Template Info */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Icon icon="solar:chat-square-bold" className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-muted-foreground uppercase">
                        {template.category}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline"
                        className={cn(copiedId === `${template.id}-dlt` && "bg-emerald-500 text-white border-emerald-500")}
                        onClick={() => handleCopyTemplate(template.dltFormat, `${template.id}-dlt`, 'DLT')}
                      >
                        {copiedId === `${template.id}-dlt` ? 'Copied!' : 'Copy DLT'}
                      </Button>
                      <Button 
                        className={cn(copiedId === `${template.id}-quick` && "bg-emerald-500 hover:bg-emerald-600")}
                        onClick={() => handleCopyTemplate(template.quickSMSFormat, `${template.id}-quick`, 'Quick SMS')}
                      >
                        {copiedId === `${template.id}-quick` ? 'Copied!' : 'Copy Quick'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Right: Phone Preview */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-950 flex justify-center">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3 text-center">Live Preview</p>
                      {/* Phone Frame */}
                      <div className="w-[220px] bg-stone-900 rounded-[2rem] p-2 shadow-xl">
                        <div className="bg-stone-950 rounded-[1.5rem] overflow-hidden">
                          {/* Notch */}
                          <div className="flex justify-center pt-1.5 pb-1">
                            <div className="w-16 h-4 bg-stone-900 rounded-full"></div>
                          </div>
                          {/* Status Bar */}
                          <div className="flex justify-between items-center px-4 py-0.5 text-white text-[8px]">
                            <span>9:41</span>
                            <div className="flex items-center gap-0.5">
                              <Icon icon="solar:wifi-bold" className="w-2.5 h-2.5" />
                              <Icon icon="solar:battery-full-bold" className="w-3 h-2.5" />
                            </div>
                          </div>
                          {/* Messages Header */}
                          <div className="bg-stone-800 px-3 py-2 flex items-center gap-2">
                            <Icon icon="solar:arrow-left-linear" className="w-4 h-4 text-blue-400" />
                            <span className="text-white text-xs font-medium flex-1">Messages</span>
                          </div>
                          {/* Message */}
                          <div className="bg-stone-950 p-3 min-h-[180px]">
                            <div className="bg-stone-800 rounded-xl rounded-tl-sm px-3 py-2 max-w-[90%]">
                              <p className="text-white text-[10px] leading-relaxed">
                                {template.quickSMSFormat}
                              </p>
                              <p className="text-stone-500 text-[8px] mt-1 text-right">Now</p>
                            </div>
                          </div>
                          {/* Home Indicator */}
                          <div className="flex justify-center py-1.5 bg-stone-950">
                            <div className="w-16 h-1 bg-stone-700 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WhatsApp Templates with Phone Preview */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:shield-check-bold" className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Meta Approval Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit these templates to your WhatsApp BSP provider for approval.
                  </p>
                </div>
              </div>
            </div>

            {filteredWhatsAppTemplates.map((template) => (
              <div key={template.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Left: Template Info */}
                  <div className="p-6 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-stone-800">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <Icon icon="solar:chat-round-dots-bold" className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase">
                        {template.category}
                      </span>
                    </div>
                    
                    <Button 
                      className={cn(
                        "w-full bg-[#25d366] hover:bg-[#20bd5a] text-white",
                        copiedId === template.id && "bg-emerald-600 hover:bg-emerald-700"
                      )}
                      onClick={() => handleCopyTemplate(template.message, template.id)}
                    >
                      {copiedId === template.id ? (
                        <><Icon icon="solar:check-circle-bold" className="mr-2 h-4 w-4" /> Copied!</>
                      ) : (
                        <><Icon icon="solar:copy-bold" className="mr-2 h-4 w-4" /> Copy Template</>
                      )}
                    </Button>
                  </div>
                  
                  {/* Right: WhatsApp Phone Preview */}
                  <div className="p-4 bg-stone-50 dark:bg-stone-950 flex justify-center">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3 text-center">Live Preview</p>
                      {/* Phone Frame */}
                      <div className="w-[220px] bg-stone-900 rounded-[2rem] p-2 shadow-xl">
                        <div className="bg-[#0b141a] rounded-[1.5rem] overflow-hidden">
                          {/* Notch */}
                          <div className="flex justify-center pt-1.5 pb-1">
                            <div className="w-16 h-4 bg-stone-900 rounded-full"></div>
                          </div>
                          {/* WhatsApp Header */}
                          <div className="bg-[#1f2c34] px-2 py-1.5 flex items-center gap-2">
                            <Icon icon="solar:arrow-left-linear" className="w-4 h-4 text-stone-400" />
                            <div className="w-7 h-7 rounded-full bg-[#25d366] flex items-center justify-center">
                              <Icon icon="solar:user-bold" className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-[10px] font-medium">Your Business</p>
                              <p className="text-stone-400 text-[8px]">online</p>
                            </div>
                            <Icon icon="solar:videocamera-linear" className="w-4 h-4 text-stone-400" />
                            <Icon icon="solar:phone-linear" className="w-4 h-4 text-stone-400" />
                          </div>
                          {/* Chat */}
                          <div 
                            className="p-2 min-h-[180px]"
                            style={{ 
                              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23182229\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M20 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z\'/%3E%3C/g%3E%3C/svg%3E")'
                            }}
                          >
                            <div className="flex justify-end">
                              <div className="bg-[#005c4b] rounded-lg rounded-tr-sm px-2.5 py-1.5 max-w-[90%] shadow-sm">
                                <p className="text-white text-[9px] whitespace-pre-wrap leading-relaxed">
                                  {template.message.replace(/\*([^*]+)\*/g, '$1')}
                                </p>
                                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                  <span className="text-[7px] text-stone-300">12:00</span>
                                  <Icon icon="solar:check-read-bold" className="w-3 h-3 text-[#53bdeb]" />
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Input Bar */}
                          <div className="bg-[#1f2c34] px-2 py-1.5 flex items-center gap-1.5">
                            <div className="flex-1 bg-[#2a3942] rounded-full px-2.5 py-1.5 flex items-center gap-1.5">
                              <Icon icon="solar:sticker-smile-circle-linear" className="w-4 h-4 text-stone-400" />
                              <span className="text-stone-500 text-[9px] flex-1">Message</span>
                              <Icon icon="solar:paperclip-linear" className="w-4 h-4 text-stone-400" />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center">
                              <Icon icon="solar:microphone-bold" className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          {/* Home Indicator */}
                          <div className="flex justify-center py-1.5 bg-[#0b141a]">
                            <div className="w-16 h-1 bg-stone-700 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'email' && filteredEmailTemplates.length === 0) ||
          (activeTab === 'sms' && filteredSMSTemplates.length === 0) ||
          (activeTab === 'whatsapp' && filteredWhatsAppTemplates.length === 0)) && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
              <Icon icon="solar:document-text-bold" className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No templates found</h3>
            <p className="text-sm text-muted-foreground mb-4">No templates in this category</p>
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory('all')}>
              View All Templates
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
