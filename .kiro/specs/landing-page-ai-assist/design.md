# Landing Page AI Assist - Technical Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Landing Page Builder                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Section Editor                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────────────┐   │    │
│  │  │ Section Content │  │ ✨ AI Assist Button     │   │    │
│  │  │ Fields          │  │ (Shows credits: "5 left")│   │    │
│  │  └─────────────────┘  └──────────┬──────────────┘   │    │
│  └──────────────────────────────────┼──────────────────┘    │
└─────────────────────────────────────┼───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Assist Modal                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Credits: 45/500 remaining                            │    │
│  │ Product Description Input                            │    │
│  │ Target Audience (optional)                           │    │
│  │ Tone Selection (optional)                            │    │
│  └─────────────────────────────────────────────────────┘    │
│  [Generate (1 credit)] Button                                │
│  OR                                                          │
│  [AIUpgradePrompt if no credits]                            │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Action / AI Flow                         │
│  1. checkAIQuota(companyId) → Verify credits available      │
│  2. generateLandingPageContent(sectionType, description)    │
│  3. trackAIUsage({ operationType: 'text_generation', ... }) │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Genkit AI Flow                                       │    │
│  │ - Section-specific prompts                           │    │
│  │ - Structured output schema                           │    │
│  │ - Model: gemini-2.0-flash                            │    │
│  │ - Credits: 1 per generation                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Generated Content Preview                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Preview of generated content                         │    │
│  │ [Apply] [Regenerate (1 credit)] [Cancel]             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Credit System Integration

### Existing Infrastructure to Use
```typescript
// From src/lib/ai-usage-tracker.ts
import { trackAIUsage, checkAIQuota } from '@/lib/ai-usage-tracker';

// From src/types/ai-usage.ts
import { DEFAULT_CREDIT_CONFIG } from '@/types/ai-usage';
// DEFAULT_CREDIT_CONFIG.textGenerationCredits = 1 credit per generation

// From src/components/ai/ai-upgrade-prompt.tsx
import { AIUpgradePrompt } from '@/components/ai/ai-upgrade-prompt';
```

### Credit Flow
```typescript
// 1. Before showing modal, check credits
const quota = await checkAIQuota(companyId);
if (!quota.allowed) {
  // Show AIUpgradePrompt instead of modal
  return <AIUpgradePrompt operationType="text_generation" ... />;
}

// 2. After successful generation, track usage
await trackAIUsage({
  companyId,
  userId,
  operationType: 'text_generation',
  model: 'gemini-2.0-flash',
  inputTokens: promptTokens,
  outputTokens: responseTokens,
  feature: 'landing_page_ai_assist',
  success: true,
});
```

## Component Structure

### 1. AIAssistButton Component
```typescript
// Location: src/components/landing-pages/ai-assist-button.tsx
interface AIAssistButtonProps {
  sectionType: string;
  onGenerated: (content: Record<string, any>) => void;
}
```

### 2. AIAssistModal Component
```typescript
// Location: src/components/landing-pages/ai-assist-modal.tsx
interface AIAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: string;
  currentContent: Record<string, any>;
  onApply: (content: Record<string, any>) => void;
}
```

### 3. AI Flow
```typescript
// Location: src/ai/flows/generate-landing-page-content-flow.ts
interface GenerateLandingPageContentInput {
  sectionType: 'hero' | 'features' | 'faq' | 'testimonial' | 'cta' | 'pricing';
  productDescription: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
}

interface GenerateLandingPageContentOutput {
  content: Record<string, any>; // Section-specific content
  suggestions?: string[]; // Optional tips
}
```

## Section-Specific Output Schemas

### Hero Section
```typescript
{
  headline: string;      // Max 60 chars, benefit-focused
  subheadline: string;   // Max 150 chars, supporting value prop
}
```

### Features Section
```typescript
{
  items: Array<{
    title: string;       // Max 30 chars
    description: string; // Max 100 chars
  }>;
}
```

### FAQ Section
```typescript
{
  items: Array<{
    q: string;  // Question
    a: string;  // Answer
  }>;
}
```

### Testimonial Section
```typescript
{
  quote: string;   // The testimonial text
  author: string;  // Name, Title at Company
}
```

### CTA Section
```typescript
{
  text: string;       // CTA headline
  buttonText: string; // Button label
}
```

### Pricing Section
```typescript
{
  plans: Array<{
    name: string;
    features: string[];
    popular?: boolean;
  }>;
}
```

## Implementation Tasks

### Task 1: Create AI Flow
- [ ] Create `src/ai/flows/generate-landing-page-content-flow.ts`
- [ ] Define input/output schemas with Zod
- [ ] Implement section-specific prompts
- [ ] Add AI usage tracking

### Task 2: Create Server Action
- [ ] Add `generateSectionContent` action to `landing-page-actions.ts`
- [ ] Handle authentication and rate limiting
- [ ] Return structured content

### Task 3: Create UI Components
- [ ] Create `AIAssistButton` component
- [ ] Create `AIAssistModal` component
- [ ] Add loading and error states

### Task 4: Integrate with Section Editors
- [ ] Add AI Assist button to each section editor in the builder
- [ ] Wire up content application
- [ ] Test all section types

## Prompt Engineering Guidelines

### Hero Section Prompt
```
Generate a compelling landing page hero section for:
Product/Service: {description}
Target Audience: {audience}
Tone: {tone}

Requirements:
- Headline: Attention-grabbing, benefit-focused, max 60 characters
- Subheadline: Explains value proposition, max 150 characters
- Focus on what the customer gains, not features
```

### Features Section Prompt
```
Generate 3 key features/benefits for:
Product/Service: {description}

Requirements:
- Each feature has a short title (max 30 chars)
- Each feature has a benefit-focused description (max 100 chars)
- Focus on outcomes and benefits, not technical features
- Use action verbs and specific results
```

### FAQ Section Prompt
```
Generate 3-5 frequently asked questions for:
Product/Service: {description}

Requirements:
- Questions should address common objections
- Questions should cover pricing, how it works, support
- Answers should be helpful and conversion-focused
- Keep answers concise but complete
```

## Error Handling

1. **No Credits Available**: Show `AIUpgradePrompt` component with upgrade options
2. **AI Generation Failure**: Show user-friendly error, offer retry (no credit charged on failure)
3. **Rate Limiting**: Inform user to wait, show cooldown timer
4. **Invalid Input**: Validate description length before sending
5. **Network Error**: Retry with exponential backoff

## Security Considerations

1. Validate user authentication before AI generation
2. Sanitize user input before sending to AI
3. Rate limit AI requests per user (handled by existing quota system)
4. Track AI usage for billing purposes (via `trackAIUsage`)
5. Only charge credits on successful generation (`success: true`)
