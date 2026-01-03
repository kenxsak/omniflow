/**
 * Centralized Menu Configuration
 * Single source of truth for navigation structure across the platform
 * 
 * Badge Types:
 * - FREE: Green - Highlights free features (competitive advantage)
 * - AI: Violet - AI-powered features
 * - PRO: Amber - Requires Pro plan
 * - NEW: Primary - New features (auto-expires after 30 days)
 * - ONLY_US: Special - Unique features no competitor offers
 */

export type BadgeType = 'FREE' | 'AI' | 'NEW' | 'PRO' | 'STARTER' | 'ONLY_US';
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface MenuItem {
  id: string;
  href: string;
  label: string;
  icon: string;
  tooltip: string;
  featureId?: string;
  badge?: BadgeType;
  badgeExpiry?: string; // ISO date for NEW badge auto-expiry
  subItems?: MenuItem[];
  adminOnly?: boolean;
  showWhenLocked?: boolean;
  minPlan?: PlanTier;
}

export const MENU_CONFIG: MenuItem[] = [
  // ═══════════════════════════════════════════════════════════════
  // SECTION: Overview
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'solar:home-2-linear',
    tooltip: 'Your business at a glance',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Your Presence (USP - FREE Digital Card)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'digital-card',
    href: '/digital-card/manage',
    label: 'Digital Card',
    icon: 'solar:card-2-linear',
    tooltip: 'Your online business card with AI voice',
    badge: 'FREE',
    featureId: 'feat_digital_cards',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Customers (Grouped - CRM)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'customers',
    href: '/crm',
    label: 'Customers',
    icon: 'solar:users-group-rounded-linear',
    tooltip: 'Manage all your contacts & deals',
    featureId: 'feat_core_crm',
    subItems: [
      {
        id: 'daily-planner',
        href: '/daily-planner',
        label: 'Daily Planner',
        icon: 'solar:calendar-date-linear',
        tooltip: 'Your daily sales focus',
        badge: 'NEW',
        badgeExpiry: '2026-02-15',
      },
      {
        id: 'contacts',
        href: '/crm',
        label: 'All Contacts',
        icon: 'solar:user-rounded-linear',
        tooltip: 'View and manage contacts',
      },
      {
        id: 'pipeline',
        href: '/crm/pipeline',
        label: 'Sales Pipeline',
        icon: 'solar:widget-5-linear',
        tooltip: 'Track your deals',
      },
      {
        id: 'invoices',
        href: '/invoices',
        label: 'Invoices',
        icon: 'solar:bill-list-linear',
        tooltip: 'Create & track invoices',
        badge: 'NEW',
        badgeExpiry: '2026-03-01',
      },
      {
        id: 'products',
        href: '/products',
        label: 'Products',
        icon: 'solar:box-linear',
        tooltip: 'Product catalog for quotes & invoices',
        badge: 'NEW',
        badgeExpiry: '2026-03-01',
      },
      {
        id: 'appointments',
        href: '/appointments',
        label: 'Appointments',
        icon: 'solar:calendar-linear',
        tooltip: 'Schedule meetings',
      },
      {
        id: 'tasks',
        href: '/tasks',
        label: 'Tasks',
        icon: 'solar:checklist-minimalistic-linear',
        tooltip: 'Your to-do list',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Campaigns (Marketing - Grouped)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'campaigns',
    href: '/campaigns',
    label: 'Campaigns',
    icon: 'solar:letter-linear',
    tooltip: 'Email, SMS & WhatsApp marketing',
    featureId: 'feat_email_marketing',
    showWhenLocked: true,
    minPlan: 'starter',
    subItems: [
      {
        id: 'email-lists',
        href: '/campaigns/email-lists',
        label: 'Lists',
        icon: 'solar:users-group-two-rounded-linear',
        tooltip: 'Manage subscriber lists',
      },
      {
        id: 'all-campaigns',
        href: '/campaigns',
        label: 'All Campaigns',
        icon: 'solar:inbox-out-linear',
        tooltip: 'View all campaigns',
      },
      {
        id: 'email',
        href: '/email-marketing',
        label: 'Email',
        icon: 'solar:mailbox-linear',
        tooltip: 'Email campaigns',
        featureId: 'feat_email_marketing',
        showWhenLocked: true,
        minPlan: 'starter',
      },
      {
        id: 'sms',
        href: '/campaigns/messages',
        label: 'SMS',
        icon: 'solar:chat-square-linear',
        tooltip: 'Text message campaigns',
        featureId: 'feat_sms_whatsapp',
        showWhenLocked: true,
        minPlan: 'pro',
        badge: 'PRO',
      },
      {
        id: 'whatsapp',
        href: '/campaigns/whatsapp',
        label: 'WhatsApp',
        icon: 'solar:chat-round-line-linear',
        tooltip: 'WhatsApp marketing',
        featureId: 'feat_sms_whatsapp',
        showWhenLocked: true,
        minPlan: 'pro',
        badge: 'PRO',
      },
      {
        id: 'whatsapp-bulk',
        href: '/campaigns/whatsapp/bulk',
        label: 'WhatsApp Bulk',
        icon: 'solar:users-group-rounded-linear',
        tooltip: 'WhatsApp API campaigns',
        featureId: 'feat_sms_whatsapp',
        showWhenLocked: true,
        minPlan: 'pro',
        badge: 'PRO',
      },
      {
        id: 'ai-calling',
        href: '/campaigns/ai-calling',
        label: 'AI Calling',
        icon: 'solar:phone-calling-rounded-linear',
        tooltip: 'Bulk AI voice call campaigns',
        featureId: 'feat_ai_calling',
        showWhenLocked: true,
        minPlan: 'pro',
        badge: 'AI',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: AI Studio (AI Features - Grouped)
  // Ordered by user workflow: Ask → Create → Save → Build → Promote → Monitor
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ai-studio',
    href: '/ai-chat',
    label: 'AI Studio',
    icon: 'solar:stars-linear',
    tooltip: 'AI-powered content creation',
    featureId: 'feat_ai_content_gen',
    badge: 'AI',
    subItems: [
      {
        id: 'ai-assistants',
        href: '/ai-chat',
        label: 'AI Assistants',
        icon: 'solar:chat-round-dots-linear',
        tooltip: 'Ask anything, create anything',
        featureId: 'feat_ai_chat',
      },
      {
        id: 'content-creator',
        href: '/social-media',
        label: 'Content Creator',
        icon: 'solar:pen-new-square-linear',
        tooltip: 'Generate social media content',
      },
      {
        id: 'content-hub',
        href: '/social-media/content-hub',
        label: 'Content Hub',
        icon: 'solar:folder-with-files-linear',
        tooltip: 'Saved content & scheduling',
      },
      {
        id: 'landing-pages',
        href: '/landing-pages',
        label: 'Landing Pages',
        icon: 'solar:window-frame-linear',
        tooltip: 'Build pages with AI',
        badge: 'NEW',
        badgeExpiry: '2026-02-01',
      },
      {
        id: 'ad-manager',
        href: '/ai-campaign-manager',
        label: 'Ad Manager',
        icon: 'solar:target-linear',
        tooltip: 'AI ad campaigns',
        featureId: 'feat_ai_ads_manager',
        showWhenLocked: true,
        minPlan: 'pro',
        badge: 'PRO',
      },
      {
        id: 'ai-usage',
        href: '/ai-usage',
        label: 'AI Credits',
        icon: 'solar:wallet-linear',
        tooltip: 'View AI usage & credits',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Automations
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'automations',
    href: '/workflow-builder',
    label: 'Automations',
    icon: 'solar:branching-paths-up-linear',
    tooltip: 'Automate your workflows',
    featureId: 'feat_workflow_builder',
    showWhenLocked: true,
    minPlan: 'pro',
    badge: 'PRO',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Analytics
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'analytics',
    href: '/advanced-analytics',
    label: 'Analytics',
    icon: 'solar:chart-2-linear',
    tooltip: 'Track your performance',
    featureId: 'feat_advanced_analytics',
    showWhenLocked: true,
    minPlan: 'starter',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Reputation Management
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'reputation',
    href: '/reputation',
    label: 'Reviews',
    icon: 'solar:star-shine-linear',
    tooltip: 'Manage reviews & reputation',
    badge: 'NEW',
    badgeExpiry: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Team (Admin Only)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'team',
    href: '/team-management',
    label: 'Team',
    icon: 'solar:users-group-two-rounded-linear',
    tooltip: 'Manage team members',
    adminOnly: true,
    featureId: 'feat_team_management',
    showWhenLocked: true,
    minPlan: 'enterprise',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECTION: Help Center
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'help-center',
    href: '/help-center',
    label: 'Help Center',
    icon: 'solar:chat-round-dots-linear',
    tooltip: 'Get help & support',
  },
];

// Super Admin navigation (separate from regular users)
export const SUPER_ADMIN_MENU: MenuItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'solar:home-2-linear',
    tooltip: 'System overview',
  },
  {
    id: 'transactions',
    href: '/transactions',
    label: 'Transactions',
    icon: 'solar:card-linear',
    tooltip: 'All payments',
  },
  {
    id: 'ai-costs',
    href: '/super-admin-ai-costs',
    label: 'AI Costs',
    icon: 'solar:wallet-money-linear',
    tooltip: 'AI profitability',
  },
  {
    id: 'settings',
    href: '/settings',
    label: 'Settings',
    icon: 'solar:settings-linear',
    tooltip: 'System settings',
  },
];

/**
 * Feature names mapping for consistency across platform
 * Use these names everywhere: menu, home page, pricing, modals
 */
export const FEATURE_NAMES: Record<string, string> = {
  'feat_core_crm': 'Customers & CRM',
  'feat_invoicing': 'Invoicing & Payments',
  'feat_ai_content_gen': 'AI Studio',
  'feat_digital_cards': 'Digital Card',
  'feat_email_marketing': 'Email Campaigns',
  'feat_sms_whatsapp': 'SMS & WhatsApp',
  'feat_social_media': 'Social Media',
  'feat_ai_ads_manager': 'AI Ads Manager',
  'feat_ai_chat': 'AI Assistants',
  'feat_landing_pages': 'Landing Pages',
  'feat_blog': 'Blog & Content',
  'feat_workflow_builder': 'Automations',
  'feat_automations': 'Marketing Automations',
  'feat_ai_calling': 'AI Calling',
  'feat_telephony': 'Telephony',
  'feat_ai_voice_widget': 'AI Voice Widget',
  'feat_facebook_lead_ads': 'Facebook Lead Ads',
  'feat_webhooks': 'Webhooks & Automation',
  'feat_agency_mode': 'Agency Mode',
  'feat_enterprise_team': 'Enterprise Team',
  'feat_team_management': 'Team Management',
  'feat_advanced_analytics': 'Analytics',
  'feat_white_label': 'White Label',
  'feat_api_integrations': 'API & Integrations',
};

/**
 * Plan display names for upgrade modals
 */
export const PLAN_NAMES: Record<PlanTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/**
 * Badge styling configuration
 * Follows semantic color system: Blue=info, Green=success, Amber=warning, Violet=AI
 */
export const BADGE_STYLES: Record<BadgeType, { bg: string; text: string; label: string }> = {
  FREE: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'FREE',
  },
  AI: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    label: 'AI',
  },
  PRO: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'PRO',
  },
  STARTER: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    label: 'STARTER',
  },
  NEW: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    label: 'NEW',
  },
  ONLY_US: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    label: 'ONLY US',
  },
};

/**
 * Feature benefits for upgrade modals
 * Shown when user clicks a locked feature
 */
export const FEATURE_BENEFITS: Record<string, string[]> = {
  'feat_invoicing': [
    'Create professional GST invoices',
    'Collect payments via Razorpay',
    'Track payments & outstanding',
    'Send via Email or WhatsApp',
  ],
  'feat_email_marketing': [
    'Send unlimited email campaigns',
    'Beautiful email templates',
    'Track opens, clicks & conversions',
    'Automated follow-up sequences',
  ],
  'feat_sms_whatsapp': [
    'Bulk SMS campaigns',
    'WhatsApp Business API integration',
    'Two-way messaging',
    'Automated responses',
  ],
  'feat_ai_calling': [
    'AI-powered voice calls at scale',
    'Automated sales & support calls',
    'Real-time call transcription',
    'Call analytics & sentiment tracking',
  ],
  'feat_telephony': [
    'Click-to-call from CRM',
    'Call tracking & recordings',
    'Plivo & Exotel integration',
    'Call logs & analytics',
  ],
  'feat_ai_voice_widget': [
    'Embed AI voice chat on websites',
    '24/7 automated customer support',
    'Lead capture via voice',
    'Works on digital cards too',
  ],
  'feat_facebook_lead_ads': [
    'Auto-sync Facebook leads to CRM',
    'Real-time webhook integration',
    'Lead form mapping',
    'Instant follow-up triggers',
  ],
  'feat_webhooks': [
    'Connect with Zapier, Make, Pabbly',
    '5000+ app integrations',
    'Custom webhook endpoints',
    'Automate any workflow',
  ],
  'feat_workflow_builder': [
    'Visual drag-and-drop builder',
    'Trigger-based automations',
    'Multi-step workflows',
    'Save hours on repetitive tasks',
  ],
  'feat_advanced_analytics': [
    'Detailed performance reports',
    'Conversion funnel analysis',
    'Campaign ROI tracking',
    'Export reports to PDF/Excel',
  ],
  'feat_team_management': [
    'Add unlimited team members',
    'Role-based access control',
    'Activity audit logs',
    'Team performance tracking',
  ],
  'feat_social_media': [
    'Multi-platform scheduling',
    'AI content generation',
    'Content calendar view',
    'Social media analytics',
  ],
  'feat_ai_ads_manager': [
    'AI-powered ad creation',
    'Multi-platform campaigns',
    'Performance optimization',
    'A/B testing suggestions',
  ],
  'feat_ai_chat': [
    'Specialized AI agents',
    'Content Writer, Ad Strategist & more',
    'Unlimited conversations',
    'Context-aware assistance',
  ],
  'feat_landing_pages': [
    'AI-powered page builder',
    'Professional templates',
    'Lead capture forms',
    'Analytics & tracking',
  ],
  'feat_blog': [
    'AI-assisted writing',
    'SEO optimization',
    'Scheduling & publishing',
    'Content analytics',
  ],
  'feat_automations': [
    'Email sequences',
    'Drip campaigns',
    'Trigger-based actions',
    'Automated follow-ups',
  ],
  'feat_enterprise_team': [
    'Lead claiming system',
    'Full audit trail',
    'Auto lead distribution',
    'Enterprise compliance',
  ],
  'feat_agency_mode': [
    'Manage multiple client companies',
    'Switch between accounts instantly',
    'Centralized dashboard for all clients',
    'Perfect for agencies & consultants',
  ],
  'feat_white_label': [
    'Custom branding',
    'Your logo & colors',
    'Custom domain',
    'Agency-ready platform',
  ],
  'feat_api_integrations': [
    'REST API access',
    'Webhook endpoints',
    'Zapier integration',
    'Third-party connections',
  ],
};

/**
 * Check if a NEW badge should still be displayed
 * Returns false if badge has expired
 */
export function isNewBadgeActive(expiryDate?: string): boolean {
  if (!expiryDate) return true;
  return new Date(expiryDate) > new Date();
}

/**
 * Get the effective badge for a menu item
 * Handles NEW badge expiry logic
 */
export function getEffectiveBadge(item: MenuItem): BadgeType | undefined {
  if (item.badge === 'NEW' && !isNewBadgeActive(item.badgeExpiry)) {
    return undefined;
  }
  return item.badge;
}
