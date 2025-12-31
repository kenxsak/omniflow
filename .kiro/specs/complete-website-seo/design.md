# Design Document: OmniFlow Complete Website

## Architecture Overview

### File Structure

```
src/app/
├── (public)/                    # Public marketing pages (SSR)
│   ├── layout.tsx              # Public layout with navbar/footer
│   ├── page.tsx                # Home page (redesigned)
│   ├── pricing/
│   │   └── page.tsx            # Dedicated pricing page
│   ├── features/
│   │   ├── page.tsx            # Features overview
│   │   ├── [slug]/
│   │   │   └── page.tsx        # Individual feature pages
│   ├── industries/
│   │   ├── page.tsx            # Industries overview
│   │   ├── [slug]/
│   │   │   └── page.tsx        # Individual industry pages
│   ├── compare/
│   │   ├── page.tsx            # Comparison overview
│   │   ├── [slug]/
│   │   │   └── page.tsx        # Individual comparison pages
│   ├── use-cases/
│   │   ├── [slug]/
│   │   │   └── page.tsx        # Use case pages
│   ├── blog/
│   │   ├── page.tsx            # Blog listing
│   │   ├── [slug]/
│   │   │   └── page.tsx        # Blog post pages
│   ├── about/
│   │   └── page.tsx            # About page
│   ├── contact/
│   │   └── page.tsx            # Contact page
│   ├── resources/
│   │   ├── page.tsx            # Resources hub
│   │   ├── roi-calculator/
│   │   │   └── page.tsx        # Interactive calculator
│   ├── privacy/
│   │   └── page.tsx            # Privacy policy
│   ├── terms/
│   │   └── page.tsx            # Terms of service
│   └── security/
│       └── page.tsx            # Security page
├── sitemap.ts                   # Dynamic sitemap
├── robots.ts                    # Robots.txt
└── (dashboard)/                 # Existing dashboard (unchanged)
```

### Data Structure

```typescript
// src/lib/website-content.ts

// Feature page data
export interface FeaturePage {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  heroHeadline: string;
  heroSubheadline: string;
  problemStatement: string;
  capabilities: string[];
  benefits: string[];
  comparisonWith: string[];
  relatedFeatures: string[];
  ctaText: string;
}

// Industry page data
export interface IndustryPage {
  slug: string;
  industry: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  painPoints: string[];
  solutions: string[];
  features: string[];
  testimonial?: {
    quote: string;
    author: string;
    company: string;
    metric: string;
  };
}

// Comparison page data
export interface ComparisonPage {
  slug: string;
  competitor: string;
  competitorLogo?: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  verdict: string;
  featureComparison: {
    feature: string;
    omniflow: string | boolean;
    competitor: string | boolean;
  }[];
  pricingComparison: {
    plan: string;
    omniflow: string;
    competitor: string;
  }[];
  prosOmniflow: string[];
  prosCompetitor: string[];
  consOmniflow: string[];
  consCompetitor: string[];
}

// Blog post data
export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  category: 'how-to' | 'comparison' | 'industry' | 'product' | 'case-study';
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  content: string; // MDX content
  relatedPosts: string[];
}
```

---

## Component Library

### Shared Components

```
src/components/website/
├── hero-section.tsx            # Reusable hero with variants
├── feature-grid.tsx            # Feature cards grid
├── comparison-table.tsx        # Feature comparison table
├── pricing-preview.tsx         # Pricing cards preview
├── testimonial-card.tsx        # Customer testimonial
├── testimonial-carousel.tsx    # Multiple testimonials
├── trust-bar.tsx               # Customer logos bar
├── cta-section.tsx             # Call-to-action sections
├── faq-section.tsx             # FAQ accordion
├── stats-section.tsx           # Key metrics display
├── how-it-works.tsx            # Step-by-step section
├── industry-card.tsx           # Industry page card
├── blog-card.tsx               # Blog post preview card
├── breadcrumb.tsx              # Navigation breadcrumb
├── table-of-contents.tsx       # For long pages
├── schema-markup.tsx           # JSON-LD schema components
└── sticky-cta.tsx              # Sticky header CTA
```

### Component Specifications

#### 1. HeroSection

```typescript
interface HeroSectionProps {
  variant: 'home' | 'feature' | 'industry' | 'comparison' | 'blog';
  badge?: string;
  headline: string;
  subheadline: string;
  primaryCta: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  image?: string;
  video?: string;
  trustIndicators?: boolean;
}
```

#### 2. ComparisonTable

```typescript
interface ComparisonTableProps {
  features: {
    category: string;
    items: {
      name: string;
      omniflow: string | boolean;
      competitor: string | boolean;
      highlight?: boolean;
    }[];
  }[];
  competitorName: string;
  competitorLogo?: string;
}
```

#### 3. FAQSection

```typescript
interface FAQSectionProps {
  title?: string;
  faqs: {
    question: string;
    answer: string;
  }[];
  schema?: boolean; // Add FAQ schema markup
}
```

---

## Page Templates

### Template 1: Feature Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Features > CRM]                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Badge: AI-Powered]                                        │
│                                                             │
│  # Smart CRM for Growing Businesses                         │
│                                                             │
│  Manage leads, track deals, and close more sales            │
│  with AI-powered insights.                                  │
│                                                             │
│  [Start Free Trial]  [Watch Demo]                           │
│                                                             │
│  [Product Screenshot]                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## The Problem                                             │
│  [Pain point description with statistics]                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Key Capabilities                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ Feature │ │ Feature │ │ Feature │                       │
│  │   1     │ │   2     │ │   3     │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## How It Works                                            │
│  [Step 1] → [Step 2] → [Step 3]                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## OmniFlow vs Alternatives                                │
│  [Comparison table with competitors]                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Pricing                                                 │
│  [Feature included in: Starter, Pro, Enterprise]            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Related Features                                        │
│  [Card] [Card] [Card]                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Ready to Get Started?                                   │
│  [CTA Section]                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Template 2: Comparison Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Compare > HubSpot]                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  # OmniFlow vs HubSpot: Complete Comparison 2025            │
│                                                             │
│  Last updated: January 2025                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Quick Verdict:                                       │   │
│  │ Choose OmniFlow if you want 90% cost savings with    │   │
│  │ similar features. Choose HubSpot if you need         │   │
│  │ enterprise-grade support and integrations.           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Feature Comparison                                      │
│  ┌──────────────┬───────────┬───────────┐                  │
│  │ Feature      │ OmniFlow  │ HubSpot   │                  │
│  ├──────────────┼───────────┼───────────┤                  │
│  │ CRM          │ ✓         │ ✓         │                  │
│  │ Email        │ ✓         │ ✓         │                  │
│  │ WhatsApp     │ ✓         │ ✗         │                  │
│  │ AI Content   │ ✓ BYOK    │ Limited   │                  │
│  └──────────────┴───────────┴───────────┘                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Pricing Comparison                                      │
│  [Side-by-side pricing cards]                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Pros & Cons                                             │
│  [Two-column layout]                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Who Should Choose What?                                 │
│  [Decision guide]                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Migration Guide                                         │
│  [How to switch from HubSpot to OmniFlow]                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Ready to Switch?                                        │
│  [CTA: Start Free Trial + Import from HubSpot]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Template 3: Industry Page

```
┌─────────────────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Industries > Education]                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Badge: For EdTech & Coaching]                             │
│                                                             │
│  # CRM for Coaching Institutes & EdTech                     │
│                                                             │
│  Convert more inquiries into enrollments with               │
│  AI-powered lead management and WhatsApp automation.        │
│                                                             │
│  [Start Free Trial]  [See Demo for Education]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Challenges in Education Marketing                       │
│  [Pain points specific to education industry]               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## How OmniFlow Helps                                      │
│  [Solutions mapped to pain points]                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Features for Education                                  │
│  - Lead capture from Facebook/Google ads                    │
│  - Automated WhatsApp follow-ups                            │
│  - Batch/course management                                  │
│  - Parent communication                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Success Story                                           │
│  [Testimonial from education customer]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ## Pricing for Education                                   │
│  [Special pricing or features for education]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## SEO Implementation

### Schema Markup Strategy

```typescript
// src/components/website/schema-markup.tsx

// Organization schema (site-wide)
export function OrganizationSchema() { ... }

// Product schema (home, pricing)
export function ProductSchema() { ... }

// FAQ schema (any page with FAQs)
export function FAQSchema({ faqs }: { faqs: FAQ[] }) { ... }

// Article schema (blog posts)
export function ArticleSchema({ post }: { post: BlogPost }) { ... }

// HowTo schema (feature pages)
export function HowToSchema({ steps }: { steps: Step[] }) { ... }

// Comparison schema (comparison pages)
export function ComparisonSchema({ data }: { data: ComparisonPage }) { ... }

// BreadcrumbList schema (all pages)
export function BreadcrumbSchema({ items }: { items: Breadcrumb[] }) { ... }
```

### Meta Tags Strategy

```typescript
// src/lib/seo-utils.ts

export function generateMetadata(page: PageData): Metadata {
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://app.omniflow.wmart.in${page.path}`,
      type: page.type || 'website',
      images: [page.ogImage || '/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.metaDescription,
    },
    alternates: {
      canonical: `https://app.omniflow.wmart.in${page.path}`,
    },
  };
}
```

### Sitemap Generation

```typescript
// src/app/sitemap.ts

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://app.omniflow.wmart.in';
  
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/features`, lastModified: new Date(), priority: 0.9 },
    // ... more static pages
  ];
  
  // Dynamic feature pages
  const featurePages = FEATURES.map(f => ({
    url: `${baseUrl}/features/${f.slug}`,
    lastModified: new Date(),
    priority: 0.8,
  }));
  
  // Dynamic comparison pages
  const comparisonPages = COMPARISONS.map(c => ({
    url: `${baseUrl}/compare/${c.slug}`,
    lastModified: new Date(),
    priority: 0.8,
  }));
  
  // Blog posts
  const blogPosts = await getBlogPosts();
  const blogPages = blogPosts.map(p => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.publishedAt),
    priority: 0.7,
  }));
  
  return [...staticPages, ...featurePages, ...comparisonPages, ...blogPages];
}
```

---

## Content Data

### Feature Pages Content

```typescript
// src/lib/content/features.ts

export const FEATURES: FeaturePage[] = [
  {
    slug: 'crm',
    title: 'CRM & Lead Management',
    metaTitle: 'AI-Powered CRM for Small Business India | OmniFlow',
    metaDescription: 'Manage leads, track deals, and close more sales with OmniFlow CRM. Free for small teams. WhatsApp integration included. Start free trial.',
    keywords: ['crm for small business india', 'lead management software', 'sales crm'],
    heroHeadline: 'Smart CRM That Helps You Close More Deals',
    heroSubheadline: 'AI-powered lead scoring, automated follow-ups, and WhatsApp integration — all in one place.',
    problemStatement: 'Indian SMEs lose 60% of leads due to poor follow-up...',
    capabilities: [
      'Contact & company management',
      'Deal pipeline with drag-and-drop',
      'AI lead scoring',
      'Activity tracking',
      'Custom fields & tags',
      'Import from Excel/CSV',
    ],
    benefits: [
      'Never miss a follow-up',
      'Know which leads to prioritize',
      'Track team performance',
    ],
    comparisonWith: ['hubspot', 'zoho', 'freshsales'],
    relatedFeatures: ['email-marketing', 'whatsapp', 'automation'],
    ctaText: 'Start Managing Leads Free',
  },
  // ... more features
];
```

### Comparison Pages Content

```typescript
// src/lib/content/comparisons.ts

export const COMPARISONS: ComparisonPage[] = [
  {
    slug: 'hubspot',
    competitor: 'HubSpot',
    metaTitle: 'OmniFlow vs HubSpot 2025: Complete Comparison | Save 90%',
    metaDescription: 'Compare OmniFlow vs HubSpot features, pricing, and capabilities. See why Indian businesses choose OmniFlow and save $500+/month.',
    keywords: ['hubspot alternative', 'hubspot vs omniflow', 'hubspot alternative india'],
    verdict: 'Choose OmniFlow if you want 90% cost savings with similar features and better WhatsApp integration. Choose HubSpot if you need enterprise-grade support and 1000+ integrations.',
    featureComparison: [
      { feature: 'CRM', omniflow: true, competitor: true },
      { feature: 'Email Marketing', omniflow: true, competitor: true },
      { feature: 'WhatsApp Integration', omniflow: 'Native', competitor: 'Third-party' },
      { feature: 'AI Content Generation', omniflow: 'Unlimited (BYOK)', competitor: 'Limited' },
      { feature: 'SMS Marketing', omniflow: true, competitor: 'Add-on' },
      { feature: 'Digital Business Cards', omniflow: 'FREE', competitor: false },
      { feature: 'Landing Pages', omniflow: true, competitor: true },
      { feature: 'India Pricing', omniflow: '₹ Optimized', competitor: 'USD Only' },
    ],
    pricingComparison: [
      { plan: 'Starter', omniflow: '$29/mo', competitor: '$50/mo' },
      { plan: 'Professional', omniflow: '$99/mo', competitor: '$890/mo' },
      { plan: 'Enterprise', omniflow: '$249/mo', competitor: '$3,600/mo' },
    ],
    prosOmniflow: [
      '90% cheaper than HubSpot',
      'Native WhatsApp integration',
      'Unlimited AI with BYOK',
      'India-optimized pricing',
      'All features in one platform',
    ],
    prosCompetitor: [
      'Market leader with proven track record',
      '1000+ integrations',
      'Enterprise-grade support',
      'Extensive training resources',
    ],
    consOmniflow: [
      'Newer platform',
      'Fewer integrations',
      'Smaller community',
    ],
    consCompetitor: [
      'Very expensive',
      'Complex pricing',
      'Features spread across hubs',
      'No native WhatsApp',
    ],
  },
  // ... more comparisons
];
```

---

## Performance Requirements

### Core Web Vitals Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | TBD |
| FID (First Input Delay) | < 100ms | TBD |
| CLS (Cumulative Layout Shift) | < 0.1 | TBD |
| TTFB (Time to First Byte) | < 600ms | TBD |

### Optimization Strategies

1. **Server-Side Rendering**: All public pages SSR
2. **Image Optimization**: Next.js Image component, WebP format
3. **Code Splitting**: Dynamic imports for heavy components
4. **Font Optimization**: Preload critical fonts
5. **Caching**: Aggressive caching for static content

---

## Implementation Priority

### Phase 1: Foundation (High Priority)
1. Create shared components (hero, CTA, FAQ, etc.)
2. Set up SSR for public pages
3. Create sitemap.ts and robots.ts
4. Implement schema markup components

### Phase 2: Core Pages (High Priority)
1. Redesign home page
2. Create /pricing page
3. Create /features overview
4. Create /about and /contact

### Phase 3: SEO Pages (Medium Priority)
1. Create feature detail pages (5 pages)
2. Create comparison pages (6 pages)
3. Create industry pages (6 pages)

### Phase 4: Content (Medium Priority)
1. Create blog infrastructure
2. Write initial 10 blog posts
3. Create resources section

### Phase 5: Optimization (Lower Priority)
1. Add product screenshots/videos
2. Add customer testimonials
3. Performance optimization
4. A/B testing setup
