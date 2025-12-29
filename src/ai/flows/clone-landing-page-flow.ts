'use server';
/**
 * @fileOverview AI flow for cloning/recreating landing pages from reference
 * 
 * Uses Gemini Vision to analyze a screenshot or URL and generate
 * a complete landing page structure with all sections and content.
 * 
 * Features:
 * - Screenshot analysis (user uploads image)
 * - URL fetching and analysis
 * - Generates complete page structure with sections
 * - Adapts content to user's product/service
 */

import { GoogleGenAI } from "@google/genai";
import { z } from 'genkit';

// Input schema
const CloneLandingPageInputSchema = z.object({
  // Either screenshot or URL (at least one required)
  screenshotBase64: z.string().optional()
    .describe('Screenshot of reference page as base64 data URI'),
  referenceUrl: z.string().url().optional()
    .describe('URL of reference page to analyze'),
  
  // User's product info for content adaptation
  productDescription: z.string().min(20)
    .describe('Description of user\'s product/service'),
  productName: z.string().optional()
    .describe('Name of the product/service'),
  targetAudience: z.string().optional()
    .describe('Target audience'),
  
  // Optional API key override
  apiKey: z.string().optional()
    .describe('Optional Gemini API key'),
});
export type CloneLandingPageInput = z.infer<typeof CloneLandingPageInputSchema>;

// Section content schemas
const HeroSectionSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
});

const FeatureItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const FAQItemSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const PricingPlanSchema = z.object({
  name: z.string(),
  price: z.string(),
  features: z.array(z.string()),
  popular: z.boolean().optional(),
});

const MenuItemSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const FooterColumnSchema = z.object({
  title: z.string(),
  links: z.array(z.object({
    label: z.string(),
    url: z.string(),
  })),
});

const SocialLinkSchema = z.object({
  platform: z.string(),
  url: z.string(),
});

// Output schema - complete page structure
const CloneLandingPageOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  
  // Page metadata
  pageName: z.string().optional(),
  primaryColor: z.string().optional(),
  
  // Detected sections in order
  sections: z.array(z.object({
    type: z.enum(['header', 'hero', 'features', 'testimonial', 'cta', 'form', 'faq', 'pricing', 'gallery', 'video', 'countdown', 'footer']),
    content: z.record(z.any()),
  })).optional(),
  
  // Analysis notes
  analysisNotes: z.string().optional(),
});
export type CloneLandingPageOutput = z.infer<typeof CloneLandingPageOutputSchema>;

/**
 * Main function to clone a landing page from reference
 */
export async function cloneLandingPageFlow(input: CloneLandingPageInput): Promise<CloneLandingPageOutput> {
  try {
    // Validate input
    if (!input.screenshotBase64 && !input.referenceUrl) {
      return {
        success: false,
        error: 'Please provide either a screenshot or a reference URL',
      };
    }

    const API_KEY = input.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    
    if (!API_KEY) {
      return {
        success: false,
        error: 'Missing API key. Please configure your Gemini API key.',
      };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // If URL provided, we'll instruct AI to imagine the page structure
    // (actual URL fetching would require additional infrastructure)
    
    if (input.screenshotBase64) {
      return await analyzeScreenshot(ai, input);
    } else if (input.referenceUrl) {
      return await analyzeFromUrl(ai, input);
    }

    return {
      success: false,
      error: 'Invalid input',
    };

  } catch (e: any) {
    console.error('Error in cloneLandingPageFlow:', e);
    return {
      success: false,
      error: e.message || 'Failed to analyze reference page',
    };
  }
}

/**
 * Analyze a screenshot using Gemini Vision
 */
async function analyzeScreenshot(
  ai: GoogleGenAI,
  input: CloneLandingPageInput
): Promise<CloneLandingPageOutput> {
  console.log('Analyzing screenshot with Gemini Vision...');
  
  // Extract base64 data from data URI
  const dataUri = input.screenshotBase64!;
  const base64Match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  
  if (!base64Match) {
    return {
      success: false,
      error: 'Invalid image format. Please upload a valid screenshot.',
    };
  }
  
  const mimeType = base64Match[1];
  const base64Data = base64Match[2];

  const prompt = buildAnalysisPrompt(input);

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
  });

  return parseAIResponse(response);
}

/**
 * Analyze from URL description (without actual fetching)
 */
async function analyzeFromUrl(
  ai: GoogleGenAI,
  input: CloneLandingPageInput
): Promise<CloneLandingPageOutput> {
  console.log('Generating page structure based on URL context...');
  
  const prompt = buildUrlAnalysisPrompt(input);

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return parseAIResponse(response);
}

/**
 * Build the analysis prompt for screenshot
 */
function buildAnalysisPrompt(input: CloneLandingPageInput): string {
  return `You are an expert landing page analyst and copywriter. Analyze this screenshot of a landing page and recreate its structure with NEW content adapted for the user's product.

USER'S PRODUCT/SERVICE:
${input.productDescription}
${input.productName ? `Product Name: ${input.productName}` : ''}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}

TASK:
1. Analyze the screenshot to identify all sections present (header, hero, features, testimonials, pricing, FAQ, CTA, footer, etc.)
2. Note the visual style, color scheme, and layout patterns
3. Generate NEW content for each section, adapted to the user's product
4. Keep the same section structure but with original, compelling copy

RESPOND WITH VALID JSON ONLY (no markdown, no code blocks):
{
  "success": true,
  "pageName": "Suggested page name based on product",
  "primaryColor": "#hexcolor based on what would suit the product",
  "sections": [
    {
      "type": "header",
      "content": {
        "logoText": "Brand Name",
        "menuItems": [{"label": "Features", "url": "#features"}, ...],
        "ctaButton": {"label": "Get Started", "url": "#"},
        "sticky": true
      }
    },
    {
      "type": "hero",
      "content": {
        "headline": "Compelling headline for the product",
        "subheadline": "Supporting value proposition"
      }
    },
    {
      "type": "features",
      "content": {
        "items": [
          {"title": "Feature 1", "description": "Benefit description"},
          {"title": "Feature 2", "description": "Benefit description"},
          {"title": "Feature 3", "description": "Benefit description"}
        ]
      }
    },
    {
      "type": "testimonial",
      "content": {
        "quote": "Customer testimonial quote",
        "author": "Name, Title at Company"
      }
    },
    {
      "type": "pricing",
      "content": {
        "plans": [
          {"name": "Starter", "price": "$X", "features": ["Feature 1", "Feature 2"], "popular": false},
          {"name": "Pro", "price": "$X", "features": ["All Starter features", "Feature 3"], "popular": true}
        ]
      }
    },
    {
      "type": "faq",
      "content": {
        "items": [
          {"q": "Question 1?", "a": "Answer 1"},
          {"q": "Question 2?", "a": "Answer 2"}
        ]
      }
    },
    {
      "type": "cta",
      "content": {
        "text": "Ready to get started?",
        "buttonText": "Start Free Trial"
      }
    },
    {
      "type": "footer",
      "content": {
        "logoText": "Brand Name",
        "description": "Brief company description",
        "columns": [
          {"title": "Product", "links": [{"label": "Features", "url": "#"}]},
          {"title": "Company", "links": [{"label": "About", "url": "#"}]}
        ],
        "socialLinks": [{"platform": "twitter", "url": "#"}],
        "copyright": "© 2025 Company Name. All rights reserved."
      }
    }
  ],
  "analysisNotes": "Brief notes about the reference page style and how content was adapted"
}

IMPORTANT:
- Only include sections that are visible in the screenshot
- Generate ORIGINAL content - do not copy text from the screenshot
- Adapt all content to the user's product/service
- Use benefit-focused, conversion-optimized copy
- Keep the same section ORDER as the reference
- Return ONLY valid JSON, no other text`;
}

/**
 * Build prompt for URL-based analysis
 */
function buildUrlAnalysisPrompt(input: CloneLandingPageInput): string {
  return `You are an expert landing page designer and copywriter. Create a professional landing page structure for the user's product, inspired by modern SaaS landing pages.

REFERENCE URL (for style inspiration): ${input.referenceUrl}

USER'S PRODUCT/SERVICE:
${input.productDescription}
${input.productName ? `Product Name: ${input.productName}` : ''}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}

TASK:
Create a complete landing page structure with compelling content. Include these sections in a logical order:
- Header with navigation
- Hero section with headline and subheadline
- Features/Benefits section (3-4 items)
- Social proof/Testimonial
- Pricing (if applicable)
- FAQ section
- Final CTA
- Footer

RESPOND WITH VALID JSON ONLY (no markdown, no code blocks):
{
  "success": true,
  "pageName": "Suggested page name",
  "primaryColor": "#hexcolor that suits the product",
  "sections": [
    {
      "type": "header",
      "content": {
        "logoText": "Brand Name",
        "menuItems": [{"label": "Features", "url": "#features"}, {"label": "Pricing", "url": "#pricing"}, {"label": "FAQ", "url": "#faq"}],
        "ctaButton": {"label": "Get Started", "url": "#"},
        "sticky": true
      }
    },
    {
      "type": "hero",
      "content": {
        "headline": "Compelling, benefit-focused headline",
        "subheadline": "Supporting value proposition that explains what the product does"
      }
    },
    ... (include all relevant sections)
  ],
  "analysisNotes": "Notes about the page structure and design choices"
}

IMPORTANT:
- Generate ORIGINAL, compelling copy
- Focus on benefits, not features
- Use power words and action verbs
- Create urgency where appropriate
- Return ONLY valid JSON`;
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(response: any): CloneLandingPageOutput {
  try {
    if (!response.candidates || response.candidates.length === 0) {
      return {
        success: false,
        error: 'No response from AI',
      };
    }

    const candidate = response.candidates[0];
    
    if (candidate.finishReason === 'SAFETY') {
      return {
        success: false,
        error: 'Content blocked by safety filter. Please try a different reference.',
      };
    }

    const textContent = candidate.content?.parts?.[0]?.text;
    
    if (!textContent) {
      return {
        success: false,
        error: 'No text content in response',
      };
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanedContent = textContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    // Parse JSON
    const parsed = JSON.parse(cleanedContent);
    
    return {
      success: parsed.success ?? true,
      pageName: parsed.pageName,
      primaryColor: parsed.primaryColor,
      sections: parsed.sections,
      analysisNotes: parsed.analysisNotes,
    };

  } catch (e: any) {
    console.error('Error parsing AI response:', e);
    return {
      success: false,
      error: 'Failed to parse AI response. Please try again.',
    };
  }
}
