# Implementation Tasks: OmniFlow Complete Website

## Overview

This task list implements a complete, SEO-optimized website for OmniFlow that will outrank Indian and global competitors. The implementation is divided into 5 phases over 8 weeks.

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Shared Components

- [ ] 1.1.1 Create `src/components/website/hero-section.tsx`
  - Support variants: home, feature, industry, comparison, blog
  - Props: badge, headline, subheadline, CTAs, image/video
  - Responsive design, mobile-first
  - _Priority: High_

- [ ] 1.1.2 Create `src/components/website/trust-bar.tsx`
  - Customer logos carousel
  - Rating badges (G2, Capterra placeholders)
  - "Trusted by X businesses" text
  - _Priority: High_

- [ ] 1.1.3 Create `src/components/website/cta-section.tsx`
  - Variants: primary, secondary, dark background
  - Props: headline, subheadline, primaryCta, secondaryCta
  - Trust indicators option
  - _Priority: High_

- [ ] 1.1.4 Create `src/components/website/faq-section.tsx`
  - Accordion component
  - FAQ schema markup integration
  - Props: title, faqs array, showSchema
  - _Priority: High_

- [ ] 1.1.5 Create `src/components/website/comparison-table.tsx`
  - Feature comparison with checkmarks/text
  - Highlight rows option
  - Mobile-responsive (horizontal scroll or stacked)
  - _Priority: High_

- [ ] 1.1.6 Create `src/components/website/feature-grid.tsx`
  - 3-column grid of feature cards
  - Icon, title, description, link
  - Hover effects
  - _Priority: Medium_

- [ ] 1.1.7 Create `src/components/website/testimonial-card.tsx`
  - Quote, author, company, metric badge
  - Star rating
  - Optional photo
  - _Priority: Medium_

- [ ] 1.1.8 Create `src/components/website/how-it-works.tsx`
  - 3-step horizontal layout
  - Step number, icon, title, description
  - Connecting lines/arrows
  - _Priority: Medium_

- [ ] 1.1.9 Create `src/components/website/stats-section.tsx`
  - Key metrics display (e.g., "1000+ businesses")
  - Animated counters option
  - _Priority: Low_

- [ ] 1.1.10 Create `src/components/website/breadcrumb.tsx`
  - Navigation breadcrumb
  - Schema markup for BreadcrumbList
  - _Priority: Medium_

### 1.2 SEO Infrastructure

- [ ] 1.2.1 Create `src/app/sitemap.ts`
  - Dynamic sitemap generation
  - Include all static pages
  - Include dynamic pages (features, comparisons, blog)
  - Set priorities and lastModified dates
  - _Priority: High_

- [ ] 1.2.2 Create `src/app/robots.ts`
  - Allow all crawlers
  - Disallow /dashboard, /api, /settings
  - Point to sitemap
  - _Priority: High_

- [ ] 1.2.3 Create `src/components/website/schema-markup.tsx`
  - OrganizationSchema component
  - ProductSchema component
  - FAQSchema component
  - ArticleSchema component
  - BreadcrumbSchema component
  - _Priority: High_

- [ ] 1.2.4 Create `src/lib/seo-utils.ts`
  - generateMetadata helper function
  - Canonical URL generator
  - OG image URL generator
  - _Priority: High_

### 1.3 Content Data Structure

- [ ] 1.3.1 Create `src/lib/content/features.ts`
  - Define FeaturePage interface
  - Add data for 10 feature pages
  - Include SEO metadata for each
  - _Priority: High_

- [ ] 1.3.2 Create `src/lib/content/comparisons.ts`
  - Define ComparisonPage interface
  - Add data for 6 comparison pages
  - Include feature comparison tables
  - _Priority: High_

- [ ] 1.3.3 Create `src/lib/content/industries.ts`
  - Define IndustryPage interface
  - Add data for 6 industry pages
  - Include industry-specific pain points
  - _Priority: Medium_

- [ ] 1.3.4 Create `src/lib/content/blog-posts.ts`
  - Define BlogPost interface
  - Add metadata for initial 10 posts
  - _Priority: Medium_

---

## Phase 2: Core Pages (Week 3-4)

### 2.1 Home Page Redesign

- [ ] 2.1.1 Convert home page to Server Component
  - Remove "use client" directive
  - Move interactive parts to client components
  - Ensure SSR for SEO
  - _Priority: Critical_

- [ ] 2.1.2 Redesign hero section
  - Add product screenshot/mockup
  - Improve headline for India focus
  - Add trust indicators below CTA
  - _Priority: High_

- [ ] 2.1.3 Add trust bar section
  - Customer logos (placeholder if needed)
  - Rating badges
  - "Trusted by X businesses" text
  - _Priority: High_

- [ ] 2.1.4 Improve features section
  - Use new feature-grid component
  - Link to individual feature pages
  - Better visual hierarchy
  - _Priority: Medium_

- [ ] 2.1.5 Add "How It Works" section
  - 3 simple steps
  - Visual flow
  - _Priority: Medium_

- [ ] 2.1.6 Improve testimonials section
  - Use new testimonial-card component
  - Add video testimonial placeholder
  - _Priority: Medium_

- [ ] 2.1.7 Add schema markup to home page
  - Organization schema
  - Product schema
  - FAQ schema
  - _Priority: High_

### 2.2 Pricing Page

- [ ] 2.2.1 Create `src/app/(public)/pricing/page.tsx`
  - Server-side rendered
  - Dedicated URL for SEO
  - _Priority: High_

- [ ] 2.2.2 Add pricing page content
  - Hero section
  - Plan cards (reuse PricingSection)
  - Feature comparison table
  - FAQ section
  - "What competitors charge" section
  - _Priority: High_

- [ ] 2.2.3 Add pricing page SEO
  - Meta tags for "marketing automation pricing"
  - Product schema with offers
  - FAQ schema
  - _Priority: High_

### 2.3 Features Overview Page

- [ ] 2.3.1 Create `src/app/(public)/features/page.tsx`
  - Server-side rendered
  - Overview of all features
  - _Priority: High_

- [ ] 2.3.2 Add features overview content
  - Hero section
  - Feature grid with all 10 features
  - Integration logos
  - CTA section
  - _Priority: High_

### 2.4 About Page

- [ ] 2.4.1 Create `src/app/(public)/about/page.tsx`
  - Company story
  - Mission & vision
  - Team section (placeholder)
  - Values
  - _Priority: Medium_

### 2.5 Contact Page

- [ ] 2.5.1 Create `src/app/(public)/contact/page.tsx`
  - Contact form
  - Email addresses
  - Phone number
  - WhatsApp button
  - Office address
  - _Priority: Medium_

---

## Phase 3: SEO Pages (Week 5-6)

### 3.1 Feature Detail Pages

- [ ] 3.1.1 Create `src/app/(public)/features/[slug]/page.tsx`
  - Dynamic route for feature pages
  - Server-side rendered
  - generateStaticParams for all features
  - _Priority: High_

- [ ] 3.1.2 Implement feature page template
  - Hero with feature name
  - Problem statement
  - Capabilities grid
  - How it works
  - Comparison section
  - Related features
  - CTA
  - _Priority: High_

- [ ] 3.1.3 Add SEO for feature pages
  - Dynamic meta tags from content data
  - HowTo schema where applicable
  - Breadcrumb schema
  - _Priority: High_

### 3.2 Comparison Pages

- [ ] 3.2.1 Create `src/app/(public)/compare/page.tsx`
  - Overview of all comparisons
  - _Priority: Medium_

- [ ] 3.2.2 Create `src/app/(public)/compare/[slug]/page.tsx`
  - Dynamic route for comparison pages
  - Server-side rendered
  - generateStaticParams for all comparisons
  - _Priority: High_

- [ ] 3.2.3 Implement comparison page template
  - Hero with competitor name
  - Quick verdict box
  - Feature comparison table
  - Pricing comparison
  - Pros/cons
  - Migration guide
  - CTA
  - _Priority: High_

- [ ] 3.2.4 Add SEO for comparison pages
  - Target "[competitor] alternative" keywords
  - Comparison schema
  - FAQ schema
  - _Priority: High_

### 3.3 Industry Pages

- [ ] 3.3.1 Create `src/app/(public)/industries/page.tsx`
  - Overview of all industries
  - _Priority: Medium_

- [ ] 3.3.2 Create `src/app/(public)/industries/[slug]/page.tsx`
  - Dynamic route for industry pages
  - Server-side rendered
  - generateStaticParams for all industries
  - _Priority: Medium_

- [ ] 3.3.3 Implement industry page template
  - Hero with industry name
  - Pain points
  - Solutions
  - Industry-specific features
  - Testimonial
  - CTA
  - _Priority: Medium_

- [ ] 3.3.4 Add SEO for industry pages
  - Target industry-specific keywords
  - LocalBusiness schema where applicable
  - _Priority: Medium_

---

## Phase 4: Blog & Resources (Week 7)

### 4.1 Blog Infrastructure

- [ ] 4.1.1 Create `src/app/(public)/blog/page.tsx`
  - Blog listing page
  - Category filters
  - Search (optional)
  - Pagination
  - _Priority: Medium_

- [ ] 4.1.2 Create `src/app/(public)/blog/[slug]/page.tsx`
  - Individual blog post page
  - MDX support for content
  - Author info
  - Related posts
  - _Priority: Medium_

- [ ] 4.1.3 Add blog SEO
  - Article schema
  - Author schema
  - Breadcrumb schema
  - _Priority: Medium_

### 4.2 Initial Blog Content

- [ ] 4.2.1 Write blog post: "How to Automate WhatsApp Marketing in India"
  - Target: "whatsapp marketing automation india"
  - 2000+ words, comprehensive guide
  - _Priority: High_

- [ ] 4.2.2 Write blog post: "Best CRM for Small Business in India 2025"
  - Target: "best crm for small business india"
  - Comparison of top 10 CRMs
  - _Priority: High_

- [ ] 4.2.3 Write blog post: "HubSpot vs OmniFlow: Complete Comparison"
  - Target: "hubspot alternative india"
  - Detailed feature comparison
  - _Priority: High_

- [ ] 4.2.4 Write 7 more blog posts
  - Topics from requirements doc
  - SEO-optimized
  - _Priority: Medium_

### 4.3 Resources Section

- [ ] 4.3.1 Create `src/app/(public)/resources/page.tsx`
  - Resources hub
  - Links to guides, tools, templates
  - _Priority: Low_

- [ ] 4.3.2 Create ROI Calculator
  - Interactive tool
  - Calculate savings vs competitors
  - Lead capture
  - _Priority: Low_

---

## Phase 5: Optimization (Week 8)

### 5.1 Visual Assets

- [ ] 5.1.1 Add product screenshots
  - Dashboard screenshot
  - Feature screenshots
  - Optimize for web (WebP)
  - _Priority: High_

- [ ] 5.1.2 Create OG images
  - Default OG image
  - Page-specific OG images
  - _Priority: Medium_

- [ ] 5.1.3 Add customer logos
  - Placeholder logos if needed
  - Trust bar integration
  - _Priority: Medium_

### 5.2 Performance Optimization

- [ ] 5.2.1 Audit Core Web Vitals
  - Run Lighthouse tests
  - Identify issues
  - _Priority: High_

- [ ] 5.2.2 Optimize images
  - Use Next.js Image component
  - Lazy loading
  - Proper sizing
  - _Priority: High_

- [ ] 5.2.3 Optimize fonts
  - Preload critical fonts
  - Font display swap
  - _Priority: Medium_

- [ ] 5.2.4 Code splitting
  - Dynamic imports for heavy components
  - Reduce initial bundle size
  - _Priority: Medium_

### 5.3 Conversion Optimization

- [ ] 5.3.1 Add sticky header CTA
  - Show "Start Free Trial" on scroll
  - _Priority: Medium_

- [ ] 5.3.2 Add exit intent popup
  - Offer lead magnet or discount
  - _Priority: Low_

- [ ] 5.3.3 Add live chat widget
  - Crisp or Intercom integration
  - _Priority: Low_

### 5.4 Launch Checklist

- [ ] 5.4.1 Submit sitemap to Google Search Console
  - Verify ownership
  - Submit sitemap.xml
  - _Priority: High_

- [ ] 5.4.2 Submit to Bing Webmaster Tools
  - Verify ownership
  - Submit sitemap
  - _Priority: Medium_

- [ ] 5.4.3 Set up Google Analytics 4
  - Track page views
  - Track conversions
  - _Priority: High_

- [ ] 5.4.4 Test all pages
  - Mobile responsiveness
  - Dark/light mode
  - All links working
  - _Priority: High_

---

## Success Criteria

### SEO Metrics (3-month targets)
- [ ] Organic traffic: 5,000 visitors/month
- [ ] Top 10 rankings for 20 target keywords
- [ ] Domain authority: 25+
- [ ] 100+ backlinks

### Conversion Metrics
- [ ] Homepage → Signup: 5%+
- [ ] Pricing page → Signup: 10%+
- [ ] Bounce rate: < 50%

### Technical Metrics
- [ ] Lighthouse score: 90+
- [ ] Core Web Vitals: All green
- [ ] Mobile-friendly: 100%

---

## Notes

- All public pages must be Server Components (SSR) for SEO
- Use the shared component library for consistency
- Follow the semantic color system established in the dashboard
- Test all pages in both light and dark modes
- Ensure WCAG 2.1 AA accessibility compliance
- Content should be written in simple language for non-tech users
