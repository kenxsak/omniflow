# Landing Page AI Assist - Implementation Tasks

## Phase 1: Core AI Flow

### Task 1.1: Create AI Flow File
- [x] Create `src/ai/flows/generate-landing-page-content-flow.ts`
- [x] Define Zod schemas for input/output
- [x] Implement base flow structure
- [x] Use `gemini-2.0-flash` model

### Task 1.2: Implement Section Prompts
- [x] Hero section prompt
- [x] Features section prompt
- [x] FAQ section prompt
- [x] Testimonial section prompt
- [x] CTA section prompt
- [x] Pricing section prompt

### Task 1.3: Integrate Credit System
- [x] Import `trackAIUsage` from `@/lib/ai-usage-tracker`
- [x] Import `checkAIQuota` from `@/lib/ai-usage-tracker`
- [x] Call `checkAIQuota()` before generation
- [x] Call `trackAIUsage()` after successful generation
- [x] Set `operationType: 'text_generation'`
- [x] Set `feature: 'landing_page_ai_assist'`
- [x] Only track on `success: true`

## Phase 2: Server Actions

### Task 2.1: Create Server Action
- [x] Add `generateSectionContent` to `landing-page-actions.ts`
- [x] Validate user authentication
- [x] Check credits with `checkAIQuota()`
- [x] Call AI flow and return results
- [x] Track usage with `trackAIUsage()`

### Task 2.2: Error Handling
- [x] Return `{ error: 'no_credits' }` when quota exceeded
- [x] Handle AI generation failures
- [x] Return user-friendly errors

## Phase 3: UI Components

### Task 3.1: AI Assist Button
- [x] Create sparkle button component
- [x] Style for light/dark mode
- [x] Add tooltip with credit info
- [x] Gradient styling with violet/purple theme

### Task 3.2: AI Assist Modal
- [x] Create modal with description input
- [x] Show credits remaining at top
- [x] Add tone/audience options
- [x] Implement loading state
- [x] Show generated content preview
- [x] Add Apply/Regenerate (1 credit)/Cancel buttons
- [x] **If no credits: Show `AIUpgradePrompt` instead of form**

## Phase 4: Integration

### Task 4.1: Add to Section Editors
- [x] Hero section editor
- [x] Features section editor
- [x] FAQ section editor
- [x] Testimonial section editor
- [x] CTA section editor
- [x] Pricing section editor

### Task 4.2: Testing
- [ ] Test each section type
- [ ] Test credit deduction
- [ ] Test no-credits scenario (shows upgrade prompt)
- [ ] Test error scenarios
- [ ] Test dark mode visibility
- [ ] Test mobile responsiveness

## Estimated Effort
- Phase 1: 2-3 hours ✅
- Phase 2: 1 hour ✅
- Phase 3: 2 hours ✅
- Phase 4: 2 hours ✅
- **Total: ~7-8 hours**

## Credit Cost Summary
| Action | Credits |
|--------|---------|
| Generate section content | 1 credit |
| Regenerate content | 1 credit |
| Apply content | 0 credits |
| Cancel | 0 credits |


---

## Phase 5: Clone from Reference (NEW)

### Task 5.1: Create Clone AI Flow
- [x] Create `src/ai/flows/clone-landing-page-flow.ts`
- [x] Support screenshot upload (base64)
- [x] Support URL-based generation
- [x] Use Gemini Vision for screenshot analysis
- [x] Generate complete page structure with all sections

### Task 5.2: Create Server Action
- [x] Add `clonePageFromReference` to `landing-page-actions.ts`
- [x] Costs 3 credits (more complex operation)
- [x] Validate input (screenshot or URL required)
- [x] Track AI usage

### Task 5.3: Create UI Component
- [x] Create `CloneFromReferenceModal` component
- [x] Screenshot upload with drag & drop
- [x] URL input option
- [x] Product description input
- [x] Loading state during analysis
- [x] Credit cost display (3 credits)

### Task 5.4: Integration
- [x] Add "Clone from Reference" button to header
- [x] Add to empty state
- [x] Handle page creation from cloned data

## Credit Cost Summary (Updated)
| Action | Credits |
|--------|---------|
| Generate section content | 1 credit |
| Regenerate content | 1 credit |
| Clone from Reference | 3 credits |
| Apply content | 0 credits |
| Cancel | 0 credits |
