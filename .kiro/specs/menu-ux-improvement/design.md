# Design Document: Menu & UX Improvement

## Overview

This design transforms OmniFlow's navigation and home page to be the most user-friendly CRM/marketing platform for non-technical small business owners. The approach combines best practices from global leaders (HubSpot's clarity, Freshsales' simplicity) with Indian market needs (WhatsApp prominence, cost-consciousness) while highlighting OmniFlow's unique advantages.

## Architecture

### Component Structure

```
src/
├── components/
│   └── layout/
│       ├── sidebar-nav.tsx          # Main navigation (MODIFY)
│       ├── sidebar-upgrade-banner.tsx # New upgrade CTA component
│       ├── quick-actions.tsx         # New quick actions component
│       └── locked-feature-modal.tsx  # New upgrade prompt modal
├── hooks/
│   └── use-feature-flag.ts          # Feature access check (MODIFY)
├── lib/
│   └── menu-config.ts               # New centralized menu configuration
└── app/
    └── page.tsx                     # Home page (MODIFY)
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  menu-config.ts │────▶│  sidebar-nav.tsx │────▶│  UI Rendering   │
│  (Menu Items)   │     │  (Logic)         │     │  (Display)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         │              │ use-feature-flag │
         │              │ (Access Check)   │
         │              └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Home Page      │     │ Locked/Unlocked  │
│  (Same Names)   │     │ State + Badges   │
└─────────────────┘     └──────────────────┘
```

## Components and Interfaces

### 1. Centralized Menu Configuration

```typescript
// src/lib/menu-config.ts

export interface MenuItem {
  id: string;
  href: string;
  label: string;                    // User-friendly name
  icon: string;                     // Solar icon
  tooltip: string;                  // Helpful description
  featureId?: string;               // For access control
  badge?: 'FREE' | 'AI' | 'NEW' | 'ONLY_US' | 'PRO' | 'STARTER';
  badgeExpiry?: string;             // ISO date for NEW badge
  subItems?: MenuItem[];
  adminOnly?: boolean;
  showWhenLocked?: boolean;         // Show with lock icon if no access
  minPlan?: 'free' | 'starter' | 'pro' | 'enterprise';
}

export const MENU_CONFIG: MenuItem[] = [
  // SECTION: Overview
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'solar:home-2-linear',
    tooltip: 'Your business at a glance',
  },
  
  // SECTION: Your Presence (USP - FREE)
  {
    id: 'digital-card',
    href: '/digital-card/manage',
    label: 'Digital Card',
    icon: 'solar:card-2-linear',
    tooltip: 'Your online business card with AI voice',
    badge: 'FREE',
    featureId: 'feat_digital_cards',
  },
  
  // SECTION: Customers (Grouped)
  {
    id: 'customers',
    href: '/crm',
    label: 'Customers',
    icon: 'solar:users-group-rounded-linear',
    tooltip: 'Manage all your contacts & deals',
    featureId: 'feat_core_crm',
    subItems: [
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
  
  // SECTION: Campaigns (Marketing - Grouped)
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
    ],
  },
  
  // SECTION: AI Studio (AI Features - Grouped)
  {
    id: 'ai-studio',
    href: '/social-media',
    label: 'AI Studio',
    icon: 'solar:stars-linear',
    tooltip: 'AI-powered content creation',
    featureId: 'feat_ai_content_gen',
    badge: 'AI',
    subItems: [
      {
        id: 'content-creator',
        href: '/social-media',
        label: 'Content Creator',
        icon: 'solar:pen-new-square-linear',
        tooltip: 'Generate content with AI',
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
      },
      {
        id: 'ad-manager',
        href: '/ai-campaign-manager',
        label: 'Ad Manager',
        icon: 'solar:target-linear',
        tooltip: 'AI ad campaigns',
        featureId: 'feat_ai_content_gen',
        showWhenLocked: true,
        minPlan: 'pro',
      },
    ],
  },
  
  // SECTION: Automations
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
  
  // SECTION: Analytics
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
  
  // SECTION: Team (Admin Only)
  {
    id: 'team',
    href: '/team-management',
    label: 'Team',
    icon: 'solar:users-group-two-rounded-linear',
    tooltip: 'Manage team members',
    adminOnly: true,
    showWhenLocked: true,
    minPlan: 'enterprise',
  },
];

// Feature names mapping for consistency
export const FEATURE_NAMES = {
  'feat_digital_cards': 'Digital Card',
  'feat_core_crm': 'Customers',
  'feat_email_marketing': 'Email Campaigns',
  'feat_sms_whatsapp': 'SMS & WhatsApp',
  'feat_ai_content_gen': 'AI Studio',
  'feat_workflow_builder': 'Automations',
  'feat_advanced_analytics': 'Analytics',
  'feat_team_management': 'Team Management',
};
```

### 2. Locked Feature Modal Component

```typescript
// src/components/layout/locked-feature-modal.tsx

interface LockedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  minPlan: 'starter' | 'pro' | 'enterprise';
  benefits: string[];
}

// Modal shows:
// - Feature name and icon
// - "Unlock [Feature] with [Plan]"
// - List of benefits
// - Current plan vs required plan comparison
// - "Upgrade Now" CTA button
// - "Maybe Later" dismiss button
```

### 3. Sidebar Upgrade Banner Component

```typescript
// src/components/layout/sidebar-upgrade-banner.tsx

// Shows at bottom of sidebar:
// - Current plan badge (e.g., "Free Plan")
// - Progress indicator (e.g., "3/100 contacts used")
// - "Upgrade" button (hidden for Enterprise users)
// - Subtle animation to draw attention
```

### 4. Quick Actions Component

```typescript
// src/components/layout/quick-actions.tsx

// Collapsible section at top of sidebar:
// - "+ Add Contact" → Opens contact form modal
// - "+ Send Message" → Opens campaign selector
// - "+ Create Content" → Opens AI Studio
// - "+ Schedule" → Opens appointment form
// Each action checks feature access and shows upgrade if locked
```

## Data Models

### Menu Item State

```typescript
interface MenuItemState {
  item: MenuItem;
  isAccessible: boolean;      // User has access
  isLocked: boolean;          // Show but locked
  isActive: boolean;          // Currently selected
  isExpanded: boolean;        // Sub-menu open
  badgeType: string | null;   // Badge to display
}
```

### Upgrade Prompt Data

```typescript
interface UpgradePromptData {
  featureId: string;
  featureName: string;
  currentPlan: string;
  requiredPlan: string;
  benefits: string[];
  monthlyPrice: number;
  savings: string;           // e.g., "Save $500/month vs competitors"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Menu Item Visibility Consistency

*For any* user with a given plan, the same menu items SHALL be visible across all sessions and devices, with locked/unlocked state matching their plan's feature access.

**Validates: Requirements 1.1, 2.1, 2.3**

### Property 2: Name Consistency Across Platform

*For any* feature displayed in the Sidebar_Menu, the exact same label SHALL appear in the Home_Page feature list and Pricing_Section.

**Validates: Requirements 4.1, 4.2**

### Property 3: Locked Feature Click Behavior

*For any* locked menu item clicked by a user, the System SHALL display an upgrade modal within 200ms without navigating away from the current page.

**Validates: Requirements 2.2, 8.4**

### Property 4: Badge Display Correctness

*For any* menu item with a badge configuration, the badge SHALL be displayed if and only if the badge condition is met (e.g., NEW badge only within 30 days of launch).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 5: Sub-Menu State Persistence

*For any* parent menu item with sub-items, the expanded/collapsed state SHALL persist within the user's session and auto-expand when a sub-item route is active.

**Validates: Requirements 5.4, 5.5**

### Property 6: Upgrade Path Accessibility

*For any* non-enterprise user, an upgrade button or prompt SHALL be accessible within 2 clicks from any dashboard page.

**Validates: Requirements 10.1, 10.2, 10.3**

## Error Handling

### Feature Flag Loading Failure

- If feature flags fail to load, show all menu items as accessible (fail-open for UX)
- Log error to monitoring system
- Retry feature flag fetch after 5 seconds

### Plan Data Unavailable

- If user's plan data is unavailable, default to "Free" plan restrictions
- Show "Loading..." state briefly, then render with defaults
- Display subtle error indicator in sidebar footer

### Upgrade Modal Errors

- If pricing data fails to load in upgrade modal, show generic "Contact Sales" CTA
- Cache pricing data locally for offline resilience

## Testing Strategy

### Unit Tests

1. Menu configuration validation (all required fields present)
2. Feature flag hook returns correct access state
3. Badge display logic (NEW badge expiry, plan-based badges)
4. Locked feature modal renders with correct data

### Property-Based Tests

1. **Menu Consistency Test**: Generate random user plans, verify menu state matches expected access
2. **Name Consistency Test**: Extract all feature names from menu config, verify they exist in home page
3. **Upgrade Flow Test**: For all locked features, verify upgrade modal displays correct plan requirement

### Integration Tests

1. Full sidebar render with mock feature flags
2. Click locked item → modal appears → upgrade button works
3. Mobile responsive behavior
4. Dark/light mode badge visibility

### E2E Tests

1. Free user sees locked Campaigns with PRO badge
2. Pro user sees unlocked Campaigns, locked Team
3. Upgrade flow from locked feature to pricing page
4. Quick actions work for accessible features
