# Landing Page AI Assist Feature

## Overview
Add AI-powered content generation assistance to individual landing page sections, allowing users to generate better copy, headlines, features, FAQs, and testimonials based on their product/service description.

**IMPORTANT**: This feature MUST integrate with the existing AI credits system (`src/lib/ai-usage-tracker.ts`) and consume credits based on the plan's allocation.

## Credit System Integration

### Credit Consumption
- Uses `text_generation` operation type
- Consumes **1 credit per generation** (as per `DEFAULT_CREDIT_CONFIG.textGenerationCredits`)
- Must call `trackAIUsage()` after each generation
- Must call `checkAIQuota()` before generation to verify credits available

### Plan Limits
- Free Plan: Limited lifetime credits (20 total)
- Paid Plans: Monthly renewable credits (2000+)
- Enterprise: Higher limits or unlimited
- BYOK users: Unlimited (uses their own API key)

## User Stories

### US-1: AI Assist Button on Sections
**As a** landing page creator  
**I want** an AI Assist button on each section in the editor  
**So that** I can quickly generate professional content for my page

**Acceptance Criteria:**
- [ ] Each section editor displays a sparkle/AI icon button
- [ ] Button is clearly visible but not intrusive
- [ ] Button tooltip shows "AI Assist" or "Generate with AI"
- [ ] Button works in both light and dark mode
- [ ] Button shows remaining credits count

### US-2: Product/Service Description Input
**As a** user  
**I want** to provide a description of my product/service  
**So that** the AI can generate relevant, contextual content

**Acceptance Criteria:**
- [ ] Modal opens when AI Assist button is clicked
- [ ] Shows current credits remaining before generation
- [ ] Text area for entering product/service description (min 20 chars)
- [ ] Optional fields for: target audience, tone (professional/casual/friendly)
- [ ] "Generate" button to trigger AI generation (shows credit cost: "Generate (1 credit)")
- [ ] Loading state while generating
- [ ] If no credits, show upgrade prompt (use existing `AIUpgradePrompt` component)

### US-3: AI Content Generation for Hero Section
**As a** user  
**I want** AI to generate compelling headlines and subheadlines  
**So that** I can capture visitor attention effectively

**Acceptance Criteria:**
- [ ] Generates main headline (attention-grabbing, benefit-focused)
- [ ] Generates subheadline (supporting value proposition)
- [ ] Shows preview of generated content before applying
- [ ] "Apply" button to use the generated content
- [ ] "Regenerate" button to get new suggestions

### US-4: AI Content Generation for Features Section
**As a** user  
**I want** AI to generate feature titles and descriptions  
**So that** I can highlight my product benefits professionally

**Acceptance Criteria:**
- [ ] Generates 3-6 feature items with titles and descriptions
- [ ] Each feature is benefit-focused, not just feature-focused
- [ ] User can select which features to apply
- [ ] Option to regenerate individual features

### US-5: AI Content Generation for FAQ Section
**As a** user  
**I want** AI to generate relevant FAQs  
**So that** I can address common customer questions

**Acceptance Criteria:**
- [ ] Generates 3-5 relevant Q&A pairs
- [ ] Questions are based on common objections/concerns
- [ ] Answers are helpful and conversion-focused
- [ ] User can edit before applying

### US-6: AI Content Generation for Testimonial Section
**As a** user  
**I want** AI to generate sample testimonials  
**So that** I can have placeholder content or inspiration

**Acceptance Criteria:**
- [ ] Generates realistic testimonial quote
- [ ] Generates author name and title/company
- [ ] Clear disclaimer that these are AI-generated samples
- [ ] User should replace with real testimonials

### US-7: AI Content Generation for CTA Section
**As a** user  
**I want** AI to generate compelling call-to-action text  
**So that** I can drive more conversions

**Acceptance Criteria:**
- [ ] Generates CTA headline/text
- [ ] Generates button text options
- [ ] Multiple variations to choose from
- [ ] Urgency/scarcity options available

### US-8: AI Content Generation for Pricing Section
**As a** user  
**I want** AI to suggest pricing plan names and feature lists  
**So that** I can present my pricing professionally

**Acceptance Criteria:**
- [ ] Generates plan names (e.g., Starter, Pro, Enterprise)
- [ ] Generates feature lists for each plan
- [ ] User provides actual prices (AI doesn't guess prices)
- [ ] Suggests which plan to mark as "popular"

## Technical Requirements

### TR-1: AI Flow Integration
- Create new Genkit AI flow: `generate-landing-page-content-flow.ts`
- Use existing AI infrastructure patterns from the codebase
- **MUST use `trackAIUsage()` from `src/lib/ai-usage-tracker.ts`**
- **MUST use `checkAIQuota()` before generation**
- Operation type: `text_generation`
- Model: `gemini-2.0-flash`
- Credits consumed: 1 per generation (per `DEFAULT_CREDIT_CONFIG`)

### TR-2: Section-Specific Prompts
- Each section type has optimized prompts
- Prompts include best practices for landing page copy
- Output is structured JSON matching section content schema

### TR-3: Error Handling
- Graceful fallback if AI generation fails
- **Show `AIUpgradePrompt` when credits exhausted**
- Rate limiting awareness
- User-friendly error messages

### TR-4: UI Components
- Reusable AI Assist modal component
- Loading states with skeleton/spinner
- Preview cards for generated content
- **Credits remaining display**
- **Use existing `AIUpgradePrompt` component for upgrade prompts**

### TR-5: Credit Tracking Integration
- Import and use existing credit system:
  ```typescript
  import { trackAIUsage, checkAIQuota } from '@/lib/ai-usage-tracker';
  import { AIUpgradePrompt } from '@/components/ai/ai-upgrade-prompt';
  ```
- Before generation: `await checkAIQuota(companyId)`
- After generation: `await trackAIUsage({ operationType: 'text_generation', ... })`

## Out of Scope
- Image generation for sections (would cost 25 credits per image - separate feature)
- Full page generation (only individual sections)
- A/B testing of AI-generated content
- Saving AI generation history

## Dependencies
- Existing Genkit AI setup
- **AI usage tracking system (`src/lib/ai-usage-tracker.ts`)** - CRITICAL
- **AI upgrade prompt (`src/components/ai/ai-upgrade-prompt.tsx`)** - For credit exhaustion
- **AI cost calculator (`src/lib/ai-cost-calculator.ts`)** - For credit calculation
- Landing page builder (`src/app/(dashboard)/landing-pages/page.tsx`)

## File References
- #[[file:src/app/(dashboard)/landing-pages/page.tsx]] - Main builder to add AI buttons
- #[[file:src/lib/ai-usage-tracker.ts]] - AI usage tracking (MUST USE)
- #[[file:src/types/ai-usage.ts]] - AI types and credit config
- #[[file:src/components/ai/ai-upgrade-prompt.tsx]] - Upgrade prompt component
- #[[file:src/ai/flows/generate-social-media-content-flow.ts]] - Reference for AI flow pattern
