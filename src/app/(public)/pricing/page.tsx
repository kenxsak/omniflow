"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PricingSection } from '@/components/pricing/pricing-section';
import { SupportedCurrency } from '@/lib/geo-detection';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import gsap from 'gsap';

export default function PricingPage() {
  const [currency, setCurrency] = useState<SupportedCurrency | undefined>(undefined);
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0, ease: 'power3.out' }
      );
    }
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <PublicNavbar />

      <main>
        {/* Hero Section */}
        <section className="py-8 sm:py-12 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div ref={heroRef} className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Choose the Perfect Plan for Your Business
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow. All paid plans include unlimited AI with your own API key.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection 
          showHeader={false}
          className="bg-background py-8 sm:py-12"
          currency={currency}
          onCurrencyChange={setCurrency}
        />

        {/* CTA Section */}
        <section ref={ctaRef} className="py-12 sm:py-16 px-4 text-center bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Ready to Get Started?</h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6">
              Start your 14-day free trial with full access to all features. No credit card required.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {['No credit card', '14-day trial', 'Cancel anytime'].map((item, i) => (
                <Badge key={i} variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" />
                  {item}
                </Badge>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm sm:text-base">
                <Link href="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-sm sm:text-base">
                <Link href="/#features">View All Features</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
