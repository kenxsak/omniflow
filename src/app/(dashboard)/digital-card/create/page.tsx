'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createDigitalCard } from '@/app/actions/digital-card-actions';
import { CreateDigitalCardInput, DigitalCardLink } from '@/lib/digital-card-types';
import { AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import { Icon } from '@iconify/react';
import { AiChatbotIcon } from '@/components/icons/ai-chatbot-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ColorExtractor } from '@/components/digital-card/color-extractor';

export default function CreateDigitalCardPage() {
  const router = useRouter();
  const { appUser, company, firebaseUser } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedSocial, setFocusedSocial] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<CreateDigitalCardInput>>({
    username: '',
    userId: appUser?.uid || '',
    companyId: company?.id || '',
    businessInfo: {
      name: '',
      tagline: '',
      description: '',
      logo: '',
      coverImage: '',
      category: ''
    },
    contact: {
      phone: '',
      email: '',
      whatsapp: '',
      address: ''
    },
    links: [],
    socialMedia: {},
    contactForm: {
      enabled: true,
      buttonText: 'Contact Us',
      title: 'Get in Touch',
      description: "Send us a message and we'll get back to you soon!"
    },
    voiceChatbot: {
      enabled: false,
      customGreeting: '',
      position: 'right',
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      fontFamily: 'Inter',
      theme: 'modern'
    },
    seo: {
      title: '',
      description: '',
      keywords: []
    },
    status: 'draft'
  });

  const handleSubmit = async (isDraft: boolean = true) => {
    setError(null);
    setSaving(true);

    try {
      if (!appUser || !company || !firebaseUser) {
        setError('Please log in to create a digital card');
        return;
      }

      if (!formData.username || !formData.businessInfo?.name) {
        setError('Please fill in required fields: Username and Name');
        return;
      }

      const idToken = await firebaseUser.getIdToken();

      const cardData: CreateDigitalCardInput = {
        ...formData as CreateDigitalCardInput,
        userId: appUser.uid,
        companyId: company.id,
        status: isDraft ? 'draft' : 'active'
      };

      const result = await createDigitalCard({
        idToken,
        input: cardData
      });

      if (!result.success) {
        setError(result.error || 'Failed to create digital card');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/digital-card/manage`);
      }, 1500);
    } catch (err) {
      console.error('Error creating digital card:', err);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    const newLink: DigitalCardLink = {
      id: `link_${Date.now()}`,
      type: 'custom',
      label: 'New Link',
      url: '',
      icon: 'link',
      enabled: true,
      order: (formData.links?.length || 0) + 1
    };
    
    setFormData({
      ...formData,
      links: [...(formData.links || []), newLink]
    });
  };

  const updateLink = (index: number, updates: Partial<DigitalCardLink>) => {
    const updatedLinks = [...(formData.links || [])];
    updatedLinks[index] = { ...updatedLinks[index], ...updates };
    setFormData({ ...formData, links: updatedLinks });
  };

  const removeLink = (index: number) => {
    const updatedLinks = formData.links?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, links: updatedLinks });
  };

  if (!appUser || !company) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to create a digital card</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Header - Autosend style */}
      <div className="flex flex-col gap-4">
        <p className="text-stone-800 dark:text-stone-200 font-semibold text-lg">Create Digital Card</p>
        
        {/* Tabs - AutoSend style */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="lead-capture">Leads</TabsTrigger>
            <TabsTrigger value="branding">Brand</TabsTrigger>
          </TabsList>
          
          <p className="text-stone-500 dark:text-stone-400 font-normal text-sm mt-4">
            Create your digital business card - a beautiful landing page for your business
          </p>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 bg-green-50 text-green-900 border-green-200">
          <AlertDescription>Digital card created successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

        <TabsContent value="basic">
          <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
            <header className="flex items-center gap-2 px-5 py-3">
              <Icon icon="solar:user-circle-linear" className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>
                <p className="text-xs text-muted-foreground">Tell people about yourself or your business</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username (URL) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">omniflow.app/card/</span>
                  <Input
                    id="username"
                    placeholder="your-name-or-business"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Use only lowercase letters, numbers, and hyphens</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Name or Business Name"
                  value={formData.businessInfo?.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, name: e.target.value }
                  })}
                  required
                />
                <p className="text-xs text-muted-foreground">Your personal name, business name, or brand name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Professional Title / Tagline</Label>
                <Input
                  id="tagline"
                  placeholder={
                    formData.businessInfo?.category === 'Freelancer' || 
                    formData.businessInfo?.category === 'Professional' || 
                    formData.businessInfo?.category === 'Creator/Influencer'
                      ? 'Digital Marketing Consultant'
                      : 'Best Coffee in Mumbai'
                  }
                  value={formData.businessInfo?.tagline}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, tagline: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  For personal: "Digital Marketing Consultant" | For business: "Best Coffee in Mumbai"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people about yourself or your business..."
                  rows={4}
                  value={formData.businessInfo?.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, description: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.businessInfo?.category}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, category: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Health & Beauty">Health & Beauty</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Creator/Influencer">Creator/Influencer</SelectItem>
                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Profile Image / Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.businessInfo?.logo}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, logo: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Your photo or business logo. Recommended: <strong>400 x 400px</strong> (square, PNG or JPG)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image / Banner URL</Label>
                <Input
                  id="coverImage"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={formData.businessInfo?.coverImage}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, coverImage: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: <strong>780 x 300px</strong> (or 1560 x 600px for high-res). Keep text minimal for best display across devices.
                </p>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contact">
          <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
            <header className="flex items-center gap-2 px-5 py-3">
              <Icon icon="solar:phone-linear" className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Contact Information</h2>
                <p className="text-xs text-muted-foreground">How can people reach you?</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.contact?.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, phone: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@mybusiness.com"
                  value={formData.contact?.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, email: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+1 555-123-4567"
                  value={formData.contact?.whatsapp}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, whatsapp: e.target.value }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter number with country code (e.g., +1 555-123-4567 or +91 98765 43210)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, Country"
                  rows={3}
                  value={formData.contact?.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, address: e.target.value }
                  })}
                />
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="links">
          <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
            <header className="flex items-center gap-2 px-5 py-3">
              <Icon icon="solar:link-linear" className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Action Links</h2>
                <p className="text-xs text-muted-foreground">Add buttons that link to your services, products, or booking pages</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-5 space-y-4">
              {formData.links && formData.links.length > 0 ? (
                <div className="space-y-3">
                  {formData.links.map((link, index) => (
                    <div key={link.id} className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <Select
                            value={link.type}
                            onValueChange={(value) => updateLink(index, { type: value as any })}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="maps">Google Maps</SelectItem>
                              <SelectItem value="calendar">Calendar Booking</SelectItem>
                              <SelectItem value="payment">Payment Link</SelectItem>
                              <SelectItem value="custom">Custom Link</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLink(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              placeholder={link.type === 'whatsapp' ? 'Chat on WhatsApp' : 'Order Now'}
                              value={link.label}
                              onChange={(e) => updateLink(index, { label: e.target.value })}
                            />
                          </div>
                          
                          {link.type === 'whatsapp' ? (
                            <>
                              <div className="space-y-2">
                                <Label>WhatsApp Number (with country code)</Label>
                                <Input
                                  placeholder="+1 234 567 8900 or 12345678900"
                                  value={link.url.replace('https://wa.me/', '').split('?')[0]}
                                  onChange={(e) => {
                                    const phone = e.target.value.replace(/\D/g, '');
                                    const currentMessage = new URLSearchParams(link.url.split('?')[1] || '').get('text') || '';
                                    const waUrl = phone 
                                      ? `https://wa.me/${phone}${currentMessage ? `?text=${encodeURIComponent(currentMessage)}` : ''}`
                                      : '';
                                    updateLink(index, { url: waUrl });
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter number with country code (e.g., 919876543210 for India, 12345678900 for USA)
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label>Pre-filled Message (Optional)</Label>
                                <Textarea
                                  placeholder="Hi! I'd like to know more about..."
                                  rows={2}
                                  value={decodeURIComponent(new URLSearchParams(link.url.split('?')[1] || '').get('text') || '')}
                                  onChange={(e) => {
                                    const phone = link.url.replace('https://wa.me/', '').split('?')[0];
                                    const message = e.target.value;
                                    const waUrl = phone 
                                      ? `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`
                                      : '';
                                    updateLink(index, { url: waUrl });
                                  }}
                                />
                                <p className="text-xs text-muted-foreground">
                                  This message will appear in the chat when someone clicks the button
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Label>URL</Label>
                              <Input
                                placeholder={
                                  link.type === 'email' ? 'mailto:email@example.com' :
                                  link.type === 'phone' ? 'tel:+1234567890' :
                                  link.type === 'maps' ? 'https://maps.google.com/?q=...' :
                                  'https://...'
                                }
                                value={link.url}
                                onChange={(e) => updateLink(index, { url: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No links added yet. Click the button below to add your first link.
                </p>
              )}
              
              <div className="flex justify-center">
                <Button onClick={addLink} variant="outline" className="w-full h-9 text-xs font-mono uppercase tracking-wide border-dashed border-stone-300 dark:border-stone-700 text-muted-foreground hover:text-foreground hover:border-stone-400 dark:hover:border-stone-600">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Link
                </Button>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="social">
          <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
            <header className="flex items-center gap-2 px-5 py-3">
              <Icon icon="solar:share-linear" className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Social Media</h2>
                <p className="text-xs text-muted-foreground">Add your social media profiles</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-5 relative">
              {/* Animated focus indicator */}
              <div 
                className="absolute left-0 w-1 bg-primary rounded-full transition-all duration-300 ease-out"
                style={{
                  height: '44px',
                  top: `${(focusedSocial ?? 0) * 60}px`,
                  opacity: focusedSocial !== null ? 1 : 0,
                }}
              />
              
              <div className="space-y-4">
                {/* Instagram */}
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    <Icon icon="ri:instagram-fill" className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex items-center h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-36 shrink-0 h-full flex items-center px-3 text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">instagram.com/</span>
                    <input
                      id="instagram"
                      placeholder="username"
                      value={formData.socialMedia?.instagram || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia!, instagram: e.target.value }
                      })}
                      onFocus={() => setFocusedSocial(0)}
                      onBlur={() => setFocusedSocial(null)}
                      className="flex-1 h-full px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* YouTube */}
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    <Icon icon="ri:youtube-fill" className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex items-center h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-36 shrink-0 h-full flex items-center px-3 text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">youtube.com/</span>
                    <input
                      id="youtube"
                      placeholder="@channel"
                      value={formData.socialMedia?.youtube || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia!, youtube: e.target.value }
                      })}
                      onFocus={() => setFocusedSocial(1)}
                      onBlur={() => setFocusedSocial(null)}
                      className="flex-1 h-full px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    <Icon icon="ri:facebook-circle-fill" className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex items-center h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-36 shrink-0 h-full flex items-center px-3 text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">facebook.com/</span>
                    <input
                      id="facebook"
                      placeholder="page"
                      value={formData.socialMedia?.facebook || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia!, facebook: e.target.value }
                      })}
                      onFocus={() => setFocusedSocial(2)}
                      onBlur={() => setFocusedSocial(null)}
                      className="flex-1 h-full px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Twitter / X */}
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    <Icon icon="ri:twitter-x-fill" className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex items-center h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-36 shrink-0 h-full flex items-center px-3 text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">x.com/</span>
                    <input
                      id="twitter"
                      placeholder="username"
                      value={formData.socialMedia?.twitter || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia!, twitter: e.target.value }
                      })}
                      onFocus={() => setFocusedSocial(3)}
                      onBlur={() => setFocusedSocial(null)}
                      className="flex-1 h-full px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    <Icon icon="ri:linkedin-box-fill" className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex items-center h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-36 shrink-0 h-full flex items-center px-3 text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">linkedin.com/in/</span>
                    <input
                      id="linkedin"
                      placeholder="profile"
                      value={formData.socialMedia?.linkedin || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia!, linkedin: e.target.value }
                      })}
                      onFocus={() => setFocusedSocial(4)}
                      onBlur={() => setFocusedSocial(null)}
                      className="flex-1 h-full px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="lead-capture">
          <div className="space-y-6">
            {/* Contact Form Card - Clerk Style */}
            <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
              <header className="flex items-center gap-2 px-5 py-3">
                <Icon icon="solar:chat-square-linear" className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Contact Form</h2>
              </header>
              <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
                <div className="p-5 space-y-5">
                  {/* Toggle Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Enable contact form</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Capture leads directly into your CRM</p>
                    </div>
                    <Switch
                      checked={formData.contactForm?.enabled ?? true}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        contactForm: { ...formData.contactForm!, enabled: checked }
                      })}
                    />
                  </div>

                  {formData.contactForm?.enabled && (
                    <>
                      <div className="h-px bg-stone-200 dark:bg-stone-800" />
                      
                      {/* Button Text */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Button Text</label>
                        <Input
                          className="h-9 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Contact Us"
                          value={formData.contactForm?.buttonText || 'Contact Us'}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactForm: { ...formData.contactForm!, buttonText: e.target.value }
                          })}
                        />
                      </div>

                      {/* Form Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Form Title</label>
                        <Input
                          className="h-9 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Get in Touch"
                          value={formData.contactForm?.title || 'Get in Touch'}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactForm: { ...formData.contactForm!, title: e.target.value }
                          })}
                        />
                      </div>

                      {/* Form Description */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Form Description</label>
                        <Textarea
                          className="min-h-[72px] bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                          placeholder="Send us a message and we'll get back to you soon!"
                          value={formData.contactForm?.description || "Send us a message and we'll get back to you soon!"}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactForm: { ...formData.contactForm!, description: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                {/* Footer Notice */}
                {formData.contactForm?.enabled && (
                  <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 rounded-b-xl">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                      Submissions automatically create leads in your CRM
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* AI Voice Chatbot Card - Clerk Style */}
            <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
              <header className="flex items-center gap-2 px-5 py-3">
                <AiChatbotIcon className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">AI Voice Chatbot</h2>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-muted-foreground">109 Languages</span>
              </header>
              <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
                <div className="p-5 space-y-5">
                  {/* Toggle Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Enable AI chatbot</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Voice & text chat with automatic lead capture</p>
                    </div>
                    <Switch
                      checked={formData.voiceChatbot?.enabled || false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        voiceChatbot: { ...formData.voiceChatbot!, enabled: checked }
                      })}
                    />
                  </div>

                  {formData.voiceChatbot?.enabled && (
                    <>
                      <div className="h-px bg-stone-200 dark:bg-stone-800" />
                      
                      {/* Info Banner */}
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                        <Icon icon="solar:lightbulb-linear" className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Configure Voice Chat AI in <span className="font-medium">Settings → API Integrations</span>
                        </p>
                      </div>

                      {/* Custom Greeting */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Custom Greeting <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <Textarea
                          className="min-h-[72px] bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                          placeholder="Hi! I'm your AI assistant. How can I help you today?"
                          value={formData.voiceChatbot?.customGreeting || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            voiceChatbot: { ...formData.voiceChatbot!, customGreeting: e.target.value }
                          })}
                        />
                      </div>

                      {/* Widget Position */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Widget Position</label>
                        <Select
                          value={formData.voiceChatbot?.position || 'right'}
                          onValueChange={(value: 'left' | 'right') => setFormData({
                            ...formData,
                            voiceChatbot: { ...formData.voiceChatbot!, position: value }
                          })}
                        >
                          <SelectTrigger className="h-9 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right">Bottom Right</SelectItem>
                            <SelectItem value="left">Bottom Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Features List */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          'Voice & text in 109 languages',
                          'Automatic lead capture',
                          'Direct CRM integration',
                          'Auto follow-up campaigns'
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <section className="rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-1">
            <header className="flex items-center gap-2 px-5 py-3">
              <Icon icon="solar:palette-linear" className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Branding & Theme</h2>
                <p className="text-xs text-muted-foreground">Customize the look and feel of your digital card</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-5 space-y-4">
              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Primary Color</Label>
                  <div className="relative group">
                    <div className="flex items-center h-11 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 overflow-hidden transition-all hover:border-stone-300 dark:hover:border-stone-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <div className="relative w-11 h-11 shrink-0">
                        <input
                          type="color"
                          value={formData.branding?.primaryColor || '#3B82F6'}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding!, primaryColor: e.target.value }
                          })}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div 
                          className="w-full h-full rounded-l-lg border-r border-stone-200 dark:border-stone-800"
                          style={{ backgroundColor: formData.branding?.primaryColor || '#3B82F6' }}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.branding?.primaryColor || '#3B82F6'}
                        onChange={(e) => setFormData({
                          ...formData,
                          branding: { ...formData.branding!, primaryColor: e.target.value }
                        })}
                        className="flex-1 h-full px-3 bg-transparent font-mono text-sm uppercase text-foreground placeholder:text-muted-foreground focus:outline-none"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Secondary Color</Label>
                  <div className="relative group">
                    <div className="flex items-center h-11 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 overflow-hidden transition-all hover:border-stone-300 dark:hover:border-stone-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <div className="relative w-11 h-11 shrink-0">
                        <input
                          type="color"
                          value={formData.branding?.secondaryColor || '#10B981'}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding!, secondaryColor: e.target.value }
                          })}
                          className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                        />
                        <div 
                          className="w-full h-full rounded-l-lg border-r border-stone-200 dark:border-stone-800"
                          style={{ backgroundColor: formData.branding?.secondaryColor || '#10B981' }}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.branding?.secondaryColor || '#10B981'}
                        onChange={(e) => setFormData({
                          ...formData,
                          branding: { ...formData.branding!, secondaryColor: e.target.value }
                        })}
                        className="flex-1 h-full px-3 bg-transparent font-mono text-sm uppercase text-foreground placeholder:text-muted-foreground focus:outline-none"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
                <ColorExtractor
                  logoUrl={formData.businessInfo?.logo || ''}
                  onColorsExtracted={(colors) => setFormData({
                    ...formData,
                    branding: {
                      ...formData.branding!,
                      primaryColor: colors.primary,
                      secondaryColor: colors.secondary
                    }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme Style</Label>
                <Select
                  value={formData.branding?.theme}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    branding: { ...formData.branding!, theme: value as any }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={formData.branding?.fontFamily}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    branding: { ...formData.branding!, fontFamily: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Modern)</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-between gap-4 mt-8">
        <Button
          variant="outline"
          onClick={() => router.push('/digital-card/manage')}
          disabled={saving}
        >
          Cancel
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={saving}
          >
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
    </div>
  );
}
