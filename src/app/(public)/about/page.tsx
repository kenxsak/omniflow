"use client";

import { ArrowRight, Zap, Globe, Sparkles, Heart, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef } from 'react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import gsap from 'gsap';

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0, ease: 'power3.out' }
      );
    }
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.about-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <PublicNavbar />

      <main className="pt-14 sm:pt-16">
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background dark:from-primary/10 dark:via-accent/10 dark:to-background">
          <div ref={heroRef} className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-destructive" />
              Our Story
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              About OmniFlow
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              We're building the all-in-one platform that empowers small businesses to compete with enterprises.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <div ref={cardsRef} className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="about-card group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  Replace expensive tool sprawl with one affordable, AI-powered platform designed for SMEs.
                </p>
              </CardContent>
            </Card>

            <Card className="about-card group hover:shadow-lg transition-all duration-300 hover:border-accent/50">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-accent" />
                </div>
                <CardTitle className="text-base sm:text-lg">Our Vision</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  Democratize access to enterprise-grade sales and marketing tools at 1/3 the cost.
                </p>
              </CardContent>
            </Card>

            <Card className="about-card group hover:shadow-lg transition-all duration-300 hover:border-green-500/50 sm:col-span-2 lg:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                </div>
                <CardTitle className="text-base sm:text-lg">Our Reach</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  Serving 1,000+ growing businesses worldwide with world-class support.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Why We Built OmniFlow
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  WMart Online Services realized small businesses were spending $2,000-$3,500 per month on scattered tools (HubSpot, Mailchimp, Zapier, etc.) while losing 40+ hours monthly juggling platforms. We built OmniFlow to fix that — one unified platform with AI-first features at an affordable price.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  <strong>OmniFlow is a service by WMart Online Services</strong> - an AI & digital solutions company serving businesses globally. For more information about our company, visit{' '}
                  <a href="https://wmart.in" className="text-primary hover:underline font-medium">wmart.in</a>.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Join thousands of businesses already using OmniFlow to grow faster.
            </p>
            <Button asChild size="lg" variant="default">
              <Link href="/signup">
                Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
