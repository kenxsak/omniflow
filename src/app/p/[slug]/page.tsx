'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getPublishedLandingPage, submitLandingPageLead, LandingPageData } from '@/app/actions/landing-page-actions';
import { cn } from '@/lib/utils';
import LandingPageVoiceWidget from '@/components/landing-pages/landing-page-voice-widget';

interface PublicLandingPageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicLandingPage({ params }: PublicLandingPageProps) {
  const { toast } = useToast();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const { slug: pageSlug } = await params;
      setSlug(pageSlug);
      const pageData = await getPublishedLandingPage(pageSlug);
      setPage(pageData);
      setLoading(false);
    }
    loadPage();
  }, [params]);

  const handleFormSubmit = async (e: React.FormEvent, sectionContent: Record<string, any>) => {
    e.preventDefault();
    if (!page) return;

    setSubmitting(true);
    try {
      const result = await submitLandingPageLead(
        page.id,
        page.slug,
        page.userId,
        formData
      );

      if (result.success) {
        setSubmitted(true);
        toast({ title: 'Success!', description: 'Your information has been submitted.' });
      } else {
        toast({ title: 'Error', description: 'Failed to submit form. Please try again.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-stone-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
            <Icon icon="solar:document-text-linear" className="w-8 h-8 text-stone-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Page Not Found</h1>
          <p className="text-sm text-stone-500 mb-4">This landing page doesn't exist or hasn't been published yet.</p>
          <a href="/" className="text-sm text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    );
  }

  const primaryColor = page.settings?.primaryColor || '#3b82f6';

  // Find header section for sticky behavior
  const headerSection = page.sections.find(s => s.type === 'header');

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      {/* Render each section */}
      {page.sections.map((section) => (
        <div key={section.id}>
          {/* Header Section */}
          {section.type === 'header' && (
            <ResponsiveHeader 
              content={section.content} 
              primaryColor={primaryColor} 
            />
          )}

          {/* Hero Section */}
          {section.type === 'hero' && (
            <section className="py-16 sm:py-24 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-stone-900 dark:text-white">
                  {section.content.headline || 'Welcome'}
                </h1>
                <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
                  {section.content.subheadline || 'Your subheadline goes here'}
                </p>
              </div>
            </section>
          )}

          {/* Form Section */}
          {section.type === 'form' && (
            <section className="py-12 px-4 bg-stone-50 dark:bg-stone-900/50">
              <div className="max-w-md mx-auto">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <Icon icon="solar:check-circle-bold" className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                    <p className="text-stone-600 dark:text-stone-400">We've received your information and will be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleFormSubmit(e, section.content)} className="space-y-4">
                    {(section.content.fields || ['name', 'email']).map((fieldId: string) => {
                      const fieldConfig: Record<string, { label: string; placeholder: string; type: string; required?: boolean }> = {
                        name: { label: 'Name', placeholder: 'Your name', type: 'text', required: true },
                        email: { label: 'Email', placeholder: 'your@email.com', type: 'email', required: true },
                        phone: { label: 'Phone', placeholder: 'Your phone number', type: 'tel' },
                        company: { label: 'Company', placeholder: 'Your company', type: 'text' },
                        message: { label: 'Message', placeholder: 'Your message', type: 'textarea' },
                      };
                      const config = fieldConfig[fieldId];
                      if (!config) return null;

                      if (config.type === 'textarea') {
                        return (
                          <div key={fieldId}>
                            <label className="block text-sm font-medium mb-1.5">{config.label}</label>
                            <Textarea
                              placeholder={config.placeholder}
                              value={formData[fieldId] || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                              rows={4}
                              className="w-full"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={fieldId}>
                          <label className="block text-sm font-medium mb-1.5">{config.label}</label>
                          <Input
                            type={config.type}
                            placeholder={config.placeholder}
                            value={formData[fieldId] || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [fieldId]: e.target.value }))}
                            required={config.required}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                    <Button 
                      type="submit" 
                      className="w-full text-white" 
                      disabled={submitting}
                      style={{ backgroundColor: primaryColor }}
                    >
                      {submitting ? 'Submitting...' : (section.content.buttonText || 'Submit')}
                    </Button>
                  </form>
                )}
              </div>
            </section>
          )}

          {/* CTA Section */}
          {section.type === 'cta' && (
            <section className="py-16 px-4" style={{ backgroundColor: `${primaryColor}10` }}>
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xl font-semibold mb-4 text-stone-900 dark:text-white">{section.content.text || 'Ready to get started?'}</p>
                <Button className="text-white" style={{ backgroundColor: primaryColor }}>
                  {section.content.buttonText || 'Get Started'}
                </Button>
              </div>
            </section>
          )}

          {/* Features Section */}
          {section.type === 'features' && (
            <section className="py-16 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(section.content.items || [1, 2, 3]).map((item: any, i: number) => (
                    <div key={i} className="text-center">
                      <div 
                        className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Icon icon="solar:star-bold" className="w-7 h-7" style={{ color: primaryColor }} />
                      </div>
                      <h3 className="font-semibold mb-2">{item.title || `Feature ${i + 1}`}</h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">{item.description || 'Feature description goes here'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Countdown Section */}
          {section.type === 'countdown' && (
            <section className="py-16 px-4 bg-stone-900 text-white">
              <div className="max-w-2xl mx-auto text-center">
                <CountdownTimer targetDate={section.content.targetDate} />
              </div>
            </section>
          )}

          {/* Testimonial Section */}
          {section.type === 'testimonial' && (
            <section className="py-16 px-4 bg-stone-50 dark:bg-stone-900/50">
              <div className="max-w-2xl mx-auto text-center">
                <Icon icon="solar:chat-round-dots-bold" className="w-10 h-10 mx-auto mb-4" style={{ color: primaryColor }} />
                <blockquote className="text-xl italic text-stone-700 dark:text-stone-300 mb-4">
                  "{section.content.quote || 'This product changed my life!'}"
                </blockquote>
                <p className="font-medium">{section.content.author || '— Happy Customer'}</p>
              </div>
            </section>
          )}

          {/* Video Section */}
          {section.type === 'video' && (
            <section className="py-16 px-4">
              <div className="max-w-3xl mx-auto">
                {section.content.videoUrl ? (
                  <div className="aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <iframe
                      src={getEmbedUrl(section.content.videoUrl)}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Icon icon="solar:play-circle-linear" className="w-16 h-16 text-stone-400" />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {section.type === 'faq' && (
            <section className="py-16 px-4">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {(section.content.items || [
                    { q: 'What is this product?', a: 'This is an amazing product that will help you succeed.' },
                    { q: 'How does it work?', a: 'Simply sign up and start using our intuitive platform.' },
                    { q: 'Is there a free trial?', a: 'Yes! We offer a 14-day free trial with no credit card required.' },
                  ]).map((item: any, i: number) => (
                    <FAQItem key={i} question={item.q} answer={item.a} primaryColor={primaryColor} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Pricing Section */}
          {section.type === 'pricing' && (
            <section className="py-16 px-4 bg-stone-50 dark:bg-stone-900/50">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8 text-stone-900 dark:text-white">Pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {(section.content.plans || [
                    { name: 'Starter', price: '$9', features: ['Feature 1', 'Feature 2'] },
                    { name: 'Pro', price: '$29', features: ['Everything in Starter', 'Feature 3', 'Feature 4'], popular: true },
                    { name: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Feature 5', 'Priority Support'] },
                  ]).map((plan: any, i: number) => (
                    <div 
                      key={i} 
                      className={cn(
                        "p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-950 border-2 flex flex-col",
                        plan.popular ? "border-primary shadow-lg sm:scale-105" : "border-stone-200 dark:border-stone-800"
                      )}
                    >
                      {plan.popular && (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-3 inline-block shadow-md self-start">
                          ⭐ Most Popular
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-white">{plan.name}</h3>
                      <p className="text-3xl sm:text-4xl font-bold my-3 text-stone-900 dark:text-white">{plan.price}<span className="text-sm font-normal text-stone-500 dark:text-stone-400">/mo</span></p>
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.features.map((f: string, fi: number) => (
                          <li key={fi} className="text-sm flex items-start gap-2 text-stone-700 dark:text-stone-300">
                            <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.buttonUrl ? (
                        <a 
                          href={plan.buttonUrl}
                          className={cn(
                            "block w-full text-center py-3 rounded-lg font-medium transition-colors",
                            plan.popular 
                              ? "text-white" 
                              : "border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-white"
                          )}
                          style={plan.popular ? { backgroundColor: primaryColor } : undefined}
                        >
                          {plan.buttonText || 'Get Started'}
                        </a>
                      ) : (
                        <Button className={cn("w-full py-3", plan.popular && "text-white")} variant={plan.popular ? 'default' : 'outline'} style={plan.popular ? { backgroundColor: primaryColor } : undefined}>
                          {plan.buttonText || 'Get Started'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Gallery Section */}
          {section.type === 'gallery' && (
            <section className="py-16 px-4">
              <div className="max-w-5xl mx-auto">
                <div 
                  className="gap-4"
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${section.content.columns || 3}, 1fr)` 
                  }}
                >
                  {(section.content.images || []).length > 0 ? (
                    section.content.images.map((img: any, i: number) => (
                      <div key={i} className="aspect-square rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden">
                        {img.url ? (
                          <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon icon="solar:gallery-linear" className="w-8 h-8 text-stone-400" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5, 6].map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                        <Icon icon="solar:gallery-linear" className="w-8 h-8 text-stone-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Footer Section */}
          {section.type === 'footer' && (
            <footer className="py-12 px-4 bg-stone-900 dark:bg-stone-950 text-white">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  {/* Brand Column */}
                  <div className="md:col-span-1">
                    {section.content.logo ? (
                      <img src={section.content.logo} alt="Logo" className="h-8 w-auto mb-4" />
                    ) : (
                      <p className="font-bold text-xl mb-4">{section.content.logoText || 'Your Brand'}</p>
                    )}
                    <p className="text-sm text-stone-400 mb-4">{section.content.description || ''}</p>
                    {/* Social Links */}
                    <div className="flex gap-3">
                      {(section.content.socialLinks || []).map((social: any, i: number) => (
                        <a 
                          key={i} 
                          href={social.url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center transition-colors"
                        >
                          <Icon icon={`mdi:${social.platform}`} className="h-5 w-5 text-stone-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                  {/* Link Columns */}
                  {(section.content.columns || []).map((col: any, i: number) => (
                    <div key={i}>
                      <p className="font-semibold mb-4 text-white">{col.title}</p>
                      <ul className="space-y-2">
                        {(col.links || []).map((link: any, li: number) => (
                          <li key={li}>
                            <a 
                              href={link.url || '#'} 
                              className="text-sm text-stone-400 hover:text-white transition-colors"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {/* Copyright */}
                <div className="pt-8 border-t border-stone-800 text-center">
                  <p className="text-sm text-stone-500">{section.content.copyright || '© 2025 Your Company. All rights reserved.'}</p>
                </div>
              </div>
            </footer>
          )}
        </div>
      ))}

      {/* Default Footer (only if no footer section exists) */}
      {!page.sections.some(s => s.type === 'footer') && (
        <footer className="py-8 px-4 border-t border-stone-200 dark:border-stone-800">
          <div className="max-w-4xl mx-auto text-center text-sm text-stone-500">
            <p>Powered by OmniFlow</p>
          </div>
        </footer>
      )}

      {/* AI Voice Assistant Widget */}
      {page.settings?.aiAssistant?.enabled && (
        <LandingPageVoiceWidget
          enabled={page.settings.aiAssistant.enabled}
          greeting={page.settings.aiAssistant.greeting}
          position={page.settings.aiAssistant.position}
          primaryColor={primaryColor}
          pageName={page.name}
          pageId={page.id}
          userId={page.userId}
        />
      )}
    </div>
  );
}

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate?: string | Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const target = targetDate ? new Date(targetDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex justify-center gap-4 sm:gap-8">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="text-4xl sm:text-5xl font-bold">{String(value).padStart(2, '0')}</div>
          <div className="text-sm text-stone-400 capitalize">{unit}</div>
        </div>
      ))}
    </div>
  );
}

// Helper to convert YouTube/Vimeo URLs to embed URLs
function getEmbedUrl(url: string): string {
  if (!url) return '';
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  
  return url;
}

// FAQ Accordion Item Component
function FAQItem({ question, answer, primaryColor }: { question: string; answer: string; primaryColor: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <h3 className="font-semibold text-stone-900 dark:text-white pr-4">{question}</h3>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Icon 
            icon={isOpen ? "solar:minus-circle-bold" : "solar:add-circle-bold"} 
            className="w-5 h-5 transition-transform duration-200" 
            style={{ color: primaryColor }}
          />
        </div>
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-0">
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// Responsive Header Component with Mobile Menu
function ResponsiveHeader({ content, primaryColor }: { content: Record<string, any>; primaryColor: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className={cn(
        "py-4 px-4 sm:px-6 bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800",
        content.sticky && "sticky top-0 z-50 backdrop-blur-lg bg-white/90 dark:bg-stone-950/90"
      )}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {content.logo ? (
              <img src={content.logo} alt="Logo" className="h-8 w-auto" />
            ) : (
              <span className="font-bold text-lg text-stone-900 dark:text-white">{content.logoText || 'Your Brand'}</span>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {(content.menuItems || []).map((item: any, i: number) => (
              <a 
                key={i} 
                href={item.url || '#'} 
                className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA + Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {content.ctaButton && (
              <a 
                href={content.ctaButton.url || '#'}
                className="hidden sm:inline-flex text-sm px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {content.ctaButton.label || 'Get Started'}
              </a>
            )}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Icon 
                icon={mobileMenuOpen ? "solar:close-circle-linear" : "solar:hamburger-menu-linear"} 
                className="h-6 w-6 text-stone-600 dark:text-stone-400" 
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 bg-white dark:bg-stone-950 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800">
            <span className="font-bold text-lg text-stone-900 dark:text-white">{content.logoText || 'Menu'}</span>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Icon icon="solar:close-circle-linear" className="h-6 w-6 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {(content.menuItems || []).map((item: any, i: number) => (
                <a 
                  key={i} 
                  href={item.url || '#'} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4 text-stone-400" />
                  <span className="font-medium">{item.label}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* Mobile Menu Footer with CTA */}
          {content.ctaButton && (
            <div className="p-4 border-t border-stone-200 dark:border-stone-800">
              <a 
                href={content.ctaButton.url || '#'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {content.ctaButton.label || 'Get Started'}
                <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
