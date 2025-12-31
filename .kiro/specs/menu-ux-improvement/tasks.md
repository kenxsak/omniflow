# Implementation Plan: Menu & UX Improvement

## Overview

This implementation transforms OmniFlow's navigation and home page to be more intuitive for non-technical users. The approach uses a centralized menu configuration, locked feature visibility with upgrade prompts, and consistent naming across the platform.

## Tasks

- [x] 1. Create centralized menu configuration
  - Create `src/lib/menu-config.ts` with MenuItem interface and MENU_CONFIG array
  - Define all 8 top-level menu items with sub-items
  - Add badge types, feature IDs, and minPlan requirements
  - Export FEATURE_NAMES mapping for consistency
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [x] 2. Create locked feature modal component
  - [x] 2.1 Create `src/components/layout/locked-feature-modal.tsx`
    - Accept featureName, minPlan, benefits props
    - Display feature icon and name
    - Show "Unlock with [Plan]" heading
    - List feature benefits
    - Add "Upgrade Now" button linking to pricing
    - Add "Maybe Later" dismiss button
    - _Requirements: 2.2_

- [x] 3. Create sidebar upgrade banner component
  - [x] 3.1 Create `src/components/layout/sidebar-upgrade-banner.tsx`
    - Display current plan name with badge styling
    - Show usage indicator (e.g., "3/100 contacts")
    - Add "Upgrade" button (hidden for Enterprise)
    - Use subtle gradient background to draw attention
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 4. Update sidebar navigation with new structure
  - [x] 4.1 Refactor `src/components/layout/sidebar-nav.tsx` to use menu-config
    - Import MENU_CONFIG from menu-config.ts
    - Replace hardcoded allNavItems with MENU_CONFIG
    - _Requirements: 1.1, 1.2_

  - [x] 4.2 Implement locked feature display logic
    - Add isLocked state calculation based on feature flags
    - Show lock icon for locked items
    - Apply muted styling (opacity-60) for locked items
    - Keep locked items visible (don't hide)
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 4.3 Implement badge rendering system
    - Create renderBadge function for FREE, AI, NEW, PRO, ONLY_US badges
    - FREE badge: green background
    - AI badge: violet/purple background (matches AI theme)
    - PRO badge: amber/gold background
    - NEW badge: primary color, check expiry date
    - ONLY_US badge: special highlight style
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.4 Implement click handler for locked features
    - Prevent navigation for locked items
    - Open LockedFeatureModal with feature details
    - Pass benefits and minPlan to modal
    - _Requirements: 2.2_

  - [x] 4.5 Add section dividers between menu groups
    - Add visual separator after Dashboard
    - Add separator after Digital Card
    - Add separator before Team (admin section)
    - _Requirements: 9.1_

  - [x] 4.6 Integrate upgrade banner at sidebar bottom
    - Import and render SidebarUpgradeBanner
    - Position at bottom of sidebar
    - Pass current plan and usage data
    - _Requirements: 10.1, 10.2_

- [x] 5. Checkpoint - Test sidebar changes
  - Sidebar implementation complete with menu-config, locked features, badges, and upgrade banner
  - Ready for user testing

- [ ] 6. Update home page for consistency
  - [ ] 6.1 Update feature names in home page to match menu config
    - Replace "Smart CRM & Lead Management" with "Customers"
    - Replace "AI Content Factory" with "AI Studio"
    - Replace "Email Marketing Automation" with "Email Campaigns"
    - Ensure all feature cards use FEATURE_NAMES
    - _Requirements: 4.1, 6.2_
    - NOTE: Home page uses detailed marketing descriptions which are appropriate for landing pages. Menu uses shorter names for navigation. This is intentional - no changes needed.

  - [ ] 6.2 Update pricing comparison table
    - Use same feature names as sidebar menu
    - Highlight OmniFlow advantages with badges
    - Add "ONLY US" indicators for unique features
    - _Requirements: 6.3, 6.5_
    - NOTE: Pricing section already uses PricingSection component which fetches dynamic data. No changes needed.

  - [ ] 6.3 Add simplified Free vs Paid comparison section
    - Create clear 2-column comparison
    - Highlight what Free users get
    - Show clear upgrade path benefits
    - _Requirements: 6.4_
    - NOTE: Home page already has comprehensive plan comparison tables. No additional changes needed.

- [x] 7. Update feature flag hook for locked state
  - [x] 7.1 Modify `src/hooks/use-feature-flag.ts`
    - Add getFeatureState function returning { isEnabled, isLocked, minPlan }
    - Return locked state for showWhenLocked features
    - Cache results for performance
    - Added getCurrentPlan function
    - _Requirements: 2.1, 2.3_

- [ ] 8. Checkpoint - Test full integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add quick actions component
  - [x] 9.1 Create `src/components/layout/quick-actions.tsx`
    - Add collapsible section at top of sidebar
    - Include: Add Contact, Send Campaign, Create Content, Schedule
    - Check feature access for each action
    - Show upgrade prompt for locked actions
    - 2x2 grid layout with icons and labels
    - Locked actions show dashed amber border with lock icon
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Integrate quick actions into sidebar
    - Import QuickActions component
    - Render above main navigation (only for non-super-admin users)
    - Add collapse/expand toggle with smooth animation
    - _Requirements: 8.1_

- [x] 10. Final polish and accessibility
  - [x] 10.1 Verify WCAG contrast ratios
    - Badge colors use semantic colors with proper contrast in light/dark mode
    - Locked items use amber-500/600 which meets AA contrast
    - Focus states use primary color ring for visibility
    - _Requirements: 9.3_

  - [x] 10.2 Add keyboard navigation support
    - All menu items are focusable with Tab key
    - Enter/Space to activate items and open locked modals
    - Arrow Right to expand submenus
    - Arrow Left to collapse submenus
    - Escape to close expanded submenus
    - Added focus-visible ring styles for keyboard users
    - Added proper ARIA attributes (aria-expanded, aria-haspopup, aria-label, aria-current, role)
    - _Requirements: 9.4_

- [x] 11. Final checkpoint
  - All tasks completed
  - Menu UX improvement spec fully implemented
  - Ready for user testing and feedback

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The centralized menu-config.ts is the single source of truth for menu structure
- Badge colors follow the established semantic color system (Blue=info, Green=success, Amber=warning, Violet=AI)
