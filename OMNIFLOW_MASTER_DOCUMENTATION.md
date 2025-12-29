# OmniFlow Master Documentation
**Single Source of Truth - All Essential Project Information**

*Consolidated: December 2024*
*Purpose: Combines all documentation into one comprehensive reference*

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Current Status & Progress](#current-status--progress)
3. [User Roles & Access](#user-roles--access)
4. [Feature Inventory](#feature-inventory)
5. [Priority Implementation Roadmap](#priority-implementation-roadmap)
6. [Messaging Platforms Integration](#messaging-platforms-integration)
7. [External Dependencies & APIs](#external-dependencies--apis)
8. [Technical Architecture](#technical-architecture)
9. [API Quick Reference](#api-quick-reference)
10. [UX Guidelines](#ux-guidelines)
11. [Testing Checklist](#testing-checklist)
12. [Security & Pre-MVP Checklist](#security--pre-mvp-checklist)
13. [Session Reminder Prompts](#session-reminder-prompts)

---

## Platform Overview

### What is OmniFlow?

OmniFlow is an all-in-one sales and marketing SaaS platform for Small and Medium Enterprises (SMEs) that combines:

- **CRM** - Lead and customer management with pipeline view
- **Multi-Channel Marketing** - Email (Brevo/Sender.net), SMS (MSG91/Fast2SMS/Twilio), WhatsApp (Gupshup/AiSensy/Meta)
- **AI Content Generation** - Gemini 2.0 Flash for text, images (Imagen 4), TTS
- **Digital Cards** - Linktree alternative with AI Voice Chatbot (109 languages)
- **Automation** - Email/SMS sequences and workflows
- **Analytics** - Campaign performance, ROI tracking, AI usage
- **Team Management** - User roles, permissions, attendance tracking

### Target Users
- **Primary**: Non-technical SME owners, marketers, sales teams
- **Secondary**: Agencies, consultants, coaches
- **Geography**: Global (50+ currencies, multi-language support)

### Core Technologies
- **Frontend**: Next.js 15 (App Router, React Server Components)
- **Backend**: Next.js Server Actions
- **Database**: Firebase Firestore (multi-tenant)
- **Authentication**: Firebase Auth with RBAC
- **AI**: Google Genkit with Gemini 2.0 Flash
- **UI**: shadcn/ui + Tailwind CSS

---

## Current Status & Progress

### Overall Completion: 80%

```
Core Platform:         ████████████████████ 100%  Complete
Messaging Platforms:   ████████████████░░░░  80%  Near Complete
Lead Capture System:   ████████████████████ 100%  Complete
Social Media Tools:    ████████████████████ 100%  Complete
Onboarding:            ████████████████████ 100%  Complete
UX Improvements:       ████████████░░░░░░░░  60%  In Progress
Mobile PWA:            ███░░░░░░░░░░░░░░░░░  15%  Planned
Advanced Features:     ██░░░░░░░░░░░░░░░░░░  10%  Planned
```

### What's 100% Complete

**Core Infrastructure:**
- Next.js 15 App Router with React Server Components
- Firebase Authentication & Firestore
- Multi-tenancy with company isolation
- Role-based access control (SuperAdmin, Admin, Manager, User)
- Subscription plans (Free, Starter, Pro, Enterprise)
- Global pricing with 50+ currency support
- API key encryption (AES-GCM)

**Features - Live & Functional:**
- Dashboard with metrics, charts, recent activity
- CRM (leads, contacts, pipeline view, CSV import/export)
- CRM Integrations (HubSpot, Zoho, Bitrix24)
- Email Marketing (Brevo, Sender.net integration)
- Email Automation (Welcome, Abandoned Cart sequences)
- SMS Marketing (MSG91, Fast2SMS, Twilio)
- WhatsApp Marketing (Gupshup, AiSensy, Authkey, Meta Cloud API)
- AI Content Factory (8 content types)
- AI Ads Manager (6 platforms)
- Digital Cards with QR codes
- Voice Chatbot Widget (109 languages)
- Task Management with calendar view
- Team Management (clock in/out, attendance)
- AI Usage Tracking (credits, costs, quotas)
- Advanced Analytics (ROI, conversion funnels)
- Settings (API keys, company profile, subscriptions)
- Enterprise Features (lead claiming, audit trail, auto-distribution)

**NEW - Social Media Content Tools (December 2024):**
- Quick Publish Buttons (one-click social sharing)
- Content Templates Library (20+ templates across industries)
- Image Style Presets (AI image generation with style categories)
- SEO Score Checker (real-time content optimization)
- Enhanced Sales Page Generator (AI-powered landing pages)
- Enhanced Blog Post Generator (AI-powered blog content)

**NEW - Lead Capture System (December 2024):**
- Floating Lead Capture Widget (auto-injects into Sales Pages & Blog Posts)
- Universal Embed Form API (`/api/embed-lead`) - Better than Web3Forms
- Embed Form Generator (HTML/React/WordPress code snippets)
- Access Key System (per-company security)
- Spam Protection (honeypot, link limits, validation)
- Email Notifications (beautiful HTML emails to business owner)
- Direct CRM Integration (leads auto-saved with source tracking)

### What's In Progress

**Template Library (100% - COMPLETE)**
- Library structure complete
- 20+ default templates across 7 industries
- End-to-end tested and working

**Onboarding Wizard (100% - COMPLETE)**
- 4-step wizard complete
- Celebration screen with confetti animation
- Progress tracking and resume functionality

**Plain Language Updates (60%)**
- Dashboard helpers ready
- Needs full implementation across all pages

---

## Competitive Advantages (December 2024)

### vs Web3Forms (Lead Capture)
OmniFlow's embed form system is **better than Web3Forms**:
- ✅ Direct CRM integration (leads auto-saved)
- ✅ Email notifications with beautiful HTML
- ✅ Spam protection (honeypot + link limits)
- ✅ Access key security (per-company)
- ✅ Source tracking (know where leads come from)
- ✅ No monthly limits on submissions
- ✅ HTML/React/WordPress code snippets

### vs Competitors (GoHighLevel, HubSpot, ActiveCampaign)
- ✅ All-in-one at fraction of cost
- ✅ BYOK for unlimited AI (no per-generation fees)
- ✅ Multi-channel marketing (Email + SMS + WhatsApp)
- ✅ Built-in AI content generation
- ✅ Digital cards with Voice AI
- ✅ Universal lead capture forms
- ✅ White-label ready for agencies

---

## User Roles & Access

### SuperAdmin (Platform Owner)
**Full platform control across all companies**

**Accessible Pages:**
- `/super-admin` - Platform dashboard
- `/super-admin/ai-monitoring` - AI costs across all companies
- `/super-admin/companies` - View all companies
- `/super-admin/plans` - Manage subscription plans
- `/super-admin/feature-flags` - Toggle features

### Admin (Company Owner)
**Full company control, manage team and settings**

**Accessible Pages:**
- All dashboard pages
- All CRM pages (leads, contacts, pipeline)
- All marketing pages (email, SMS, WhatsApp)
- All AI pages (content factory, ads manager)
- `/settings/*` - All settings including API keys
- `/team/*` - User management

### Manager (Team Lead)
**Manage users, create campaigns, view leads**

**Same as Admin except:**
- Cannot access company settings
- Cannot manage API keys
- Cannot view subscription details
- Can manage users (except Admins/SuperAdmins)

### User (Team Member)
**Basic operations (leads, campaigns, AI)**

**Same as Manager except:**
- Cannot manage other users
- Can only see own leads (or assigned)
- Can create campaigns

---

## Feature Inventory

### CRM Features
| Feature | Status | File Location |
|---------|--------|---------------|
| Lead CRUD | Complete | `src/app/actions/lead-actions.ts` |
| Contact Details | Complete | `src/app/dashboard/crm/contacts/[id]/page.tsx` |
| Pipeline View | Complete | `src/app/dashboard/crm/pipeline/page.tsx` |
| CSV Import/Export | Complete | `src/components/leads/` |
| Activity Timeline | Complete | `src/components/activity/` |
| Deal Management | Complete | `src/app/actions/deal-actions.ts` |
| Lead Claiming | Complete | Enterprise feature |
| Audit Trail | Complete | Enterprise feature |

### Email Marketing
| Feature | Status | Provider |
|---------|--------|----------|
| Brevo Integration | Complete | Campaign API |
| Sender.net Integration | Complete | Campaign API |
| Campaign Creation | Complete | - |
| Template Management | Complete | - |
| Email Automation | Complete | Pre-built sequences |
| Analytics/Tracking | Complete | - |

### SMS Marketing
| Feature | Status | Provider |
|---------|--------|----------|
| MSG91 Integration | Complete | DLT supported |
| Fast2SMS Integration | Complete | Budget option |
| Twilio Integration | Complete | Global |
| Bulk SMS Campaigns | Complete | - |
| Template Management | Complete | DLT templates |

### WhatsApp Marketing
| Feature | Status | Provider |
|---------|--------|----------|
| Gupshup Integration | Complete | Business API |
| AiSensy Integration | Complete | Marketing automation |
| Authkey Integration | Complete | - |
| Meta Cloud API | Complete | Direct integration |
| Template Management | Complete | - |
| Bulk Campaigns | Complete | - |

### AI Features
| Feature | Status | Model |
|---------|--------|-------|
| Content Factory | Complete | Gemini 2.0 Flash |
| Blog Generator | Complete | Gemini 2.0 Flash |
| Social Media Posts | Complete | Gemini 2.0 Flash |
| Email Writer | Complete | Gemini 2.0 Flash |
| Image Generation | Complete | Imagen 4 |
| Text-to-Speech | Complete | Gemini TTS |
| Ad Copy Generator | Complete | Gemini 2.0 Flash |
| BYOK Support | Complete | User's own key |
| Content Templates | Complete | 20+ templates |
| Image Style Presets | Complete | Category-based |
| SEO Score Checker | Complete | Real-time analysis |
| Sales Page Generator | Complete | AI-powered |
| Blog Post Generator | Complete | AI-powered |

### Lead Capture Features (NEW)
| Feature | Status | Notes |
|---------|--------|-------|
| Floating Widget | Complete | Auto-injects into pages |
| Embed Form API | Complete | `/api/embed-lead` |
| Embed Code Generator | Complete | HTML/React/WordPress |
| Access Key System | Complete | Per-company security |
| Spam Protection | Complete | Honeypot + validation |
| Email Notifications | Complete | HTML emails |
| CRM Integration | Complete | Auto-save leads |

### Digital Cards
| Feature | Status | Notes |
|---------|--------|-------|
| Card Builder | Complete | Drag-drop |
| QR Code Generation | Complete | - |
| Voice Chatbot | Complete | 109 languages |
| Link Management | Complete | - |
| Analytics | Complete | - |

---

## Priority Implementation Roadmap

### CRITICAL PRIORITY: Messaging Platforms (If not complete)

**For detailed step-by-step implementation, see: `MESSAGING_PLATFORMS_GUIDE.md`**

**Why Critical:**
- THE #1 user request: bulk messaging for 1,000+ contacts
- Enables real marketing campaigns
- 3x higher user retention

**WhatsApp Platforms:**
| Platform | Priority | Setup Time | Best For |
|----------|----------|------------|----------|
| WATI | P0 | 15 min | Simple UI, non-tech teams |
| AiSensy | P0 | 20 min | Automation, chatbots |
| Meta Direct | P2 | 2 hours | Tech-savvy teams |

**SMS Platforms (India + Global):**
| Platform | Priority | India Cost | Best For |
|----------|----------|------------|----------|
| MSG91 | P0 | ₹0.18-0.30/SMS | Developer-friendly, DLT |
| 2Factor.in | P0 | ₹0.18-0.30/SMS | Ultra-fast OTP (1-3s) |
| Fast2SMS | P1 | ₹0.15-0.20/SMS | Budget startups |

### Phase 1 (Week 1-2): UX Improvements

1. **Template Library Testing**
   - Test template application end-to-end
   - Variable substitution verification

2. **Onboarding Completion**
   - Add celebration screen
   - Track onboarding analytics

3. **Plain Language Updates**
   - Replace jargon throughout UI
   - Add contextual help buttons

### Phase 2 (Week 3-4): High-Impact UX

1. **Help System**
   - "?" buttons on every page
   - Contextual tooltips

2. **Video Tutorials**
   - 10+ embedded tutorials

3. **Weekly Email Reports**
   - Automated performance summaries

### Phase 3 (Month 2): Advanced Features

1. **Mobile PWA**
   - Offline capability
   - Push notifications

2. **Visual Automation Builder**
   - Drag-drop workflow builder

3. **Achievements/Gamification**
   - Progress tracking

---

## External Dependencies & APIs

### Core Infrastructure
- **Firebase**: Authentication, Firestore
- **Next.js 15**: Web framework
- **React 18**: UI library

### UI & Styling
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **Lucide React**: Icons
- **Recharts**: Data visualization

### AI & Automation
- **Google Genkit**: AI orchestration
- **@genkit-ai/googleai**: Gemini integration

### Third-Party Integrations

**Image Services:**
- ImgBB API (image hosting)

**Email Services:**
- Sender.net API
- Brevo API
- Custom SMTP (Amazon SES, SMTP2GO, Gmail)

**WhatsApp Platforms:**
- Gupshup API
- Authkey API
- AiSensy API
- MSG91 WhatsApp API
- Fast2SMS WhatsApp API
- Meta WhatsApp Cloud API

**SMS Platforms:**
- MSG91 SMS API
- Fast2SMS API
- Twilio SMS API

**CRM Systems:**
- HubSpot API
- Zoho CRM API
- Bitrix24 API

**Payment Gateways:**
- Stripe (International)
- Razorpay (India)

**Utilities:**
- exchangerate-api.com (currency rates)
- ipapi.co (geo-detection)
- Cal.com API (appointments)

---

## Technical Architecture

### Multi-Tenancy
- All data scoped by `companyId`
- Firestore security rules enforce isolation
- Users can only access their company's data

### Authentication Flow
1. Firebase Auth handles login/signup
2. Custom claims store role and companyId
3. Server actions verify auth on each request
4. Role-based feature access

### API Key Security
- AES-GCM encryption for all API keys
- Keys stored encrypted in Firestore
- Decrypted only when needed server-side

### Feature Flags
Plan-based feature gating:
- `feat_core_crm`: All paid plans
- `feat_email_marketing`: Starter+
- `feat_sms_whatsapp`: Pro+
- `feat_ai_content_gen`: All plans
- `feat_enterprise_team`: Enterprise only

### Enterprise Features (50+ Users)
- **Lead Claiming**: Transaction-based, 30-min auto-expire
- **Audit Trail**: Full CRM action logging
- **Auto-Distribution**: Round-robin, load-balanced, random
- **SSO Ready**: Firebase supports Google, GitHub, Microsoft, Apple

---

## API Quick Reference

### Lead/Contact Actions
**Location:** `src/app/actions/lead-actions.ts`

| Action | Parameters | Returns |
|--------|------------|---------|
| `getLeads` | `companyId` | `Lead[]` |
| `getLead` | `leadId` | `Lead \| null` |
| `createLead` | `data: LeadInput` | `{success, id?, error?}` |
| `updateLead` | `leadId, data` | `{success, error?}` |
| `deleteLead` | `leadId` | `{success, error?}` |

### Lead Capture API (NEW)
**Universal Embed Form:** `POST /api/embed-lead`

| Field | Required | Description |
|-------|----------|-------------|
| `access_key` | Yes | Company's unique access key |
| `name` | Yes | Lead's name |
| `email` | Yes | Lead's email |
| `phone` | No | Lead's phone |
| `message` | No | Lead's message |
| `source` | No | Custom source identifier |
| `_honeypot` | No | Spam protection (must be empty) |

**Sales Page Lead Capture:** `POST /api/capture-sales-lead`

| Field | Required | Description |
|-------|----------|-------------|
| `postId` | Yes | Sales page/blog post ID |
| `name` | Yes | Lead's name |
| `email` | Yes | Lead's email |
| `phone` | No | Lead's phone |
| `message` | No | Lead's message |

### Embed Form Actions
**Location:** `src/app/actions/embed-form-actions.ts`

| Action | Parameters | Returns |
|--------|------------|---------|
| `generateEmbedAccessKey` | `idToken` | `{success, accessKey?}` |
| `getEmbedAccessKey` | `idToken` | `{success, accessKey?}` |

### Campaign Actions
**Location:** `src/app/actions/campaign-actions.ts`

| Action | Parameters | Returns |
|--------|------------|---------|
| `getCampaigns` | `companyId` | `Campaign[]` |
| `createCampaign` | `data` | `{success, id?}` |
| `sendCampaign` | `campaignId` | `{success, error?}` |

### AI Actions
**Location:** `src/app/actions/ai-actions.ts`

| Action | Parameters | Returns |
|--------|------------|---------|
| `generateContent` | `prompt, type` | `{success, content?}` |
| `generateImage` | `prompt` | `{success, imageUrl?}` |
| `checkAIQuota` | `companyId` | `{remaining, limit}` |

### Payment Actions
**Stripe:** `src/app/actions/stripe-payment-actions.ts`
**Razorpay:** `src/app/actions/razorpay-payment-actions.ts`

---

## UX Guidelines

### Design Principles
1. **Mobile-First**: Design for phones, enhance for desktop
2. **Plain Language**: No jargon, explain simply
3. **User-Centric**: Think like a non-technical SME owner
4. **Fast Feedback**: Always show loading, success, error states
5. **Test Everywhere**: Mobile, tablet, desktop must all work

### Language Replacements
| Technical Term | Plain Language |
|----------------|----------------|
| API Key | Connection Code |
| CRM Integration | Import Contacts |
| OAuth | Quick Connect |
| Webhook | Automatic Updates |
| Dashboard | Home |
| Analytics | Reports |
| Campaign | Message |
| Automation | Auto-Send |

### Mobile Requirements
- Touch targets: minimum 44px
- No horizontal scroll
- Text minimum 16px
- Single column on mobile (375px)
- Stack all elements vertically

---

## Testing Checklist

Before marking any feature complete:

**Functionality:**
- [ ] Works on mobile (375px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1920px width)
- [ ] No console errors
- [ ] All buttons/links work
- [ ] Form validation works
- [ ] Error states display correctly
- [ ] Loading states work

**UX:**
- [ ] No technical jargon visible
- [ ] Touch targets >= 44px
- [ ] Text >= 16px on mobile
- [ ] Clear success/error messages
- [ ] Intuitive flow

**Security:**
- [ ] Auth required for protected routes
- [ ] Role restrictions enforced
- [ ] API keys not exposed
- [ ] Input sanitization

---

## Security & Pre-MVP Checklist

### Security Scripts
- `scripts/security-scan.sh` - OWASP-style automated checks
- `docs/OWASP_SECURITY_CHECKLIST.md` - Security verification guide

### Testing Resources
- `docs/USER_JOURNEY_TESTING.md` - 11 critical user journeys
- `docs/STRESS_TEST_GUIDE.md` - 100 concurrent user testing
- `scripts/stress-test.js` - Load test script
- `docs/PAYMENT_VERIFICATION_GUIDE.md` - Stripe & Razorpay testing

### Documentation
- `docs/API_QUICK_REFERENCE.md` - Server actions and endpoints
- `docs/USER_HELP_ARTICLES.md` - End-user documentation

### Backup & Recovery
- `docs/BACKUP_DISASTER_RECOVERY.md` - Backup procedures
- `scripts/firestore-backup.sh` - Automated backup

---

## Session Reminder Prompts

### Main Development Prompt
```
Continue OmniFlow development. Read OMNIFLOW_MASTER_DOCUMENTATION.md for 
complete project reference. Current priorities:
1. Complete any in-progress features
2. UX improvements (plain language, mobile responsiveness)
3. Testing and polish

All features must be mobile-responsive and use plain language (no jargon).
```

### For Messaging Work
```
Work on OmniFlow Messaging Integration. Refer to the Messaging Platforms 
section in OMNIFLOW_MASTER_DOCUMENTATION.md. Implement [PLATFORM NAME]. 
Follow the step-by-step guide. All UX must be non-technical.
```

### For UX Improvements
```
Improve OmniFlow UX for non-technical users. Refer to UX Guidelines section 
in OMNIFLOW_MASTER_DOCUMENTATION.md. Implement plain language updates, 
contextual help, and ensure mobile responsiveness.
```

### For Testing
```
Test OmniFlow features. Use the Testing Checklist section in 
OMNIFLOW_MASTER_DOCUMENTATION.md. Verify functionality on mobile (375px), 
tablet (768px), and desktop (1920px). Check for console errors and jargon.
```

---

## Key File Locations

### Core App
- `src/app/` - App router pages
- `src/app/actions/` - Server actions
- `src/components/` - React components
- `src/lib/` - Utilities and helpers
- `src/types/` - TypeScript types

### Lead Capture System (NEW)
- `src/app/api/embed-lead/route.ts` - Universal embed form API
- `src/app/api/capture-sales-lead/route.ts` - Sales page lead capture API
- `src/components/settings/embed-form-generator.tsx` - Embed code generator
- `src/app/actions/embed-form-actions.ts` - Embed form server actions
- `src/app/actions/sales-page-lead-actions.ts` - Sales page lead actions
- `src/app/(dashboard)/blog/[postId]/blog-post-client.tsx` - Floating widget injection

### Social Media Tools (NEW)
- `src/components/social-media/quick-publish-buttons.tsx` - One-click sharing
- `src/components/social-media/content-templates-selector.tsx` - Template library
- `src/components/social-media/image-style-presets.tsx` - AI image styles
- `src/components/social-media/seo-score-panel.tsx` - SEO checker
- `src/lib/content-templates.ts` - Template definitions
- `src/lib/seo-checker.ts` - SEO analysis logic

### Configuration
- `next.config.js` - Next.js config
- `tailwind.config.ts` - Tailwind config
- `firebase.json` - Firebase config

### Documentation (Preserved)
- `replit.md` - System overview
- `OMNIFLOW_MASTER_DOCUMENTATION.md` - This file
- `docs/` - Technical documentation

---

*Last Updated: December 2024*
*This document consolidates information from 128 previous documentation files. 
Keep this file updated as the single source of truth for the project.*
