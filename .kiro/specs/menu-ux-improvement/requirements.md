# Requirements Document

## Introduction

This specification defines the comprehensive UX improvement for OmniFlow's navigation menu and home page to make the platform more accessible for non-technical small business users. The goal is to create a consistent, intuitive experience that clearly communicates value, encourages upgrades, and differentiates OmniFlow from competitors like HubSpot, Zoho, Freshsales (global) and LeadSquared, Kylas, Salesmate (Indian market).

## Glossary

- **Sidebar_Menu**: The main navigation component in the dashboard that users interact with daily
- **Home_Page**: The public landing page at `/` that showcases features and pricing
- **Feature_Flag**: A system that controls which features are visible based on user's subscription plan
- **Locked_Feature**: A menu item visible to all users but disabled for those without access, showing an upgrade prompt
- **USP_Badge**: A visual indicator highlighting unique selling points (e.g., "FREE", "ONLY US", "AI")
- **Non_Tech_User**: Small business owners without technical background who need simple, clear interfaces

## Requirements

### Requirement 1: Simplified Menu Structure

**User Story:** As a non-tech business owner, I want a simple menu with fewer items grouped logically, so that I can find features without feeling overwhelmed.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL display maximum 8 top-level navigation items (reduced from current 12)
2. THE Sidebar_Menu SHALL group related features under parent items using expandable sub-menus
3. WHEN a user views the menu, THE Sidebar_Menu SHALL use simple, action-oriented labels that non-tech users understand (e.g., "Customers" instead of "Contacts/CRM")
4. THE Sidebar_Menu SHALL maintain consistent naming with Home_Page feature descriptions

### Requirement 2: Locked Feature Visibility with Upgrade Prompts

**User Story:** As a free plan user, I want to see all available features (even locked ones), so that I understand what I can unlock by upgrading.

#### Acceptance Criteria

1. WHEN a feature is not available in user's plan, THE Sidebar_Menu SHALL display the item with a lock icon and "PRO" or "STARTER" badge
2. WHEN a user clicks a locked feature, THE System SHALL display an upgrade modal explaining the feature benefits and pricing
3. THE Sidebar_Menu SHALL NOT completely hide features from lower-tier users (show locked instead)
4. WHEN displaying locked features, THE System SHALL show them in a slightly muted style but still clearly visible

### Requirement 3: USP Badges and Competitive Highlights

**User Story:** As a potential customer, I want to immediately see what makes OmniFlow unique, so that I can understand why to choose it over competitors.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL display "FREE" badge on Digital Card item (unique selling point)
2. THE Sidebar_Menu SHALL display "AI" badge on AI-powered features to highlight automation capabilities
3. THE Sidebar_Menu SHALL display "ONLY US" badge on features no competitor offers (AI Voice Chatbot)
4. WHEN a feature is new, THE Sidebar_Menu SHALL display "NEW" badge for 30 days after launch
5. THE Home_Page SHALL highlight the same USPs with consistent badge styling

### Requirement 4: Consistent Naming Across Platform

**User Story:** As a user, I want the same feature names used everywhere, so that I don't get confused navigating between home page and dashboard.

#### Acceptance Criteria

1. THE System SHALL use identical feature names in Sidebar_Menu, Home_Page, and Pricing_Section
2. THE System SHALL use the following standardized names:
   - "Customers" (not "Contacts" or "CRM")
   - "Campaigns" (not "Marketing")
   - "AI Studio" (not "AI Tools")
   - "Digital Card" (consistent everywhere)
   - "Analytics" (not "Advanced Analytics" or "Reports")
3. WHEN updating any feature name, THE System SHALL update all occurrences simultaneously

### Requirement 5: Smart Menu Grouping

**User Story:** As a business owner, I want related features grouped together, so that I can complete tasks without searching through many menu items.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL group customer-related features (Contacts, Pipeline, Appointments, Tasks) under "Customers"
2. THE Sidebar_Menu SHALL group marketing features (Email, SMS, WhatsApp) under "Campaigns"
3. THE Sidebar_Menu SHALL group AI features (Content Creator, Landing Pages, Ad Manager) under "AI Studio"
4. WHEN a parent menu has sub-items, THE Sidebar_Menu SHALL auto-expand when any sub-item is active
5. THE Sidebar_Menu SHALL remember user's expanded/collapsed state per session

### Requirement 6: Home Page Feature-Plan Alignment

**User Story:** As a visitor, I want to clearly see which features are included in each plan, so that I can choose the right plan for my needs.

#### Acceptance Criteria

1. THE Home_Page pricing comparison table SHALL dynamically fetch plan data (not hardcoded)
2. THE Home_Page SHALL display features using the same names as Sidebar_Menu
3. WHEN displaying plan comparison, THE Home_Page SHALL highlight OmniFlow's unique advantages over competitors
4. THE Home_Page SHALL show a simplified Free vs Paid comparison for quick understanding
5. THE Home_Page SHALL display "What competitors charge" comparison to emphasize value

### Requirement 7: Mobile-Friendly Navigation

**User Story:** As a business owner using mobile, I want easy navigation on small screens, so that I can manage my business on the go.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL collapse to icons-only mode on mobile devices
2. WHEN in mobile mode, THE Sidebar_Menu SHALL show labels on hover/tap
3. THE Sidebar_Menu SHALL support swipe gestures to open/close on mobile
4. THE Home_Page SHALL be fully responsive with touch-friendly pricing cards

### Requirement 8: Quick Actions for Common Tasks

**User Story:** As a busy business owner, I want quick access to common actions, so that I can complete frequent tasks faster.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL include a "Quick Actions" section at the top (collapsible)
2. THE Quick_Actions section SHALL include: Add Contact, Send Message, Create Campaign, Schedule Post
3. WHEN a quick action is clicked, THE System SHALL open the relevant form/modal directly
4. IF a quick action requires a locked feature, THEN THE System SHALL show upgrade prompt instead

### Requirement 9: Visual Hierarchy and Accessibility

**User Story:** As a user, I want clear visual distinction between menu sections, so that I can quickly scan and find what I need.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL use section dividers between logical groups
2. THE Sidebar_Menu SHALL use consistent icon style (Solar icons) for all items
3. THE Sidebar_Menu SHALL maintain WCAG 2.1 AA contrast ratios in both light and dark modes
4. WHEN a menu item is active, THE Sidebar_Menu SHALL clearly highlight it with background color change

### Requirement 10: Upgrade Path Visibility

**User Story:** As a free user, I want to easily see how to upgrade, so that I can unlock more features when ready.

#### Acceptance Criteria

1. THE Sidebar_Menu SHALL display current plan name at the bottom (e.g., "Free Plan")
2. THE Sidebar_Menu SHALL include an "Upgrade" button visible to non-enterprise users
3. WHEN user clicks Upgrade, THE System SHALL navigate to pricing page with current plan highlighted
4. THE System SHALL show upgrade prompts contextually when users hit plan limits
