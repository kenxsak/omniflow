'use server';
/**
 * @fileOverview Image generation using Google's Gemini 2.5 Flash Image (Nano Banana)
 * 
 * Uses the new @google/genai SDK for native image generation with multimodal support
 * - Supports brand logo input for branded image generation
 * - Faster and cheaper than Imagen 4 (~$0.02/image vs $0.04)
 * - Optimized for high-volume, low-latency tasks
 *
 * - generateImageWithAiFlow - Main function for image generation
 * - GenerateImageWithAiFlowInput - Input type
 * - GenerateImageWithAiFlowOutput - Return type
 */

import { GoogleGenAI, Type } from "@google/genai";
import { z } from 'genkit';

const GenerateImageWithAiFlowInputSchema = z.object({
  prompt: z.string().min(1).describe('The text prompt to generate an image from.'),
  aspectRatio: z.enum(['1:1', '3:4', '4:3', '9:16', '16:9']).optional().describe('Aspect ratio for the image'),
  apiKey: z.string().optional().describe('Optional Gemini API key to use instead of platform default'),
  brandLogo: z.string().optional().describe('Brand logo as base64 data URI to incorporate into the generated image'),
  brandName: z.string().optional().describe('Brand/company name to include in the image'),
});
export type GenerateImageWithAiFlowInput = z.infer<typeof GenerateImageWithAiFlowInputSchema>;

const GenerateImageWithAiFlowOutputSchema = z.object({
  imageDataUri: z.string().optional().describe('The generated image as a data URI (e.g., data:image/png;base64,...). Present on success.'),
  error: z.string().optional().describe('An error message if image generation failed.'),
});
export type GenerateImageWithAiFlowOutput = z.infer<typeof GenerateImageWithAiFlowOutputSchema>;

export async function generateImageWithAiFlow(input: GenerateImageWithAiFlowInput): Promise<GenerateImageWithAiFlowOutput> {
  try {
    // Use provided API key if available, otherwise fall back to environment variable
    const API_KEY = input.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    
    if (!API_KEY) {
      return { 
        error: 'Missing GEMINI_API_KEY. Please add your Google AI Studio API key in Settings > Integrations.' 
      };
    }

    const aspectRatio = input.aspectRatio || getAspectRatioFromPrompt(input.prompt);
    
    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Check if we have a brand logo for multimodal generation
    if (input.brandLogo) {
      return await generateBrandedImage(ai, input, aspectRatio);
    } else {
      return await generateStandardImage(ai, input, aspectRatio);
    }

  } catch (e: any) {
    console.error('Error in generateImageWithAiFlow:', e);
    
    // Handle specific error types
    const errorMessage = e.message || 'An unexpected error occurred.';
    
    if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
      return {
        error: 'API key error: Please verify your GEMINI_API_KEY is valid. Get a new key at https://aistudio.google.com/'
      };
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return {
        error: 'Rate limit exceeded. Please wait a moment and try again.'
      };
    }
    
    if (errorMessage.includes('billing') || errorMessage.includes('payment')) {
      return {
        error: 'Billing required: Please enable billing on your Google Cloud project.'
      };
    }
    
    return { 
      error: `Image generation error: ${errorMessage}` 
    };
  }
}

/**
 * Generate a branded image using the logo as reference
 */
async function generateBrandedImage(
  ai: GoogleGenAI, 
  input: GenerateImageWithAiFlowInput, 
  aspectRatio: string
): Promise<GenerateImageWithAiFlowOutput> {
  console.log(`Generating BRANDED image with Gemini 2.5 Flash...`);
  console.log(`Brand name: ${input.brandName || 'Not specified'}`);
  
  // Extract base64 data from data URI
  const logoDataUri = input.brandLogo!;
  const base64Match = logoDataUri.match(/^data:([^;]+);base64,(.+)$/);
  
  if (!base64Match) {
    return { error: 'Invalid logo format. Please upload a valid image.' };
  }
  
  const mimeType = base64Match[1];
  const base64Data = base64Match[2];
  
  // Build the branded prompt
  const brandedPrompt = buildBrandedPrompt(input.prompt, input.brandName, aspectRatio);
  
  console.log(`Branded prompt: "${brandedPrompt}"`);

  // Use multimodal input with the logo image
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
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
            text: brandedPrompt,
          },
        ],
      },
    ],
    config: {
      responseModalities: ["image", "text"],
    },
  });

  return extractImageFromResponse(response);
}

/**
 * Generate a standard image without branding
 */
async function generateStandardImage(
  ai: GoogleGenAI, 
  input: GenerateImageWithAiFlowInput, 
  aspectRatio: string
): Promise<GenerateImageWithAiFlowOutput> {
  // Build prompt with aspect ratio hint
  const enhancedPrompt = buildPromptWithAspectRatio(input.prompt, aspectRatio);

  console.log(`Generating standard image with Gemini 2.5 Flash Image...`);
  console.log(`Prompt: "${enhancedPrompt}"`);
  console.log(`Aspect ratio: ${aspectRatio}`);

  // Generate image using Gemini 2.5 Flash Image model
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: enhancedPrompt,
    config: {
      responseModalities: ["image", "text"],
    },
  });

  return extractImageFromResponse(response);
}

/**
 * Extract image from Gemini response
 */
function extractImageFromResponse(response: any): GenerateImageWithAiFlowOutput {
  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        // Check for inline image data
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const imageDataUri = `data:${mimeType};base64,${part.inlineData.data}`;
          console.log('Image generated successfully!');
          return { imageDataUri };
        }
      }
    }
    
    // Check for safety filtering
    if (candidate.finishReason === 'SAFETY') {
      return {
        error: 'Image blocked by safety filter. Try modifying your prompt to be less sensitive.'
      };
    }
  }

  // If no image was generated
  console.error('No image in response. Full response:', JSON.stringify(response).substring(0, 500));
  return {
    error: 'Image generation completed but no image was returned. The model may not support this type of request.'
  };
}

/**
 * Build a branded prompt that instructs the AI to incorporate the logo
 */
function buildBrandedPrompt(prompt: string, brandName: string | undefined, aspectRatio: string): string {
  const aspectRatioDescriptions: Record<string, string> = {
    '1:1': 'square format',
    '3:4': 'portrait format (3:4)',
    '4:3': 'landscape format (4:3)',
    '9:16': 'vertical/story format (9:16)',
    '16:9': 'widescreen format (16:9)',
  };
  
  const formatHint = aspectRatioDescriptions[aspectRatio] || 'square format';
  
  let brandedPrompt = `You are creating a professional branded marketing image. 

BRAND LOGO: The image I've provided is the brand's logo. Analyze its colors, style, and design elements.

TASK: Generate a ${formatHint} marketing image that:
1. Incorporates the brand logo prominently and naturally into the design
2. Uses the logo's color palette as the primary colors for the image
3. Matches the logo's visual style (modern, classic, playful, professional, etc.)
4. Creates a cohesive branded look

USER REQUEST: ${prompt}`;

  if (brandName) {
    brandedPrompt += `\n\nBRAND NAME: "${brandName}" - Include this text in the image if appropriate for the design.`;
  }

  brandedPrompt += `\n\nIMPORTANT: 
- The logo should be clearly visible and well-integrated
- Maintain brand consistency throughout the image
- Create a professional, high-quality marketing asset
- Generate in ${formatHint}`;

  return brandedPrompt;
}

/**
 * Build prompt with aspect ratio guidance (for non-branded images)
 */
function buildPromptWithAspectRatio(prompt: string, aspectRatio: string): string {
  const aspectRatioDescriptions: Record<string, string> = {
    '1:1': 'square format',
    '3:4': 'portrait format (3:4)',
    '4:3': 'landscape format (4:3)',
    '9:16': 'vertical/story format (9:16)',
    '16:9': 'widescreen format (16:9)',
  };
  
  const formatHint = aspectRatioDescriptions[aspectRatio] || 'square format';
  
  // Only add format hint if not already mentioned in prompt
  if (!prompt.toLowerCase().includes('format') && !prompt.toLowerCase().includes('aspect')) {
    return `${prompt}. Generate in ${formatHint}.`;
  }
  
  return prompt;
}

/**
 * Detect aspect ratio from prompt keywords
 */
function getAspectRatioFromPrompt(prompt: string): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('16:9') || lowerPrompt.includes('widescreen') || lowerPrompt.includes('wide')) {
    return '16:9';
  } else if (lowerPrompt.includes('9:16') || lowerPrompt.includes('vertical') || lowerPrompt.includes('story') || lowerPrompt.includes('reel')) {
    return '9:16';
  } else if (lowerPrompt.includes('4:3') || lowerPrompt.includes('landscape')) {
    return '4:3';
  } else if (lowerPrompt.includes('3:4') || lowerPrompt.includes('portrait')) {
    return '3:4';
  } else if (lowerPrompt.includes('square') || lowerPrompt.includes('1:1')) {
    return '1:1';
  }
  
  return '1:1';
}
