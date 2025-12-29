"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PricingSection } from '@/components/pricing/pricing-section';
import { SupportedCurrency } from '@/lib/geo-detection';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { LayoutLines } from '@/components/ui/layout-lines';
import { Glow } from '@/components/ui/glow';
import { PublicFooter } from '@/components/layout/public-footer';

export default function HomePage() {
  const [currency, setCurrency] = useState<SupportedCurrency | undefined>(undefined);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://app.omniflow.wmart.in/#organization",
        "name": "OmniFlow",
        "url": "https://app.omniflow.wmart.in",
        "logo": {
          "@type": "ImageObject",
          "url": "https://app.omniflow.wmart.in/favicon_io/android-chrome-512x512.png",
          "width": 512,
          "height": 512
        },
        "description": "AI-powered all-in-one sales and marketing automation platform for small and medium businesses. Replace 10+ tools with one affordable solution.",
        "sameAs": [
          "https://twitter.com/omniflow",
          "https://www.linkedin.com/company/omniflow"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Support",
          "availableLanguage": ["English", "Hindi"]
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://app.omniflow.wmart.in/#product",
        "name": "OmniFlow",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": [
          {
            "@type": "Offer",
            "name": "Free Plan",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Perfect for individuals exploring AI-powered marketing",
            "availability": "https://schema.org/InStock"
          },
          {
            "@type": "Offer",
            "name": "Starter Plan",
            "price": "29",
            "priceCurrency": "USD",
            "description": "For solopreneurs and small businesses getting started",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "29",
              "priceCurrency": "USD",
              "billingDuration": "P1M"
            },
            "availability": "https://schema.org/InStock"
          },
          {
            "@type": "Offer",
            "name": "Pro Plan",
            "price": "99",
            "priceCurrency": "USD",
            "description": "For growing businesses that need powerful automation and AI",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "99",
              "priceCurrency": "USD",
              "billingDuration": "P1M"
            },
            "availability": "https://schema.org/InStock"
          },
          {
            "@type": "Offer",
            "name": "Enterprise Plan",
            "price": "249",
            "priceCurrency": "USD",
            "description": "For large organizations needing advanced features and support",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "249",
              "priceCurrency": "USD",
              "billingDuration": "P1M"
            },
            "availability": "https://schema.org/InStock"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "500",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "AI-powered CRM and lead management",
          "Multi-channel marketing automation (Email, SMS, WhatsApp)",
          "AI content generation (blogs, emails, social posts, images)",
          "Digital business cards with AI voice chatbot",
          "Landing pages with AI content generation and Clone from Reference",
          "Advanced analytics and reporting",
          "Campaign automation and workflow builder",
          "Email marketing with segmentation",
          "WhatsApp Business API integration",
          "SMS marketing campaigns",
          "AI Ads Manager for Meta and Google Ads",
          "Social media content creation and scheduling",
          "Content Hub and blog management",
          "Appointment scheduling with automated reminders",
          "Task and activity management",
          "Enterprise team collaboration with lead claiming",
          "Audit trail and compliance tracking",
          "Support for teams up to 50 members",
          "Enterprise-grade security with role-based access"
        ],
        "description": "OmniFlow is an all-in-one AI-powered sales and marketing automation platform designed for SMEs. Replaces 10+ tools including CRM, email marketing, SMS, WhatsApp, AI content, digital cards, appointment scheduling, task management, and enterprise team collaboration. Features include AI content generation with BYOK unlimited usage, zero-markup messaging, multi-channel marketing, and advanced analytics. Pricing from $29/month.",
        "screenshot": "https://app.omniflow.wmart.in/favicon_io/android-chrome-512x512.png"
      },
      {
        "@type": "WebSite",
        "@id": "https://app.omniflow.wmart.in/#website",
        "url": "https://app.omniflow.wmart.in",
        "name": "OmniFlow - AI Marketing Automation Platform",
        "publisher": {
          "@id": "https://app.omniflow.wmart.in/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://app.omniflow.wmart.in/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How much does OmniFlow cost compared to other tools?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "OmniFlow costs $29-$249/month for all features, replacing tools that would cost $2,000-$3,500/month (HubSpot $800, Mailchimp $300, Zapier $240, and others). This represents a 90-95% cost reduction while providing more AI-powered features."
            }
          },
          {
            "@type": "Question",
            "name": "What tools does OmniFlow replace?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "OmniFlow replaces 12+ tools today: HubSpot CRM, Mailchimp (3 providers: Brevo, Sender.net, or any SMTP server), Twilio/MSG91, WATI/AiSensy, Jasper AI, Canva, HiHello digital cards, Calendly appointment booking, Todoist task management, Unbounce/Leadpages landing pages, Buffer/Hootsuite social media management, and enterprise team collaboration tools."
            }
          },
          {
            "@type": "Question",
            "name": "Does OmniFlow support WhatsApp marketing in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! OmniFlow integrates with MSG91 and Fast2SMS WhatsApp APIs specifically for Indian businesses, offering zero-markup pricing at ₹0.785 per message. We handle TRAI DLT compliance and Meta-approved templates."
            }
          },
          {
            "@type": "Question",
            "name": "How does the AI content generation work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "OmniFlow uses Google Gemini 2.0 Flash for text generation and Nana Banana (Gemini's viral image generator) for images. Simply describe what you need in plain English, and our AI creates blogs, emails, social posts, ad copy, and marketing images in seconds. It's 10x faster than manual creation."
            }
          },
          {
            "@type": "Question",
            "name": "Is there a free trial?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! OmniFlow offers a 14-day free trial with full access to all features. No credit card required, cancel anytime. We also have a forever-free plan with limited features for individuals."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Header - Fixed Navbar */}
      <PublicNavbar />
      
      {/* Layout Lines - Animated vertical lines */}
      <LayoutLines />
      
      <div className="bg-background text-foreground min-h-screen pt-14 sm:pt-16 relative">
      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 px-4 overflow-hidden line-b">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-0"></div>
          <Glow variant="top" className="opacity-30" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              <Badge variant="outline" className="text-base px-4 py-2 border-2 border-primary/50 bg-primary/10">
                <Icon icon="solar:stars-bold" className="w-4 h-4 mr-2 inline" />
                AI-First Sales & Marketing Automation for SMEs
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                Stop Juggling 10 Tools.
                <br />
                Start Growing Your Business.
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                OmniFlow is the <span className="font-semibold text-foreground">all-in-one AI-powered platform</span> that replaces CRM, email, SMS, WhatsApp, AI content tools, and more — at <span className="font-semibold text-primary">1/3rd the cost</span> with zero messaging markups.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/signup">
                    Start Free 14-Day Trial <Icon icon="solar:arrow-right-linear" className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                  <Link href="#demo">
                    Watch Demo <Icon icon="solar:play-circle-bold" className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Digital Card Highlight Banner */}
              <div className="mt-8 inline-flex items-center gap-3 glass-3 px-6 py-3 rounded-full shadow-lg">
                <Icon icon="solar:smartphone-bold" className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">
                  No website? Get a <span className="font-bold text-primary">FREE Digital Card</span> with AI Voice Chatbot — only OmniFlow has this!
                </span>
                <Link href="#digital-card" className="text-primary font-bold underline hover:opacity-80 text-sm">
                  Learn more
                </Link>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 text-center">
              <p className="text-sm text-muted-foreground mb-6">Trusted by 1,000+ growing businesses worldwide</p>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Icon key={i} icon="solar:star-bold" className="w-6 h-6 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-semibold">4.9/5 from 500+ reviews</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problems & Solutions Section */}
        <section className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">The Challenge</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Is Your Business Bleeding Money on Scattered Tools?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Small businesses lose 40+ hours per month and $500-$3,000 managing disconnected marketing tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Problems */}
              <Card className="border-2 border-destructive/20 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                    Without OmniFlow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: "solar:dollar-bold", text: "Paying $200-$1,000/month for multiple tools (HubSpot $800, Mailchimp $300, Zapier $240)" },
                    { icon: "solar:clock-circle-bold", text: "Wasting 10+ hours/week switching between 10 different platforms" },
                    { icon: "solar:database-bold", text: "Customer data scattered across tools — no single source of truth" },
                    { icon: "solar:target-bold", text: "Missing 60% of leads because follow-ups fall through the cracks" },
                    { icon: "solar:brain-bold", text: "Spending 15 hours/week creating content manually instead of growing business" },
                    { icon: "solar:chart-bold", text: "No visibility into what's actually working — flying blind with marketing" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Icon icon={item.icon} className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Solutions */}
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon icon="solar:check-circle-bold" className="w-6 h-6" />
                    With OmniFlow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { icon: "solar:dollar-bold", text: "Pay $29-$249/month for ALL features — save $500-$2,000/month" },
                    { icon: "solar:clock-circle-bold", text: "Everything in one dashboard — save 10+ hours/week" },
                    { icon: "solar:database-bold", text: "Unified CRM with complete customer journey in one place" },
                    { icon: "solar:target-bold", text: "AI-powered automation ensures no lead is left behind" },
                    { icon: "solar:stars-bold", text: "AI creates blogs, emails, social posts, images in seconds" },
                    { icon: "solar:chart-2-bold", text: "Real-time analytics dashboard — know exactly what drives revenue" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Icon icon={item.icon} className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold mb-4">
                The result? <span className="text-primary">3x more leads, 50% less time, 80% lower costs.</span>
              </p>
              <Button asChild size="lg">
                <Link href="/signup">Start Saving Today — Free Trial <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FREE Digital Card Section - Major Sales Magnet */}
        <section id="digital-card" className="py-20 px-4 bg-muted/30 line-b relative overflow-hidden">
          <div className="absolute top-4 right-4 md:top-8 md:right-8">
            <Badge className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-lg px-4 py-2 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
              100% FREE Forever
            </Badge>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-3 py-1.5 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <Icon icon="solar:smartphone-bold" className="w-4 h-4 mr-1 inline" />
                No Website? No Problem!
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Your Complete Online Presence — <span className="text-primary">Zero Cost</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Most small businesses don't have a website. Get a <strong>professional Digital Card</strong> with AI-powered lead capture, voice assistant, and one link for all your contacts — <span className="font-bold text-success">absolutely FREE</span>.
              </p>
            </div>

            {/* Key Value Proposition */}
            <Card className="glass-4 mb-12 shadow-2xl">
              <CardContent className="pt-8 pb-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <h3 className="text-2xl md:text-3xl font-bold">
                      The ONLY Digital Card with <span className="text-primary">AI Voice Assistant</span>
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      While competitors give you basic links, OmniFlow gives you a <strong>complete business presence</strong> that captures leads, answers questions 24/7, and books appointments — all in ONE card.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button asChild size="lg" className="shadow-lg">
                        <Link href="/signup">
                          Create Your FREE Card <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="border-2">
                        <Link href="#digital-card-features">
                          See All Features <Icon icon="solar:arrow-right-linear" className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: "solar:chat-square-bold", title: "Lead Capture Form", desc: "Collect inquiries 24/7", badge: "FREE" },
                      { icon: "solar:microphone-3-bold", title: "AI Voice Chatbot", desc: "14-day premium trial, then free", badge: "ONLY US" },
                      { icon: "solar:calendar-bold", title: "Calendar Booking", desc: "Let clients schedule", badge: "FREE" },
                      { icon: "solar:database-bold", title: "Built-in CRM", desc: "All leads synced", badge: "FREE" },
                    ].map((item, i) => (
                      <Card key={i} className="glass-2">
                        <CardContent className="pt-4 pb-4 text-center">
                          <Badge className={cn("mb-2 rounded-lg px-2 py-0.5 border", item.badge === "ONLY US" ? "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 border-stone-300/60 dark:border-stone-600/60" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200/60 dark:border-stone-700/60")}>{item.badge}</Badge>
                          <Icon icon={item.icon} className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice AI Upgrade Path */}
            <Card className="mb-8 glass-3">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Icon icon="solar:microphone-3-bold" className="w-10 h-10 text-primary" />
                    <div>
                      <p className="font-bold text-lg">AI Voice Chatbot — No Competitor Has This!</p>
                      <p className="text-sm text-muted-foreground">14-day premium trial, then English FREE forever | 109+ languages on Pro</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Badge className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg px-2.5 py-1 border border-stone-200/60 dark:border-stone-700/60">English FREE</Badge>
                    <Badge className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg px-2.5 py-1 border border-stone-200/60 dark:border-stone-700/60">14-Day Premium Trial</Badge>
                    <Badge className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg px-2.5 py-1 border border-stone-200/60 dark:border-stone-700/60">109+ Languages Pro</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Features Grid */}
            <div id="digital-card-features" className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {[
                { icon: "solar:chat-square-bold", title: "Contact Form", desc: "Capture leads automatically" },
                { icon: "solar:microphone-3-bold", title: "AI Voice Chat", desc: "English free, upgrade for more" },
                { icon: "solar:target-bold", title: "QR Code", desc: "Share anywhere instantly" },
                { icon: "solar:calendar-bold", title: "Calendar Link", desc: "Book meetings easily" },
                { icon: "solar:stars-bold", title: "Custom Branding", desc: "Your colors & logo" },
                { icon: "solar:chart-2-bold", title: "Analytics", desc: "Track all visits & leads" },
              ].map((item, i) => (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow glass-1 hover:border-primary/50">
                  <CardContent className="pt-4 pb-4">
                    <Icon icon={item.icon} className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Digital Card vs Competitors Table */}
            <div className="bg-card rounded-xl shadow-xl overflow-hidden border">
              <div className="bg-primary p-4 text-primary-foreground text-center">
                <h3 className="text-xl md:text-2xl font-bold">OmniFlow Digital Card vs Competitors</h3>
                <p className="text-sm opacity-90">See why we're the best choice for small businesses</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 bg-muted/30">
                      <th className="p-3 text-left font-bold">Feature</th>
                      <th className="p-3 text-center bg-primary/10 font-bold">
                        <div className="flex items-center justify-center gap-1">
                          <Icon icon="solar:crown-bold" className="w-4 h-4 text-primary" />
                          OmniFlow
                        </div>
                        <span className="text-xs font-normal text-primary">FREE</span>
                      </th>
                      <th className="p-3 text-center">HiHello<br/><span className="text-xs font-normal">Free/$6/mo</span></th>
                      <th className="p-3 text-center">Linktree<br/><span className="text-xs font-normal">Free/$5/mo</span></th>
                      <th className="p-3 text-center">Popl<br/><span className="text-xs font-normal">Paid only</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "AI Voice Chatbot", omniflow: "✓ 14-day premium trial, then FREE", hihello: "✗ NONE", linktree: "✗ NONE", popl: "✗ NONE", highlight: true },
                      { feature: "109+ Languages Support", omniflow: "✓ Pro Plan", hihello: "✗ NONE", linktree: "✗ NONE", popl: "✗ NONE", highlight: true },
                      { feature: "Contact Form (Lead Capture)", omniflow: "✓ Built-in", hihello: "✗ $25/mo CRM", linktree: "✗ Basic email", popl: "✓ Paid only", highlight: false },
                      { feature: "Built-in CRM", omniflow: "✓ OmniFlow CRM", hihello: "✗ $25+/mo extra", linktree: "✗ Zapier only", popl: "✓ Paid", highlight: false },
                      { feature: "QR Code Sharing", omniflow: "✓ FREE", hihello: "✓ Free", linktree: "✓ Free", popl: "✓ Paid", highlight: false },
                      { feature: "Analytics & Insights", omniflow: "✓ Built-in", hihello: "✗ Paid plans", linktree: "✗ Paid plans", popl: "✓ Paid", highlight: false },
                      { feature: "Calendar Booking", omniflow: "✓ Yes", hihello: "✓ External link", linktree: "✓ Yes", popl: "✓ Yes", highlight: false },
                      { feature: "Custom Branding", omniflow: "✓ FREE", hihello: "✗ Paid", linktree: "✗ Paid", popl: "✗ Paid", highlight: false },
                    ].map((row, i) => (
                      <tr key={i} className={cn("border-b hover:bg-muted/20", row.highlight && "bg-primary/5")}>
                        <td className={cn("p-3 font-medium text-sm", row.highlight && "font-bold")}>{row.feature}</td>
                        <td className="p-3 text-center bg-primary/10 font-bold text-primary text-sm">{row.omniflow}</td>
                        <td className={cn("p-3 text-center text-sm", row.highlight ? "text-destructive font-bold" : "text-muted-foreground")}>{row.hihello}</td>
                        <td className="p-3 text-center text-muted-foreground text-sm">{row.linktree}</td>
                        <td className="p-3 text-center text-muted-foreground text-sm">{row.popl}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 border-t-2">
                      <td className="p-3 font-bold">Your Monthly Cost</td>
                      <td className="p-3 text-center bg-primary/10 font-bold text-primary text-lg">$0</td>
                      <td className="p-3 text-center font-bold text-destructive">$25-50/mo</td>
                      <td className="p-3 text-center font-bold text-destructive">$5-24/mo</td>
                      <td className="p-3 text-center font-bold text-destructive">$7-15/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <Card className="glass-4 max-w-3xl mx-auto">
                <CardContent className="pt-6 pb-6">
                  <p className="text-lg font-bold mb-2">
                    No competitor offers <span className="text-primary">Lead Capture + AI Voice Chatbot + Built-in CRM</span> — starting <span className="text-primary">FREE</span>
                  </p>
                  <p className="text-muted-foreground mb-4">
                    This is your complete online presence. No website needed. Start capturing leads in 5 minutes.
                  </p>
                  <Button asChild size="lg" className="shadow-lg">
                    <Link href="/signup">
                      Get Your FREE Digital Card Now <Icon icon="solar:rocket-bold" className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Pay Us Section - Orchestration Value */}
        <section className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4">The Real Question</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                "Why Pay You When I Can Use Free Tools?"
              </h2>
              <p className="text-xl text-muted-foreground">
                Great question! Here's the honest answer...
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-2 border-destructive/30 bg-background">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon icon="solar:clock-circle-bold" className="w-5 h-5 text-destructive" />
                    DIY Free Tools Approach
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">Yes, you COULD use:</p>
                    <ul className="space-y-1 ml-4">
                      <li>✓ Brevo (300 emails/day free)</li>
                      <li>✓ Sender.net (2,500 emails/month free)</li>
                      <li>✓ MSG91 WhatsApp (pay per message)</li>
                      <li>✓ Gemini API (bring your own key)</li>
                      <li>✓ Google Sheets for contacts</li>
                    </ul>
                    <p className="font-semibold mt-4 text-destructive">But you'd spend 40+ hours/month:</p>
                    <ul className="space-y-1 ml-4 text-muted-foreground">
                      <li>→ Logging into 10 different dashboards</li>
                      <li>→ Manually copying contacts between tools</li>
                      <li>→ Building automation workflows from scratch</li>
                      <li>→ Managing API keys and compliance</li>
                      <li>→ Figuring out why something broke</li>
                      <li>→ Creating reports manually</li>
                    </ul>
                    <p className="font-bold mt-4 text-destructive text-lg">
                      Time Cost: $1,600+/month in labor
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon icon="solar:bolt-bold" className="w-5 h-5 text-primary" />
                    OmniFlow Orchestration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">We connect the same tools PLUS:</p>
                    <ul className="space-y-1 ml-4 font-medium">
                      <li>✓ All contacts in ONE unified CRM</li>
                      <li>✓ Auto-sync across all platforms</li>
                      <li>✓ AI creates campaigns in 5 minutes</li>
                      <li>✓ One dashboard for everything</li>
                      <li>✓ Compliance handled automatically</li>
                      <li>✓ Real-time analytics & ROI tracking</li>
                    </ul>
                    <p className="font-semibold mt-4 text-primary">What you actually get:</p>
                    <ul className="space-y-1 ml-4">
                      <li><strong>Automation:</strong> Workflows run 24/7</li>
                      <li><strong>Intelligence:</strong> AI campaign assistant</li>
                      <li><strong>Integration:</strong> Data flows seamlessly</li>
                      <li><strong>Insights:</strong> Know what drives revenue</li>
                      <li><strong>Support:</strong> We fix issues, not you</li>
                    </ul>
                    <p className="font-bold mt-4 text-primary text-lg">
                      Time Saved: 40 hours/month = $1,600/month value
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-4 max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-2xl">The Math is Simple</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-bold text-lg">$29-249/mo</p>
                    <p className="text-muted-foreground">OmniFlow Cost</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-success">+40 hours</p>
                    <p className="text-muted-foreground">Time Saved</p>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-success">= $1,350+</p>
                    <p className="text-muted-foreground">Net Savings/mo</p>
                  </div>
                </div>
                <p className="text-lg font-semibold pt-4">
                  Pay us $29-249/month to save $1,600/month in time.<br/>
                  That's a <span className="text-success">5-50x ROI</span> before you even count the growth benefits.
                </p>
                <p className="text-sm text-muted-foreground italic pt-2">
                  You're not paying for tools — you're paying for orchestration, automation, and peace of mind.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CPaaS Infrastructure Section - Our Own Messaging Platform */}
        <section className="py-20 px-4 bg-muted/30 line-b relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4">
                <Icon icon="solar:server-bold" className="w-4 h-4 mr-1 inline" />
                Our Own Infrastructure
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Powered by Our Own CPaaS Platform
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Effortlessly Simplified & Powerful Multi-Channel CPaaS Platform — Cloud Communication APIs seamlessly integrate messaging, voice, email, WhatsApp, and more
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:layers-bold" className="w-6 h-6 text-primary" />
                    WMart CPaaS — Our All-in-One Communication Platform
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Our own <strong>Communication Platform as a Service (CPaaS)</strong> — giving you enterprise-grade messaging at wholesale rates with direct carrier connections.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: "solar:chat-square-bold", label: "WhatsApp Business API" },
                      { icon: "solar:letter-bold", label: "Email Marketing" },
                      { icon: "solar:smartphone-bold", label: "SMS Campaigns" },
                      { icon: "solar:phone-calling-bold", label: "Voice Calls & IVR" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Icon icon={item.icon} className="w-4 h-4 text-primary" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <a href="https://wmart.in/cpaas" target="_blank" rel="noopener noreferrer">
                      Explore CPaaS <Icon icon="solar:square-arrow-right-up-linear" className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:dollar-bold" className="w-6 h-6 text-primary" />
                    Why This Matters for You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      { title: "Zero Markup Messaging", desc: "Pay actual API costs — no 300% GoHighLevel-style markup" },
                      { title: "Direct API Access", desc: "Same APIs used by enterprise companies, at SME prices" },
                      { title: "99.9% Uptime", desc: "Enterprise-grade reliability for your campaigns" },
                      { title: "Instant Delivery", desc: "Direct carrier connections = faster message delivery" },
                      { title: "Full Compliance", desc: "DLT registration, TRAI templates, Meta-approved" },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground text-sm"> — {item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-3 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold mb-1">For Agencies & Resellers</p>
                    <p className="text-muted-foreground">Want to offer SMS, WhatsApp, Email under YOUR brand? Our CPaaS supports white-label reselling.</p>
                  </div>
                  <Button asChild>
                    <a href="https://wmart.in/cpaas" target="_blank" rel="noopener noreferrer">
                      Become a Reseller <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Voice Chat AI Bot Section - WMart Product Cross-Marketing */}
        <section className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4">
                <Icon icon="solar:microphone-3-bold" className="w-4 h-4 mr-1 inline" />
                AI Voice Assistant
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Turn Website Visitors into Customers — 24/7
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our AI Voice Chatbot engages customers instantly, answers questions, captures leads, and integrates with your workflow
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:microphone-3-bold" className="w-6 h-6 text-primary" />
                    Voice Chat AI Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "AI Voice & Text Chat", desc: "Engage visitors with natural voice or text conversations" },
                    { title: "109+ Languages", desc: "Speak to customers in their native language (Pro plan)" },
                    { title: "Instant Lead Capture", desc: "Automatically collect contact info and qualify leads" },
                    { title: "24/7 Availability", desc: "Never miss a customer inquiry, even after hours" },
                    { title: "CRM Integration", desc: "All leads flow directly into your OmniFlow CRM" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">{item.title}:</span>
                        <span className="text-muted-foreground"> {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:bolt-bold" className="w-6 h-6 text-primary" />
                    Go Live in Minutes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Embed the AI chatbot on your website or digital business card with just a few clicks. No coding required.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <p className="text-sm font-medium mb-2">How it works:</p>
                    <ol className="text-sm space-y-2 text-muted-foreground">
                      <li>1. Create your AI agent with custom knowledge</li>
                      <li>2. Customize the voice, personality & responses</li>
                      <li>3. Embed on your website or digital card</li>
                      <li>4. Watch leads flow into your CRM automatically</li>
                    </ol>
                  </div>
                  <Button asChild className="w-full">
                    <a href="https://voicechatai.wmart.in/" target="_blank" rel="noopener noreferrer">
                      Try Voice Chat AI <Icon icon="solar:square-arrow-right-up-linear" className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-3 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold mb-1">Included in Digital Business Cards</p>
                    <p className="text-muted-foreground">Every OmniFlow digital card comes with Voice Chat AI integration — capture leads while you network!</p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href="/signup">
                      Start Free Trial <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* E-Commerce Integrations Section */}
        <section id="ecommerce-integrations" className="py-20 px-4 bg-muted/30 line-b relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="default" className="mb-4">
                <Icon icon="solar:globe-bold" className="w-4 h-4 mr-1 inline" />
                E-Commerce Ready
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Connect Your Store. Get Smart Customers.
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Automatically sync customer data from your e-commerce store directly into OmniFlow CRM. Track orders, manage customer relationships, and run targeted campaigns — all in one place.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  name: "Shopify",
                  description: "Real-time order and customer sync via webhooks",
                  features: ["Auto customer creation", "Order tracking", "Purchase history", "Abandoned cart recovery"],
                  icon: "🛍️"
                },
                {
                  name: "WooCommerce",
                  description: "Self-hosted store integration with webhook support",
                  features: ["Product-linked contacts", "Order automation", "Custom fields mapping", "Inventory sync"],
                  icon: "📦"
                },
                {
                  name: "WordPress",
                  description: "WordPress form & lead capture integration",
                  features: ["Form submissions", "Newsletter sync", "Lead scoring", "CRM automation"],
                  icon: "📝"
                }
              ].map((store, i) => (
                <Card key={i} className="glass-2 hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{store.icon}</span>
                      <Badge variant="outline">New</Badge>
                    </div>
                    <CardTitle>{store.name}</CardTitle>
                    <CardDescription>{store.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {store.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-3 max-w-4xl mx-auto mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="solar:bolt-bold" className="w-6 h-6 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <p className="font-semibold text-sm">Connect Your Store</p>
                        <p className="text-xs text-muted-foreground">Provide your store URL and API credentials</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <p className="font-semibold text-sm">Auto Sync Data</p>
                        <p className="text-xs text-muted-foreground">Customers, orders sync in real-time to CRM</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <p className="font-semibold text-sm">Run Campaigns</p>
                        <p className="text-xs text-muted-foreground">Email, SMS, WhatsApp based on purchase behavior</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pt-4 border-t">
                    ✓ No monthly fees for integration  •  ✓ Automatic webhooks setup  •  ✓ 24/7 sync support
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:chart-2-bold" className="w-6 h-6 text-primary" />
                    Unique Use Cases
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold text-sm">Abandoned Cart Recovery</p>
                    <p className="text-xs text-muted-foreground">Automatically send SMS/WhatsApp when customers leave items in cart</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">VIP Customer Workflows</p>
                    <p className="text-xs text-muted-foreground">Create special campaigns for high-value repeat customers</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Cross-Sell Campaigns</p>
                    <p className="text-xs text-muted-foreground">Based on purchase history, recommend related products via email/SMS</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:dollar-bold" className="w-6 h-6 text-primary" />
                    Cost Savings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground mb-2">Traditional approach:</p>
                    <p className="font-semibold text-sm text-destructive">Zapier + Shopify App + Email + SMS = $100-200/mo</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-2">With OmniFlow:</p>
                    <p className="font-semibold text-sm text-primary">Everything included in your plan ($29+/mo)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-3 max-w-4xl mx-auto mt-8">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold mb-1">Ready to Supercharge Your E-Commerce?</p>
                    <p className="text-muted-foreground">Connect your store today and start growing customer lifetime value with smart automation.</p>
                  </div>
                  <Button asChild>
                    <Link href="/signup">
                      Start Free Trial <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* BYOK Explanation Section */}
        <section className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4">
                <Icon icon="solar:key-bold" className="w-4 h-4 mr-1 inline" />
                Industry First
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                BYOK = Unlimited AI at Zero Extra Cost
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                "Bring Your Own Key" — the secret weapon no competitor offers
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-6">
                <Card className="glass-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon icon="solar:key-bold" className="w-6 h-6 text-primary" />
                      What is BYOK?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      <strong>Bring Your Own Key (BYOK)</strong> means you connect YOUR Google Gemini API key to OmniFlow. Instead of paying us per-AI-generation, you pay Google directly at their wholesale rates.
                    </p>
                    <div className="bg-background rounded-lg p-4 border">
                      <p className="text-sm font-mono">
                        <span className="text-muted-foreground">Google Gemini 2.0 Flash:</span><br/>
                        <span className="text-success font-bold">$0.10 per 1M tokens (input)</span><br/>
                        <span className="text-success font-bold">$0.40 per 1M tokens (output)</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        That's ~1,000 blog posts for $1. Unlimited usage, no caps.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="glass-1">
                  <CardHeader>
                    <CardTitle className="text-lg">What Competitors Charge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>GoHighLevel AI</span>
                        <span className="text-destructive font-bold">$97/mo extra</span>
                      </li>
                      <li className="flex justify-between">
                        <span>HubSpot AI</span>
                        <span className="text-destructive font-bold">$450/mo add-on</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Jasper AI</span>
                        <span className="text-destructive font-bold">$82/mo</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Copy.ai</span>
                        <span className="text-destructive font-bold">$49/mo</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                      All with usage limits and caps. OmniFlow BYOK = truly unlimited.
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon icon="solar:infinity-bold" className="w-5 h-5 text-primary" />
                      OmniFlow BYOK
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>AI Content Generation</span>
                        <span className="text-primary font-bold">Unlimited</span>
                      </li>
                      <li className="flex justify-between">
                        <span>AI Image Generation</span>
                        <span className="text-primary font-bold">Unlimited</span>
                      </li>
                      <li className="flex justify-between">
                        <span>AI Campaign Studio</span>
                        <span className="text-primary font-bold">Unlimited</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Monthly Extra Cost</span>
                        <span className="text-primary font-bold">$0 extra</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                      Just add your Google AI API key in Settings. Takes 2 minutes.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold mb-4">
                Why does no competitor offer this? <span className="text-primary">Because they make money on AI markups.</span>
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We make money from subscriptions, not per-use fees. Our incentive is to give you unlimited AI so you stay with us longer. Win-win.
              </p>
            </div>
          </div>
        </section>

        {/* WhatsApp API Depth Section */}
        <section className="py-20 px-4 bg-muted/30 line-b relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4">
                <Icon icon="solar:chat-square-bold" className="w-4 h-4 mr-1 inline" />
                6+ WhatsApp APIs
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                The Deepest WhatsApp Integration in the Market
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose from 6+ WhatsApp Business API providers — find the best rates for your region
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              {[
                { name: "Meta Cloud API", region: "Global", highlight: "Official" },
                { name: "MSG91", region: "India", highlight: "Popular" },
                { name: "Gupshup", region: "India/Global", highlight: "Enterprise" },
                { name: "AiSensy", region: "India", highlight: "Affordable" },
                { name: "WMart CPaaS", region: "India", highlight: "Our CPaaS" },
                { name: "Fast2SMS", region: "India", highlight: "Budget" },
              ].map((provider, i) => (
                <Card key={i} className="glass-1 text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <Badge variant="outline" className="mb-2 text-xs">{provider.highlight}</Badge>
                    <p className="font-bold">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">{provider.region}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="glass-2">
                <CardHeader>
                  <CardTitle>Why Multiple Providers?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { title: "Best Rates", desc: "Compare pricing across providers — save up to 40%" },
                    { title: "Redundancy", desc: "If one provider has issues, switch instantly" },
                    { title: "Regional Optimization", desc: "Use local providers for faster delivery in India" },
                    { title: "Compliance", desc: "Some providers handle DLT better than others" },
                    { title: "Features", desc: "Different providers offer unique features (chatbots, flows)" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <span className="font-medium">{item.title}:</span>
                        <span className="text-muted-foreground"> {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-2">
                <CardHeader>
                  <CardTitle>Same Story for SMS & Email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">SMS Providers:</p>
                    <div className="flex flex-wrap gap-2">
                      {["MSG91", "Fast2SMS", "Twilio", "WMart CPaaS"].map((p, i) => (
                        <Badge key={i} variant="outline">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Email Providers:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Brevo", "Sender.net", "Amazon SES", "SMTP2GO", "Custom SMTP"].map((p, i) => (
                        <Badge key={i} variant="outline">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    <strong>Zero lock-in:</strong> Switch providers anytime without losing your campaigns or contacts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Complete Toolkit</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Everything You Need to Dominate Sales & Marketing
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Replace 10+ expensive tools with one powerful, AI-first platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "solar:users-group-rounded-bold",
                  title: "Smart CRM & Lead Management",
                  description: "Capture, score, and nurture leads automatically. Track every customer interaction in one place. Never lose a deal to poor follow-up.",
                  replaces: "Replaces: HubSpot CRM ($800/mo), Salesforce ($150/mo)"
                },
                {
                  icon: "solar:brain-bold",
                  title: "AI Content Factory",
                  description: "Generate blogs, social posts, emails, ad copy, and images in seconds. Powered by Gemini 2.0 Flash & Nana Banana. Write 10x faster.",
                  replaces: "Replaces: Jasper ($82/mo), Canva Pro ($12/mo)"
                },
                {
                  icon: "solar:letter-bold",
                  title: "Email Marketing Automation",
                  description: "Send personalized email campaigns with advanced segmentation. Track opens, clicks, and conversions. Automated drip sequences.",
                  replaces: "Replaces: Mailchimp ($300/mo), ActiveCampaign ($180/mo)"
                },
                {
                  icon: "solar:chat-square-bold",
                  title: "WhatsApp & SMS Marketing",
                  description: "Reach customers on their preferred channels. Bulk campaigns, templates, and compliance-ready messaging for India and global markets.",
                  replaces: "Replaces: Twilio ($200/mo), WATI ($40/mo)"
                },
                {
                  icon: "solar:stars-bold",
                  title: "AI Campaign Studio",
                  description: "Describe your campaign in plain English — AI creates complete multi-channel campaigns in minutes. Email, SMS, WhatsApp, all automated.",
                  replaces: "Replaces: Manual campaign creation (15+ hours/week)"
                },
                {
                  icon: "solar:smartphone-bold",
                  title: "Digital Business Cards",
                  description: "Professional digital cards with QR codes, lead capture, and AI voice chatbot (free English, 109+ languages with upgrade). Perfect for networking and sales teams.",
                  replaces: "Replaces: HiHello ($12/mo), Calendly ($15/mo)"
                },
                {
                  icon: "solar:buildings-bold",
                  title: "Team Attendance & Management",
                  description: "Built for teams, not just individuals. Track team attendance (clock in/out), manage unified brand presence with digital cards for entire team, centralized CRM, and company-wide campaigns.",
                  replaces: "Replaces: When I Work ($4/user), BambooHR ($6/user)"
                },
                {
                  icon: "solar:chart-2-bold",
                  title: "Advanced Analytics Dashboard",
                  description: "Real-time insights on campaign performance, ROI tracking, and customer behavior. Know what drives revenue at a glance.",
                  replaces: "Replaces: Google Analytics 360 ($150/mo), Mixpanel ($89/mo)"
                },
                {
                  icon: "solar:bolt-bold",
                  title: "Workflow Automation",
                  description: "Build powerful automation workflows without code. Trigger actions based on customer behavior, schedule campaigns, auto-follow-ups.",
                  replaces: "Replaces: Zapier ($240/mo), Make ($29/mo)"
                },
                {
                  icon: "solar:globe-bold",
                  title: "Multi-Channel Campaigns",
                  description: "Coordinate campaigns across email, SMS, and WhatsApp from one dashboard. Consistent messaging, better results.",
                  replaces: "Replaces: Manual coordination across 5+ tools"
                },
                {
                  icon: "solar:target-bold",
                  title: "AI Ads Manager",
                  description: "Plan ad campaigns and generate high-converting ad creatives with AI. Meta Ads, Google Ads optimized copy and images.",
                  replaces: "Replaces: AdEspresso ($49/mo), Canva ($12/mo)"
                },
                {
                  icon: "solar:share-circle-bold",
                  title: "Social Media Management",
                  description: "Create AI-powered content for all platforms, schedule posts with content calendar, quick-publish to Facebook, Instagram, LinkedIn, X, and Pinterest.",
                  replaces: "Replaces: Buffer ($15/mo), Hootsuite ($99/mo)"
                },
                {
                  icon: "solar:document-text-bold",
                  title: "Content Hub & Blog Manager",
                  description: "Publish SEO-optimized blogs and landing pages. AI-assisted writing, image generation, and publishing — all in one place.",
                  replaces: "Replaces: WordPress hosting ($30/mo), SEO tools ($99/mo)"
                },
                {
                  icon: "solar:window-frame-bold",
                  title: "AI Landing Page Builder",
                  description: "Create high-converting landing pages with AI. Clone any page from a screenshot, AI-generate content per section, add Voice Chat AI for 24/7 lead capture.",
                  replaces: "Replaces: Unbounce ($99/mo), Leadpages ($49/mo)"
                },
                {
                  icon: "solar:calendar-bold",
                  title: "Appointment Scheduling",
                  description: "Book meetings with clients, send automated reminders via email/SMS/WhatsApp, sync with Google Calendar. Clients can self-book from your digital card.",
                  replaces: "Replaces: Calendly ($15/mo), Acuity ($25/mo)"
                },
                {
                  icon: "solar:clipboard-check-bold",
                  title: "Task & Activity Management",
                  description: "Track follow-ups, set reminders, manage your sales pipeline tasks. Link tasks to leads and appointments. Never miss a follow-up again.",
                  replaces: "Replaces: Todoist ($6/mo), Asana ($11/mo)"
                },
                {
                  icon: "solar:users-group-two-rounded-bold",
                  title: "Enterprise Team Collaboration",
                  description: "Lead claiming prevents duplicates, audit trail tracks all actions, auto-assignment distributes leads fairly. Perfect for sales teams up to 50 members.",
                  replaces: "Replaces: Salesforce Team ($150/user), Pipedrive ($59/user)"
                },
                {
                  icon: "solar:shield-check-bold",
                  title: "Enterprise-Grade Security",
                  description: "AES-256 encryption for API keys, role-based access control, multi-tenant isolation. Your data is safe and compliant.",
                  replaces: "Peace of mind: Bank-level security included"
                },
              ].map((feature, i) => (
                <Card key={i} className="glass-1 hover:shadow-lg transition-shadow hover:border-primary/50">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon icon={feature.icon} className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                    <p className="text-xs text-muted-foreground font-medium pt-2 border-t">
                      💰 {feature.replaces}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Card className="glass-4 max-w-3xl mx-auto">
                <CardContent className="pt-6">
                  <p className="text-2xl font-bold mb-2">
                    Total Savings: <span className="text-primary">$2,000-$3,500/month</span>
                  </p>
                  <p className="text-muted-foreground">
                    Pay just $29-$249/month for everything. That's a 90-95% cost reduction.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 px-4 bg-muted/30 line-b relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Why OmniFlow</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Built for Teams, Not Just Individuals
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                From solo founders to 50-person teams — manage attendance, unified brand, shared CRM, and team collaboration in one platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: "solar:dollar-bold",
                  title: "Save 90% on Tools",
                  description: "Replace $2,000-$3,500/mo in subscriptions with one $29-$249/mo platform",
                  metric: "Avg. savings: $30,000/year"
                },
                {
                  icon: "solar:clock-circle-bold",
                  title: "Save 40+ Hours/Month",
                  description: "No more switching between 10 dashboards. Everything unified in one beautiful interface",
                  metric: "ROI: Get 1 week back every month"
                },
                {
                  icon: "solar:graph-up-bold",
                  title: "3x More Leads",
                  description: "AI automation ensures zero leads fall through cracks. Smart follow-ups, better conversion",
                  metric: "Avg. increase: 300% in qualified leads"
                },
                {
                  icon: "solar:stars-bold",
                  title: "10x Faster Content",
                  description: "AI creates blogs, emails, social posts, and images in seconds instead of hours",
                  metric: "Save 15 hours/week on content"
                },
                {
                  icon: "solar:target-bold",
                  title: "Better Targeting",
                  description: "Advanced segmentation and AI insights help you reach the right customers at the right time",
                  metric: "Up to 50% higher open rates"
                },
                {
                  icon: "solar:chart-2-bold",
                  title: "Data-Driven Decisions",
                  description: "Real-time dashboards show exactly what's working. Optimize campaigns with confidence",
                  metric: "Know your ROI down to the $"
                },
                {
                  icon: "solar:rocket-bold",
                  title: "Scale Without Limits",
                  description: "Start solo, scale to 50+ team members. Plans grow with your business needs",
                  metric: "From startup to enterprise"
                },
                {
                  icon: "solar:heart-bold",
                  title: "No Technical Skills Needed",
                  description: "Guided AI workflows and intuitive design. If you can use email, you can use OmniFlow",
                  metric: "Setup in 15 minutes, not days"
                },
              ].map((benefit, i) => (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow glass-1">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon icon={benefit.icon} className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{benefit.description}</p>
                    <Badge variant="secondary" className="text-xs">{benefit.metric}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section - Two Tables: Plan Progression + Competitor Comparison */}
        <section id="comparison" className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-7xl mx-auto space-y-16">
            {/* Plan Progression Table */}
            <div>
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">Your Growth Path</Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Start Free, Scale as You Grow
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  See exactly what you get at each plan level
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg shadow-lg">
                  <thead>
                    <tr className="border-b-2">
                      <th className="p-4 text-left font-bold">What You Get</th>
                      <th className="p-4 text-center font-bold">Free</th>
                      <th className="p-4 text-center font-bold">Starter<br/><span className="text-sm font-normal">$29/mo</span></th>
                      <th className="p-4 text-center bg-primary/10 font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <Icon icon="solar:crown-bold" className="w-5 h-5 text-primary" />
                          Pro<br/><span className="text-sm font-normal">$99/mo</span>
                        </div>
                      </th>
                      <th className="p-4 text-center font-bold">Enterprise<br/><span className="text-sm font-normal">$249/mo</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Team Size", free: "1 user", starter: "3 users", pro: "10 users", enterprise: "50 users" },
                      { feature: "Team Attendance Tracking", free: "✗", starter: "✓", pro: "✓", enterprise: "✓ Advanced" },
                      { feature: "AI Credits/Month", free: "20 (one-time)", starter: "2,000", pro: "12,000", enterprise: "60,000" },
                      { feature: "Unlimited AI with BYOK", free: "✗", starter: "✓", pro: "✓", enterprise: "✓" },
                      { feature: "CRM & Contacts", free: "✓ Basic (100)", starter: "✓ Full (Unlimited)", pro: "✓ Full (Unlimited)", enterprise: "✓ Full (Unlimited)" },
                      { feature: "Contact Forms & Lead Capture", free: "✓ Basic", starter: "✓ Spam-protected", pro: "✓ Spam-protected", enterprise: "✓ Spam-protected" },
                      { feature: "Digital Cards (Voice AI)", free: "1 card", starter: "1 per user", pro: "2 per user", enterprise: "3 per user" },
                      { feature: "Email Marketing", free: "✗", starter: "✓ (provider limits*)", pro: "✓ (provider limits*)", enterprise: "✓ (provider limits*)" },
                      { feature: "SMS Marketing", free: "✗", starter: "✗", pro: "✓ Zero markup", enterprise: "✓ Zero markup" },
                      { feature: "WhatsApp Marketing", free: "✗", starter: "✗", pro: "✓ Zero markup", enterprise: "✓ Zero markup" },
                      { feature: "AI Content Generation", free: "Limited", starter: "✓ Full", pro: "✓ Full", enterprise: "✓ Full" },
                      { feature: "AI Campaign Studio", free: "✗", starter: "✗", pro: "✓", enterprise: "✓" },
                      { feature: "AI Ads Manager", free: "✗", starter: "✗", pro: "✓", enterprise: "✓" },
                      { feature: "Enterprise Team Collaboration", free: "✗", starter: "✗", pro: "✗", enterprise: "✓" },
                      { feature: "Advanced Analytics", free: "✗", starter: "Basic", pro: "✓ Advanced", enterprise: "✓ Advanced" },
                      { feature: "Support", free: "Community", starter: "Email", pro: "Priority", enterprise: "Dedicated Manager" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-medium">{row.feature}</td>
                        <td className="p-4 text-center text-sm">{row.free}</td>
                        <td className="p-4 text-center text-sm">{row.starter}</td>
                        <td className="p-4 text-center bg-primary/5 font-bold text-primary text-sm">{row.pro}</td>
                        <td className="p-4 text-center text-sm">{row.enterprise}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary/5 border-t-2">
                      <td className="p-4 font-bold">Best For</td>
                      <td className="p-4 text-center text-sm">Testing</td>
                      <td className="p-4 text-center text-sm">Solopreneurs</td>
                      <td className="p-4 text-center text-sm font-bold text-primary">Growing Businesses</td>
                      <td className="p-4 text-center text-sm">Large Teams</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 text-center">
                <Card className="glass-4 max-w-2xl mx-auto">
                  <CardContent className="pt-6">
                    <p className="text-lg font-semibold mb-2">
                      🎯 Most Popular: <span className="text-primary">Pro Plan at $99/mo</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unlock all features, save $2,000+/month vs competitors, get 12,000 AI credits PLUS unlimited with your own API key
                    </p>
                  </CardContent>
                </Card>
                <p className="mt-4 text-xs text-muted-foreground italic max-w-3xl mx-auto">
                  * Email provider limits refer to your chosen email service (e.g., Brevo: 2,500 subscribers, Sender: 2,500 subscribers, or your own SMTP). Your CRM can store unlimited contacts on paid plans - segment contacts to fit within your email provider's limits.
                </p>
              </div>
            </div>

            {/* Competitor Comparison Table */}
            <div>
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4">Head-to-Head</Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  OmniFlow Pro vs. The Competition
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  See how our $99/month plan stacks up against alternatives
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg shadow-lg">
                  <thead>
                    <tr className="border-b-2">
                      <th className="p-4 text-left font-bold">Feature</th>
                      <th className="p-4 text-center bg-primary/10 font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <Icon icon="solar:crown-bold" className="w-5 h-5 text-primary" />
                          OmniFlow Pro
                        </div>
                      </th>
                      <th className="p-4 text-center">GoHighLevel<br/><span className="text-sm font-normal">$297/mo</span></th>
                      <th className="p-4 text-center">HubSpot Pro<br/><span className="text-sm font-normal">$890/mo</span></th>
                      <th className="p-4 text-center">ActiveCampaign<br/><span className="text-sm font-normal">$149/mo</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Monthly Cost", omniflow: "$99", ghl: "$297", hubspot: "$890", ac: "$149" },
                      { feature: "Team Members", omniflow: "10 included", ghl: "Unlimited", hubspot: "5 included", ac: "3 included" },
                      { feature: "AI Content Generation", omniflow: "✓ Unlimited (BYOK)", ghl: "○ $97/mo extra", hubspot: "○ Add-on $450/mo", ac: "✗ None" },
                      { feature: "Email Marketing", omniflow: "✓ 3 providers*", ghl: "✓ Built-in", hubspot: "✓ Built-in", ac: "✓ Built-in" },
                      { feature: "WhatsApp Marketing", omniflow: "✓ Zero markup", ghl: "✓ 300% markup", hubspot: "○ Via partners", ac: "✗ None" },
                      { feature: "SMS Marketing", omniflow: "✓ Zero markup", ghl: "✓ 300% markup", hubspot: "○ Add-on", ac: "○ Add-on" },
                      { feature: "CRM & Pipeline", omniflow: "✓ Full-featured", ghl: "✓ Full-featured", hubspot: "✓ Advanced", ac: "✓ Full-featured" },
                      { feature: "Digital Business Cards", omniflow: "✓ AI Voice (109 lang)", ghl: "✗ None", hubspot: "✗ None", ac: "✗ None" },
                      { feature: "AI Image Generation", omniflow: "✓ Nana Banana", ghl: "✗ None", hubspot: "✗ None", ac: "✗ None" },
                      { feature: "Analytics & Reports", omniflow: "✓ Real-time", ghl: "✓ Advanced", hubspot: "✓ Advanced", ac: "✓ Good" },
                      { feature: "Workflow Automation", omniflow: "✓ Included", ghl: "✓ Visual builder", hubspot: "✓ Visual builder", ac: "✓ Visual builder" },
                      { feature: "Landing Pages", omniflow: "✓ AI-Powered + Voice Chat", ghl: "✓ Yes", hubspot: "✓ Yes", ac: "○ Limited" },
                      { feature: "Social Media Management", omniflow: "✓ AI + Calendar", ghl: "○ Basic", hubspot: "○ Add-on", ac: "✗ None" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-medium">{row.feature}</td>
                        <td className="p-4 text-center bg-primary/5 font-bold text-primary">{row.omniflow}</td>
                        <td className="p-4 text-center text-muted-foreground text-sm">{row.ghl}</td>
                        <td className="p-4 text-center text-muted-foreground text-sm">{row.hubspot}</td>
                        <td className="p-4 text-center text-muted-foreground text-sm">{row.ac}</td>
                      </tr>
                    ))}
                    <tr className="bg-success-muted border-t-2">
                      <td className="p-4 font-bold">Annual Savings vs OmniFlow</td>
                      <td className="p-4 text-center font-bold text-primary">$1,188/year</td>
                      <td className="p-4 text-center font-bold text-success">Save $2,376</td>
                      <td className="p-4 text-center font-bold text-success">Save $9,492</td>
                      <td className="p-4 text-center font-bold text-success">Save $600</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Legend: ✓ Included | ○ Limited/Add-on | ✗ Not available | 🔨 Coming soon<br/>
                  *3 Email options: Brevo (300/day free), Sender.net (2,500/month free), or SMTP (your own server)
                </p>
                <div className="bg-muted/50 border rounded-lg p-4 max-w-4xl mx-auto">
                  <p className="text-sm font-medium">
                    <strong>OmniFlow's Unique Advantages:</strong> (1) Zero-markup messaging saves $200-400/mo vs GoHighLevel, 
                    (2) Unlimited AI with BYOK while competitors charge $97-450/mo extra, 
                    (3) Unique Digital Cards with AI voice chatbot (109+ languages on Pro), 
                    (4) Same features at 67-90% lower cost than HubSpot/GoHighLevel.
                  </p>
                </div>
                <Button asChild size="lg">
                  <Link href="/signup">
                    Start Free 14-Day Trial <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Indian Competitor Comparison */}
            <div className="mt-16">
              <div className="text-center mb-12">
                <Badge variant="default" className="mb-4">
                  <Icon icon="solar:wallet-money-bold" className="w-4 h-4 mr-1 inline" />
                  Made for India
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  OmniFlow vs Indian CRM & Marketing Platforms
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Compare with popular Indian platforms — better features at lower cost with true all-in-one capability
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg shadow-lg">
                  <thead>
                    <tr className="border-b-2">
                      <th className="p-4 text-left font-bold">Feature</th>
                      <th className="p-4 text-center bg-primary/10 font-bold">
                        <div className="flex items-center justify-center gap-2">
                          <Icon icon="solar:crown-bold" className="w-5 h-5 text-primary" />
                          OmniFlow Pro
                        </div>
                        <span className="text-sm font-normal">₹7,999/mo</span>
                      </th>
                      <th className="p-4 text-center">Zoho CRM Plus<br/><span className="text-sm font-normal">₹4,600/user/mo</span></th>
                      <th className="p-4 text-center">LeadSquared<br/><span className="text-sm font-normal">₹3,000+/user/mo</span></th>
                      <th className="p-4 text-center">Freshsales<br/><span className="text-sm font-normal">₹2,799/user/mo</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Team of 10 Users", omniflow: "₹7,999 total", zoho: "₹46,000/mo", leadsq: "₹30,000+/mo", fresh: "₹27,990/mo" },
                      { feature: "AI Content Generation", omniflow: "✓ Unlimited (BYOK)", zoho: "○ Zia (Limited)", leadsq: "✗ None", fresh: "○ Freddy (Limited)" },
                      { feature: "WhatsApp Marketing", omniflow: "✓ 6+ APIs", zoho: "○ Add-on", leadsq: "✓ Built-in", fresh: "○ Limited" },
                      { feature: "SMS Marketing", omniflow: "✓ Zero markup", zoho: "○ Via Zoho Campaigns", leadsq: "✓ Built-in", fresh: "○ Add-on" },
                      { feature: "Email Marketing", omniflow: "✓ 3 providers", zoho: "✓ Zoho Campaigns", leadsq: "✓ Built-in", fresh: "✓ Built-in" },
                      { feature: "Razorpay Integration", omniflow: "✓ Native", zoho: "✓ Via apps", leadsq: "✓ Native", fresh: "○ Limited" },
                      { feature: "DLT/TRAI Compliance", omniflow: "✓ Auto-handled", zoho: "○ Manual", leadsq: "✓ Supported", fresh: "○ Manual" },
                      { feature: "Digital Business Cards", omniflow: "✓ AI Voice (109 lang)", zoho: "✗ None", leadsq: "✗ None", fresh: "✗ None" },
                      { feature: "AI Image Generation", omniflow: "✓ Nana Banana", zoho: "✗ None", leadsq: "✗ None", fresh: "✗ None" },
                      { feature: "Own CPaaS Infrastructure", omniflow: "✓ wmart.in/cpaas", zoho: "✗ Third-party", leadsq: "✗ Third-party", fresh: "✗ Third-party" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-medium">{row.feature}</td>
                        <td className="p-4 text-center bg-primary/5 font-bold text-primary">{row.omniflow}</td>
                        <td className="p-4 text-center text-muted-foreground text-sm">{row.zoho}</td>
                        <td className="p-4 text-center text-muted-foreground text-sm">{row.leadsq}</td>
                        <td className="p-4 text-center text-muted-foreground text-sm">{row.fresh}</td>
                      </tr>
                    ))}
                    <tr className="bg-orange-50 dark:bg-orange-950/20 border-t-2">
                      <td className="p-4 font-bold">Annual Cost (10 users)</td>
                      <td className="p-4 text-center font-bold text-primary">₹95,988</td>
                      <td className="p-4 text-center font-bold text-orange-600">₹5,52,000</td>
                      <td className="p-4 text-center font-bold text-orange-600">₹3,60,000+</td>
                      <td className="p-4 text-center font-bold text-orange-600">₹3,35,880</td>
                    </tr>
                    <tr className="bg-success-muted">
                      <td className="p-4 font-bold">Your Savings with OmniFlow</td>
                      <td className="p-4 text-center font-bold text-primary">—</td>
                      <td className="p-4 text-center font-bold text-success">Save ₹4,56,012/yr</td>
                      <td className="p-4 text-center font-bold text-success">Save ₹2,64,012/yr</td>
                      <td className="p-4 text-center font-bold text-success">Save ₹2,39,892/yr</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <Card className="glass-2">
                  <CardContent className="pt-6 text-center">
                    <Icon icon="solar:wallet-money-bold" className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-bold text-lg">Fixed INR Pricing</p>
                    <p className="text-sm text-muted-foreground">No USD conversion, Razorpay native, GST invoices</p>
                  </CardContent>
                </Card>
                <Card className="glass-2">
                  <CardContent className="pt-6 text-center">
                    <Icon icon="solar:chat-square-bold" className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-bold text-lg">Indian WhatsApp APIs</p>
                    <p className="text-sm text-muted-foreground">MSG91, Gupshup, AiSensy, WMart CPaaS + more</p>
                  </CardContent>
                </Card>
                <Card className="glass-2">
                  <CardContent className="pt-6 text-center">
                    <Icon icon="solar:shield-check-bold" className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-bold text-lg">DLT Compliance Built-in</p>
                    <p className="text-sm text-muted-foreground">TRAI template management, auto sender ID</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4 bg-muted/30 line-b relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Perfect For</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Who Benefits Most from OmniFlow?
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "solar:buildings-bold",
                  title: "Small Businesses",
                  description: "Grow from 1 to 50 employees without breaking the bank on enterprise tools",
                  examples: "Retail, Services, Consulting"
                },
                {
                  icon: "solar:case-bold",
                  title: "Marketing Agencies",
                  description: "Manage multiple clients, campaigns, and channels from one powerful dashboard",
                  examples: "Digital agencies, PR firms"
                },
                {
                  icon: "solar:users-group-rounded-bold",
                  title: "Solopreneurs & Founders",
                  description: "Compete with big companies using AI automation and professional tools",
                  examples: "Coaches, Freelancers, Creators"
                },
              ].map((useCase, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow glass-1">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon icon={useCase.icon} className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-center text-xl">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-3">{useCase.description}</p>
                    <Badge variant="outline">{useCase.examples}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* White-Label Enterprise Section */}
        <section className="py-20 px-4 bg-background line-b relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge variant="default" className="mb-4">
                <Icon icon="solar:buildings-bold" className="w-4 h-4 mr-1 inline" />
                Enterprise & Agencies
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                White-Label OmniFlow Under Your Brand
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                For agencies and resellers — offer the full OmniFlow platform to your clients under YOUR brand name
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:crown-bold" className="w-6 h-6 text-primary" />
                    What You Get with White-Label
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      { title: "Your Logo & Branding", desc: "Full customization of colors, logos, and domain" },
                      { title: "Your Pricing", desc: "Set your own prices and margins" },
                      { title: "Client Management", desc: "Manage multiple clients from one dashboard" },
                      { title: "CPaaS Reselling", desc: "Resell SMS, WhatsApp, Email via wmart.in/cpaas" },
                      { title: "Dedicated Support", desc: "Priority support for you and your clients" },
                      { title: "Training & Onboarding", desc: "We help you get started and trained" },
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground text-sm"> — {item.desc}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="glass-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon icon="solar:dollar-bold" className="w-6 h-6 text-primary" />
                    Revenue Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 border border-border">
                    <p className="text-sm mb-2">
                      <strong>Competitors charge for white-label:</strong>
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>GoHighLevel SaaS Mode: <span className="text-destructive font-bold">$497/mo</span></li>
                      <li>HubSpot White-Label: <span className="text-destructive font-bold">Contact Sales ($$$)</span></li>
                      <li>ActiveCampaign: <span className="text-destructive font-bold">Not available</span></li>
                    </ul>
                  </div>
                  <div className="bg-success-muted rounded-lg p-4 border border-success-border">
                    <p className="text-sm mb-2">
                      <strong>Your potential revenue with OmniFlow:</strong>
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>Resell at: <span className="text-success font-bold">$149-299/mo per client</span></li>
                      <li>Your cost: <span className="text-success font-bold">$249/mo Enterprise plan</span></li>
                      <li>10 clients = <span className="text-success font-bold">$1,490-2,990/mo revenue</span></li>
                    </ul>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Plus earn on CPaaS messaging: SMS, WhatsApp, Email credits at wholesale rates.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/30 bg-primary/5 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold mb-1">Ready to Start Your Own SaaS Business?</p>
                    <p className="text-muted-foreground">Contact us to discuss white-label partnership opportunities and custom pricing.</p>
                  </div>
                  <Button asChild>
                    <Link href="/signup">
                      Get Enterprise Plan <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 px-4 bg-muted/30 line-b relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Success Stories</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Real Results from Real Businesses
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "We cut our marketing tool costs from $2,400/month to just $99/month with OmniFlow. The AI content generation alone saves us 20 hours every week.",
                  author: "Priya Sharma",
                  role: "Marketing Director",
                  company: "TechStart India",
                  metric: "Saved $27,000/year",
                  stars: 5
                },
                {
                  quote: "OmniFlow's WhatsApp marketing features helped us reach 10,000 customers in India within the first month. Conversion rates jumped by 40%.",
                  author: "Rajesh Kumar",
                  role: "Founder",
                  company: "HealthPlus Wellness",
                  metric: "40% higher conversions",
                  stars: 5
                },
                {
                  quote: "As a solopreneur, I can now compete with agencies 10x my size. The AI Campaign Studio creates professional campaigns in minutes, not days.",
                  author: "Sarah Johnson",
                  role: "Business Coach",
                  company: "Leadership Excellence",
                  metric: "3x more clients",
                  stars: 5
                },
              ].map((testimonial, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: testimonial.stars }).map((_, j) => (
                        <Icon key={j} icon="solar:star-bold" className="w-4 h-4 text-yellow-400" />
                      ))}
                    </div>
                    <CardDescription className="text-base italic">"{testimonial.quote}"</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                    <Badge className="mt-3 bg-success-muted text-success-muted-foreground hover:bg-success-muted/80">
                      {testimonial.metric}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <div id="pricing">
          <PricingSection 
            showHeader={true}
            headerTitle="Simple, Transparent Pricing"
            headerDescription="Start free, scale as you grow. All paid plans include unlimited AI with your own API key."
            className="bg-background"
            currency={currency}
            onCurrencyChange={setCurrency}
          />
        </div>

        {/* Final CTA Section */}
        <section className="py-20 px-4 bg-stone-900 dark:bg-primary text-white dark:text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl opacity-90">
              Join 1,000+ businesses saving $30,000/year and growing 3x faster with OmniFlow
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-6">
                <Link href="/signup">
                  Start Free 14-Day Trial <Icon icon="solar:arrow-right-linear" className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white dark:border-stone-800 text-white dark:text-stone-800 hover:bg-white/10 dark:hover:bg-stone-800/10 bg-transparent">
                <Link href="/#pricing">
                  View Pricing Plans
                </Link>
              </Button>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm opacity-80">✓ No credit card required  •  ✓ Cancel anytime  •  ✓ 24/7 support</p>
              <p className="text-xs opacity-70">Loved by 1,000+ businesses  •  4.9/5 rating  •  500+ reviews</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <PublicFooter />
      </div>
    </>
  );
}
