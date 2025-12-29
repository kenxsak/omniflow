/**
 * Content Templates Library
 * Pre-built templates for common marketing use cases
 */

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'sales' | 'social' | 'announcement' | 'engagement';
  icon: string;
  platforms: string[];
  promptTemplate: string;
  suggestedTone: string;
  suggestedCTA?: string;
  isPremium?: boolean;
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  // Marketing Templates
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce a new product or feature with excitement',
    category: 'marketing',
    icon: 'solar:rocket-2-bold',
    platforms: ['Instagram', 'LinkedIn', 'Facebook', 'TwitterX'],
    promptTemplate: 'Create an exciting product launch announcement for [PRODUCT_NAME]. Highlight the key benefits: [KEY_BENEFITS]. Target audience: [TARGET_AUDIENCE]. Launch date: [LAUNCH_DATE].',
    suggestedTone: 'Inspirational',
    suggestedCTA: 'Learn more at our website',
  },
  {
    id: 'sale-discount',
    name: 'Sale / Discount',
    description: 'Promote a limited-time offer or discount',
    category: 'marketing',
    icon: 'solar:tag-price-bold',
    platforms: ['Instagram', 'Facebook', 'TwitterX'],
    promptTemplate: 'Create an urgent promotional post for our [DISCOUNT_PERCENTAGE]% off sale on [PRODUCT/SERVICE]. Sale ends [END_DATE]. Highlight the savings and create urgency.',
    suggestedTone: 'Urgent',
    suggestedCTA: 'Shop now before it ends!',
  },
  {
    id: 'case-study',
    name: 'Case Study / Success Story',
    description: 'Share customer success stories and results',
    category: 'marketing',
    icon: 'solar:chart-2-bold',
    platforms: ['LinkedIn', 'BlogPost'],
    promptTemplate: 'Write a compelling case study about how [CUSTOMER_NAME] achieved [RESULTS] using our [PRODUCT/SERVICE]. Include the challenge they faced, our solution, and measurable outcomes.',
    suggestedTone: 'Professional',
    suggestedCTA: 'See how we can help you too',
  },
  
  // Sales Templates
  {
    id: 'lead-magnet',
    name: 'Lead Magnet Promotion',
    description: 'Promote a free resource to capture leads',
    category: 'sales',
    icon: 'solar:magnet-bold',
    platforms: ['LinkedIn', 'Facebook', 'Instagram'],
    promptTemplate: 'Create a post promoting our free [RESOURCE_TYPE] about [TOPIC]. Highlight what readers will learn and the value they\'ll get. Make it irresistible to download.',
    suggestedTone: 'Professional',
    suggestedCTA: 'Download your free copy now',
  },
  {
    id: 'webinar-invite',
    name: 'Webinar / Event Invitation',
    description: 'Invite audience to a webinar or online event',
    category: 'sales',
    icon: 'solar:videocamera-record-bold',
    platforms: ['LinkedIn', 'Facebook', 'TwitterX'],
    promptTemplate: 'Create an invitation for our upcoming webinar: "[WEBINAR_TITLE]" on [DATE] at [TIME]. Topics covered: [TOPICS]. Speaker: [SPEAKER_NAME]. Limited spots available.',
    suggestedTone: 'Professional',
    suggestedCTA: 'Reserve your spot now',
  },
  {
    id: 'testimonial-spotlight',
    name: 'Customer Testimonial',
    description: 'Share a customer review or testimonial',
    category: 'sales',
    icon: 'solar:star-bold',
    platforms: ['Instagram', 'LinkedIn', 'Facebook'],
    promptTemplate: 'Create a post featuring this customer testimonial: "[TESTIMONIAL_QUOTE]" - [CUSTOMER_NAME], [CUSTOMER_TITLE]. Add context about what they achieved with our product.',
    suggestedTone: 'Inspirational',
    suggestedCTA: 'Join our happy customers',
  },

  // Social Engagement Templates
  {
    id: 'behind-scenes',
    name: 'Behind the Scenes',
    description: 'Show the human side of your brand',
    category: 'engagement',
    icon: 'solar:camera-bold',
    platforms: ['Instagram', 'Facebook', 'TwitterX'],
    promptTemplate: 'Create a behind-the-scenes post about [TOPIC/EVENT] at our company. Make it personal, authentic, and show our team culture. Include a fun fact or interesting detail.',
    suggestedTone: 'Casual',
  },
  {
    id: 'poll-question',
    name: 'Poll / Question',
    description: 'Engage audience with a question or poll',
    category: 'engagement',
    icon: 'solar:chat-round-dots-bold',
    platforms: ['TwitterX', 'LinkedIn', 'Instagram'],
    promptTemplate: 'Create an engaging poll/question post about [TOPIC] that will spark discussion. Make it relevant to our audience of [TARGET_AUDIENCE]. Include 2-4 answer options if it\'s a poll.',
    suggestedTone: 'Casual',
  },
  {
    id: 'tip-of-day',
    name: 'Tip of the Day',
    description: 'Share valuable tips and advice',
    category: 'engagement',
    icon: 'solar:lightbulb-bolt-bold',
    platforms: ['TwitterX', 'LinkedIn', 'Instagram'],
    promptTemplate: 'Create a valuable tip post about [TOPIC] for [TARGET_AUDIENCE]. Make it actionable and immediately useful. Format it as a quick, easy-to-digest tip.',
    suggestedTone: 'Professional',
  },

  // Announcement Templates
  {
    id: 'company-news',
    name: 'Company News / Update',
    description: 'Share important company announcements',
    category: 'announcement',
    icon: 'solar:bell-bold',
    platforms: ['LinkedIn', 'Facebook', 'TwitterX'],
    promptTemplate: 'Create a professional announcement about [NEWS/UPDATE]. Explain what this means for our customers and stakeholders. Keep it informative yet engaging.',
    suggestedTone: 'Professional',
  },
  {
    id: 'milestone-celebration',
    name: 'Milestone Celebration',
    description: 'Celebrate company or customer milestones',
    category: 'announcement',
    icon: 'solar:cup-star-bold',
    platforms: ['LinkedIn', 'Instagram', 'Facebook'],
    promptTemplate: 'Create a celebratory post about reaching [MILESTONE] (e.g., 10,000 customers, 5 years in business, $1M in sales). Thank our community and share what\'s next.',
    suggestedTone: 'Inspirational',
  },
  {
    id: 'hiring-post',
    name: 'We\'re Hiring',
    description: 'Attract talent with job announcements',
    category: 'announcement',
    icon: 'solar:users-group-rounded-bold',
    platforms: ['LinkedIn', 'TwitterX'],
    promptTemplate: 'Create an exciting job posting for [JOB_TITLE] position. Highlight our culture, benefits, and what makes this role special. Location: [LOCATION]. Key requirements: [REQUIREMENTS].',
    suggestedTone: 'Professional',
    suggestedCTA: 'Apply now or tag someone who\'d be perfect!',
  },

  // Blog Templates
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Step-by-step tutorial or guide',
    category: 'marketing',
    icon: 'solar:document-text-bold',
    platforms: ['BlogPost'],
    promptTemplate: 'Write a comprehensive how-to guide on [TOPIC]. Include step-by-step instructions, tips, common mistakes to avoid, and practical examples. Target audience: [TARGET_AUDIENCE].',
    suggestedTone: 'Professional',
    suggestedCTA: 'Try it yourself and let us know how it goes!',
  },
  {
    id: 'listicle',
    name: 'Listicle (Top X)',
    description: 'List-based article (Top 10, Best of, etc.)',
    category: 'marketing',
    icon: 'solar:list-check-bold',
    platforms: ['BlogPost'],
    promptTemplate: 'Write a listicle article: "Top [NUMBER] [TOPIC]" for [TARGET_AUDIENCE]. Include brief explanations for each item, pros/cons where relevant, and actionable takeaways.',
    suggestedTone: 'Casual',
  },
  {
    id: 'industry-trends',
    name: 'Industry Trends',
    description: 'Analysis of current industry trends',
    category: 'marketing',
    icon: 'solar:graph-up-bold',
    platforms: ['BlogPost', 'LinkedIn'],
    promptTemplate: 'Write an insightful analysis of current trends in [INDUSTRY]. Cover [NUMBER] key trends, their implications, and how businesses can adapt. Include data points where possible.',
    suggestedTone: 'Professional',
  },

  // Sales Page Templates
  {
    id: 'saas-landing',
    name: 'SaaS Product Page',
    description: 'Landing page for software products',
    category: 'sales',
    icon: 'solar:code-square-bold',
    platforms: ['SalesLandingPage'],
    promptTemplate: 'Create a high-converting landing page for [PRODUCT_NAME], a [PRODUCT_TYPE] that helps [TARGET_AUDIENCE] to [MAIN_BENEFIT]. Key features: [FEATURES]. Pricing starts at [PRICE].',
    suggestedTone: 'Professional',
    suggestedCTA: 'Start your free trial',
    isPremium: true,
  },
  {
    id: 'service-landing',
    name: 'Service Business Page',
    description: 'Landing page for service businesses',
    category: 'sales',
    icon: 'solar:hand-shake-bold',
    platforms: ['SalesLandingPage'],
    promptTemplate: 'Create a professional landing page for [BUSINESS_NAME], offering [SERVICES] to [TARGET_AUDIENCE]. Highlight our expertise, process, and results. Include testimonials section.',
    suggestedTone: 'Professional',
    suggestedCTA: 'Book a free consultation',
    isPremium: true,
  },
  {
    id: 'course-landing',
    name: 'Online Course Page',
    description: 'Landing page for courses or training',
    category: 'sales',
    icon: 'solar:square-academic-cap-bold',
    platforms: ['SalesLandingPage'],
    promptTemplate: 'Create a compelling landing page for our online course: "[COURSE_NAME]". Students will learn [LEARNING_OUTCOMES]. Instructor: [INSTRUCTOR]. Price: [PRICE]. Include curriculum outline.',
    suggestedTone: 'Inspirational',
    suggestedCTA: 'Enroll now and transform your skills',
    isPremium: true,
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: 'solar:widget-5-bold' },
  { id: 'marketing', name: 'Marketing', icon: 'solar:graph-up-bold' },
  { id: 'sales', name: 'Sales', icon: 'solar:tag-price-bold' },
  { id: 'engagement', name: 'Engagement', icon: 'solar:chat-round-dots-bold' },
  { id: 'announcement', name: 'Announcements', icon: 'solar:bell-bold' },
];

/**
 * Image Style Presets for AI Image Generation
 */
export interface ImageStylePreset {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  icon: string;
  category: 'photo' | 'illustration' | '3d' | 'artistic' | 'marketing';
  isPremium?: boolean;
}

export const IMAGE_STYLE_PRESETS: ImageStylePreset[] = [
  // Photography Styles
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Ultra-realistic photography style',
    promptSuffix: ', photorealistic, high resolution, professional photography, sharp focus, natural lighting, 8K quality',
    icon: 'solar:camera-bold',
    category: 'photo',
  },
  {
    id: 'product-photo',
    name: 'Product Photography',
    description: 'Clean product shots on white/gradient background',
    promptSuffix: ', professional product photography, clean white background, soft studio lighting, high-end commercial photography, sharp details',
    icon: 'solar:box-bold',
    category: 'photo',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Photography',
    description: 'Natural, candid lifestyle shots',
    promptSuffix: ', lifestyle photography, natural lighting, candid moment, warm tones, authentic feel, editorial style',
    icon: 'solar:users-group-rounded-bold',
    category: 'photo',
  },
  {
    id: 'aerial',
    name: 'Aerial / Drone',
    description: 'Bird\'s eye view perspective',
    promptSuffix: ', aerial photography, drone shot, bird\'s eye view, dramatic perspective, high altitude, cinematic',
    icon: 'solar:map-arrow-up-bold',
    category: 'photo',
  },

  // Illustration Styles
  {
    id: 'flat-illustration',
    name: 'Flat Illustration',
    description: 'Modern flat design illustration',
    promptSuffix: ', flat design illustration, vector art style, clean lines, bold colors, minimalist, modern graphic design',
    icon: 'solar:pallete-2-bold',
    category: 'illustration',
  },
  {
    id: 'isometric',
    name: 'Isometric',
    description: '3D isometric illustration style',
    promptSuffix: ', isometric illustration, 3D isometric view, clean geometric shapes, vibrant colors, tech illustration style',
    icon: 'solar:box-minimalistic-bold',
    category: 'illustration',
  },
  {
    id: 'hand-drawn',
    name: 'Hand Drawn',
    description: 'Sketchy, hand-drawn aesthetic',
    promptSuffix: ', hand-drawn illustration, sketch style, pencil texture, artistic, whimsical, organic lines',
    icon: 'solar:pen-bold',
    category: 'illustration',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft watercolor painting style',
    promptSuffix: ', watercolor painting, soft edges, flowing colors, artistic, delicate, painterly texture',
    icon: 'solar:paint-roller-bold',
    category: 'illustration',
  },

  // 3D Styles
  {
    id: '3d-render',
    name: '3D Render',
    description: 'Clean 3D rendered graphics',
    promptSuffix: ', 3D render, CGI, clean 3D graphics, soft shadows, studio lighting, octane render quality',
    icon: 'solar:cube-bold',
    category: '3d',
  },
  {
    id: 'clay-render',
    name: 'Clay / Soft 3D',
    description: 'Soft, clay-like 3D style',
    promptSuffix: ', clay render, soft 3D, matte material, pastel colors, rounded shapes, playful 3D illustration',
    icon: 'solar:shapes-bold',
    category: '3d',
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass 3D effect',
    promptSuffix: ', glassmorphism, frosted glass effect, translucent materials, soft gradients, modern UI style, depth blur',
    icon: 'solar:window-frame-bold',
    category: '3d',
  },

  // Artistic Styles
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, minimal aesthetic',
    promptSuffix: ', minimalist design, clean composition, lots of white space, simple shapes, elegant, less is more',
    icon: 'solar:minimize-square-bold',
    category: 'artistic',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon / Cyberpunk',
    description: 'Vibrant neon and cyberpunk vibes',
    promptSuffix: ', neon lights, cyberpunk aesthetic, vibrant colors, dark background, futuristic, glowing effects',
    icon: 'solar:bolt-bold',
    category: 'artistic',
    isPremium: true,
  },
  {
    id: 'vintage-retro',
    name: 'Vintage / Retro',
    description: 'Nostalgic retro aesthetic',
    promptSuffix: ', vintage style, retro aesthetic, film grain, muted colors, nostalgic, 70s/80s inspired',
    icon: 'solar:clock-circle-bold',
    category: 'artistic',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Abstract artistic interpretation',
    promptSuffix: ', abstract art, artistic interpretation, bold shapes, creative composition, modern art style',
    icon: 'solar:atom-bold',
    category: 'artistic',
  },

  // Marketing Specific
  {
    id: 'social-media',
    name: 'Social Media Ready',
    description: 'Optimized for social media posts',
    promptSuffix: ', social media style, eye-catching, vibrant colors, bold composition, scroll-stopping, engaging visual',
    icon: 'solar:share-bold',
    category: 'marketing',
  },
  {
    id: 'hero-banner',
    name: 'Hero Banner',
    description: 'Website hero section imagery',
    promptSuffix: ', hero banner style, wide composition, space for text overlay, professional, impactful, website header',
    icon: 'solar:monitor-bold',
    category: 'marketing',
  },
  {
    id: 'infographic',
    name: 'Infographic Style',
    description: 'Data visualization aesthetic',
    promptSuffix: ', infographic style, data visualization, clean icons, organized layout, informative design, professional',
    icon: 'solar:chart-bold',
    category: 'marketing',
  },
  {
    id: 'thumbnail',
    name: 'YouTube Thumbnail',
    description: 'Bold, attention-grabbing thumbnails',
    promptSuffix: ', YouTube thumbnail style, bold text-friendly, high contrast, attention-grabbing, expressive, 16:9 aspect ratio',
    icon: 'solar:play-bold',
    category: 'marketing',
  },
];

export const IMAGE_STYLE_CATEGORIES = [
  { id: 'all', name: 'All Styles', icon: 'solar:widget-5-bold' },
  { id: 'photo', name: 'Photography', icon: 'solar:camera-bold' },
  { id: 'illustration', name: 'Illustration', icon: 'solar:pallete-2-bold' },
  { id: '3d', name: '3D & Render', icon: 'solar:cube-bold' },
  { id: 'artistic', name: 'Artistic', icon: 'solar:magic-stick-3-bold' },
  { id: 'marketing', name: 'Marketing', icon: 'solar:graph-up-bold' },
];
