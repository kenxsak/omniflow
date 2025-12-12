"use client";

import { ArrowRight, Mail, MessageSquare, Phone, Clock, Building2, Headphones } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useRef } from 'react';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';
import gsap from 'gsap';

export default function ContactPage() {
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
      const cards = cardsRef.current.querySelectorAll('.contact-card');
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

      <main>
        <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
          <div ref={heroRef} className="max-w-2xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1">
              <Headphones className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              We're Here to Help
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
              Have questions? We'd love to hear from you. Reach out to our team.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4">
          <div ref={cardsRef} className="max-w-2xl mx-auto grid gap-4 sm:gap-6">
            <Card className="contact-card group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Email</h3>
                  <a href="mailto:support@worldmart.in" className="text-primary hover:underline text-sm sm:text-base">
                    support@worldmart.in
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="contact-card group hover:shadow-lg transition-all duration-300 hover:border-accent/50">
              <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">AI Voice Chat Widget</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Use the AI voice chat widget on our website for instant support. Powered by WMart AI technology, available 24/7 in 109+ languages.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="contact-card group hover:shadow-lg transition-all duration-300 hover:border-green-500/50">
              <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">Phone</h3>
                  <a href="tel:+918080077736" className="text-primary hover:underline text-sm sm:text-base">
                    +91-8080077736
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  How to Reach Us
                </h2>
                <div className="space-y-3 text-sm sm:text-base text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Company:</strong> WMart Online Services</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Mail className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Email:</strong> support@worldmart.in</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Phone:</strong> +91-8080077736</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Business Hours:</strong> Mon-Fri 9:00 AM - 6:00 PM IST | Sat 10:00 AM - 4:00 PM IST</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Headphones className="w-4 h-4 mt-1 flex-shrink-0 text-green-500" />
                    <span><strong>Emergency Support:</strong> 24/7 via email for urgent technical issues</span>
                  </p>
                </div>
                <Button asChild className="mt-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm sm:text-base">
                  <Link href="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
