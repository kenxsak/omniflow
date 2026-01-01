'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getDigitalCard, updateDigitalCard } from '@/app/actions/digital-card-actions';
import { DigitalCard, UpdateDigitalCardInput, DigitalCardLink } from '@/lib/digital-card-types';
import { AlertCircle, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { AiChatbotIcon } from '@/components/icons/ai-chatbot-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ColorExtractor } from '@/components/digital-card/color-extractor';
import WidgetEmbedCode from '@/components/digital-card/widget-embed-code';
import WebsiteEmbedCodes from '@/components/digital-card/website-embed-codes';

export default function EditDigitalCardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;
  const { appUser, company, firebaseUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [card, setCard] = useState<DigitalCard | null>(null);
  const [focusedSocial, setFocusedSocial] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<UpdateDigitalCardInput>>({
    id: cardId,
    username: '',
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
    calendarBooking: {
      enabled: false,
      buttonText: 'Book Appointment',
      calcomUsername: '',
      calcomEventSlug: '',
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

  useEffect(() => {
    loadCard();
  }, [cardId, appUser, company, firebaseUser]);

  const loadCard = async () => {
    if (!appUser || !company || !firebaseUser || !cardId) {
      setLoading(false);
      return;
    }

    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await getDigitalCard({ idToken, cardId });

      if (!result.success || !result.card) {
        setError(result.error || 'Digital card not found');
        setLoading(false);
        return;
      }

      setCard(result.card);
      
      // Populate form with existing data
      setFormData({
        id: result.card.id,
        username: result.card.username,
        userId: result.card.userId,
        companyId: result.card.companyId,
        businessInfo: result.card.businessInfo,
        contact: result.card.contact,
        links: result.card.links || [],
        socialMedia: result.card.socialMedia || {},
        contactForm: result.card.contactForm || {
          enabled: true,
          buttonText: 'Contact Us',
          title: 'Get in Touch',
          description: "Send us a message and we'll get back to you soon!"
        },
        calendarBooking: result.card.calendarBooking || {
          enabled: false,
          buttonText: 'Book Appointment',
          calcomUsername: '',
          calcomEventSlug: '',
        },
        voiceChatbot: result.card.voiceChatbot || {
          enabled: false,
          customGreeting: '',
          position: 'right',
        },
        branding: result.card.branding || {
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          fontFamily: 'Inter',
          theme: 'modern'
        },
        seo: result.card.seo || {
          title: '',
          description: '',
          keywords: []
        },
        status: result.card.status
      });
    } catch (err) {
      console.error('Error loading card:', err);
      setError('Failed to load digital card');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isDraft: boolean = true) => {
    setError(null);
    setSaving(true);

    try {
      if (!appUser || !company || !firebaseUser) {
        setError('Please log in to update the digital card');
        return;
      }

      if (!formData.username || !formData.businessInfo?.name) {
        setError('Please fill in required fields: Username and Name');
        return;
      }

      const idToken = await firebaseUser.getIdToken();

      const updateData: UpdateDigitalCardInput = {
        ...formData as UpdateDigitalCardInput,
        id: cardId,
        status: isDraft ? formData.status : 'active'
      };

      const result = await updateDigitalCard({
        idToken,
        input: updateData
      });

      if (!result.success) {
        setError(result.error || 'Failed to update digital card');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/digital-card/manage`);
      }, 1500);
    } catch (err) {
      console.error('Error updating digital card:', err);
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
          <AlertDescription>Please log in to edit digital cards</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading digital card...</p>
        </div>
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/digital-card/manage')} className="mt-4">
          Back to Manage Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full h-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <p className="text-stone-800 dark:text-stone-200 font-semibold text-lg">Edit Digital Card</p>
        
        {/* Tabs - Grid layout on mobile, inline on desktop */}
        <Tabs defaultValue="basic" className="w-full">
          {/* Mobile: 4-column grid, Desktop: inline flex */}
          <TabsList className="grid grid-cols-4 sm:inline-flex sm:flex-wrap h-auto gap-1 bg-stone-100 dark:bg-stone-900 p-1.5 rounded-xl w-full sm:w-auto">
            <TabsTrigger value="basic" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white h-auto">
              <Icon icon="solar:user-circle-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Basic</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white h-auto">
              <Icon icon="solar:phone-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Contact</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white h-auto">
              <Icon icon="solar:link-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Links</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-pink-500 data-[state=active]:text-white h-auto">
              <Icon icon="solar:share-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Social</span>
            </TabsTrigger>
            <TabsTrigger value="lead-capture" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white h-auto">
              <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-violet-500 data-[state=active]:text-white h-auto">
              <Icon icon="solar:pallete-2-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Brand</span>
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2 text-[10px] sm:text-sm whitespace-nowrap rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white h-auto col-span-2 sm:col-span-1">
              <Icon icon="solar:code-linear" className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
              <span>Embed</span>
            </TabsTrigger>
          </TabsList>
          
          <p className="text-stone-500 dark:text-stone-400 font-normal text-xs sm:text-sm mt-3 sm:mt-4">
            Update your digital card settings and content
          </p>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 bg-green-50 text-green-900 border-green-200">
          <AlertDescription>Digital card updated successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

        <TabsContent value="basic">
          <section className="rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 p-1">
            <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Icon icon="solar:user-circle-linear" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>
                <p className="text-xs text-muted-foreground truncate">Tell people about yourself or your business</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs sm:text-sm">Username (URL) *</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground shrink-0">omniflow.app/card/</span>
                  <Input
                    id="username"
                    placeholder="your-name-or-business"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    required
                    className="h-10"
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Use only lowercase letters, numbers, and hyphens</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-xs sm:text-sm">Name *</Label>
                <Input
                  id="businessName"
                  placeholder="Your Name or Business Name"
                  value={formData.businessInfo?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, name: e.target.value }
                  })}
                  required
                  className="h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Your personal name, business name, or brand name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-xs sm:text-sm">Professional Title / Tagline</Label>
                <Input
                  id="tagline"
                  placeholder={
                    formData.businessInfo?.category === 'Freelancer' || 
                    formData.businessInfo?.category === 'Professional' || 
                    formData.businessInfo?.category === 'Creator/Influencer'
                      ? 'Digital Marketing Consultant'
                      : 'Best Coffee in Mumbai'
                  }
                  value={formData.businessInfo?.tagline || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, tagline: e.target.value }
                  })}
                  className="h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  For personal: "Digital Marketing Consultant" | For business: "Best Coffee in Mumbai"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people about yourself or your business..."
                  rows={3}
                  value={formData.businessInfo?.description || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, description: e.target.value }
                  })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                <Select
                  value={formData.businessInfo?.category}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, category: value }
                  })}
                >
                  <SelectTrigger className="h-10">
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
                <Label htmlFor="logo" className="text-xs sm:text-sm">Profile Image / Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.businessInfo?.logo || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, logo: e.target.value }
                  })}
                  className="h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Your photo or business logo. Recommended: 400 x 400px (square)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage" className="text-xs sm:text-sm">Cover Image / Banner URL</Label>
                <Input
                  id="coverImage"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={formData.businessInfo?.coverImage || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    businessInfo: { ...formData.businessInfo!, coverImage: e.target.value }
                  })}
                  className="h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Recommended: 780 x 300px (or 1560 x 600px for high-res)
                </p>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contact">
          <section className="rounded-2xl bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 p-1">
            <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <Icon icon="solar:phone-linear" className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Contact Information</h2>
                <p className="text-xs text-muted-foreground truncate">How can people reach you?</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-4 sm:p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.contact?.phone || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, phone: e.target.value }
                  })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hello@mybusiness.com"
                  value={formData.contact?.email || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, email: e.target.value }
                  })}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-xs sm:text-sm">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+1 555-123-4567"
                  value={formData.contact?.whatsapp || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, whatsapp: e.target.value }
                  })}
                  className="h-10"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Enter number with country code (e.g., +1 555-123-4567)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs sm:text-sm">Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, Country"
                  rows={2}
                  value={formData.contact?.address || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact: { ...formData.contact!, address: e.target.value }
                  })}
                  className="text-sm"
                />
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="links">
          <section className="rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 p-1">
            <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Icon icon="solar:link-linear" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Action Links</h2>
                <p className="text-xs text-muted-foreground truncate">Add buttons for services, products, or booking</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-4 sm:p-5 space-y-4">
              {formData.links && formData.links.length > 0 ? (
                <div className="space-y-3">
                  {formData.links.map((link, index) => (
                    <div key={link.id} className="p-3 sm:p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move shrink-0" />
                          <Select
                            value={link.type}
                            onValueChange={(value) => updateLink(index, { type: value as any })}
                          >
                            <SelectTrigger className="flex-1 h-9 text-xs sm:text-sm">
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
                            className="h-9 w-9 p-0 shrink-0"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Label</Label>
                            <Input
                              placeholder={link.type === 'whatsapp' ? 'Chat on WhatsApp' : 'Order Now'}
                              value={link.label}
                              onChange={(e) => updateLink(index, { label: e.target.value })}
                              className="h-9 text-sm"
                            />
                          </div>
                          
                          {link.type === 'whatsapp' ? (
                            <>
                              <div className="space-y-1.5">
                                <Label className="text-xs">WhatsApp Number</Label>
                                <Input
                                  placeholder="+1 234 567 8900"
                                  value={link.url.replace('https://wa.me/', '').split('?')[0]}
                                  onChange={(e) => {
                                    const phone = e.target.value.replace(/\D/g, '');
                                    const currentMessage = new URLSearchParams(link.url.split('?')[1] || '').get('text') || '';
                                    const waUrl = phone 
                                      ? `https://wa.me/${phone}${currentMessage ? `?text=${encodeURIComponent(currentMessage)}` : ''}`
                                      : '';
                                    updateLink(index, { url: waUrl });
                                  }}
                                  className="h-9 text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                  With country code (e.g., 919876543210)
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Pre-filled Message (Optional)</Label>
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
                                  className="text-sm"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1.5">
                              <Label className="text-xs">URL</Label>
                              <Input
                                placeholder={
                                  link.type === 'email' ? 'mailto:email@example.com' :
                                  link.type === 'phone' ? 'tel:+1234567890' :
                                  link.type === 'maps' ? 'https://maps.google.com/?q=...' :
                                  'https://...'
                                }
                                value={link.url}
                                onChange={(e) => updateLink(index, { url: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  No links added yet. Add your first link below.
                </p>
              )}
              
              <div className="flex justify-center">
                <Button onClick={addLink} variant="outline" className="w-full h-10 text-xs font-medium border-dashed border-stone-300 dark:border-stone-700 text-muted-foreground hover:text-foreground hover:border-stone-400 dark:hover:border-stone-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="social">
          <section className="rounded-2xl bg-gradient-to-br from-pink-50/50 to-rose-50/30 dark:from-pink-950/20 dark:to-rose-950/10 p-1">
            <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                <Icon icon="solar:share-linear" className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Social Media</h2>
                <p className="text-xs text-muted-foreground">Add your social media profiles</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-4 sm:p-5 relative">
              {/* Animated focus indicator - hidden on mobile */}
              <div 
                className="absolute left-0 w-1 bg-primary rounded-full transition-all duration-300 ease-out hidden sm:block"
                style={{
                  height: '44px',
                  top: `${(focusedSocial ?? 0) * 60}px`,
                  opacity: focusedSocial !== null ? 1 : 0,
                }}
              />
              
              <div className="space-y-3 sm:space-y-4">
                {/* Instagram */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-8 sm:justify-center">
                    <Icon icon="ri:instagram-fill" className="h-5 w-5 text-pink-500" />
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Instagram</span>
                  </div>
                  <div className="flex-1 flex items-center h-10 sm:h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-28 sm:w-36 shrink-0 h-full flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">instagram.com/</span>
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
                      className="flex-1 h-full px-2 sm:px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* YouTube */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-8 sm:justify-center">
                    <Icon icon="ri:youtube-fill" className="h-5 w-5 text-red-500" />
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">YouTube</span>
                  </div>
                  <div className="flex-1 flex items-center h-10 sm:h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-28 sm:w-36 shrink-0 h-full flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">youtube.com/</span>
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
                      className="flex-1 h-full px-2 sm:px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-8 sm:justify-center">
                    <Icon icon="ri:facebook-circle-fill" className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">Facebook</span>
                  </div>
                  <div className="flex-1 flex items-center h-10 sm:h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-28 sm:w-36 shrink-0 h-full flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">facebook.com/</span>
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
                      className="flex-1 h-full px-2 sm:px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Twitter / X */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-8 sm:justify-center">
                    <Icon icon="ri:twitter-x-fill" className="h-5 w-5 text-foreground" />
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">X (Twitter)</span>
                  </div>
                  <div className="flex-1 flex items-center h-10 sm:h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-28 sm:w-36 shrink-0 h-full flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">x.com/</span>
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
                      className="flex-1 h-full px-2 sm:px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-8 sm:justify-center">
                    <Icon icon="ri:linkedin-box-fill" className="h-5 w-5 text-blue-700" />
                    <span className="text-xs font-medium text-muted-foreground sm:hidden">LinkedIn</span>
                  </div>
                  <div className="flex-1 flex items-center h-10 sm:h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <span className="w-28 sm:w-36 shrink-0 h-full flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground select-none bg-stone-200 dark:bg-stone-800">linkedin.com/in/</span>
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
                      className="flex-1 h-full px-2 sm:px-3 bg-stone-50 dark:bg-stone-900 border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="lead-capture">
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Form Card - Colorful Style */}
            <section className="rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 p-1">
              <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:chat-square-linear" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">Contact Form</h2>
                  <p className="text-xs text-muted-foreground truncate sm:hidden">Capture leads into CRM</p>
                </div>
              </header>
              <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Toggle Row - Improved mobile layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Enable contact form</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Capture leads directly into your CRM</p>
                      </div>
                      <Switch
                        size="lg"
                        checked={formData.contactForm?.enabled ?? true}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          contactForm: { ...formData.contactForm!, enabled: checked }
                        })}
                        className="shrink-0 data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>

                  {formData.contactForm?.enabled && (
                    <>
                      <div className="h-px bg-stone-200 dark:bg-stone-800" />
                      
                      {/* Button Text */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Button Text</label>
                        <Input
                          className="h-10 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                          className="h-10 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                          className="min-h-[72px] text-sm bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
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
                  <div className="px-4 sm:px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 rounded-b-xl">
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 shrink-0" />
                      <span>Submissions automatically create leads in your CRM</span>
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Calendar Booking Card - Colorful Style */}
            <section className="rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 p-1">
              <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:calendar-mark-linear" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">Calendar Booking</h2>
                  <p className="text-xs text-muted-foreground truncate sm:hidden">Book appointments</p>
                </div>
              </header>
              <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Toggle Row - Improved mobile layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Enable Cal.com booking</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Let visitors book appointments directly</p>
                      </div>
                      <Switch
                        size="lg"
                        checked={formData.calendarBooking?.enabled || false}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          calendarBooking: { ...formData.calendarBooking!, enabled: checked }
                        })}
                        className="shrink-0 data-[state=checked]:bg-blue-500"
                      />
                    </div>
                  </div>

                  {formData.calendarBooking?.enabled && (
                    <>
                      <div className="h-px bg-stone-200 dark:bg-stone-800" />
                      
                      {/* Info Banner */}
                      <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                        <Icon icon="solar:calendar-linear" className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Get a free Cal.com account at <a href="https://cal.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-foreground">cal.com</a>
                        </p>
                      </div>

                      {/* Cal.com Username */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Cal.com Username</label>
                        <div className="flex items-center h-10 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                          <span className="w-20 sm:w-24 shrink-0 h-full flex items-center px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground bg-stone-100 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 select-none">cal.com/</span>
                          <input
                            className="flex-1 h-full px-2 sm:px-3 bg-stone-50 dark:bg-stone-900 text-sm outline-none text-foreground placeholder:text-muted-foreground"
                            placeholder="your-username"
                            value={formData.calendarBooking?.calcomUsername || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              calendarBooking: { ...formData.calendarBooking!, calcomUsername: e.target.value }
                            })}
                          />
                        </div>
                      </div>

                      {/* Event Slug */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Event Type <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <Input
                          className="h-10 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="30min"
                          value={formData.calendarBooking?.calcomEventSlug || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            calendarBooking: { ...formData.calendarBooking!, calcomEventSlug: e.target.value }
                          })}
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Leave empty to show all event types</p>
                      </div>

                      {/* Button Text */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Button Text</label>
                        <Input
                          className="h-10 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="Book Appointment"
                          value={formData.calendarBooking?.buttonText || 'Book Appointment'}
                          onChange={(e) => setFormData({
                            ...formData,
                            calendarBooking: { ...formData.calendarBooking!, buttonText: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                {/* Footer Notice */}
                {formData.calendarBooking?.enabled && (
                  <div className="px-4 sm:px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 rounded-b-xl">
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                      <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5 shrink-0" />
                      <span>Bookings sync to CRM when Cal.com API is configured in Settings</span>
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Voice Chat AI Card - Colorful Style */}
            <section className="rounded-2xl bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30 dark:from-purple-950/20 dark:to-fuchsia-950/10 p-1">
              <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <AiChatbotIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">Voice Chat AI</h2>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 whitespace-nowrap">109 Languages</span>
              </header>
              <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Toggle Row - Improved mobile layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Enable Voice Chat AI</p>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Voice & text chat with automatic lead capture</p>
                      </div>
                      <Switch
                        size="lg"
                        checked={formData.voiceChatbot?.enabled || false}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          voiceChatbot: { ...formData.voiceChatbot!, enabled: checked }
                        })}
                        className="shrink-0 data-[state=checked]:bg-purple-500"
                      />
                    </div>
                  </div>

                  {formData.voiceChatbot?.enabled && (
                    <>
                      <div className="h-px bg-stone-200 dark:bg-stone-800" />
                      
                      {/* Info Banner */}
                      <div className="flex items-start gap-2 p-2.5 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50">
                        <Icon icon="solar:lightbulb-linear" className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Configure Voice Chat AI in <span className="font-medium">Settings → API Integrations</span>
                        </p>
                      </div>

                      {/* Custom Greeting */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Custom Greeting <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <Textarea
                          className="min-h-[72px] text-sm bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
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
                          <SelectTrigger className="h-10 bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right">Bottom Right</SelectItem>
                            <SelectItem value="left">Bottom Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Features List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'Voice & text in 109 languages',
                          'Automatic lead capture',
                          'Direct CRM integration',
                          'Auto follow-up campaigns'
                        ].map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                            <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Widget Embed Code Section */}
            {formData.voiceChatbot?.enabled && (
              <WidgetEmbedCode
                cardId={cardId}
                enabled={formData.voiceChatbot.enabled}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <section className="rounded-2xl bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 p-1">
            <header className="flex items-center gap-2 px-4 sm:px-5 py-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Icon icon="solar:palette-linear" className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Branding & Theme</h2>
                <p className="text-xs text-muted-foreground truncate">Customize the look and feel of your digital card</p>
              </div>
            </header>
            <div className="rounded-xl bg-white dark:bg-stone-950 shadow-sm ring-1 ring-stone-200/60 dark:ring-stone-800">
              <div className="p-4 sm:p-5 space-y-4">
              {/* Color Pickers - Stack on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="space-y-2 flex-1">
                  <Label className="text-xs font-medium text-muted-foreground">Primary Color</Label>
                  <div className="relative group">
                    <div className="flex items-center h-10 sm:h-11 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 overflow-hidden transition-all hover:border-stone-300 dark:hover:border-stone-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <div className="relative w-10 sm:w-11 h-10 sm:h-11 shrink-0">
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
                        className="flex-1 h-full px-2 sm:px-3 bg-transparent font-mono text-xs sm:text-sm uppercase text-foreground placeholder:text-muted-foreground focus:outline-none"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-xs font-medium text-muted-foreground">Secondary Color</Label>
                  <div className="relative group">
                    <div className="flex items-center h-10 sm:h-11 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 overflow-hidden transition-all hover:border-stone-300 dark:hover:border-stone-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <div className="relative w-10 sm:w-11 h-10 sm:h-11 shrink-0">
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
                        className="flex-1 h-full px-2 sm:px-3 bg-transparent font-mono text-xs sm:text-sm uppercase text-foreground placeholder:text-muted-foreground focus:outline-none"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily" className="text-xs sm:text-sm">Font Family</Label>
                <Select
                  value={formData.branding?.fontFamily || 'Inter'}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    branding: { ...formData.branding!, fontFamily: value }
                  })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme" className="text-xs sm:text-sm">Theme</Label>
                <Select
                  value={formData.branding?.theme || 'modern'}
                  onValueChange={(value: any) => setFormData({
                    ...formData,
                    branding: { ...formData.branding!, theme: value }
                  })}
                >
                  <SelectTrigger className="h-10">
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
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="embed">
          <WebsiteEmbedCodes
            cardUsername={formData.username || ''}
            calcomUsername={formData.calendarBooking?.enabled ? formData.calendarBooking?.calcomUsername : undefined}
            calcomEventSlug={formData.calendarBooking?.calcomEventSlug}
            voiceChatEnabled={formData.voiceChatbot?.enabled}
            contactFormEnabled={formData.contactForm?.enabled}
            calendarBookingEnabled={formData.calendarBooking?.enabled}
            primaryColor={formData.branding?.primaryColor}
            businessName={formData.businessInfo?.name}
          />
        </TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
        <Button
          variant="outline"
          onClick={() => router.push('/digital-card/manage')}
          disabled={saving}
          className="w-full sm:w-auto h-10"
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={saving}
          variant="outline"
          className="w-full sm:w-auto h-10 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Card'
          )}
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="w-full sm:w-auto h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            'Update & Publish'
          )}
        </Button>
      </div>
    </div>
  );
}
