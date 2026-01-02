/**
 * Platform presets and style options for AI image generation
 * Separated from server action file to allow client-side imports
 */

// ============================================================================
// PLATFORM PRESETS - Optimized sizes for each social media platform
// ============================================================================
export const PLATFORM_PRESETS = {
  // Instagram
  'instagram-feed': { 
    aspectRatio: '1:1' as const, 
    name: 'Instagram Feed Post',
    description: 'Square format for Instagram feed',
    dimensions: '1080x1080',
    tips: 'Eye-catching visuals, vibrant colors, clear focal point'
  },
  'instagram-story': { 
    aspectRatio: '9:16' as const, 
    name: 'Instagram Story/Reel',
    description: 'Vertical format for Stories and Reels',
    dimensions: '1080x1920',
    tips: 'Full-screen vertical, text-safe zones, engaging motion-ready'
  },
  'instagram-portrait': { 
    aspectRatio: '4:5' as const, 
    name: 'Instagram Portrait',
    description: 'Portrait format for maximum feed visibility',
    dimensions: '1080x1350',
    tips: 'Takes more feed space, great for product showcases'
  },
  
  // Facebook
  'facebook-feed': { 
    aspectRatio: '1:1' as const, 
    name: 'Facebook Feed Post',
    description: 'Square format for Facebook feed',
    dimensions: '1200x1200',
    tips: 'Works well on both mobile and desktop'
  },
  'facebook-cover': { 
    aspectRatio: '16:9' as const, 
    name: 'Facebook Cover',
    description: 'Wide format for cover photos',
    dimensions: '1640x924',
    tips: 'Keep important elements centered'
  },
  'facebook-ad': { 
    aspectRatio: '1:1' as const, 
    name: 'Facebook Ad',
    description: 'Optimized for Facebook advertising',
    dimensions: '1080x1080',
    tips: 'Minimal text (under 20%), clear CTA area'
  },
  
  // LinkedIn
  'linkedin-feed': { 
    aspectRatio: '1:1' as const, 
    name: 'LinkedIn Feed Post',
    description: 'Square format for LinkedIn feed',
    dimensions: '1200x1200',
    tips: 'Professional aesthetic, clean design'
  },
  'linkedin-banner': { 
    aspectRatio: '4:1' as const, 
    name: 'LinkedIn Banner',
    description: 'Wide banner for company pages',
    dimensions: '1584x396',
    tips: 'Keep text minimal, brand-focused'
  },
  'linkedin-article': { 
    aspectRatio: '16:9' as const, 
    name: 'LinkedIn Article Cover',
    description: 'Cover image for LinkedIn articles',
    dimensions: '1280x720',
    tips: 'Professional, thought-leadership style'
  },
  
  // YouTube
  'youtube-thumbnail': { 
    aspectRatio: '16:9' as const, 
    name: 'YouTube Thumbnail',
    description: 'Thumbnail for YouTube videos',
    dimensions: '1280x720',
    tips: 'Bold text, expressive faces, high contrast'
  },
  'youtube-banner': { 
    aspectRatio: '16:9' as const, 
    name: 'YouTube Channel Banner',
    description: 'Banner for YouTube channel',
    dimensions: '2560x1440',
    tips: 'Safe zone in center, brand consistent'
  },
  
  // Pinterest
  'pinterest-pin': { 
    aspectRatio: '2:3' as const, 
    name: 'Pinterest Pin',
    description: 'Vertical pin format',
    dimensions: '1000x1500',
    tips: 'Tall format, text overlay friendly, lifestyle imagery'
  },
  'pinterest-long': { 
    aspectRatio: '1:2' as const, 
    name: 'Pinterest Long Pin',
    description: 'Extra tall pin for infographics',
    dimensions: '1000x2000',
    tips: 'Great for step-by-step, infographics'
  },
  
  // TikTok
  'tiktok-video': { 
    aspectRatio: '9:16' as const, 
    name: 'TikTok Video Cover',
    description: 'Vertical format for TikTok',
    dimensions: '1080x1920',
    tips: 'Trendy, dynamic, youth-focused'
  },
  
  // Google Ads
  'google-display-square': { 
    aspectRatio: '1:1' as const, 
    name: 'Google Display Square',
    description: 'Square display ad',
    dimensions: '1200x1200',
    tips: 'Clear branding, simple message'
  },
  'google-display-landscape': { 
    aspectRatio: '16:9' as const, 
    name: 'Google Display Landscape',
    description: 'Landscape display ad',
    dimensions: '1200x628',
    tips: 'Works across most placements'
  },
  'google-display-portrait': { 
    aspectRatio: '9:16' as const, 
    name: 'Google Display Portrait',
    description: 'Portrait display ad',
    dimensions: '300x600',
    tips: 'Sidebar and mobile placements'
  },
  
  // WhatsApp
  'whatsapp-status': { 
    aspectRatio: '9:16' as const, 
    name: 'WhatsApp Status',
    description: 'Vertical format for WhatsApp Status',
    dimensions: '1080x1920',
    tips: 'Personal, direct communication style'
  },
  
  // Blog/Website
  'blog-featured': { 
    aspectRatio: '16:9' as const, 
    name: 'Blog Featured Image',
    description: 'Hero image for blog posts',
    dimensions: '1200x675',
    tips: 'SEO-friendly, relevant to content'
  },
  'blog-square': { 
    aspectRatio: '1:1' as const, 
    name: 'Blog Square Image',
    description: 'Square image for blog content',
    dimensions: '1200x1200',
    tips: 'Versatile, works in various layouts'
  },
  'website-hero': { 
    aspectRatio: '16:9' as const, 
    name: 'Website Hero',
    description: 'Hero section background',
    dimensions: '1920x1080',
    tips: 'High resolution, text overlay space'
  },
  
  // Email
  'email-header': { 
    aspectRatio: '3:1' as const, 
    name: 'Email Header',
    description: 'Header banner for emails',
    dimensions: '600x200',
    tips: 'Keep file size small, clear branding'
  },
  'email-hero': { 
    aspectRatio: '16:9' as const, 
    name: 'Email Hero Image',
    description: 'Main image for email campaigns',
    dimensions: '600x338',
    tips: 'Compelling, supports email message'
  },
} as const;

export type PlatformPreset = keyof typeof PLATFORM_PRESETS;

// ============================================================================
// IMAGE STYLES - Different aesthetic options
// ============================================================================
export const IMAGE_STYLES = {
  'photorealistic': {
    name: 'Photorealistic',
    description: 'Ultra-realistic photography style',
    prompt: 'photorealistic, ultra high quality, professional photography, sharp focus, natural lighting, 8K resolution'
  },
  'illustration': {
    name: 'Illustration',
    description: 'Digital illustration style',
    prompt: 'digital illustration, artistic, detailed artwork, vibrant colors, creative design'
  },
  'minimalist': {
    name: 'Minimalist',
    description: 'Clean and simple design',
    prompt: 'minimalist design, clean lines, simple composition, white space, modern aesthetic'
  },
  'vibrant': {
    name: 'Vibrant',
    description: 'Bold and colorful',
    prompt: 'vibrant colors, bold design, eye-catching, high saturation, dynamic composition'
  },
  'professional': {
    name: 'Professional',
    description: 'Corporate and business-like',
    prompt: 'professional, corporate style, clean design, business aesthetic, polished look'
  },
  'playful': {
    name: 'Playful',
    description: 'Fun and energetic',
    prompt: 'playful design, fun colors, energetic, cheerful mood, engaging visuals'
  },
  'luxury': {
    name: 'Luxury',
    description: 'Premium and elegant',
    prompt: 'luxury aesthetic, premium quality, elegant design, sophisticated, high-end feel, gold accents'
  },
  'tech': {
    name: 'Tech/Modern',
    description: 'Futuristic and technological',
    prompt: 'modern tech aesthetic, futuristic design, digital elements, sleek, innovative look'
  },
  'organic': {
    name: 'Organic/Natural',
    description: 'Natural and earthy',
    prompt: 'organic aesthetic, natural elements, earthy tones, sustainable feel, eco-friendly vibe'
  },
  'retro': {
    name: 'Retro/Vintage',
    description: 'Nostalgic vintage style',
    prompt: 'retro style, vintage aesthetic, nostalgic feel, classic design, throwback vibes'
  },
  'flat': {
    name: 'Flat Design',
    description: 'Modern flat design style',
    prompt: 'flat design, 2D graphics, bold shapes, simple icons, modern UI style'
  },
  '3d': {
    name: '3D Render',
    description: '3D rendered graphics',
    prompt: '3D render, three-dimensional, depth, realistic lighting, CGI quality'
  },
} as const;

export type ImageStyle = keyof typeof IMAGE_STYLES;
