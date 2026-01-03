'use server';

/**
 * Unified AI Chat Flow - Gemini-like Experience
 * 
 * Simple, versatile AI assistant using only Gemini API (no extra APIs needed):
 * 1. Works like native Gemini - answers any question
 * 2. Uses Gemini's built-in knowledge for research/advice
 * 3. Routes to specialized flows ONLY when user explicitly wants content creation
 * 4. No limitations - general purpose AI assistant
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Simple intent classification - general_response is the default
const IntentSchema = z.object({
  intent: z.enum([
    'general_response',    // Default - answer like Gemini (research, Q&A, advice, etc.)
    'google_ad',
    'facebook_ad', 
    'linkedin_ad',
    'youtube_ad',
    'tiktok_ad',
    'social_post',
    'blog_post',
    'email',
    'video_script',
    'image',
    'keywords',
    'hashtags',
    'sales_page',
    'review_response',
  ]).describe('The detected intent - use general_response for most queries'),
  topic: z.string().describe('The main topic/subject the user is asking about'),
  platform: z.string().optional().describe('Specific platform if mentioned'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
});

export type DetectedIntent = z.infer<typeof IntentSchema>;

const IntentDetectionInputSchema = z.object({
  userMessage: z.string().describe('The current user message'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Previous messages in the conversation'),
  agentContext: z.string().optional().describe('The type of AI agent being used (ad-strategist, content-writer, etc.)'),
});

// Prompt for intent detection - Gemini-like behavior
const intentDetectionPrompt = ai.definePrompt({
  name: 'detectUserIntent',
  input: { schema: IntentDetectionInputSchema },
  output: { schema: IntentSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are an intelligent AI assistant that understands user requests.

IMPORTANT: You should behave like Google Gemini - able to answer ANY question, do research, provide advice, analyze data, etc.

INTENT CLASSIFICATION RULES:
1. **general_response** (DEFAULT) - Use for:
   - Questions about anything (business, technology, science, etc.)
   - Requests for advice, analysis, explanations
   - Comparisons, recommendations, opinions
   - Calculations, data analysis
   - General conversation
   - Research questions (you'll use your knowledge to answer)
   - ANY query that doesn't explicitly ask to CREATE marketing content

2. **Content Creation Intents** - ONLY use when user EXPLICITLY asks to CREATE/GENERATE:
   - google_ad, facebook_ad, linkedin_ad: "Create a Google ad for...", "Generate Facebook ad..."
   - youtube_ad, tiktok_ad: "Create a YouTube ad...", "Make a TikTok ad..."
   - social_post: "Create an Instagram post...", "Write a tweet..."
   - blog_post: "Write a blog post about...", "Create a blog article..."
   - email: "Write an email to...", "Draft an email..."
   - video_script: "Write a video script...", "Create a script for..."
   - image: "Create an image of...", "Generate a picture..."
   - keywords: "Suggest keywords for...", "Find keywords..."
   - hashtags: "Generate hashtags for..."
   - sales_page: "Create a sales page...", "Write landing page copy..."
   - review_response: "Respond to this review..."

EXAMPLES:
- "What is POS software?" → general_response (explaining, not creating)
- "Best POS systems for restaurants" → general_response (research/comparison)
- "How much does Square POS cost?" → general_response (use your knowledge)
- "Create a Google ad for my POS software" → google_ad (explicit creation request)
- "Write a blog about POS benefits" → blog_post (explicit creation request)
- "What are the latest trends in retail?" → general_response (use your knowledge)
- "Explain how CRM works" → general_response (explanation)
- "Compare Salesforce vs HubSpot" → general_response (analysis)

{{#if agentContext}}
Agent Context: {{agentContext}}
- If agent is "ad-strategist" and user asks to CREATE something, lean towards ad intents
- If agent is "content-writer" and user asks to CREATE something, lean towards content intents
- But STILL use general_response for questions/research even with specialized agents
{{/if}}

{{#if conversationHistory}}
Previous conversation:
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

Current user message: {{{userMessage}}}

Analyze and classify. Remember: Default to general_response unless user explicitly wants to CREATE marketing content.
`,
});

export async function detectIntent(
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  agentContext?: string
): Promise<DetectedIntent> {
  try {
    const { output } = await intentDetectionPrompt({
      userMessage,
      conversationHistory: conversationHistory?.slice(-6), // Last 6 messages for context
      agentContext,
    });

    if (!output) {
      return {
        intent: 'general_response',
        topic: userMessage,
        confidence: 0.5,
      };
    }

    return output;
  } catch (error) {
    console.error('[Intent Detection] Error:', error);
    return {
      intent: 'general_response',
      topic: userMessage,
      confidence: 0.3,
    };
  }
}

// Schema for Gemini-like general response
const GeneralResponseSchema = z.object({
  response: z.string().describe('The comprehensive AI response'),
  suggestedFollowUps: z.array(z.string()).optional().describe('2-3 suggested follow-up questions'),
});

// Main Gemini-like response prompt - handles ANY query using Gemini's knowledge
const geminiResponsePrompt = ai.definePrompt({
  name: 'geminiLikeResponse',
  input: { 
    schema: z.object({
      userMessage: z.string(),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })).optional(),
      agentContext: z.string().optional(),
    })
  },
  output: { schema: GeneralResponseSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are a world-class expert AI assistant. You provide the BEST possible answers on ANY topic.

YOUR EXPERTISE:
- Business Strategy & Marketing: Expert-level advice on marketing, sales, branding, growth
- Technology & Software: Deep knowledge of software, apps, SaaS, tech trends
- Industry Knowledge: Retail, healthcare, finance, real estate, hospitality, etc.
- Data & Analytics: Market research, competitor analysis, pricing strategies
- Content & Communication: Writing, messaging, positioning, storytelling

RESPONSE QUALITY STANDARDS:
1. Be SPECIFIC and ACTIONABLE - give real examples, numbers, strategies
2. Be COMPREHENSIVE - cover all important aspects the user needs
3. Be EXPERT-LEVEL - respond as the top consultant in that field would
4. Be PRACTICAL - focus on what actually works, not theory
5. Use your FULL KNOWLEDGE - don't hold back, give the best answer possible

MULTILINGUAL SUPPORT:
- Respond in the SAME LANGUAGE the user writes in
- Support all major languages including: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Spanish, French, German, Portuguese, Arabic, Chinese, Japanese, Korean, etc.
- If user writes in Hindi/Hinglish, respond naturally in that style

{{#if agentContext}}
You are currently acting as a {{agentContext}}. Apply your deep expertise in this area while being helpful with any question.
{{/if}}

{{#if conversationHistory}}
Previous conversation:
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}
{{/if}}

User's question: {{{userMessage}}}

Provide an EXPERT-LEVEL response. Be the best specialist they could consult.
- Use markdown formatting for readability
- Include specific examples, data points, or strategies when relevant
- If discussing pricing or real-time data, mention that users should verify current information
- Suggest 2-3 relevant follow-up questions they might want to explore
`,
});

// Main function for Gemini-like responses (no web search - uses Gemini's built-in knowledge)
export async function getGeminiResponse(
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  agentContext?: string
): Promise<{ response: string; suggestedFollowUps?: string[] }> {
  try {
    const { output } = await geminiResponsePrompt({
      userMessage,
      conversationHistory: conversationHistory?.slice(-6),
      agentContext,
    });

    return output || { response: "I'm here to help! What would you like to know?" };
  } catch (error) {
    console.error('[Gemini Response] Error:', error);
    return { response: "I apologize, but I encountered an error. Please try again." };
  }
}

/**
 * Analyze an image using Gemini Vision
 * 
 * COST-EFFICIENT DESIGN:
 * - Image is sent as base64 directly to Gemini API
 * - NO server storage - image is processed and discarded
 * - Max 1MB limit to prevent abuse
 * - Only costs Gemini API tokens (similar to text)
 */
export async function analyzeImageWithGemini(
  imageBase64: string,
  userQuestion: string,
  agentContext?: string
): Promise<{ response: string; suggestedFollowUps?: string[] }> {
  try {
    // Use Gemini's multimodal capability
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        {
          media: {
            contentType: imageBase64.startsWith('data:image/png') ? 'image/png' : 
                         imageBase64.startsWith('data:image/gif') ? 'image/gif' :
                         imageBase64.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg',
            url: imageBase64,
          },
        },
        {
          text: `You are a world-class expert AI assistant analyzing an image.

${agentContext ? `You are acting as a ${agentContext}.` : ''}

User's question about this image: ${userQuestion || 'What can you tell me about this image?'}

Provide a helpful, detailed analysis. Consider:
- What is shown in the image
- Any text, logos, or branding visible
- Quality and composition (if relevant)
- Actionable insights based on the user's question
- Business/marketing implications if applicable

MULTILINGUAL: Respond in the same language as the user's question.

Be specific and practical in your response.`,
        },
      ],
    });

    const responseText = response.text || "I couldn't analyze this image. Please try again.";
    
    return {
      response: responseText,
      suggestedFollowUps: [
        'What improvements would you suggest?',
        'How can I use this for marketing?',
        'Create content based on this image',
      ],
    };
  } catch (error) {
    console.error('[Image Analysis] Error:', error);
    return { 
      response: "I couldn't analyze this image. Please make sure it's a valid image file under 1MB.",
      suggestedFollowUps: [],
    };
  }
}
