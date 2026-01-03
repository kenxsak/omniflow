import { LucideIcon, PlusCircle, FileUp, Mail, Send, CreditCard } from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'crm'
  | 'crm-integrations'
  | 'tasks'
  | 'content-writer'
  | 'content-hub'
  | 'ad-copy-generator'
  | 'templates'
  | 'email-campaigns'
  | 'email-create-campaign'
  | 'email-automations'
  | 'email-subscribers'
  | 'text-messages'
  | 'text-send'
  | 'whatsapp'
  | 'whatsapp-bulk-campaigns'
  | 'sms-bulk-campaigns'
  | 'digital-cards'
  | 'digital-card-create'
  | 'smart-chat'
  | 'ai-chat'
  | 'sms-marketing'
  | 'social-media'
  | 'onboarding'
  | 'my-team'
  | 'settings'
  | 'business-reports'
  | 'landing-pages'
  | 'workflow-builder'
  | 'appointments'
  | 'team-management'
  | 'advanced-analytics'
  | 'transactions';

interface QuickAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface FAQ {
  question: string;
  answer: string;
}

interface HelpContent {
  pageTitle: string;
  overview?: string;
  capabilities: string[];
  quickActions?: QuickAction[];
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  tips?: string[];
  faqs?: FAQ[];
}

export const helpContent: Record<PageId, HelpContent> = {
  dashboard: {
    pageTitle: 'Dashboard',
    overview: 'Your command center - see everything happening in your business at a glance. This platform replaces 10+ tools, and this is where you see it all working together.',
    capabilities: [
      'See your total contacts and recent activity',
      'Track emails, texts, and WhatsApp messages sent',
      'Monitor your AI credits usage',
      'View quick stats on what\'s working'
    ],
    quickActions: [
      {
        label: 'Add Contact',
        icon: PlusCircle,
        onClick: () => (window.location.href = '/crm')
      },
      {
        label: 'Send Email',
        icon: Mail,
        onClick: () => (window.location.href = '/email-marketing/create-campaign')
      }
    ],
    tips: [
      'Check your dashboard daily to stay on top of things',
      'Numbers update automatically as you work',
      'Click any card to see more details'
    ],
    faqs: [
      {
        question: 'What do the numbers mean?',
        answer: 'Total Contacts = everyone in your list. AI Credits = how much AI you\'ve used this month. Campaigns = emails and messages you\'ve sent. Engagement = how people respond to your messages.'
      },
      {
        question: 'How often does it update?',
        answer: 'Automatically! Every time you send a message, add a contact, or use any feature, the numbers update. Refresh the page to see the latest.'
      },
      {
        question: 'What if I run out of AI credits?',
        answer: 'You\'ll see a warning at 80% usage. Go to Settings → Billing to upgrade your plan for more credits, or wait until next month when they reset.'
      }
    ]
  },

  'business-reports': {
    pageTitle: 'Business Reports',
    overview: 'Track how your business is growing month by month. See your revenue, sales trends, and which products or services are selling best.',
    capabilities: [
      'Track your revenue and business growth over time',
      'See detailed charts of your sales performance',
      'Compare this month to previous months'
    ],
    tips: [
      'Use the date filters to view different time periods',
      'Export reports to share with your team or accountant',
      'Look at the trends to see what\'s working and what needs improvement'
    ],
    faqs: [
      {
        question: 'How far back can I view my reports?',
        answer: 'You can view reports from the day you started using the platform. Use the date filter to select any time period you want to analyze.'
      },
      {
        question: 'Can I download these reports?',
        answer: 'Yes! Click the Export button to download your reports as a PDF or Excel file that you can share with your accountant or team.'
      }
    ]
  },

  crm: {
    pageTitle: 'My Contacts',
    overview: 'Everyone who might buy from you - all in one place. Add people manually, import from Excel, or organize them into groups. This is your customer database that connects to everything else.',
    capabilities: [
      'Add and manage all your contacts',
      'Import contacts from Excel or CSV files',
      'Organize contacts with tags and status',
      'Sync to external tools like Brevo or HubSpot',
      'Add contacts to WhatsApp/SMS lists for campaigns'
    ],
    quickActions: [
      {
        label: 'Add Someone',
        icon: PlusCircle,
        onClick: () => {
          const addButton = document.querySelector('[data-action="add-contact"]') as HTMLElement;
          addButton?.click();
        }
      },
      {
        label: 'Import from File',
        icon: FileUp,
        onClick: () => {
          const importButton = document.querySelector('[data-action="import-contacts"]') as HTMLElement;
          importButton?.click();
        }
      }
    ],
    tips: [
      'Import from Excel - just have Name and Email columns',
      'Add notes to remember important details about each person',
      'Use tags like "VIP" or "Interested in Product A" to organize',
      'Phone numbers need country codes (+91 for India, +1 for US) for messaging'
    ],
    faqs: [
      {
        question: 'How do I import contacts from Excel?',
        answer: 'Click "Import from File", select your Excel or CSV file, then match the columns (Name, Email, Phone). Your file should have column headers in the first row.'
      },
      {
        question: 'What\'s the difference between Sync and Add to List?',
        answer: 'Sync pushes contacts to external tools (Brevo/HubSpot). "Add to WhatsApp/SMS List" prepares contacts for bulk messaging campaigns.'
      },
      {
        question: 'Can I message contacts without phone numbers?',
        answer: 'You can email them, but not text or WhatsApp. Make sure phone numbers include country codes (+91 for India, +1 for US).'
      },
      {
        question: 'How do I track where contacts are in my sales process?',
        answer: 'Use the Status field - mark them as New, Contacted, Qualified, or Won. You can also add custom tags to group them your way.'
      }
    ]
  },

  'crm-integrations': {
    pageTitle: 'Connect Other Tools',
    overview: 'Connect your existing tools like Brevo, HubSpot, or Zoho so all your contacts stay synced automatically. No more copying and pasting between different apps.',
    capabilities: [
      'Link your other contact management tools',
      'Automatically sync contacts from other services',
      'Keep all your contacts in one place'
    ],
    tips: [
      'Connecting tools means you don\'t have to manually import contacts',
      'Your contacts will stay up-to-date automatically',
      'You\'ll need API keys from the other service - look in their Settings'
    ],
    faqs: [
      {
        question: 'Where do I find my API key for Brevo or HubSpot?',
        answer: 'Log into Brevo/HubSpot, go to Settings → API Keys, and copy the key. Then paste it into the connection settings here.'
      },
      {
        question: 'Will my contacts sync both ways?',
        answer: 'It depends on the integration. Most sync FROM this platform TO the other tool. Check the specific integration\'s description to see how it works.'
      }
    ]
  },

  tasks: {
    pageTitle: 'Task Management',
    capabilities: [
      'Create to-do items for yourself or your team',
      'Track which tasks are done and which need work',
      'Set reminders so you don\'t forget important things'
    ],
    tips: [
      'Check off tasks as you complete them to stay organized',
      'Add due dates to prioritize what to do first'
    ]
  },

  'content-writer': {
    pageTitle: 'Content Writer',
    capabilities: [
      'Let the computer write social media posts for you',
      'Create email messages automatically',
      'Generate blog articles and web page content'
    ],
    quickActions: [
      {
        label: 'Create Post',
        icon: PlusCircle,
        onClick: () => {
          const createButton = document.querySelector('[data-action="create-content"]') as HTMLElement;
          createButton?.click();
        }
      }
    ],
    tips: [
      'Just describe what you want to say, and the computer will write it for you',
      'You can edit the content after it\'s generated to make it perfect',
      'Save your favorite posts to reuse them later'
    ]
  },

  'content-hub': {
    pageTitle: 'Content Hub',
    capabilities: [
      'Browse all the content you\'ve created',
      'Reuse posts you\'ve written before',
      'Find old emails and messages quickly'
    ],
    tips: [
      'Use the search box to find specific content',
      'Copy and paste content to use it again'
    ]
  },

  'ad-copy-generator': {
    pageTitle: 'Ad Copy Generator',
    capabilities: [
      'Create advertising text for Google, Facebook, and other platforms',
      'Generate multiple ad variations to test',
      'Get suggestions for catchy headlines'
    ],
    tips: [
      'Describe your product or service clearly for best results',
      'Try generating a few different versions to see which one you like best'
    ]
  },

  templates: {
    pageTitle: 'Templates',
    capabilities: [
      'Browse pre-written email and text message templates',
      'Use ready-made messages to save time',
      'Customize templates for your business'
    ],
    tips: [
      'Templates are a great starting point - just edit them to fit your needs',
      'Save your edited templates to reuse them'
    ]
  },

  'email-campaigns': {
    pageTitle: 'Email Campaigns',
    overview: 'Send emails to your contacts and see how they perform. Track opens, clicks, and what\'s working best.',
    capabilities: [
      'Send professional emails to your contacts',
      'See how many people opened your emails',
      'Track which emails got the most clicks',
      'View email history and performance'
    ],
    quickActions: [
      {
        label: 'Send New Email',
        icon: Mail,
        onClick: () => (window.location.href = '/email-marketing/create-campaign')
      }
    ],
    tips: [
      'Higher open rates mean your subject lines are working',
      'Track clicks to learn what your audience likes',
      'Send test emails to yourself before sending to everyone'
    ],
    faqs: [
      {
        question: 'What is a contact group?',
        answer: 'A list of people who will receive your email. For example, "All Customers" or "Newsletter Subscribers". Create groups in Email Subscribers section.'
      },
      {
        question: 'How do I know if my email was delivered?',
        answer: 'Check the campaign details. You\'ll see Sent, Delivered, Opened, and Clicked counts. If Delivered is lower than Sent, some emails bounced.'
      },
      {
        question: 'Why is my open rate low?',
        answer: 'Try improving your subject line - make it short and interesting. Send at better times (Tuesday-Thursday, 9-11 AM works well).'
      }
    ]
  },

  'email-create-campaign': {
    pageTitle: 'Create Email Campaign',
    overview: 'Create and send a professional email to your contacts. Write your message, choose who gets it, and send it now or schedule it for later.',
    capabilities: [
      'Send an email to your contacts',
      'Choose who receives the email (contact groups)',
      'Schedule emails to send later',
      'Preview how your email looks before sending'
    ],
    tips: [
      'Write a short, catchy subject line to get more people to open your email',
      'Test your email by sending it to yourself first',
      'Schedule emails for tomorrow morning (9-10 AM works well)',
      'Keep your message focused on one main point'
    ],
    faqs: [
      {
        question: 'How do I create an email if I don\'t have a contact group?',
        answer: 'Go to Email Marketing → Subscribers first and create a contact list. Add people to it, then come back here to send an email to that list.'
      },
      {
        question: 'Can I use the AI to write my email?',
        answer: 'Yes! Click the AI Content button and describe what you want to say. The AI will draft the email for you, then you can edit it to make it perfect.'
      },
      {
        question: 'What time should I schedule my email?',
        answer: 'Tuesday-Thursday at 9-11 AM usually gets the best results. Avoid Monday mornings (too busy) and Friday afternoons (weekend mode).'
      }
    ]
  },

  'email-automations': {
    pageTitle: 'Email Automation',
    overview: 'Set up emails that send automatically - welcome new contacts, follow up on abandoned carts, or nurture leads. Save time and never miss a follow-up.',
    capabilities: [
      'Set up emails that send automatically',
      'Welcome new contacts instantly',
      'Send follow-ups without remembering',
      'Create multi-step email sequences'
    ],
    tips: [
      'Set up a welcome email first - it\'s the easiest one',
      'Automated emails save time and never forget to follow up',
      'Test by adding yourself as a contact first'
    ],
    faqs: [
      {
        question: 'What are automated emails?',
        answer: 'Emails that send themselves when something happens. For example, when someone joins your list, they automatically get a welcome email without you doing anything.'
      },
      {
        question: 'Can I edit automated emails later?',
        answer: 'Yes! Click Configure on any automation to edit emails, change timing, or turn it on/off. Changes take effect immediately.'
      },
      {
        question: 'How do I know if automations are working?',
        answer: 'Check the Status - it should say "Active". Add yourself as a test contact to see if you receive the automated emails.'
      }
    ]
  },

  'email-subscribers': {
    pageTitle: 'Email Subscribers',
    capabilities: [
      'View all your email contact lists',
      'See who has subscribed or unsubscribed',
      'Organize contacts into different groups'
    ],
    tips: [
      'Create different lists for different types of customers',
      'Respect unsubscribes - it keeps your emails more effective'
    ]
  },

  'text-messages': {
    pageTitle: 'Text Messages',
    capabilities: [
      'View all text messages you\'ve sent',
      'Check delivery status of your messages',
      'See message history with each contact'
    ],
    quickActions: [
      {
        label: 'Send New Message',
        icon: Send,
        onClick: () => (window.location.href = '/sms-marketing/send')
      }
    ],
    tips: [
      'Keep text messages short - people read them quickly',
      'Include a clear action (like "Reply YES to confirm")'
    ]
  },

  'text-send': {
    pageTitle: 'Send New Text Message',
    capabilities: [
      'Send a text message to your contacts',
      'Text one person or many people at once',
      'Schedule messages to send later'
    ],
    tips: [
      'Text messages should be under 160 characters for best results',
      'Always include your business name so people know who\'s texting',
      'Best times to send: 10 AM - 8 PM on weekdays'
    ]
  },

  whatsapp: {
    pageTitle: 'WhatsApp Messages',
    capabilities: [
      'Send messages through WhatsApp',
      'Reach contacts who prefer WhatsApp',
      'Send images and files through WhatsApp'
    ],
    tips: [
      'WhatsApp works great for international contacts',
      'You can send images, which isn\'t possible with regular text messages'
    ]
  },

  'whatsapp-bulk-campaigns': {
    pageTitle: 'WhatsApp Campaigns',
    overview: 'Send WhatsApp messages to hundreds or thousands of people at once. Perfect for announcements, promotions, or updates.',
    capabilities: [
      'Send WhatsApp to many contacts at once',
      'Use approved templates for business messaging',
      'Track delivery and read status',
      'Send personalized messages'
    ],
    quickActions: [
      {
        label: 'Go to Settings',
        icon: CreditCard,
        onClick: () => (window.location.href = '/settings')
      }
    ],
    tips: [
      'First, connect WATI or AiSensy in Settings → Integrations',
      'Add contacts to WhatsApp lists from your CRM',
      'Use approved templates - WhatsApp requires Meta approval',
      'Track delivery and read receipts in "My Campaigns"'
    ],
    faqs: [
      {
        question: 'How do I send WhatsApp campaigns?',
        answer: 'Step 1: Connect WATI/AiSensy in Settings. Step 2: Add contacts to a WhatsApp list from CRM. Step 3: Create campaign, select template and list, then send.'
      },
      {
        question: 'What are approved templates?',
        answer: 'WhatsApp requires all business messages to use pre-approved templates. Create them in your WATI or AiSensy dashboard. Meta approves them in 24-48 hours.'
      },
      {
        question: 'Why do contacts need country codes?',
        answer: 'WhatsApp requires full international numbers. Use +91 for India, +1 for US, +44 for UK. Without the code, messages won\'t send.'
      },
      {
        question: 'How much does it cost?',
        answer: 'Costs depend on your WhatsApp provider and recipient country. Usually a few cents per message. You\'ll see estimated costs before sending.'
      }
    ]
  },

  'sms-bulk-campaigns': {
    pageTitle: 'SMS Campaigns',
    overview: 'Send text messages to hundreds or thousands of people at once. Perfect for time-sensitive updates, promotions, or reminders.',
    capabilities: [
      'Send SMS to many contacts at once',
      'Track delivery status and costs',
      'Send promotional and transactional messages',
      'See cost estimates before sending'
    ],
    quickActions: [
      {
        label: 'Go to Settings',
        icon: CreditCard,
        onClick: () => (window.location.href = '/settings')
      }
    ],
    tips: [
      'First, connect MSG91 or Fast2SMS in Settings → Integrations',
      'Add contacts to SMS lists from your CRM',
      'Keep messages under 160 characters to save money',
      'View cost estimates before sending'
    ],
    faqs: [
      {
        question: 'How do bulk SMS campaigns work?',
        answer: 'Step 1: Connect MSG91 or Fast2SMS in Settings. Step 2: Add contacts to SMS list from CRM. Step 3: Write your message (under 160 characters), select your list, and send.'
      },
      {
        question: 'What is DLT and do I need it?',
        answer: 'DLT is required by India\'s telecom rules for promotional SMS. Register your templates at MSG91\'s DLT portal. Transactional messages (like OTPs) don\'t need DLT.'
      },
      {
        question: 'How much do SMS messages cost?',
        answer: 'In India: ₹0.20-0.50 per message. Each 160 characters = 1 SMS. A 320-character message costs double. You\'ll see the exact cost before sending.'
      },
      {
        question: 'Can I send to international numbers?',
        answer: 'Yes, but costs are higher (₹2-5 per SMS). Make sure phone numbers include country codes (+1 for US, +91 for India).'
      }
    ]
  },

  'digital-cards': {
    pageTitle: 'Digital Business Cards',
    overview: 'Your online business card - share it with anyone via link or QR code. No website needed! This platform is the only one with AI Voice Chatbot on digital cards.',
    capabilities: [
      'Create beautiful digital business cards',
      'Share via link or QR code',
      'Capture leads with built-in contact forms',
      'Add AI Voice Chatbot (exclusive feature!)',
      'Track who views your card'
    ],
    quickActions: [
      {
        label: 'Create New Card',
        icon: CreditCard,
        onClick: () => (window.location.href = '/digital-card/create')
      }
    ],
    tips: [
      'Share your card link in email signatures and social media',
      'Print the QR code on business cards or flyers',
      'Enable the contact form to capture leads automatically',
      'Add the AI Voice Chatbot to answer questions 24/7'
    ],
    faqs: [
      {
        question: 'What is a digital card?',
        answer: 'A mobile-friendly web page with your contact info, links, and business details. Share it via link or QR code instead of paper business cards. People can save your contact, visit your website, or message you instantly.'
      },
      {
        question: 'How do I share my card?',
        answer: 'Click Copy Link to share via email or text. Download the QR code to print on business cards, flyers, or store windows. Anyone who scans or clicks sees your card.'
      },
      {
        question: 'What makes these digital cards special?',
        answer: 'We\'re the only platform with AI Voice Chatbot! Your card can answer questions, capture leads, and book appointments 24/7 - no other digital card service offers this.'
      },
      {
        question: 'Can I have multiple cards?',
        answer: 'Yes! Create different cards for different purposes - one for your business, one personal, one for a specific product or event.'
      }
    ]
  },

  'digital-card-create': {
    pageTitle: 'Create Digital Card',
    overview: 'Build your digital business card step by step. Add your info, links, colors, and design - then share it with the world.',
    capabilities: [
      'Make a new digital business card',
      'Add your contact information and social media links',
      'Customize colors and design',
      'Add action buttons (WhatsApp, Email, Phone, Website)',
      'Enable contact form to capture leads'
    ],
    tips: [
      'Choose a simple username (like "john-smith" or "cafe-mumbai") for your card URL',
      'Add a professional photo and cover image for best results',
      'Include all ways people can contact you (phone, email, WhatsApp)',
      'Preview your card before saving'
    ],
    faqs: [
      {
        question: 'What should I put in the username field?',
        answer: 'Choose something simple and memorable like "yourname" or "yourbusiness". This becomes your card URL. Use only lowercase letters, numbers, and hyphens.'
      },
      {
        question: 'What action links should I add?',
        answer: 'Add links that help people take action - WhatsApp for instant chat, your website, booking calendar, menu, or payment link. Think about what you want visitors to do next.'
      },
      {
        question: 'How do I enable the contact form?',
        answer: 'Go to the "Lead Capture" tab and turn on Contact Form. When someone fills it, you\'ll get their details in your CRM automatically.'
      }
    ]
  },

  'smart-chat': {
    pageTitle: 'Smart Chat Helper',
    capabilities: [
      'Chat with our smart assistant for help',
      'Ask questions about using the platform',
      'Get suggestions for growing your business'
    ],
    tips: [
      'Ask specific questions for better answers',
      'The assistant can help you write emails, texts, and posts'
    ]
  },

  'ai-chat': {
    pageTitle: 'AI Assistants',
    overview: 'Chat with specialized AI assistants that help you with different tasks. Each assistant is an expert in their area - content writing, email marketing, SEO, ads, and more.',
    capabilities: [
      'Chat with AI experts for different marketing tasks',
      'Get help writing emails, social posts, and blog articles',
      'Create ad copy for Google and Facebook',
      'Get SEO tips and trending topic ideas',
      'Generate images for your marketing'
    ],
    tips: [
      'Pick the right assistant for your task - Content Writer for posts, Email Expert for campaigns',
      'Be specific - "Write a Facebook post about our weekend shoe sale" works better than "Write a post"',
      'You can always edit what the AI creates to match your style',
      'Ask follow-up questions to refine the content'
    ],
    faqs: [
      {
        question: 'Which AI assistant should I use?',
        answer: 'Content Writer: social posts and blogs. Email Expert: email campaigns. SEO Expert: keywords and trending topics. Ad Copy Expert: Google/Facebook ads. Image Creator: marketing visuals.'
      },
      {
        question: 'How do I get the best results from AI?',
        answer: 'Be specific! Tell the AI: (1) What you\'re promoting, (2) Who it\'s for, (3) The tone you want (friendly/professional), (4) What action you want people to take.'
      },
      {
        question: 'Can I use the content the AI creates?',
        answer: 'Yes! The AI creates drafts for you to use. Review and edit them to match your brand voice, then use them in your campaigns, posts, or website.'
      },
      {
        question: 'How many times can I use the AI?',
        answer: 'Your plan includes a monthly AI credit quota. Check your dashboard to see how many credits you have left. Upgrade your plan for more credits.'
      }
    ]
  },

  'sms-marketing': {
    pageTitle: 'Text Messages',
    capabilities: [
      'View all text messages you\'ve sent',
      'Check delivery status of your messages',
      'See message history with each contact'
    ],
    quickActions: [
      {
        label: 'Send New Message',
        icon: Send,
        onClick: () => (window.location.href = '/sms-marketing/send')
      }
    ],
    tips: [
      'Keep text messages short - people read them quickly',
      'Include a clear action (like "Reply YES to confirm")',
      'Best times to send: 10 AM - 8 PM on weekdays'
    ]
  },

  'social-media': {
    pageTitle: 'AI Content Factory',
    overview: 'Your AI-powered content creation hub. Generate social media posts, images, and marketing content in seconds. Schedule posts across all your social platforms from one place.',
    capabilities: [
      'Create social media posts with AI - just describe what you want',
      'Generate eye-catching images for your posts',
      'Schedule posts to Facebook, Instagram, LinkedIn, and Twitter',
      'Save content to your library for later use',
      'Get SEO suggestions to improve your reach'
    ],
    quickActions: [
      {
        label: 'Create Post',
        icon: PlusCircle,
        onClick: () => {
          const createButton = document.querySelector('[data-action="create-content"]') as HTMLElement;
          createButton?.click();
        }
      }
    ],
    tips: [
      'Tell the AI what you want to say - "Write a post about our weekend sale" works great',
      'Use the image generator to create visuals that match your post',
      'Schedule posts for the best times - Tuesday-Thursday mornings work well',
      'Connect your social accounts in Settings to post directly'
    ],
    faqs: [
      {
        question: 'How do I create a post with AI?',
        answer: 'Click "Create Post", describe what you want (like "Write a fun Instagram post about our new coffee blend"), and the AI will write it for you. You can edit it before posting.'
      },
      {
        question: 'Can I post to multiple platforms at once?',
        answer: 'Yes! Connect your social accounts in Settings → Social Media Setup. Then when you create a post, you can select which platforms to publish to.'
      },
      {
        question: 'How do I schedule posts for later?',
        answer: 'After creating your post, click "Schedule" instead of "Post Now". Pick the date and time, and it will be published automatically.'
      },
      {
        question: 'What is the Content Hub?',
        answer: 'The Content Hub stores all your created content - posts, images, and drafts. You can reuse, edit, or schedule any saved content later.'
      }
    ]
  },

  onboarding: {
    pageTitle: 'Getting Started',
    overview: 'Welcome! Follow these simple steps to set up your all-in-one marketing platform. Everything you need is built-in - no external tools required.',
    capabilities: [
      'Add your first contacts',
      'Send your first email campaign',
      'Create a Digital Business Card',
      'Try AI content generation',
      'Set up automated follow-ups',
      'Launch multi-channel campaigns'
    ],
    tips: [
      'Everything works out of the box - no external tools needed!',
      'Start with "Add Contacts" - it\'s the easiest first step',
      'Each step unlocks more marketing power',
      'Skip any step and come back later - no pressure'
    ],
    faqs: [
      {
        question: 'Do I need to connect external tools first?',
        answer: 'No! This platform has everything built-in. You can add contacts, send emails, create digital cards, and use AI without connecting anything else.'
      },
      {
        question: 'What happens when I complete all steps?',
        answer: 'You\'ll have a fully working marketing system! Contacts in your CRM, campaigns sent, leads captured, AI content created, and automation running.'
      },
      {
        question: 'How is this different from other tools?',
        answer: 'This platform replaces 10+ tools (CRM, email, SMS, WhatsApp, AI content, digital cards, and more) at 1/3rd the cost. Everything works together in one place.'
      }
    ]
  },

  'my-team': {
    pageTitle: 'My Team',
    capabilities: [
      'Invite team members to help manage your account',
      'Set permissions for what each person can do',
      'Remove team members when needed'
    ],
    tips: [
      'Give team members only the access they need',
      'You can always change permissions later'
    ]
  },

  settings: {
    pageTitle: 'Settings',
    overview: 'Your control center - connect your tools, manage your subscription, and customize how the platform works for you.',
    capabilities: [
      'Connect email services (Brevo, Gmail, SMTP)',
      'Connect messaging (WhatsApp, SMS providers)',
      'Manage your subscription and billing',
      'Add team members',
      'Update your business info'
    ],
    tips: [
      'Start with Integrations to connect email and messaging',
      'You\'ll need API keys from each service you connect',
      'Add team members in the Users tab',
      'Keep your business info updated - it shows on invoices and emails'
    ],
    faqs: [
      {
        question: 'How do I connect my email service?',
        answer: 'Go to Integrations tab. For Brevo: paste your API key. For Gmail/SMTP: enter your email, password, and server details. Find these in your email provider\'s Settings.'
      },
      {
        question: 'Where do I find API keys?',
        answer: 'Brevo: Account → SMTP & API → API Keys. HubSpot: Settings → Integrations → Private Apps. WATI: Dashboard → API Docs. MSG91: Dashboard → Settings → API Keys.'
      },
      {
        question: 'How do I add team members?',
        answer: 'Go to Users tab, click Invite User, enter their email. They\'ll get an invitation to join your account.'
      },
      {
        question: 'Can I change my plan?',
        answer: 'Yes! Go to Billing tab to upgrade or downgrade. Changes take effect immediately and billing adjusts automatically.'
      }
    ]
  },

  'landing-pages': {
    pageTitle: 'Landing Pages',
    overview: 'Create beautiful web pages without coding. Perfect for capturing leads, launching products, or promoting events. AI can even clone any website design you like!',
    capabilities: [
      'Create landing pages from templates',
      'Clone any website design with AI',
      'Add lead capture forms (syncs to your CRM)',
      'Customize colors and branding',
      'Publish instantly with a shareable link'
    ],
    tips: [
      'Start with a template - it\'s faster than building from scratch',
      'Use "Clone from Reference" to copy any page design you like',
      'Add a lead form to capture visitor info automatically',
      'Preview on mobile before publishing'
    ],
    faqs: [
      {
        question: 'How do I create a landing page?',
        answer: 'Click "Create New Page", pick a template (Lead Capture, Product Launch, etc.), then customize the content. Click any section to edit text, images, and colors.'
      },
      {
        question: 'What is Clone from Reference?',
        answer: 'Paste any website URL and AI will analyze its design and create a similar page for you. Great for recreating competitor pages or designs you admire.'
      },
      {
        question: 'Where do leads from my page go?',
        answer: 'When someone fills out a form, their info automatically appears in your Contacts. You can then follow up via email, WhatsApp, or SMS.'
      },
      {
        question: 'Can I use my own domain?',
        answer: 'Pages are published with a shareable link. Custom domains are available on higher plans.'
      }
    ]
  },

  'workflow-builder': {
    pageTitle: 'Workflow Builder',
    overview: 'Automate your follow-ups and never miss a lead. When something happens (new contact, form filled), automatically send emails, SMS, or WhatsApp messages.',
    capabilities: [
      'Create automated workflows with drag & drop',
      'Trigger actions when contacts are added or forms submitted',
      'Send automated emails, SMS, and WhatsApp',
      'Add delays between messages',
      'Create different paths based on conditions'
    ],
    tips: [
      'Start simple - create a "Welcome Email" workflow first',
      'Every workflow needs a Trigger (what starts it) and an Action (what happens)',
      'Use delays to space out messages - don\'t overwhelm contacts',
      'Test by adding yourself as a contact'
    ],
    faqs: [
      {
        question: 'How do I create my first workflow?',
        answer: 'Click "New Workflow", add a Trigger (like "New Contact Added"), then add an Action (like "Send Email"). Configure each step, then click Activate.'
      },
      {
        question: 'What triggers are available?',
        answer: 'New Contact Added, Form Submitted, Tag Added, Deal Stage Changed, Deal Won, Appointment Scheduled, and Manual Trigger.'
      },
      {
        question: 'Can I send WhatsApp automatically?',
        answer: 'Yes! Add a "Send WhatsApp" action. You\'ll need to connect WATI or AiSensy in Settings first, and use approved message templates.'
      },
      {
        question: 'How do I test my workflow?',
        answer: 'Add yourself as a test contact with your email/phone. The workflow will run and you\'ll receive the messages.'
      }
    ]
  },

  'appointments': {
    pageTitle: 'Appointments',
    overview: 'All your bookings in one place. Sync with Cal.com for automatic scheduling, or create appointments manually.',
    capabilities: [
      'View all appointments in one place',
      'Create appointments manually',
      'Sync bookings from Cal.com automatically',
      'Mark appointments as completed or cancelled',
      'Set up reminders'
    ],
    tips: [
      'Connect Cal.com in Settings to auto-sync bookings',
      'Appointments sync automatically when you open this page',
      'Use filters to see upcoming or completed appointments',
      'Click any appointment to view details or reschedule'
    ],
    faqs: [
      {
        question: 'How do I connect Cal.com?',
        answer: 'Go to Settings → Integrations, find Cal.com, and enter your API key. Once connected, bookings sync automatically.'
      },
      {
        question: 'Can I create appointments without Cal.com?',
        answer: 'Yes! Click "New Appointment" to create one manually. Enter client details, date, time, and notes.'
      },
      {
        question: 'How do reminders work?',
        answer: 'When creating an appointment, enable email or SMS reminders. They\'ll be sent automatically before the appointment.'
      }
    ]
  },

  'team-management': {
    pageTitle: 'Team Management',
    overview: 'Track your team\'s work status. Team members can clock in/out, and managers can see who\'s working.',
    capabilities: [
      'Clock in and out to track work hours',
      'See who\'s currently working',
      'View attendance history',
      'Managers can see all team members\' status'
    ],
    tips: [
      'Clock in when you start, clock out when you\'re done',
      'Your status updates in real-time for your team',
      'Managers and admins see the full team view'
    ],
    faqs: [
      {
        question: 'How do I clock in?',
        answer: 'Click the "Clock In" button. Your status changes to "Clocked In" and your team can see you\'re working.'
      },
      {
        question: 'Can I see my team\'s attendance?',
        answer: 'If you\'re a manager or admin, you\'ll see a table showing all team members, their status, and when they last clocked in/out.'
      },
      {
        question: 'Is attendance tracked automatically?',
        answer: 'No, you need to manually clock in and out. This gives you control over when your work time is recorded.'
      }
    ]
  },

  'advanced-analytics': {
    pageTitle: 'Advanced Analytics',
    overview: 'See what\'s working in your business. Track your sales funnel, calculate campaign ROI, and get AI predictions for growth.',
    capabilities: [
      'View your sales funnel (lead to customer)',
      'Calculate ROI for email and SMS campaigns',
      'See which channels bring the most revenue',
      'Get AI predictions for future performance',
      'Export reports to Excel'
    ],
    tips: [
      'Connect Brevo and Twilio in Settings to see campaign costs and ROI',
      'Use the period filter to compare different time ranges',
      'Check Predictions for AI-powered growth forecasts',
      'Export reports to share with your team'
    ],
    faqs: [
      {
        question: 'Why is my ROI showing as 0?',
        answer: 'ROI needs campaign cost data. Connect Brevo (for email costs) and Twilio (for SMS costs) in Settings → Integrations.'
      },
      {
        question: 'How are predictions calculated?',
        answer: 'AI analyzes your historical data (leads, revenue, campaigns) to predict future trends. You need at least 3 months of data for accurate predictions.'
      },
      {
        question: 'What does the conversion funnel show?',
        answer: 'How contacts move through your sales process: New Lead → Contacted → Qualified → Won. Percentages show how many make it to each stage.'
      }
    ]
  },

  'transactions': {
    pageTitle: 'Transactions',
    overview: 'View all payments across your platform. Track successful payments, handle failed ones, and monitor your revenue.',
    capabilities: [
      'View all Stripe and Razorpay transactions',
      'Filter by status (succeeded, failed, pending)',
      'See revenue totals in USD and INR',
      'Update transaction status manually',
      'Search by company, email, or transaction ID'
    ],
    tips: [
      'Use filters to find specific transactions quickly',
      'Check failed transactions to follow up with customers',
      'Export data for accounting',
      'Review pending transactions that may need attention'
    ],
    faqs: [
      {
        question: 'Why are some transactions pending?',
        answer: 'Pending transactions are waiting for payment confirmation from Stripe/Razorpay. They usually resolve in a few minutes. If stuck, you can manually update the status.'
      },
      {
        question: 'Can I refund from here?',
        answer: 'Refunds must be processed through your Stripe or Razorpay dashboard directly. This page shows history but doesn\'t process refunds.'
      },
      {
        question: 'What\'s the difference between Stripe and Razorpay?',
        answer: 'Stripe handles international payments (USD), Razorpay handles Indian payments (INR). Customers are automatically routed based on their location.'
      }
    ]
  }
};
