'use server';
/**
 * @fileOverview Image generation using Google's Gemini 2.5 Flash Image (Nano Banana)
 * 
 * Uses the new @google/genai SDK for native image generation with multimodal support
 * - Supports brand logo input for branded image generation
 * - Platform-specific image presets for social media advertising
 * - Multiple style options for different brand aesthetics
 * - Faster and cheaper than Imagen 4 (~$0.02/image vs $0.04)
 * - Optimized for high-volume, low-latency tasks
 *
 * - generateImageWithAiFlow - Main function for image generation
 * - GenerateImageWithAiFlowInput - Input type
 * - GenerateImageWithAiFlowOutput - Return type
 */

import { GoogleGenAI } from "@google/genai";
import { z } from 'genkit';
import { PLATFORM_PRESETS, IMAGE_STYLES, type PlatformPreset, type ImageStyle } from '../image-generation-presets';

const GenerateImageWithAiFlowInputSchema = z.object({
  prompt: z.string().min(1).describe('The text prompt to generate an image from.'),
  aspectRatio: z.enum(['1:1', '3:4', '4:3', '9:16', '16:9', '4:5', '2:3', '1:2', '4:1', '3:1']).optional().describe('Aspect ratio for the image'),
  platform: z.string().optional().describe('Platform preset to use (e.g., instagram-feed, youtube-thumbnail)'),
  style: z.string().optional().describe('Image style to apply (e.g., photorealistic, minimalist, luxury)'),
  apiKey: z.string().optional().describe('Optional Gemini API key to use instead of platform default'),
  brandLogo: z.string().optional().describe('Brand logo as base64 data URI to incorporate into the generated image'),
  brandName: z.string().optional().describe('Brand/company name to include in the image'),
  brandColors: z.array(z.string()).optional().describe('Brand colors to incorporate (hex codes)'),
  textOverlay: z.string().optional().describe('Text to overlay on the image'),
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

    // Determine aspect ratio from platform preset or direct input
    let aspectRatio = input.aspectRatio || '1:1';
    let platformTips = '';
    
    if (input.platform && input.platform in PLATFORM_PRESETS) {
      const preset = PLATFORM_PRESETS[input.platform as PlatformPreset];
      aspectRatio = preset.aspectRatio;
      platformTips = preset.tips;
      console.log(`Using platform preset: ${preset.name} (${preset.dimensions})`);
    } else {
      aspectRatio = getAspectRatioFromPrompt(input.prompt);
    }
    
    // Get style enhancement if specified
    let stylePrompt = '';
    if (input.style && input.style in IMAGE_STYLES) {
      stylePrompt = IMAGE_STYLES[input.style as ImageStyle].prompt;
      console.log(`Applying style: ${IMAGE_STYLES[input.style as ImageStyle].name}`);
    }
    
    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Check if we have a brand logo for multimodal generation
    if (input.brandLogo) {
      return await generateBrandedImage(ai, input, aspectRatio, stylePrompt, platformTips);
    } else {
      return await generateStandardImage(ai, input, aspectRatio, stylePrompt, platformTips);
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
  aspectRatio: string,
  stylePrompt: string = '',
  platformTips: string = ''
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
  
  // Build the branded prompt with all enhancements
  const brandedPrompt = buildBrandedPrompt(input.prompt, input.brandName, aspectRatio, stylePrompt, platformTips, input.brandColors, input.textOverlay);
  
  console.log(`Branded prompt: "${brandedPrompt.substring(0, 200)}..."`);

  // Use multimodal input with the logo image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
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
  aspectRatio: string,
  stylePrompt: string = '',
  platformTips: string = ''
): Promise<GenerateImageWithAiFlowOutput> {
  // Build prompt with all enhancements
  const enhancedPrompt = buildEnhancedPrompt(input.prompt, aspectRatio, stylePrompt, platformTips, input.textOverlay);

  console.log(`Generating standard image with Gemini 2.0 Flash...`);
  console.log(`Prompt: "${enhancedPrompt.substring(0, 200)}..."`);
  console.log(`Aspect ratio: ${aspectRatio}`);

  // Generate image using Gemini 2.0 Flash Experimental (supports image generation)
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
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
function buildBrandedPrompt(
  prompt: string, 
  brandName: string | undefined, 
  aspectRatio: string,
  stylePrompt: string = '',
  platformTips: string = '',
  brandColors?: string[],
  textOverlay?: string
): string {
  const aspectRatioDescriptions: Record<string, string> = {
    '1:1': 'square format (1:1)',
    '3:4': 'portrait format (3:4)',
    '4:3': 'landscape format (4:3)',
    '9:16': 'vertical/story format (9:16)',
    '16:9': 'widescreen format (16:9)',
    '4:5': 'Instagram portrait format (4:5)',
    '2:3': 'Pinterest pin format (2:3)',
    '1:2': 'tall infographic format (1:2)',
    '4:1': 'wide banner format (4:1)',
    '3:1': 'email header format (3:1)',
  };
  
  const formatHint = aspectRatioDescriptions[aspectRatio] || 'square format';
  
  let brandedPrompt = `You are an expert advertising designer creating a professional branded marketing image.

BRAND LOGO: The image I've provided is the brand's logo. Analyze its colors, style, and design elements carefully.

TASK: Generate a ${formatHint} marketing image that:
1. Incorporates the brand logo prominently and naturally into the design
2. Uses the logo's color palette as the primary colors for the image
3. Matches the logo's visual style (modern, classic, playful, professional, etc.)
4. Creates a cohesive branded look that would work for advertising

USER REQUEST: ${prompt}`;

  if (brandName) {
    brandedPrompt += `\n\nBRAND NAME: "${brandName}" - Include this text in the image if appropriate for the design.`;
  }
  
  if (brandColors && brandColors.length > 0) {
    brandedPrompt += `\n\nBRAND COLORS: Use these colors prominently: ${brandColors.join(', ')}`;
  }
  
  if (stylePrompt) {
    brandedPrompt += `\n\nSTYLE: ${stylePrompt}`;
  }
  
  if (platformTips) {
    brandedPrompt += `\n\nPLATFORM TIPS: ${platformTips}`;
  }
  
  if (textOverlay) {
    brandedPrompt += `\n\nTEXT TO INCLUDE: "${textOverlay}" - Integrate this text naturally into the design with good readability.`;
  }

  brandedPrompt += `\n\nIMPORTANT REQUIREMENTS:
- The logo should be clearly visible and well-integrated
- Maintain brand consistency throughout the image
- Create a professional, high-quality marketing asset
- Generate in ${formatHint}
- Ensure the image is suitable for advertising and social media
- Make it visually striking and attention-grabbing
- Use professional composition and lighting`;

  return brandedPrompt;
}

/**
 * Build enhanced prompt with all options (for non-branded images)
 */
function buildEnhancedPrompt(
  prompt: string, 
  aspectRatio: string,
  stylePrompt: string = '',
  platformTips: string = '',
  textOverlay?: string
): string {
  const aspectRatioDescriptions: Record<string, string> = {
    '1:1': 'square format (1:1)',
    '3:4': 'portrait format (3:4)',
    '4:3': 'landscape format (4:3)',
    '9:16': 'vertical/story format (9:16)',
    '16:9': 'widescreen format (16:9)',
    '4:5': 'Instagram portrait format (4:5)',
    '2:3': 'Pinterest pin format (2:3)',
    '1:2': 'tall infographic format (1:2)',
    '4:1': 'wide banner format (4:1)',
    '3:1': 'email header format (3:1)',
  };
  
  const formatHint = aspectRatioDescriptions[aspectRatio] || 'square format';
  
  let enhancedPrompt = `Create a professional, high-quality image: ${prompt}`;
  
  if (stylePrompt) {
    enhancedPrompt += `. Style: ${stylePrompt}`;
  }
  
  if (platformTips) {
    enhancedPrompt += `. Design tips: ${platformTips}`;
  }
  
  if (textOverlay) {
    enhancedPrompt += `. Include this text in the design: "${textOverlay}"`;
  }
  
  // Add format hint if not already mentioned
  if (!prompt.toLowerCase().includes('format') && !prompt.toLowerCase().includes('aspect')) {
    enhancedPrompt += `. Generate in ${formatHint}.`;
  }
  
  enhancedPrompt += ' Make it visually striking, professional quality, suitable for advertising and social media.';
  
  return enhancedPrompt;
}

/**
 * Build prompt with aspect ratio guidance (legacy support)
 */
function buildPromptWithAspectRatio(prompt: string, aspectRatio: string): string {
  return buildEnhancedPrompt(prompt, aspectRatio);
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
