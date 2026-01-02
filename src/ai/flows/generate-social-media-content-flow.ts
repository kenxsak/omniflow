
'use server';
/**
 * @fileOverview A Genkit flow for generating social media content using AI.
 *
 * - generateSocialMediaContent - A function that handles social media content generation.
 * - GenerateSocialMediaContentInput - The input type.
 * - GenerateSocialMediaContentOutput - The return type.
 */

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSocialMediaContentInputSchema = z.object({
  topic: z.string().optional().describe('The main topic, theme, or user prompt. For Sales Pages, this is the primary instruction for the AI.'),
  platform: z.enum(['BlogPost', 'TwitterX', 'Instagram', 'LinkedIn', 'Facebook', 'YouTubeVideoScript', 'SalesLandingPage'])
    .describe('The target social media platform for the content.'),
  tone: z.enum(['Formal', 'Casual', 'Humorous', 'Inspirational', 'Professional', 'Witty', 'Urgent'])
    .describe('The desired tone of voice for the content.'),
  // The following fields are now optional for more flexibility, especially for sales pages
  goal: z.string().optional().describe('The primary objective of the post.'),
  keywords: z.string().optional().describe('Comma-separated list of keywords to try and include (especially for Blog Posts or Sales Page for SEO).'),
  callToAction: z.string().optional().describe('The desired call to action (e.g., Visit our website, Learn more, Shop now, Comment below).'),
  
  includeHashtags: z.boolean().optional().default(true).describe('Whether to include relevant hashtags (for applicable platforms).'),
  numVariations: z.number().min(1).max(3).optional().default(1).describe('Number of content variations to generate (1-3).'),
  blogPostApproximateWords: z.number().min(50).optional().describe("Target approximate word count for the blog post section (e.g., 500, 1000). Relevant only if platform is 'BlogPost'."),
  targetLanguage: z.string().optional().default('English').describe('The desired language for the output content (e.g., "Spanish", "Hindi", "French", "German"). Default is English if not specified.'),
  
  // Existing HTML content for editing sales pages or blogs
  salesPageContent: z.string().optional().describe('Optional: The full HTML content of a previously generated sales page or blog post. If provided, the "topic" field will be treated as an editing instruction.'),
  
  // New field for website URL to include in blogs
  websiteUrl: z.string().url().optional().describe('The base URL of the user\'s website, for creating backlinks in blog posts.'),
});
export type GenerateSocialMediaContentInput = z.infer<typeof GenerateSocialMediaContentInputSchema>;

const SocialMediaPostVariationSchema = z.object({
    textContent: z.string().describe('The AI-generated text content. For BlogPost or YouTubeVideoScript, this will be the main article/script. For others, it is the post text/caption.'),
    suggestedImagePrompt: z.string().optional().describe('A concise, descriptive prompt for an AI image generation model to create a relevant visual. Example: "A flat lay of a laptop, notebook, and coffee cup on a wooden desk, minimalist style, bright lighting, square aspect ratio". Include aspect ratio hints.'),
    suggestedVideoScriptIdea: z.string().optional().describe('For platforms other than YouTubeVideoScript, a brief (1-3 sentence) idea for a short video. For YouTubeVideoScript, the detailed script is in textContent.'),
    // YouTube Specific fields - populated only when platform is 'YouTubeVideoScript'
    suggestedVideoTitle: z.string().optional().describe('A compelling and SEO-friendly title for the YouTube video.'),
    suggestedVideoDescription: z.string().optional().describe('A well-structured YouTube video description, including key points, relevant links (placeholders), and a call to action.'),
    suggestedVideoKeywordsTags: z.array(z.string()).optional().describe('An array of 5-10 relevant keywords/tags for the YouTube video.'),
    suggestedVideoHashtags: z.array(z.string()).optional().describe('An array of 3-5 relevant hashtags for the YouTube video description.'),
    suggestedVideoThumbnailPrompt: z.string().optional().describe('A specific text prompt for generating an engaging YouTube thumbnail image (16:9 aspect ratio).'),
});
export type SocialMediaPostVariation = z.infer<typeof SocialMediaPostVariationSchema>;

const GenerateSocialMediaContentOutputSchema = z.object({
  variations: z.array(SocialMediaPostVariationSchema).describe('An array of generated social media post variations.')
});
export type GenerateSocialMediaContentOutput = z.infer<typeof GenerateSocialMediaContentOutputSchema>;

export async function generateSocialMediaContent(input: GenerateSocialMediaContentInput): Promise<GenerateSocialMediaContentOutput> {
  return generateSocialMediaContentFlow(input);
}

// Get current year for copyright notices
const getCurrentYear = () => new Date().getFullYear();

const prompt = ai.definePrompt({
  name: 'generateSocialMediaContentPrompt',
  input: { schema: GenerateSocialMediaContentInputSchema },
  output: { schema: GenerateSocialMediaContentOutputSchema },
  model: geminiModel,
  prompt: `You are an expert content strategist, SEO specialist, and full-stack web developer with a keen eye for modern, professional design. Generate {{{numVariations}}} variation(s) of content for the specified platform.

**IMPORTANT: Current Year for Copyright Notices: ${getCurrentYear()}**
When generating any copyright notice or footer, ALWAYS use the year ${getCurrentYear()} (e.g., "© ${getCurrentYear()} Company Name").

**Overall User Inputs:**
-   Target Platform: {{{platform}}}
-   Desired Tone: {{{tone}}}
-   User Prompt / Topic / Editing Request: {{{topic}}}
-   Base HTML Content (if any): {{{salesPageContent}}}
-   Target Language (Default is English): {{{targetLanguage}}}
-   User's Website URL (for backlinks): {{{websiteUrl}}}

**General Instruction:** Generate all text-based outputs in the '{{{targetLanguage}}}' if provided. Otherwise, generate in English.

**Output Instructions (For EACH variation, populate these fields for the 'variations' array):**

**1.  textContent:**
    *   Adapt the language and style to the specified '{{{tone}}}'.

    *   **Platform Specifics for 'textContent':**
        *   **If Platform is 'BlogPost':**
            *   **ROLE:** You are a world-class content strategist combining the expertise of Neil Patel (SEO), Ann Handley (content marketing), and the design sensibility of Medium's editorial team. Your mission is to create blog content that ranks on Google, engages readers, and drives conversions.
            
            *   **Analyze the User's Prompt:** Use '{{{topic}}}' as the core subject for the blog post.
            *   **Create or Edit:**
                *   If '{{{salesPageContent}}}' is provided, treat it as the base HTML. The '{{{topic}}}' is an **editing instruction**. Modify the existing HTML based on this prompt.
                *   If '{{{salesPageContent}}}' is NOT provided, generate a new blog post from scratch.
            
            *   **Generate a COMPLETE, single-file HTML document.** The output MUST be valid HTML, including \`<!DOCTYPE html>\`, \`<html lang="en">\`, \`<head>\`, and \`<body>\` tags.
            
            *   **=== HEAD SECTION (Critical for SEO) ===**
            *   **In the \`<head>\` section, you MUST include:**
                *   **Title Tag (Most Important):**
                    *   Format: "Primary Keyword - Secondary Keyword | Brand Name" or "How to [Action] [Result] in [Timeframe]"
                    *   Keep under 60 characters
                    *   Front-load the main keyword
                    *   Make it compelling and click-worthy
                *   **Meta Description:**
                    *   150-160 characters exactly
                    *   Include primary keyword naturally
                    *   Include a call-to-action or value proposition
                    *   Make it enticing to click
                *   **Essential Meta Tags:**
                    *   \`<meta name="viewport" content="width=device-width, initial-scale=1">\`
                    *   \`<meta name="robots" content="index, follow">\`
                    *   \`<meta name="author" content="[Author Name]">\`
                    *   \`<link rel="canonical" href="[URL]">\` (placeholder)
                *   **Open Graph Tags (for Social Sharing):**
                    *   \`og:title\` - Same as title or slightly modified for social
                    *   \`og:description\` - Compelling social description
                    *   \`og:image\` - Use placeholder: https://placehold.co/1200x630.png
                    *   \`og:type="article"\`
                    *   \`og:url\` - Placeholder URL
                    *   \`article:published_time\` - Current date in ISO format
                    *   \`article:author\` - Author name
                *   **Twitter Card Tags:**
                    *   \`twitter:card="summary_large_image"\`
                    *   \`twitter:title\`, \`twitter:description\`, \`twitter:image\`
                *   **Schema.org Structured Data (JSON-LD):**
                    *   Include Article schema with: headline, description, image, author, datePublished, publisher
                    *   This is CRITICAL for rich snippets in Google
                
                *   **=== CSS STYLING (Professional Design) ===**
                *   A complete \`<style>\` tag with embedded CSS featuring:
                    *   **CSS Variables for Easy Theming:**
                        \`\`\`
                        :root {
                          --text-primary: #1a1a1a;
                          --text-secondary: #4a4a4a;
                          --bg-primary: #ffffff;
                          --bg-secondary: #f8f9fa;
                          --bg-accent: #e8f4f8;
                          --accent-color: #0066cc;
                          --border-color: #e5e5e5;
                        }
                        @media (prefers-color-scheme: dark) {
                          :root {
                            --text-primary: #f5f5f5;
                            --text-secondary: #b0b0b0;
                            --bg-primary: #1a1a1a;
                            --bg-secondary: #2d2d2d;
                            --bg-accent: #1e3a4a;
                            --border-color: #404040;
                          }
                        }
                        \`\`\`
                    *   **CRITICAL COLOR RULES:**
                        *   Body text: var(--text-primary) - ALWAYS dark on light, light on dark
                        *   Secondary text: var(--text-secondary) - Never lighter than #666 on white
                        *   All boxes, cards, callouts MUST use these variables
                        *   NEVER hardcode gray colors like #888, #999, #aaa for text
                    *   **Typography (Reader-Focused):**
                        *   Font: 'Georgia, "Times New Roman", serif' for body (proven readability)
                        *   Font: 'Inter, -apple-system, sans-serif' for headings
                        *   Body font-size: 19px (optimal for reading)
                        *   Line-height: 1.75 (generous spacing)
                        *   Paragraph margin: 1.5em 0
                    *   **Layout:**
                        *   Article max-width: 700px (optimal reading width)
                        *   Centered with auto margins
                        *   Generous padding: 1rem on mobile, 2rem on tablet, 4rem on desktop
                        *   **CRITICAL: All elements must use \`position: static\` or \`position: relative\` by default**
                        *   **NEVER use \`position: fixed\` or \`position: absolute\` for content elements on mobile**
                        *   Use media queries to add sticky/fixed positioning ONLY on larger screens
                    *   **Visual Elements:**
                        *   Blockquotes: Left border 4px solid accent, italic, padding-left 1.5rem
                        *   Code blocks: Background var(--bg-secondary), border-radius 8px, overflow-x auto
                        *   Images: border-radius 12px, box-shadow subtle
                        *   Links: accent color, underline on hover
                    *   **Special Sections Styling:**
                        *   Key Takeaways box: background var(--bg-accent), border-left 4px solid accent, padding 1.5rem, color var(--text-primary)
                        *   CTA box: background gradient or solid accent, color white or var(--text-primary) based on contrast
                        *   Callout boxes: distinct background, icon, clear text color
                    *   **MOBILE-FIRST CSS RULES (CRITICAL):**
                        *   Start with mobile styles as default (no media query)
                        *   Use \`@media (min-width: 768px)\` for tablet styles
                        *   Use \`@media (min-width: 1024px)\` for desktop styles
                        *   All floating/fixed elements must be \`position: static\` on mobile
                        *   No horizontal overflow - use \`overflow-x: hidden\` on body
                        *   Images: \`max-width: 100%; height: auto;\`
                        *   Font sizes: Start smaller, scale up with media queries
            
            *   **=== BODY CONTENT STRUCTURE (SEO-Optimized) ===**
            *   **In the \`<body>\` section, generate a well-structured article with ALL of the following elements:**
            
                *   **1. Minimal Header:**
                    *   Logo placeholder (left)
                    *   Simple navigation or "Subscribe" button (right)
                    *   Sticky on scroll (optional)
                
                *   **2. Article Header (Above the Fold - Critical):**
                    *   **Category badge** - Clickable tag (e.g., "Marketing", "Technology")
                    *   **H1 Headline** - The most important SEO element:
                        *   Include primary keyword near the beginning
                        *   Use power words (Ultimate, Complete, Proven, Essential)
                        *   Create curiosity or promise value
                        *   Keep under 60 characters for SERP display
                    *   **Subtitle/Deck** - 1-2 sentences expanding on headline, include secondary keyword
                    *   **Author byline** with:
                        *   Circular avatar placeholder
                        *   Author name (linked)
                        *   Publication date (use format: "January 2, 2026")
                        *   Reading time (calculate: word count / 200)
                    *   **Social share buttons** - Twitter, LinkedIn, Facebook, Copy Link
                
                *   **3. Hero Image:**
                    *   \`<figure>\` with \`<img>\` and \`<figcaption>\`
                    *   Use: \`<img src="https://placehold.co/1200x630.png" alt="[Descriptive alt text with keyword]" loading="lazy">\`
                    *   Alt text MUST be descriptive and include keyword naturally
                    *   Caption for image credit
                
                *   **4. Table of Contents (For articles 1000+ words):**
                    *   **MOBILE-FIRST APPROACH - CRITICAL:**
                        *   On mobile (default): Display as a collapsible/accordion box INLINE with content flow
                        *   Use \`position: static\` (NOT fixed or absolute) on mobile
                        *   Style as a bordered card that can be expanded/collapsed
                        *   Place it AFTER the hero image, BEFORE the introduction
                    *   **On desktop (min-width: 1024px):**
                        *   Can optionally become a sticky sidebar using \`position: sticky; top: 100px;\`
                        *   But ONLY if there's enough viewport width
                    *   **CSS Requirements:**
                        \`\`\`css
                        .toc {
                          position: static; /* Mobile default - flows with content */
                          background: var(--bg-secondary);
                          border-radius: 12px;
                          padding: 1rem;
                          margin: 1.5rem 0;
                        }
                        @media (min-width: 1024px) {
                          .toc {
                            /* Only sticky on large screens with sidebar layout */
                            /* position: sticky; top: 100px; */
                          }
                        }
                        \`\`\`
                    *   Links to all H2 sections with anchor IDs
                    *   Include a "Table of Contents" heading with toggle icon on mobile
                    *   Helps both users and Google understand structure
                
                *   **5. Introduction (First 100 words are CRITICAL for SEO):**
                    *   **Hook** - Start with a compelling statistic, question, or bold statement
                    *   **Problem** - Identify the reader's pain point
                    *   **Promise** - What they'll learn/gain from reading
                    *   **Include primary keyword** in first paragraph naturally
                    *   Keep paragraphs short (2-3 sentences max)
                
                *   **6. Main Content Sections:**
                    *   **H2 Subheadings** - Each should:
                        *   Include relevant keywords naturally
                        *   Be descriptive and scannable
                        *   Follow logical progression
                        *   Use numbers when appropriate ("5 Ways to...", "Step 1:")
                    *   **H3 Sub-sections** where needed for depth
                    *   **Content Best Practices:**
                        *   Short paragraphs (3-4 sentences max)
                        *   Bullet points and numbered lists for scanability
                        *   Bold key terms and important phrases
                        *   Include relevant statistics with sources
                        *   Add internal links to '{{{websiteUrl}}}' (2-3 naturally placed)
                        *   Use transition words between sections
                    *   **Visual Breaks:**
                        *   Relevant images every 300-400 words
                        *   Blockquotes for expert quotes or key insights
                        *   Callout boxes for tips, warnings, or pro tips
                        *   Code blocks if technical content
                
                *   **7. Key Takeaways Box (CRITICAL - Must be visible and readable):**
                    *   Styled as a distinct card/box with:
                        *   Background: var(--bg-accent) or light blue/green tint
                        *   Border-left: 4px solid accent color
                        *   Padding: 1.5rem
                        *   **Text color: var(--text-primary) - MUST be dark (#1a1a1a) on light backgrounds**
                    *   Title: "Key Takeaways" or "TL;DR" with icon
                    *   3-5 bullet points summarizing main insights
                    *   Use checkmark icons (✓) for visual appeal
                
                *   **8. Conclusion:**
                    *   Summarize key points briefly
                    *   Reinforce the main benefit/value
                    *   Include a clear call-to-action
                    *   End with a question to encourage comments
                
                *   **9. Call-to-Action Section (Lead Generation):**
                    *   Visually distinct box with:
                        *   Contrasting background (gradient or solid color)
                        *   **Text MUST have high contrast - white on dark, or dark on light**
                        *   Clear headline: "Ready to [Benefit]?" or "Get Started Today"
                        *   Brief value proposition
                        *   CTA button (prominent, action-oriented text)
                        *   Optional: Email signup form placeholder
                
                *   **10. Author Bio Box:**
                    *   Circular avatar placeholder
                    *   Author name and credentials
                    *   2-3 sentence bio establishing expertise
                    *   Social links (Twitter, LinkedIn)
                    *   Builds E-E-A-T (Experience, Expertise, Authoritativeness, Trust)
                
                *   **11. Related Articles (Internal Linking):**
                    *   3 cards with thumbnail, title, excerpt
                    *   Improves time on site and internal link structure
                
                *   **12. Comments Section:**
                    *   "Join the Discussion" prompt
                    *   Placeholder for comment form
                    *   Encourages engagement signals
                
                *   **13. Footer:**
                    *   Copyright: © ${getCurrentYear()} [Company Name]
                    *   Links: Privacy Policy, Terms, Contact
                    *   Social media icons
            
            *   **=== SEO CHECKLIST (Must Follow) ===**
                *   ✓ Primary keyword in: Title, H1, first paragraph, one H2, meta description, image alt
                *   ✓ Secondary keywords sprinkled naturally throughout
                *   ✓ Proper heading hierarchy: H1 → H2 → H3 (never skip)
                *   ✓ Semantic HTML5: \`<article>\`, \`<section>\`, \`<header>\`, \`<footer>\`, \`<figure>\`, \`<figcaption>\`
                *   ✓ Internal links to '{{{websiteUrl}}}' (2-3 minimum)
                *   ✓ External links to authoritative sources (1-2, open in new tab)
                *   ✓ Image alt text descriptive and keyword-rich
                *   ✓ Schema.org Article structured data
                *   ✓ Mobile-responsive design
                *   ✓ Fast-loading (no heavy scripts)
            
            *   **=== CONTENT QUALITY STANDARDS ===**
                *   Write at 8th-grade reading level for accessibility
                *   Use active voice predominantly
                *   Include specific examples and actionable advice
                *   Back claims with data when possible
                *   Make content comprehensive (aim for 1500+ words for competitive topics)
                *   Ensure originality - no generic filler content
            
            *   **Optional JavaScript (Minimal):**
                *   Smooth scroll for TOC links
                *   Copy-to-clipboard for code blocks
                *   Reading progress bar
            
            *   The 'textContent' field in the output must contain this full HTML string.

        *   **If Platform is 'SalesLandingPage':**
            *   Act as an expert UI/UX Designer, Conversion Rate Optimization (CRO) specialist, and Frontend Developer. Your mission is to take a simple user prompt about their business and expand it into a complete, modern, high-converting sales landing page.
            *   **Analyze the User's Prompt:** Use '{{{topic}}}' as the core concept. Intelligently generate compelling, benefit-focused copy for all sections. Use '{{{keywords}}}' for SEO.
            *   **Create or Edit:**
                *   If '{{{salesPageContent}}}' is provided, treat it as the base HTML. The '{{{topic}}}' is an **editing instruction**. Modify the existing HTML based on this prompt.
                *   If '{{{salesPageContent}}}' is NOT provided, generate a new sales page from scratch.
            *   **Generate a COMPLETE, single-file HTML document.** The output MUST be valid HTML, including \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, and \`<body>\` tags.
            *   **In the \`<head>\` section, you MUST include:**
                *   A \`<title>\` tag derived from the '{{{topic}}}'.
                *   A \`<meta name="description" content="...">\` tag with compelling copy.
                *   \`<meta name="viewport" content="width=device-width, initial-scale=1">\` for mobile responsiveness.
                *   **Open Graph meta tags** for social sharing (\`og:title\`, \`og:description\`, \`og:image\`, \`og:type\`).
                *   A complete \`<style>\` tag with embedded CSS featuring:
                    *   Modern, clean, mobile-first design
                    *   **Both light and dark modes** using \`@media (prefers-color-scheme: dark)\` query
                    *   Professional font stack: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    *   **Subtle animations** using CSS transitions and keyframes (fade-in, slide-up effects)
                    *   **Modern design elements**: subtle gradients, soft shadows, rounded corners (border-radius: 12px-16px)
                    *   **Glassmorphism effects** where appropriate (backdrop-filter: blur)
                    *   CSS custom properties (variables) for colors, spacing, and easy theming
            *   **In the \`<body>\` section, generate a page with ALL OF THE FOLLOWING SECTIONS in this order:**
                *   **1. Announcement Bar (Optional):** A slim top bar with a promotional message or limited-time offer with urgency.
                *   **2. Responsive Header:** Logo placeholder, navigation links, and a CTA button. The menu MUST collapse into a **hamburger menu on mobile**.
                *   **3. Hero Section:** 
                    *   A small badge/pill above the headline (e.g., "🚀 New Feature" or "Trusted by 10,000+ users")
                    *   A powerful, benefit-focused H1 headline (not feature-focused)
                    *   A compelling sub-headline explaining the value proposition
                    *   Two CTA buttons (primary and secondary/ghost style)
                    *   A **placeholder hero image or product mockup** (use https://placehold.co/800x500.png)
                    *   **Social proof snippet** below CTAs (e.g., "Join 5,000+ happy customers" with small avatar circles)
                *   **4. Logos/Trust Bar:** A horizontal row of 4-6 "Trusted by" or "As seen in" company logo placeholders with grayscale filter.
                *   **5. Problem-Agitate-Solution Section:** Briefly describe the problem the product solves, agitate the pain point, then introduce the solution.
                *   **6. Key Features Grid:** A responsive grid (2-3 columns) showcasing 4-6 key features with:
                    *   **Inline SVG icons** in colored circular backgrounds
                    *   Feature title and 1-2 sentence benefit-focused description
                    *   Subtle hover effects
                *   **7. How It Works Section:** A 3-4 step process with numbered steps, icons, and brief descriptions showing the user journey.
                *   **8. Benefits Section:** A two-column layout with an image on one side and a list of 4-5 benefits with checkmark icons on the other.
                *   **9. Testimonials Section:** 
                    *   A grid with 3 customer testimonials
                    *   Include placeholder avatar, name, title/company, star rating, and quote
                    *   Use card design with subtle shadows
                *   **10. Pricing Section:** 
                    *   A grid of 3 pricing tiers (Basic, Pro/Popular, Enterprise)
                    *   The middle plan should be highlighted as "Most Popular" with a badge and different styling
                    *   Each plan: name, price, billing period, feature list with checkmarks, CTA button
                    *   Include a "Money-back guarantee" badge below pricing
                *   **11. Comparison Table (Optional):** A simple table comparing your product vs competitors or plan features.
                *   **12. FAQ (Accordion):** An interactive accordion-style FAQ section with 5-6 common questions. Include questions about pricing, refunds, and getting started.
                *   **13. Final CTA Section:** 
                    *   A visually distinct section (gradient background or different color)
                    *   Strong headline, brief text, and prominent CTA button
                    *   Optional: Add urgency element or guarantee badge
                *   **14. Multi-Column Footer:** 
                    *   4 columns: Product, Company, Resources, Legal
                    *   Social media icon links (use placeholder SVGs)
                    *   Newsletter signup form placeholder
                    *   Copyright notice: © ${getCurrentYear()} [Company Name]. All rights reserved.
                *   **15. Sticky Mobile CTA (Optional):** A fixed bottom bar on mobile with a CTA button that appears on scroll.
            *   **Design Guidelines:**
                *   Use a cohesive color palette with a primary brand color, secondary color, and neutral tones
                *   Ensure sufficient contrast for accessibility (WCAG AA)
                *   Use whitespace generously for a clean, premium feel
                *   All images should use placeholder URLs from https://placehold.co/ with appropriate dimensions
                *   Buttons should have hover states and be large enough for touch (min 44px height on mobile)
            *   **SVG Icon Library (use these for features):**
                *   Checkmark: \`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>\`
                *   Users/CRM: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>\`
                *   Sparkles/AI: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/></svg>\`
                *   Chart/Analytics: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>\`
                *   Zap/Fast: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>\`
                *   Shield/Security: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>\`
                *   Globe/Integrations: \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>\`
                *   Star: \`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>\`
            *   Include a **small, safe JavaScript snippet** at the end of the \`<body>\` to handle:
                *   Hamburger menu toggle
                *   FAQ accordion functionality
                *   Smooth scroll for anchor links
                *   Optional: Fade-in animation on scroll using IntersectionObserver
            *   Ensure the entire page is well-structured with semantic HTML5 tags and is **fully mobile-responsive**.

        *   **If Platform is 'YouTubeVideoScript':**
            *   Create a detailed video script with scene descriptions, voice-over, and on-screen text suggestions based on '{{{topic}}}'.
        *   **For other platforms (TwitterX, Instagram, etc.):**
            *   Generate concise and engaging post text suitable for the platform based on '{{{topic}}}'.

**2.  suggestedImagePrompt:** (Required for 'BlogPost' and 'SalesLandingPage')
    *   Provide a concise, descriptive text prompt for an AI image generator to create a relevant hero image. Include aspect ratio hints.

**3.  suggestedVideoScriptIdea:** (Not required for 'SalesLandingPage' or 'BlogPost')
    *   Provide a brief video concept if the platform is not 'YouTubeVideoScript'.

**4.  YouTube-specific fields:** Populate these only when platform is 'YouTubeVideoScript'.

Generate the content now, following these platform-specific instructions precisely. For 'SalesLandingPage' and 'BlogPost', remember to generate a complete and valid HTML file as a single string.
`,
});

const generateSocialMediaContentFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaContentFlow',
    inputSchema: GenerateSocialMediaContentInputSchema,
    outputSchema: GenerateSocialMediaContentOutputSchema,
  },
  async (input: GenerateSocialMediaContentInput): Promise<GenerateSocialMediaContentOutput> => {
    const { output } = await prompt(input);
    if (!output || !output.variations) {
      throw new Error("Failed to generate social media content from AI.");
    }
    return { variations: output.variations };
  }
);
    
