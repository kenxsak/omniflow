'use server';
/**
 * @fileOverview AI flow for generating landing page section content
 * 
 * Generates optimized copy for landing page sections:
 * - Hero (headline, subheadline)
 * - Features (title, description for each)
 * - FAQ (questions and answers)
 * - Testimonial (quote, author)
 * - CTA (text, button text)
 * - Pricing (plan names, features)
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema
const GenerateLandingPageContentInputSchema = z.object({
  sectionType: z.enum(['hero', 'features', 'faq', 'testimonial', 'cta', 'pricing'])
    .describe('The type of landing page section to generate content for'),
  productDescription: z.string().min(20)
    .describe('Description of the product/service (min 20 characters)'),
  targetAudience: z.string().optional()
    .describe('Target audience for the content (e.g., "small business owners", "developers")'),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).optional().default('professional')
    .describe('Tone of voice for the content'),
});
export type GenerateLandingPageContentInput = z.infer<typeof GenerateLandingPageContentInputSchema>;

// Output schemas for each section type
const HeroContentSchema = z.object({
  headline: z.string().describe('Main headline (max 60 chars, benefit-focused)'),
  subheadline: z.string().describe('Supporting subheadline (max 150 chars)'),
});

const FeatureItemSchema = z.object({
  title: z.string().describe('Feature title (max 30 chars)'),
  description: z.string().describe('Feature description (max 100 chars, benefit-focused)'),
});

const FeaturesContentSchema = z.object({
  items: z.array(FeatureItemSchema).min(3).max(6).describe('3-6 feature items'),
});

const FAQItemSchema = z.object({
  q: z.string().describe('Question'),
  a: z.string().describe('Answer (helpful and conversion-focused)'),
});

const FAQContentSchema = z.object({
  items: z.array(FAQItemSchema).min(3).max(5).describe('3-5 FAQ items'),
});

const TestimonialContentSchema = z.object({
  quote: z.string().describe('Testimonial quote (realistic and specific)'),
  author: z.string().describe('Author name and title (e.g., "Jane Doe, CEO at TechCorp")'),
});

const CTAContentSchema = z.object({
  text: z.string().describe('CTA headline/text'),
  buttonText: z.string().describe('Button label (action-oriented, max 20 chars)'),
});

const PricingPlanSchema = z.object({
  name: z.string().describe('Plan name (e.g., Starter, Pro, Enterprise)'),
  features: z.array(z.string()).min(3).max(6).describe('3-6 feature bullet points'),
  popular: z.boolean().optional().describe('Whether this is the recommended plan'),
});

const PricingContentSchema = z.object({
  plans: z.array(PricingPlanSchema).min(2).max(3).describe('2-3 pricing plans'),
});

// Combined output schema
const GenerateLandingPageContentOutputSchema = z.object({
  hero: HeroContentSchema.optional(),
  features: FeaturesContentSchema.optional(),
  faq: FAQContentSchema.optional(),
  testimonial: TestimonialContentSchema.optional(),
  cta: CTAContentSchema.optional(),
  pricing: PricingContentSchema.optional(),
});
export type GenerateLandingPageContentOutput = z.infer<typeof GenerateLandingPageContentOutputSchema>;

// Main export function
export async function generateLandingPageContent(
  input: GenerateLandingPageContentInput
): Promise<GenerateLandingPageContentOutput> {
  return generateLandingPageContentFlow(input);
}

// Define the prompt
const prompt = ai.definePrompt({
  name: 'generateLandingPageContentPrompt',
  input: { schema: GenerateLandingPageContentInputSchema },
  output: { schema: GenerateLandingPageContentOutputSchema },
  model: geminiModel,
  prompt: `You are an expert landing page copywriter and conversion rate optimization specialist. Generate compelling, benefit-focused content for a landing page section.

**Product/Service Description:**
{{{productDescription}}}

**Target Audience:** {{{targetAudience}}}
**Tone:** {{{tone}}}
**Section Type:** {{{sectionType}}}

**IMPORTANT GUIDELINES:**
- Focus on BENEFITS, not features
- Use power words that drive action
- Keep copy concise and scannable
- Address customer pain points
- Create urgency where appropriate
- Use specific numbers when possible (e.g., "Save 10 hours/week" not "Save time")

**SECTION-SPECIFIC INSTRUCTIONS:**

{{#if (eq sectionType "hero")}}
Generate a hero section with:
- headline: A powerful, benefit-focused headline (max 60 characters). Start with a verb or address a pain point.
- subheadline: A supporting statement that explains the value proposition (max 150 characters).

Examples of good headlines:
- "Stop Losing Leads. Start Closing Deals."
- "Build Landing Pages That Actually Convert"
- "Your All-in-One Marketing Platform"
{{/if}}

{{#if (eq sectionType "features")}}
Generate 3-4 key features/benefits with:
- title: Short, punchy title (max 30 chars)
- description: Benefit-focused description (max 100 chars)

Focus on outcomes, not technical specs. Use action verbs.
Example: Instead of "Cloud-based storage" → "Access your files anywhere, anytime"
{{/if}}

{{#if (eq sectionType "faq")}}
Generate 3-5 FAQs that:
- Address common objections (pricing, complexity, support)
- Answer "How does it work?" and "Is there a free trial?"
- Provide helpful, conversion-focused answers
- Build trust and reduce friction
{{/if}}

{{#if (eq sectionType "testimonial")}}
Generate a realistic testimonial with:
- quote: A specific, believable testimonial (mention specific results if possible)
- author: Name, title, and company

Note: This is a SAMPLE testimonial. The user should replace it with real customer feedback.
Make it sound authentic, not generic.
{{/if}}

{{#if (eq sectionType "cta")}}
Generate a call-to-action section with:
- text: A compelling headline that creates urgency or highlights value
- buttonText: Action-oriented button text (max 20 chars, e.g., "Start Free Trial", "Get Started Now")
{{/if}}

{{#if (eq sectionType "pricing")}}
Generate 2-3 pricing plan suggestions with:
- name: Plan name (Starter/Basic, Pro/Professional, Enterprise)
- features: 3-6 feature bullet points per plan (differentiate clearly)
- popular: Mark one plan as the recommended option

Note: User will add their own prices. Focus on feature differentiation.
{{/if}}

Generate ONLY the content for the "{{{sectionType}}}" section. Return the appropriate object structure.
`,
});

// Define the flow
const generateLandingPageContentFlow = ai.defineFlow(
  {
    name: 'generateLandingPageContentFlow',
    inputSchema: GenerateLandingPageContentInputSchema,
    outputSchema: GenerateLandingPageContentOutputSchema,
  },
  async (input: GenerateLandingPageContentInput): Promise<GenerateLandingPageContentOutput> => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate landing page content from AI.');
    }
    return output;
  }
);
