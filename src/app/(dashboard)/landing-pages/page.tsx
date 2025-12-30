'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { 
  publishLandingPage, 
  saveLandingPage, 
  getUserLandingPages, 
  deleteLandingPage,
} from '@/app/actions/landing-page-actions';
import { AIAssistButton } from '@/components/landing-pages/ai-assist-modal';
import { CloneFromReferenceModal } from '@/components/landing-pages/clone-from-reference-modal';
import { getCompany, getStoredPlans } from '@/lib/saas-data';
import type { Plan } from '@/types/saas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

// Landing page templates with better previews
const pageTemplates = [
  {
    id: 'lead-capture',
    name: 'Lead Capture',
    description: 'Collect emails & grow your list',
    icon: 'solar:user-plus-bold',
    preview: 'bg-gradient-to-br from-blue-500 to-purple-600',
    popular: true,
    sections: ['hero', 'form'],
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce your new product',
    icon: 'solar:rocket-bold',
    preview: 'bg-gradient-to-br from-orange-500 to-red-600',
    sections: ['hero', 'features', 'cta'],
  },
  {
    id: 'webinar',
    name: 'Webinar Registration',
    description: 'Get signups for your event',
    icon: 'solar:videocamera-record-bold',
    preview: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    popular: true,
    sections: ['hero', 'countdown', 'form'],
  },
  {
    id: 'coming-soon',
    name: 'Coming Soon',
    description: 'Build anticipation & collect emails',
    icon: 'solar:clock-circle-bold',
    preview: 'bg-gradient-to-br from-pink-500 to-rose-600',
    sections: ['hero', 'countdown', 'form'],
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    description: 'Post-conversion confirmation',
    icon: 'solar:heart-bold',
    preview: 'bg-gradient-to-br from-violet-500 to-indigo-600',
    sections: ['hero', 'cta'],
  },
  {
    id: 'sales-page',
    name: 'Sales Page',
    description: 'Sell your product or service',
    icon: 'solar:tag-price-bold',
    preview: 'bg-gradient-to-br from-amber-500 to-orange-600',
    popular: true,
    sections: ['header', 'hero', 'features', 'testimonial', 'pricing', 'faq', 'cta', 'footer'],
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: 'solar:document-bold',
    preview: 'bg-stone-200 dark:bg-stone-800',
    sections: [],
  },
];

// Section types for the builder
const sectionTypes = [
  { id: 'header', name: 'Header/Nav', icon: 'solar:hamburger-menu-bold', description: 'Logo & navigation' },
  { id: 'hero', name: 'Hero Section', icon: 'solar:star-bold', description: 'Main headline & intro' },
  { id: 'features', name: 'Features', icon: 'solar:widget-4-bold', description: 'Highlight key benefits' },
  { id: 'testimonial', name: 'Testimonial', icon: 'solar:chat-round-dots-bold', description: 'Customer reviews' },
  { id: 'cta', name: 'Call to Action', icon: 'solar:cursor-bold', description: 'Drive action' },
  { id: 'form', name: 'Lead Form', icon: 'solar:document-add-bold', description: 'Capture leads' },
  { id: 'faq', name: 'FAQ', icon: 'solar:question-circle-bold', description: 'Answer questions' },
  { id: 'pricing', name: 'Pricing', icon: 'solar:tag-price-bold', description: 'Show your plans' },
  { id: 'gallery', name: 'Gallery', icon: 'solar:gallery-bold', description: 'Image showcase' },
  { id: 'video', name: 'Video', icon: 'solar:play-circle-bold', description: 'Embed video' },
  { id: 'countdown', name: 'Countdown', icon: 'solar:clock-circle-bold', description: 'Create urgency' },
  { id: 'footer', name: 'Footer', icon: 'solar:align-bottom-bold', description: 'Links & copyright' },
];

interface PageSection {
  id: string;
  type: string;
  content: Record<string, any>;
}

interface LandingPage {
  id: string;
  name: string;
  slug: string;
  template: string;
  sections: PageSection[];
  settings: {
    primaryColor: string;
    fontFamily: string;
    favicon?: string;
    metaTitle?: string;
    metaDescription?: string;
    aiAssistant?: {
      enabled: boolean;
      greeting?: string;
      position?: 'left' | 'right';
    };
  };
  isPublished: boolean;
  createdAt: Date | string;
  stats?: {
    views: number;
    submissions: number;
  };
}

type ViewMode = 'list' | 'editor';

export default function LandingPagesPage() {
  const { toast } = useToast();
  const { appUser, isSuperAdmin } = useAuth();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [activePage, setActivePage] = useState<LandingPage | null>(null);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [isSectionPanelOpen, setIsSectionPanelOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Plan limit state
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  // Load user's landing pages and plan info on mount
  useEffect(() => {
    async function loadPagesAndPlan() {
      if (!appUser?.uid || !appUser?.companyId) {
        setLoading(false);
        return;
      }
      try {
        // Load pages and plan info in parallel
        const [userPages, company, plans] = await Promise.all([
          getUserLandingPages(appUser.uid),
          getCompany(appUser.companyId),
          getStoredPlans()
        ]);
        
        setPages(userPages as LandingPage[]);
        
        // Check plan limits (super admins bypass all limits)
        if (company && plans && !isSuperAdmin) {
          const plan = plans.find(p => p.id === company.planId);
          if (plan) {
            setCurrentPlan(plan);
            // Check if user has reached their landing page limit
            const maxPages = plan.maxLandingPages;
            if (maxPages !== null && maxPages !== undefined && userPages.length >= maxPages) {
              setHasReachedLimit(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading pages:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPagesAndPlan();
  }, [appUser?.uid, appUser?.companyId, isSuperAdmin]);

  const handleSectionClick = (section: PageSection) => {
    setSelectedSection(section);
    setIsSectionPanelOpen(true);
  };

  const createNewPage = (templateId: string) => {
    // Check if user has reached their limit
    if (hasReachedLimit && currentPlan) {
      toast({ 
        title: 'Limit Reached', 
        description: `Your ${currentPlan.name} plan allows only ${currentPlan.maxLandingPages} landing page(s). Upgrade to create more.`,
        variant: 'destructive'
      });
      setShowTemplates(false);
      return;
    }
    
    const template = pageTemplates.find(t => t.id === templateId);
    const timestamp = Date.now();
    const newPage: LandingPage = {
      id: `page_${timestamp}`,
      name: template?.name || 'New Page',
      slug: `my-page-${timestamp.toString(36)}`,
      template: templateId,
      sections: getDefaultSections(templateId),
      settings: {
        primaryColor: '#3b82f6',
        fontFamily: 'Inter',
        metaTitle: template?.name || 'New Page',
        metaDescription: template?.description || '',
      },
      isPublished: false,
      createdAt: new Date().toISOString(),
      stats: { views: 0, submissions: 0 },
    };
    setPages(prev => [newPage, ...prev]);
    setActivePage(newPage);
    setShowTemplates(false);
    setViewMode('editor');
    toast({ title: '🎉 Page Created!', description: 'Start customizing your landing page' });
  };

  const getDefaultSections = (templateId: string): PageSection[] => {
    const template = pageTemplates.find(t => t.id === templateId);
    if (!template) return [];

    return template.sections.map((sectionType, index) => {
      const defaultContent = getDefaultContent(sectionType);
      return {
        id: `section_${Date.now()}_${index}`,
        type: sectionType,
        content: defaultContent,
      };
    });
  };

  const getDefaultContent = (sectionType: string): Record<string, any> => {
    switch (sectionType) {
      case 'hero':
        return { headline: 'Your Amazing Headline', subheadline: 'A compelling subheadline that explains your value proposition' };
      case 'form':
        return { fields: ['name', 'email'], buttonText: 'Get Started Free' };
      case 'cta':
        return { text: 'Ready to get started?', buttonText: 'Start Now' };
      case 'features':
        return { items: [
          { title: 'Easy to Use', description: 'Simple and intuitive interface' },
          { title: 'Fast Results', description: 'See results in minutes' },
          { title: 'Great Support', description: '24/7 customer support' },
        ]};
      case 'countdown':
        return { targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() };
      case 'testimonial':
        return { quote: 'This product changed everything for our business!', author: 'Happy Customer, CEO' };
      case 'pricing':
        return { plans: [
          { name: 'Starter', price: '$9', features: ['Feature 1', 'Feature 2'] },
          { name: 'Pro', price: '$29', features: ['Everything in Starter', 'Feature 3'], popular: true },
        ]};
      case 'faq':
        return { items: [
          { q: 'How does it work?', a: 'Simply sign up and start using our platform.' },
          { q: 'Is there a free trial?', a: 'Yes! We offer a 14-day free trial.' },
        ]};
      case 'header':
        return { 
          logo: '', 
          logoText: 'Your Brand',
          menuItems: [
            { label: 'Home', url: '#' },
            { label: 'Features', url: '#features' },
            { label: 'Pricing', url: '#pricing' },
            { label: 'Contact', url: '#contact' },
          ],
          ctaButton: { label: 'Get Started', url: '#' },
          sticky: true,
        };
      case 'footer':
        return {
          logo: '',
          logoText: 'Your Brand',
          description: 'Your company tagline or brief description goes here.',
          columns: [
            { 
              title: 'Product', 
              links: [
                { label: 'Features', url: '#' },
                { label: 'Pricing', url: '#' },
                { label: 'FAQ', url: '#' },
              ]
            },
            { 
              title: 'Company', 
              links: [
                { label: 'About', url: '#' },
                { label: 'Blog', url: '#' },
                { label: 'Careers', url: '#' },
              ]
            },
            { 
              title: 'Legal', 
              links: [
                { label: 'Privacy', url: '#' },
                { label: 'Terms', url: '#' },
              ]
            },
          ],
          socialLinks: [
            { platform: 'twitter', url: '#' },
            { platform: 'facebook', url: '#' },
            { platform: 'instagram', url: '#' },
          ],
          copyright: '© 2025 Your Company. All rights reserved.',
        };
      default:
        return {};
    }
  };

  const addSection = (sectionType: string) => {
    if (!activePage) return;
    const newSection: PageSection = {
      id: `section_${Date.now()}`,
      type: sectionType,
      content: getDefaultContent(sectionType),
    };
    const updated = {
      ...activePage,
      sections: [...activePage.sections, newSection],
    };
    setActivePage(updated);
    setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedSection(newSection);
    setIsSectionPanelOpen(true);
    toast({ title: 'Section Added', description: `${sectionTypes.find(s => s.id === sectionType)?.name} added to your page` });
  };

  const deleteSection = (sectionId: string) => {
    if (!activePage) return;
    const updated = {
      ...activePage,
      sections: activePage.sections.filter(s => s.id !== sectionId),
    };
    setActivePage(updated);
    setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedSection(null);
    setIsSectionPanelOpen(false);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!activePage) return;
    const sections = [...activePage.sections];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    
    const updated = { ...activePage, sections };
    setActivePage(updated);
    setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const duplicatePage = (page: LandingPage) => {
    const timestamp = Date.now();
    const newPage: LandingPage = {
      ...page,
      id: `page_${timestamp}`,
      name: `${page.name} (Copy)`,
      slug: `${page.slug}-copy-${timestamp.toString(36)}`,
      isPublished: false,
      createdAt: new Date().toISOString(),
      stats: { views: 0, submissions: 0 },
    };
    setPages(prev => [newPage, ...prev]);
    toast({ title: 'Page Duplicated', description: 'A copy of your page has been created' });
  };

  const handleDeletePage = async (pageId: string) => {
    if (!appUser?.uid) return;
    if (!confirm('Are you sure you want to delete this page? This cannot be undone.')) return;
    
    try {
      await deleteLandingPage(appUser.uid, pageId);
      setPages(prev => prev.filter(p => p.id !== pageId));
      if (activePage?.id === pageId) {
        setActivePage(null);
        setViewMode('list');
      }
      toast({ title: 'Page Deleted', description: 'Your page has been deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' });
    }
  };

  const copyPageLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
    toast({ title: 'Link Copied!', description: 'Page URL copied to clipboard' });
  };

  const publishPage = async () => {
    if (!activePage || !appUser?.uid) return;
    setPublishing(true);
    try {
      const result = await publishLandingPage(appUser.uid, {
        ...activePage,
        createdAt: activePage.createdAt || new Date().toISOString(),
      } as any);
      
      if (result.success) {
        const updated = { ...activePage, isPublished: true };
        setActivePage(updated);
        setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast({ 
          title: '🎉 Page Published!', 
          description: (
            <div className="mt-1 space-y-2">
              <p className="text-sm">Your page is now live!</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => copyPageLink(activePage.slug)}
              >
                <Icon icon="solar:copy-linear" className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </div>
          ),
        });
      } else {
        toast({ title: 'Error', description: 'Failed to publish page', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  };

  const savePage = async () => {
    if (!activePage || !appUser?.uid) return;
    setSaving(true);
    try {
      const result = await saveLandingPage(appUser.uid, {
        ...activePage,
        createdAt: activePage.createdAt || new Date().toISOString(),
      } as any);
      
      if (result.success) {
        toast({ title: '✓ Saved', description: 'All changes saved' });
      } else {
        toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openPageEditor = (page: LandingPage) => {
    setActivePage(page);
    setViewMode('editor');
  };

  const backToList = () => {
    setActivePage(null);
    setViewMode('list');
    setSelectedSection(null);
    setIsSectionPanelOpen(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading your pages...</p>
        </div>
      </div>
    );
  }

  // Handle page created from clone
  const handleClonedPageCreated = (clonedPage: {
    name: string;
    sections: Array<{ type: string; content: Record<string, any> }>;
    settings: { primaryColor: string; fontFamily: string };
  }) => {
    // Check if user has reached their limit
    if (hasReachedLimit && currentPlan) {
      toast({ 
        title: 'Limit Reached', 
        description: `Your ${currentPlan.name} plan allows only ${currentPlan.maxLandingPages} landing page(s). Upgrade to create more.`,
        variant: 'destructive'
      });
      setShowCloneModal(false);
      return;
    }
    
    const timestamp = Date.now();
    const newPage: LandingPage = {
      id: `page_${timestamp}`,
      name: clonedPage.name,
      slug: `${clonedPage.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp.toString(36)}`,
      template: 'cloned',
      sections: clonedPage.sections.map((s, i) => ({
        id: `section_${timestamp}_${i}`,
        type: s.type,
        content: s.content,
      })),
      settings: {
        ...clonedPage.settings,
        metaTitle: clonedPage.name,
        metaDescription: '',
      },
      isPublished: false,
      createdAt: new Date().toISOString(),
      stats: { views: 0, submissions: 0 },
    };
    setPages(prev => [newPage, ...prev]);
    setActivePage(newPage);
    setShowCloneModal(false);
    setViewMode('editor');
    toast({ title: '🎉 Page Created from Reference!', description: `${clonedPage.sections.length} sections generated` });
  };

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Landing Pages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create beautiful pages that convert visitors into leads
          </p>
        </div>
        {viewMode === 'list' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => hasReachedLimit ? null : setShowCloneModal(true)} 
              disabled={hasReachedLimit}
              className="gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-300 dark:border-emerald-700 hover:from-emerald-500/20 hover:to-teal-500/20 text-xs sm:text-sm"
            >
              <Icon icon="solar:copy-bold" className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-300 truncate">Clone from Reference</span>
            </Button>
            <Button onClick={() => hasReachedLimit ? null : setShowTemplates(true)} disabled={hasReachedLimit} className="gap-2 text-xs sm:text-sm">
              <Icon icon="solar:add-circle-bold" className="h-4 w-4 shrink-0" />
              <span className="truncate">Create New Page</span>
            </Button>
          </div>
        )}
      </div>

      {/* Free Plan Limit Banner */}
      {hasReachedLimit && currentPlan && viewMode === 'list' && (
        <Alert className="mb-6 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
          <Icon icon="solar:shield-warning-bold" className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">Landing Page Limit Reached</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <p className="mb-3">
              Your <strong>{currentPlan.name}</strong> plan allows only <strong>{currentPlan.maxLandingPages}</strong> landing page{currentPlan.maxLandingPages === 1 ? '' : 's'}. 
              Upgrade to create unlimited landing pages with AI-powered content generation.
            </p>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/settings?tab=billing">
                <Icon icon="solar:rocket-bold" className="h-4 w-4 mr-2" />
                Upgrade Now
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Clone from Reference Modal */}
      <CloneFromReferenceModal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        onPageCreated={handleClonedPageCreated}
      />

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-950 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Choose a Template</h2>
                  <p className="text-sm text-muted-foreground">Pick a starting point for your page</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowTemplates(false)}>
                  <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-5 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pageTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => createNewPage(template.id)}
                    className="group text-left relative"
                  >
                    {template.popular && (
                      <span className="absolute -top-2 -right-2 z-10 px-2.5 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border-2 border-white dark:border-stone-950">
                        ⭐ Popular
                      </span>
                    )}
                    <div className={cn(
                      "aspect-[4/3] rounded-xl mb-3 flex items-center justify-center transition-all group-hover:scale-[1.02] group-hover:shadow-lg border-2 border-transparent group-hover:border-primary/50",
                      template.preview
                    )}>
                      <Icon icon={template.icon} className="h-10 w-10 text-white/90" />
                    </div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        /* Pages List View */
        <div>
          {pages.length === 0 ? (
            /* Empty State */
            <div className="border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-5">
                <Icon icon="solar:document-add-bold" className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Your First Landing Page</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Build beautiful, high-converting landing pages in minutes. No coding required!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setShowTemplates(true)} size="lg" className="gap-2">
                  <Icon icon="solar:add-circle-bold" className="h-5 w-5" />
                  Start from Template
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setShowCloneModal(true)}
                  className="gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-300 dark:border-emerald-700"
                >
                  <Icon icon="solar:copy-bold" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">Clone from Reference</span>
                </Button>
              </div>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 max-w-xl mx-auto">
                {[
                  { icon: 'solar:palette-bold', text: 'Beautiful Templates' },
                  { icon: 'solar:magic-stick-3-bold', text: 'AI-Powered Copy' },
                  { icon: 'solar:copy-bold', text: 'Clone Any Page' },
                  { icon: 'solar:chart-bold', text: 'Track Results' },
                ].map((feature, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-2">
                      <Icon icon={feature.icon} className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Pages Grid */
            <div className="space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Pages', value: pages.length, icon: 'solar:document-bold', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Published', value: pages.filter(p => p.isPublished).length, icon: 'solar:check-circle-bold', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Drafts', value: pages.filter(p => !p.isPublished).length, icon: 'solar:pen-bold', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Total Leads', value: pages.reduce((acc, p) => acc + (p.stats?.submissions || 0), 0), icon: 'solar:users-group-rounded-bold', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                        <Icon icon={stat.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pages List */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pages.map(page => (
                  <div
                    key={page.id}
                    className="group p-4 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 hover:shadow-lg transition-all"
                  >
                    {/* Page Preview Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        pageTemplates.find(t => t.id === page.template)?.preview || 'bg-stone-100 dark:bg-stone-800'
                      )}>
                        <Icon 
                          icon={pageTemplates.find(t => t.id === page.template)?.icon || 'solar:document-bold'} 
                          className="h-6 w-6 text-white" 
                        />
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-full",
                        page.isPublished 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {page.isPublished ? '● Live' : '○ Draft'}
                      </span>
                    </div>

                    {/* Page Info */}
                    <h3 className="font-semibold mb-1 truncate">{page.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 truncate">
                      /{page.slug}
                    </p>

                    {/* Stats */}
                    {page.isPublished && (
                      <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:eye-linear" className="h-3.5 w-3.5" />
                          {page.stats?.views || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:user-plus-linear" className="h-3.5 w-3.5" />
                          {page.stats?.submissions || 0} leads
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openPageEditor(page)}
                      >
                        <Icon icon="solar:pen-linear" className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      {page.isPublished && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyPageLink(page.slug)}
                        >
                          {copiedLink === page.slug ? (
                            <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-green-500" />
                          ) : (
                            <Icon icon="solar:copy-linear" className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => duplicatePage(page)}
                      >
                        <Icon icon="solar:copy-bold-duotone" className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePage(page.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Page Editor View */
        <PageEditor
          page={activePage!}
          setPage={(updated) => {
            setActivePage(updated);
            setPages(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
          onBack={backToList}
          onSave={savePage}
          onPublish={publishPage}
          saving={saving}
          publishing={publishing}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          selectedSection={selectedSection}
          onSectionClick={handleSectionClick}
          onAddSection={addSection}
          onDeleteSection={deleteSection}
          onMoveSection={moveSection}
          sectionTypes={sectionTypes}
          isSectionPanelOpen={isSectionPanelOpen}
          setIsSectionPanelOpen={setIsSectionPanelOpen}
          setSelectedSection={setSelectedSection}
          isSettingsPanelOpen={isSettingsPanelOpen}
          setIsSettingsPanelOpen={setIsSettingsPanelOpen}
          copyPageLink={copyPageLink}
        />
      )}

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="landing-pages" />
    </div>
  );
}


// Page Editor Component
interface PageEditorProps {
  page: LandingPage;
  setPage: (page: LandingPage) => void;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
  previewMode: 'desktop' | 'mobile';
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  selectedSection: PageSection | null;
  onSectionClick: (section: PageSection) => void;
  onAddSection: (type: string) => void;
  onDeleteSection: (id: string) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  sectionTypes: typeof sectionTypes;
  isSectionPanelOpen: boolean;
  setIsSectionPanelOpen: (open: boolean) => void;
  setSelectedSection: (section: PageSection | null) => void;
  isSettingsPanelOpen: boolean;
  setIsSettingsPanelOpen: (open: boolean) => void;
  copyPageLink: (slug: string) => void;
}

function PageEditor({
  page,
  setPage,
  onBack,
  onSave,
  onPublish,
  saving,
  publishing,
  previewMode,
  setPreviewMode,
  selectedSection,
  onSectionClick,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  sectionTypes,
  isSectionPanelOpen,
  setIsSectionPanelOpen,
  setSelectedSection,
  isSettingsPanelOpen,
  setIsSettingsPanelOpen,
  copyPageLink,
}: PageEditorProps) {
  const [showAddSectionSheet, setShowAddSectionSheet] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[500px] lg:min-h-[600px]">
      {/* Left Sidebar - Sections (Hidden on mobile, shown on desktop) */}
      <div className="hidden lg:block lg:w-64 shrink-0 border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        {/* Back Button & Page Name */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={onBack}>
            <Icon icon="solar:arrow-left-linear" className="h-4 w-4 mr-1" />
            Back to Pages
          </Button>
          <Input
            value={page.name}
            onChange={(e) => setPage({ ...page, name: e.target.value })}
            className="font-semibold"
            placeholder="Page Name"
          />
        </div>

        {/* Add Sections */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add Sections</h3>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {sectionTypes.map(section => (
              <button
                key={section.id}
                onClick={() => onAddSection(section.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon icon={section.icon} className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{section.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{section.description}</p>
                </div>
                <Icon icon="solar:add-circle-linear" className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col border border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-100 dark:bg-stone-900 overflow-hidden min-h-[400px]">
        {/* Mobile Header - Fixed at top */}
        <div className="lg:hidden p-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
              <Icon icon="solar:arrow-left-bold" className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
                {saving ? <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" /> : <Icon icon="solar:diskette-bold" className="h-4 w-4" />}
              </Button>
              <Button size="sm" onClick={onPublish} disabled={publishing}>
                {publishing ? <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" /> : <Icon icon="solar:upload-bold" className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Input
            value={page.name}
            onChange={(e) => setPage({ ...page, name: e.target.value })}
            className="font-semibold text-sm bg-stone-50 dark:bg-stone-900"
            placeholder="Page Name"
          />
        </div>

        {/* Desktop Toolbar */}
        <div className="hidden lg:flex p-3 items-center justify-between bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={cn("p-1.5 rounded-md transition-colors", previewMode === 'desktop' && "bg-white dark:bg-stone-700 shadow-sm")}
              >
                <Icon icon="solar:monitor-linear" className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={cn("p-1.5 rounded-md transition-colors", previewMode === 'mobile' && "bg-white dark:bg-stone-700 shadow-sm")}
              >
                <Icon icon="solar:smartphone-linear" className="h-4 w-4" />
              </button>
            </div>

            {/* Page Settings */}
            <Button variant="outline" size="sm" onClick={() => setIsSettingsPanelOpen(true)}>
              <Icon icon="solar:settings-linear" className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {page.isPublished && (
              <Button variant="outline" size="sm" onClick={() => copyPageLink(page.slug)}>
                <Icon icon="solar:link-linear" className="h-4 w-4 mr-1" />
                Copy Link
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
              {saving ? (
                <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Icon icon="solar:diskette-linear" className="h-4 w-4 mr-1" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" onClick={onPublish} disabled={publishing}>
              {publishing ? (
                <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Icon icon="solar:upload-linear" className="h-4 w-4 mr-1" />
              )}
              {publishing ? 'Publishing...' : page.isPublished ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>        {/* Preview Canvas - Scrollable area */}
        <div className={cn(
          "flex-1 overflow-y-auto p-3 lg:p-4 flex justify-center pb-24 lg:pb-4",
          previewMode === 'mobile' && "lg:bg-stone-200 lg:dark:bg-stone-800"
        )}>
          <div className={cn(
            "bg-white dark:bg-stone-950 rounded-xl shadow-xl overflow-hidden transition-all h-fit min-h-[300px] w-full",
            previewMode === 'desktop' ? "lg:max-w-4xl" : "lg:w-[375px]"
          )}>
            {page.sections.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                  <Icon icon="solar:add-circle-bold" className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold mb-1">Add Your First Section</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Tap the + button below to start building your page
                </p>
                <Button size="sm" onClick={() => setShowAddSectionSheet(true)} className="lg:hidden">
                  <Icon icon="solar:add-circle-bold" className="h-4 w-4 mr-1" />
                  Add Section
                </Button>
              </div>
            ) : (
              <div>
                {page.sections.map((section, index) => (
                  <SectionPreview
                    key={section.id}
                    section={section}
                    index={index}
                    totalSections={page.sections.length}
                    isSelected={selectedSection?.id === section.id}
                    onClick={() => onSectionClick(section)}
                    onDelete={() => onDeleteSection(section.id)}
                    onMoveUp={() => onMoveSection(section.id, 'up')}
                    onMoveDown={() => onMoveSection(section.id, 'down')}
                    sectionTypes={sectionTypes}
                    previewMode={previewMode}
                  />
                ))}
                
                {/* Voice Chat AI Indicator */}
                {page.settings.aiAssistant?.enabled && (
                  <div className="p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-t border-violet-200 dark:border-violet-800">
                    <div className="flex items-center justify-center gap-2 text-xs text-violet-700 dark:text-violet-300">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
                        <Icon icon="solar:microphone-3-bold" className="h-3 w-3 text-white" />
                      </div>
                      <span className="font-medium">Voice Chat AI Enabled</span>
                      <span className="text-violet-500 dark:text-violet-400 hidden sm:inline">• {page.settings.aiAssistant.position || 'right'} side</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Floating Action Buttons */}
        <div className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2">
          <Button 
            size="icon" 
            variant="outline"
            className="h-12 w-12 rounded-full shadow-lg bg-white dark:bg-stone-900"
            onClick={() => setIsSettingsPanelOpen(true)}
          >
            <Icon icon="solar:settings-bold" className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowAddSectionSheet(true)}
          >
            <Icon icon="solar:add-circle-bold" className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Add Section Sheet */}
      <Sheet open={showAddSectionSheet} onOpenChange={setShowAddSectionSheet}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Add Section</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[calc(70vh-100px)] pb-6">
            {sectionTypes.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  onAddSection(section.id);
                  setShowAddSectionSheet(false);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-primary/5 hover:border-primary/30 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon icon={section.icon} className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{section.name}</p>
                  <p className="text-[10px] text-muted-foreground">{section.description}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Section Editor Sheet */}
      <Sheet open={isSectionPanelOpen} onOpenChange={setIsSectionPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon icon={sectionTypes.find(s => s.id === selectedSection?.type)?.icon || 'solar:widget-bold'} className="h-4 w-4 text-primary" />
              </div>
              Edit {sectionTypes.find(s => s.id === selectedSection?.type)?.name}
            </SheetTitle>
          </SheetHeader>
          
          {selectedSection && (
            <SectionEditor
              section={selectedSection}
              onUpdate={(updated) => {
                setSelectedSection(updated);
                setPage({
                  ...page,
                  sections: page.sections.map(s => s.id === updated.id ? updated : s),
                });
              }}
              onDelete={() => onDeleteSection(selectedSection.id)}
              onClose={() => setIsSectionPanelOpen(false)}
              canMoveUp={page.sections.findIndex(s => s.id === selectedSection.id) > 0}
              canMoveDown={page.sections.findIndex(s => s.id === selectedSection.id) < page.sections.length - 1}
              onMoveUp={() => onMoveSection(selectedSection.id, 'up')}
              onMoveDown={() => onMoveSection(selectedSection.id, 'down')}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Page Settings Sheet */}
      <Sheet open={isSettingsPanelOpen} onOpenChange={setIsSettingsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Icon icon="solar:settings-bold" className="h-5 w-5" />
              Page Settings
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* URL Slug */}
            <div>
              <Label className="text-xs font-medium">Page URL</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/p/</span>
                <Input
                  value={page.slug}
                  onChange={(e) => setPage({ ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="my-page"
                  className="flex-1"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Only lowercase letters, numbers, and hyphens</p>
            </div>

            {/* SEO Settings */}
            <div>
              <Label className="text-xs font-medium">SEO Title</Label>
              <Input
                value={page.settings.metaTitle || ''}
                onChange={(e) => setPage({ ...page, settings: { ...page.settings, metaTitle: e.target.value } })}
                placeholder="Page title for search engines"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">SEO Description</Label>
              <Textarea
                value={page.settings.metaDescription || ''}
                onChange={(e) => setPage({ ...page, settings: { ...page.settings, metaDescription: e.target.value } })}
                placeholder="Brief description for search engines"
                className="mt-1.5"
                rows={3}
              />
            </div>

            {/* Primary Color */}
            <div>
              <Label className="text-xs font-medium">Primary Color</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={page.settings.primaryColor}
                  onChange={(e) => setPage({ ...page, settings: { ...page.settings, primaryColor: e.target.value } })}
                  className="w-10 h-10 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer"
                />
                <Input
                  value={page.settings.primaryColor}
                  onChange={(e) => setPage({ ...page, settings: { ...page.settings, primaryColor: e.target.value } })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Voice Chat AI */}
            <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-3 sm:p-4 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Icon icon="solar:microphone-3-bold" className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Voice Chat AI</p>
                    <p className="text-[10px] text-muted-foreground truncate">24/7 AI chatbot for visitors</p>
                  </div>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={() => setPage({ 
                    ...page, 
                    settings: { 
                      ...page.settings, 
                      aiAssistant: { 
                        ...page.settings.aiAssistant,
                        enabled: !page.settings.aiAssistant?.enabled 
                      } 
                    } 
                  })}
                  className={cn(
                    "relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                    page.settings.aiAssistant?.enabled 
                      ? "bg-gradient-to-r from-violet-500 to-purple-600" 
                      : "bg-stone-300 dark:bg-stone-600"
                  )}
                  role="switch"
                  aria-checked={page.settings.aiAssistant?.enabled || false}
                >
                  <span className="sr-only">Enable Voice Chat AI</span>
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                      page.settings.aiAssistant?.enabled ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              
              {page.settings.aiAssistant?.enabled && (
                <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-stone-700">
                  <div>
                    <Label className="text-xs font-medium">Custom Greeting</Label>
                    <Input
                      value={page.settings.aiAssistant?.greeting || ''}
                      onChange={(e) => setPage({ 
                        ...page, 
                        settings: { 
                          ...page.settings, 
                          aiAssistant: { 
                            ...page.settings.aiAssistant,
                            enabled: true,
                            greeting: e.target.value 
                          } 
                        } 
                      })}
                      placeholder="Hi! How can I help you today?"
                      className="mt-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Widget Position</Label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {(['left', 'right'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setPage({ 
                            ...page, 
                            settings: { 
                              ...page.settings, 
                              aiAssistant: { 
                                ...page.settings.aiAssistant,
                                enabled: true,
                                position: pos 
                              } 
                            } 
                          })}
                          className={cn(
                            "py-2.5 sm:py-2 px-3 rounded-lg text-xs font-medium border transition-colors capitalize flex flex-col items-center gap-1",
                            (page.settings.aiAssistant?.position || 'right') === pos
                              ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                              : "border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                          )}
                        >
                          <Icon icon={pos === 'left' ? 'solar:align-left-linear' : 'solar:align-right-linear'} className="h-4 w-4" />
                          <span>{pos}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                      <Icon icon="solar:info-circle-linear" className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Requires Voice Chat AI integration in Settings → Integrations</span>
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5 font-medium">
                      <Icon icon="solar:refresh-circle-linear" className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Remember to Publish/Save after enabling to apply changes</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setIsSettingsPanelOpen(false)}>
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


// Section Preview Component
interface SectionPreviewProps {
  section: PageSection;
  index: number;
  totalSections: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  sectionTypes: typeof sectionTypes;
  previewMode?: 'desktop' | 'mobile';
}

function SectionPreview({
  section,
  index,
  totalSections,
  isSelected,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
  sectionTypes,
  previewMode = 'desktop',
}: SectionPreviewProps) {
  const isMobilePreview = previewMode === 'mobile';
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-6 cursor-pointer transition-all group",
        "hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
        "border-b border-stone-200 dark:border-stone-700 last:border-b-0",
        isSelected && "ring-2 ring-inset ring-primary bg-primary/5 dark:bg-primary/10"
      )}
    >
      {/* Hover Controls */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-medium shadow-lg">
          ✏️ Click to edit
        </span>
      </div>
      
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1.5">
        <button
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shadow-lg transition-colors",
            index === 0 
              ? "bg-stone-300 dark:bg-stone-600 text-stone-500 dark:text-stone-400 cursor-not-allowed" 
              : "bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500 text-white"
          )}
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={index === 0}
          title="Move up"
        >
          <Icon icon="solar:alt-arrow-up-bold" className="h-4 w-4" />
        </button>
        <button
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shadow-lg transition-colors",
            index === totalSections - 1 
              ? "bg-stone-300 dark:bg-stone-600 text-stone-500 dark:text-stone-400 cursor-not-allowed" 
              : "bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500 text-white"
          )}
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={index === totalSections - 1}
          title="Move down"
        >
          <Icon icon="solar:alt-arrow-down-bold" className="h-4 w-4" />
        </button>
        <button
          className="h-8 w-8 rounded-lg flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete section"
        >
          <Icon icon="solar:trash-bin-trash-bold" className="h-4 w-4" />
        </button>
      </div>

      {/* Section Content Preview */}
      {section.type === 'header' && (
        <div className="py-3 px-3 flex items-center justify-between bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2 min-w-0">
            {section.content.logo ? (
              <img src={section.content.logo} alt="Logo" className="h-6 w-auto" />
            ) : (
              <span className="font-bold text-xs text-stone-900 dark:text-white truncate">{section.content.logoText || 'Your Brand'}</span>
            )}
          </div>
          {/* Desktop menu - hidden when mobile preview or on small screens */}
          {!isMobilePreview && (
            <div className="hidden lg:flex items-center gap-3">
              {(section.content.menuItems || []).slice(0, 4).map((item: any, i: number) => (
                <span key={i} className="text-[10px] text-stone-600 dark:text-stone-400">{item.label}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {/* CTA - hidden on mobile preview or very small screens */}
            {section.content.ctaButton && !isMobilePreview && (
              <span className="hidden sm:inline-flex text-[10px] px-2 py-1 bg-primary text-primary-foreground rounded font-medium">
                {section.content.ctaButton.label || 'CTA'}
              </span>
            )}
            {/* Hamburger - always shown in mobile preview, or on mobile/tablet */}
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded bg-stone-100 dark:bg-stone-800",
              isMobilePreview ? "flex" : "lg:hidden"
            )}>
              <Icon icon="solar:hamburger-menu-bold" className="h-4 w-4 text-stone-600 dark:text-stone-400" />
            </div>
          </div>
        </div>
      )}

      {section.type === 'hero' && (
        <div className="text-center py-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{section.content.headline || 'Your Headline'}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{section.content.subheadline || 'Your subheadline goes here'}</p>
        </div>
      )}

      {section.type === 'form' && (
        <div className="max-w-sm mx-auto space-y-3 py-4">
          {(section.content.fields || ['name', 'email']).map((fieldId: string) => (
            <div key={fieldId} className="h-10 px-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex items-center text-sm text-muted-foreground">
              {fieldId === 'name' && 'Your name'}
              {fieldId === 'email' && 'Your email'}
              {fieldId === 'phone' && 'Your phone'}
              {fieldId === 'company' && 'Your company'}
              {fieldId === 'message' && 'Your message'}
            </div>
          ))}
          <div className="h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-sm font-medium shadow-md">
            {section.content.buttonText || 'Submit'}
          </div>
        </div>
      )}

      {section.type === 'cta' && (
        <div className="text-center py-6 bg-primary/10 dark:bg-primary/20 rounded-xl mx-4">
          <p className="font-semibold mb-3 text-foreground">{section.content.text || 'Ready to get started?'}</p>
          <span className="inline-flex h-10 px-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-md">
            {section.content.buttonText || 'Get Started'}
          </span>
        </div>
      )}

      {section.type === 'features' && (
        <div className="grid grid-cols-3 gap-4 py-4">
          {(section.content.items || [{ title: 'Feature 1' }, { title: 'Feature 2' }, { title: 'Feature 3' }]).slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-2 flex items-center justify-center">
                <Icon icon="solar:star-bold" className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">{item.title || `Feature ${i + 1}`}</p>
            </div>
          ))}
        </div>
      )}

      {section.type === 'countdown' && (
        <CountdownPreview targetDate={section.content.targetDate} />
      )}

      {section.type === 'testimonial' && (
        <div className="py-6 text-center">
          <Icon icon="solar:chat-round-dots-bold" className="h-8 w-8 mx-auto text-primary/50 mb-3" />
          <p className="text-sm italic text-muted-foreground mb-2 max-w-md mx-auto">
            "{section.content.quote || 'Customer testimonial goes here...'}"
          </p>
          <p className="text-xs font-medium">{section.content.author || '— Happy Customer'}</p>
        </div>
      )}

      {section.type === 'video' && (
        <VideoPreview videoUrl={section.content.videoUrl} />
      )}

      {section.type === 'pricing' && (
        <div className="py-4 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {(section.content.plans || [{ name: 'Basic', price: '$9', features: ['Feature 1', 'Feature 2'] }, { name: 'Pro', price: '$29', popular: true, features: ['Feature 1', 'Feature 2'] }]).slice(0, 3).map((plan: any, i: number) => (
              <div key={i} className={cn(
                "p-4 rounded-xl border text-center relative",
                plan.popular 
                  ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-md" 
                  : "border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800"
              )}>
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md whitespace-nowrap">
                    ⭐ Popular
                  </span>
                )}
                <p className="text-sm font-semibold text-stone-900 dark:text-white mt-1">{plan.name || 'Plan'}</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white my-1">{plan.price || '$0'}</p>
                {plan.features && plan.features.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {plan.features.slice(0, 3).map((f: string, fi: number) => (
                      <p key={fi} className="text-xs text-stone-600 dark:text-stone-300 flex items-center justify-center gap-1.5">
                        <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </p>
                    ))}
                    {plan.features.length > 3 && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">+{plan.features.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {section.type === 'faq' && (
        <FAQPreview items={section.content.items || [{ q: 'Question 1?', a: 'Answer 1' }, { q: 'Question 2?', a: 'Answer 2' }]} />
      )}

      {section.type === 'gallery' && (
        <GalleryPreview images={section.content.images} columns={section.content.columns} />
      )}

      {section.type === 'footer' && (
        <div className="py-6 px-4 bg-stone-900 dark:bg-stone-950 text-white">
          <div className="max-w-lg mx-auto">
            <div className="flex flex-wrap justify-between gap-4 mb-4">
              <div>
                <p className="font-bold text-sm mb-1">{section.content.logoText || 'Your Brand'}</p>
                <p className="text-[10px] text-stone-400 max-w-[150px]">{section.content.description || 'Your tagline'}</p>
              </div>
              <div className="flex gap-6">
                {(section.content.columns || []).slice(0, 2).map((col: any, i: number) => (
                  <div key={i}>
                    <p className="text-[10px] font-semibold mb-1 text-stone-300">{col.title}</p>
                    {(col.links || []).slice(0, 2).map((link: any, li: number) => (
                      <p key={li} className="text-[9px] text-stone-500">{link.label}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-stone-800">
              <p className="text-[9px] text-stone-500">{section.content.copyright || '© 2025 Your Company'}</p>
              <div className="flex gap-2">
                {(section.content.socialLinks || []).slice(0, 3).map((social: any, i: number) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center">
                    <Icon icon={`mdi:${social.platform}`} className="h-3 w-3 text-stone-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback for unknown types */}
      {!['header', 'hero', 'form', 'cta', 'features', 'countdown', 'testimonial', 'video', 'pricing', 'faq', 'gallery', 'footer'].includes(section.type) && (
        <div className="py-8 text-center">
          <Icon icon={sectionTypes.find(s => s.id === section.type)?.icon || 'solar:widget-bold'} className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{sectionTypes.find(s => s.id === section.type)?.name}</p>
        </div>
      )}
    </div>
  );
}


// Section Editor Component
interface SectionEditorProps {
  section: PageSection;
  onUpdate: (section: PageSection) => void;
  onDelete: () => void;
  onClose: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SectionEditor({
  section,
  onUpdate,
  onDelete,
  onClose,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: SectionEditorProps) {
  const updateContent = (key: string, value: any) => {
    onUpdate({
      ...section,
      content: { ...section.content, [key]: value },
    });
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Hero Section Editor */}
      {section.type === 'hero' && (
        <>
          {/* AI Assist Button */}
          <AIAssistButton
            sectionType="hero"
            onApply={(content) => {
              onUpdate({
                ...section,
                content: { ...section.content, ...content },
              });
            }}
            className="w-full"
          />
          <div>
            <Label className="text-xs font-medium">Headline</Label>
            <Input
              value={section.content.headline || ''}
              onChange={(e) => updateContent('headline', e.target.value)}
              placeholder="Your main headline"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Subheadline</Label>
            <Textarea
              value={section.content.subheadline || ''}
              onChange={(e) => updateContent('subheadline', e.target.value)}
              placeholder="Supporting text"
              className="mt-1.5"
              rows={3}
            />
          </div>
        </>
      )}

      {/* Form Section Editor */}
      {section.type === 'form' && (
        <>
          <div>
            <Label className="text-xs font-medium">Button Text</Label>
            <Input
              value={section.content.buttonText || ''}
              onChange={(e) => updateContent('buttonText', e.target.value)}
              placeholder="Submit"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Form Fields</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Select which fields to show</p>
            <div className="space-y-2">
              {[
                { id: 'name', label: 'Name' },
                { id: 'email', label: 'Email' },
                { id: 'phone', label: 'Phone Number' },
                { id: 'company', label: 'Company' },
                { id: 'message', label: 'Message' },
              ].map(field => {
                const fields = section.content.fields || ['name', 'email'];
                const isChecked = fields.includes(field.id);
                return (
                  <label key={field.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={(e) => {
                        const currentFields = section.content.fields || ['name', 'email'];
                        const newFields = e.target.checked
                          ? [...currentFields, field.id]
                          : currentFields.filter((f: string) => f !== field.id);
                        updateContent('fields', newFields);
                      }}
                      className="rounded border-stone-300 text-primary focus:ring-primary" 
                    />
                    {field.label}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* CTA Section Editor */}
      {section.type === 'cta' && (
        <>
          {/* AI Assist Button */}
          <AIAssistButton
            sectionType="cta"
            onApply={(content) => {
              onUpdate({
                ...section,
                content: { ...section.content, ...content },
              });
            }}
            className="w-full"
          />
          <div>
            <Label className="text-xs font-medium">CTA Text</Label>
            <Input
              value={section.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              placeholder="Ready to get started?"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Button Text</Label>
            <Input
              value={section.content.buttonText || ''}
              onChange={(e) => updateContent('buttonText', e.target.value)}
              placeholder="Get Started"
              className="mt-1.5"
            />
          </div>
        </>
      )}

      {/* Video Section Editor */}
      {section.type === 'video' && (
        <div>
          <Label className="text-xs font-medium">Video URL</Label>
          <Input
            value={section.content.videoUrl || ''}
            onChange={(e) => updateContent('videoUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="mt-1.5"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Supports YouTube and Vimeo</p>
        </div>
      )}

      {/* Testimonial Section Editor */}
      {section.type === 'testimonial' && (
        <>
          {/* AI Assist Button */}
          <AIAssistButton
            sectionType="testimonial"
            onApply={(content) => {
              onUpdate({
                ...section,
                content: { ...section.content, ...content },
              });
            }}
            className="w-full"
          />
          <div>
            <Label className="text-xs font-medium">Quote</Label>
            <Textarea
              value={section.content.quote || ''}
              onChange={(e) => updateContent('quote', e.target.value)}
              placeholder="This product changed my life..."
              className="mt-1.5"
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Author</Label>
            <Input
              value={section.content.author || ''}
              onChange={(e) => updateContent('author', e.target.value)}
              placeholder="John Doe, CEO"
              className="mt-1.5"
            />
          </div>
        </>
      )}

      {/* Countdown Section Editor */}
      {section.type === 'countdown' && (
        <div>
          <Label className="text-xs font-medium">Target Date & Time</Label>
          <Input
            type="datetime-local"
            value={section.content.targetDate ? new Date(section.content.targetDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateContent('targetDate', new Date(e.target.value).toISOString())}
            className="mt-1.5"
          />
        </div>
      )}

      {/* Features Section Editor */}
      {section.type === 'features' && (
        <div>
          {/* AI Assist Button */}
          <AIAssistButton
            sectionType="features"
            onApply={(content) => {
              onUpdate({
                ...section,
                content: { ...section.content, items: content.items },
              });
            }}
            className="w-full mb-3"
          />
          <Label className="text-xs font-medium">Features</Label>
          <div className="mt-2 space-y-3">
            {(section.content.items || []).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                <Input
                  value={item.title || ''}
                  onChange={(e) => {
                    const items = [...(section.content.items || [])];
                    items[i] = { ...items[i], title: e.target.value };
                    updateContent('items', items);
                  }}
                  placeholder="Feature title"
                  className="mb-2"
                />
                <Input
                  value={item.description || ''}
                  onChange={(e) => {
                    const items = [...(section.content.items || [])];
                    items[i] = { ...items[i], description: e.target.value };
                    updateContent('items', items);
                  }}
                  placeholder="Feature description"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const items = [...(section.content.items || []), { title: '', description: '' }];
                updateContent('items', items);
              }}
            >
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </div>
        </div>
      )}

      {/* FAQ Section Editor */}
      {section.type === 'faq' && (
        <div>
          {/* AI Assist Button */}
          <AIAssistButton
            sectionType="faq"
            onApply={(content) => {
              onUpdate({
                ...section,
                content: { ...section.content, items: content.items },
              });
            }}
            className="w-full mb-3"
          />
          <Label className="text-xs font-medium">FAQ Items</Label>
          <div className="mt-2 space-y-3">
            {(section.content.items || []).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                <Input
                  value={item.q || ''}
                  onChange={(e) => {
                    const items = [...(section.content.items || [])];
                    items[i] = { ...items[i], q: e.target.value };
                    updateContent('items', items);
                  }}
                  placeholder="Question"
                  className="mb-2"
                />
                <Textarea
                  value={item.a || ''}
                  onChange={(e) => {
                    const items = [...(section.content.items || [])];
                    items[i] = { ...items[i], a: e.target.value };
                    updateContent('items', items);
                  }}
                  placeholder="Answer"
                  rows={2}
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const items = [...(section.content.items || []), { q: '', a: '' }];
                updateContent('items', items);
              }}
            >
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
              Add FAQ
            </Button>
          </div>
        </div>
      )}

      {/* Header Section Editor */}
      {section.type === 'header' && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Logo</Label>
            <Input
              value={section.content.logo || ''}
              onChange={(e) => updateContent('logo', e.target.value)}
              placeholder="Logo image URL (optional)"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Brand Name</Label>
            <Input
              value={section.content.logoText || ''}
              onChange={(e) => updateContent('logoText', e.target.value)}
              placeholder="Your Brand"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Menu Items</Label>
            <div className="mt-2 space-y-2">
              {(section.content.menuItems || []).map((item: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={item.label || ''}
                    onChange={(e) => {
                      const items = [...(section.content.menuItems || [])];
                      items[i] = { ...items[i], label: e.target.value };
                      updateContent('menuItems', items);
                    }}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Input
                    value={item.url || ''}
                    onChange={(e) => {
                      const items = [...(section.content.menuItems || [])];
                      items[i] = { ...items[i], url: e.target.value };
                      updateContent('menuItems', items);
                    }}
                    placeholder="URL or #section"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 shrink-0"
                    onClick={() => {
                      const items = (section.content.menuItems || []).filter((_: any, idx: number) => idx !== i);
                      updateContent('menuItems', items);
                    }}
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const items = [...(section.content.menuItems || []), { label: '', url: '#' }];
                  updateContent('menuItems', items);
                }}
              >
                <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
                Add Menu Item
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">CTA Button</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <Input
                value={section.content.ctaButton?.label || ''}
                onChange={(e) => updateContent('ctaButton', { ...section.content.ctaButton, label: e.target.value })}
                placeholder="Button text"
              />
              <Input
                value={section.content.ctaButton?.url || ''}
                onChange={(e) => updateContent('ctaButton', { ...section.content.ctaButton, url: e.target.value })}
                placeholder="Button URL"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.content.sticky || false}
              onChange={(e) => updateContent('sticky', e.target.checked)}
              className="rounded border-stone-300 text-primary focus:ring-primary"
            />
            <Label className="text-xs">Sticky header (stays at top when scrolling)</Label>
          </div>
        </div>
      )}

      {/* Footer Section Editor */}
      {section.type === 'footer' && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Brand Name</Label>
            <Input
              value={section.content.logoText || ''}
              onChange={(e) => updateContent('logoText', e.target.value)}
              placeholder="Your Brand"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={section.content.description || ''}
              onChange={(e) => updateContent('description', e.target.value)}
              placeholder="Brief company description"
              className="mt-1.5"
              rows={2}
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Link Columns</Label>
            <div className="mt-2 space-y-3">
              {(section.content.columns || []).map((col: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center justify-between mb-2">
                    <Input
                      value={col.title || ''}
                      onChange={(e) => {
                        const cols = [...(section.content.columns || [])];
                        cols[i] = { ...cols[i], title: e.target.value };
                        updateContent('columns', cols);
                      }}
                      placeholder="Column title"
                      className="flex-1 mr-2"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 shrink-0"
                      onClick={() => {
                        const cols = (section.content.columns || []).filter((_: any, idx: number) => idx !== i);
                        updateContent('columns', cols);
                      }}
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                    </Button>
                  </div>
                  {(col.links || []).map((link: any, li: number) => (
                    <div key={li} className="flex gap-2 mb-1">
                      <Input
                        value={link.label || ''}
                        onChange={(e) => {
                          const cols = [...(section.content.columns || [])];
                          cols[i].links[li] = { ...cols[i].links[li], label: e.target.value };
                          updateContent('columns', cols);
                        }}
                        placeholder="Link text"
                        className="flex-1 text-xs h-8"
                      />
                      <Input
                        value={link.url || ''}
                        onChange={(e) => {
                          const cols = [...(section.content.columns || [])];
                          cols[i].links[li] = { ...cols[i].links[li], url: e.target.value };
                          updateContent('columns', cols);
                        }}
                        placeholder="URL"
                        className="flex-1 text-xs h-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          const cols = [...(section.content.columns || [])];
                          cols[i].links = cols[i].links.filter((_: any, idx: number) => idx !== li);
                          updateContent('columns', cols);
                        }}
                      >
                        <Icon icon="solar:close-circle-linear" className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 text-xs"
                    onClick={() => {
                      const cols = [...(section.content.columns || [])];
                      cols[i].links = [...(cols[i].links || []), { label: '', url: '#' }];
                      updateContent('columns', cols);
                    }}
                  >
                    + Add Link
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const cols = [...(section.content.columns || []), { title: '', links: [] }];
                  updateContent('columns', cols);
                }}
              >
                <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
                Add Column
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Social Links</Label>
            <div className="mt-2 space-y-2">
              {(section.content.socialLinks || []).map((social: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={social.platform || 'twitter'}
                    onChange={(e) => {
                      const links = [...(section.content.socialLinks || [])];
                      links[i] = { ...links[i], platform: e.target.value };
                      updateContent('socialLinks', links);
                    }}
                    className="flex-1 h-9 rounded-md border border-stone-200 dark:border-stone-700 bg-transparent px-3 text-sm"
                  >
                    <option value="twitter">Twitter/X</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                  <Input
                    value={social.url || ''}
                    onChange={(e) => {
                      const links = [...(section.content.socialLinks || [])];
                      links[i] = { ...links[i], url: e.target.value };
                      updateContent('socialLinks', links);
                    }}
                    placeholder="Profile URL"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 shrink-0"
                    onClick={() => {
                      const links = (section.content.socialLinks || []).filter((_: any, idx: number) => idx !== i);
                      updateContent('socialLinks', links);
                    }}
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const links = [...(section.content.socialLinks || []), { platform: 'twitter', url: '' }];
                  updateContent('socialLinks', links);
                }}
              >
                <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
                Add Social Link
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Copyright Text</Label>
            <Input
              value={section.content.copyright || ''}
              onChange={(e) => updateContent('copyright', e.target.value)}
              placeholder="© 2025 Your Company. All rights reserved."
              className="mt-1.5"
            />
          </div>
        </div>
      )}

      {/* Pricing Section Editor */}
      {section.type === 'pricing' && (
        <div>
          {/* AI Assist Button */}
          <AIAssistButton
            sectionType="pricing"
            onApply={(content) => {
              // Merge AI-generated plan names/features with existing prices
              const existingPlans = section.content.plans || [];
              const newPlans = (content.plans || []).map((aiPlan: any, i: number) => ({
                ...aiPlan,
                price: existingPlans[i]?.price || '', // Keep existing price
                buttonText: existingPlans[i]?.buttonText || 'Get Started',
                buttonUrl: existingPlans[i]?.buttonUrl || '',
              }));
              onUpdate({
                ...section,
                content: { ...section.content, plans: newPlans },
              });
            }}
            className="w-full mb-3"
          />
          <Label className="text-xs font-medium">Pricing Plans</Label>
          <div className="mt-2 space-y-4">
            {(section.content.plans || []).map((plan: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Plan {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={plan.popular || false}
                        onChange={(e) => {
                          const plans = [...(section.content.plans || [])];
                          plans[i] = { ...plans[i], popular: e.target.checked };
                          updateContent('plans', plans);
                        }}
                        className="rounded border-stone-300 text-primary focus:ring-primary h-3 w-3" 
                      />
                      Popular
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-600"
                      onClick={() => {
                        const plans = (section.content.plans || []).filter((_: any, idx: number) => idx !== i);
                        updateContent('plans', plans);
                      }}
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={plan.name || ''}
                  onChange={(e) => {
                    const plans = [...(section.content.plans || [])];
                    plans[i] = { ...plans[i], name: e.target.value };
                    updateContent('plans', plans);
                  }}
                  placeholder="Plan name (e.g., Starter)"
                />
                <Input
                  value={plan.price || ''}
                  onChange={(e) => {
                    const plans = [...(section.content.plans || [])];
                    plans[i] = { ...plans[i], price: e.target.value };
                    updateContent('plans', plans);
                  }}
                  placeholder="Price (e.g., $29)"
                />
                <div>
                  <Label className="text-[10px] text-muted-foreground">Features (one per line)</Label>
                  <Textarea
                    value={(plan.features || []).join('\n')}
                    onChange={(e) => {
                      const plans = [...(section.content.plans || [])];
                      plans[i] = { ...plans[i], features: e.target.value.split('\n').filter(f => f.trim()) };
                      updateContent('plans', plans);
                    }}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    rows={3}
                  />
                </div>
                <Input
                  value={plan.buttonText || ''}
                  onChange={(e) => {
                    const plans = [...(section.content.plans || [])];
                    plans[i] = { ...plans[i], buttonText: e.target.value };
                    updateContent('plans', plans);
                  }}
                  placeholder="Button text (e.g., Get Started)"
                />
                <Input
                  value={plan.buttonUrl || ''}
                  onChange={(e) => {
                    const plans = [...(section.content.plans || [])];
                    plans[i] = { ...plans[i], buttonUrl: e.target.value };
                    updateContent('plans', plans);
                  }}
                  placeholder="Button URL (e.g., https://...)"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const plans = [...(section.content.plans || []), { name: '', price: '', features: [], popular: false }];
                updateContent('plans', plans);
              }}
            >
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
              Add Plan
            </Button>
          </div>
        </div>
      )}

      {/* Gallery Section Editor */}
      {section.type === 'gallery' && (
        <div>
          <Label className="text-xs font-medium">Gallery Images</Label>
          <p className="text-[10px] text-muted-foreground mb-2">Add image URLs for your gallery</p>
          <div className="mt-2 space-y-3">
            {(section.content.images || []).map((img: any, i: number) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={img.url || ''}
                  onChange={(e) => {
                    const images = [...(section.content.images || [])];
                    images[i] = { ...images[i], url: e.target.value };
                    updateContent('images', images);
                  }}
                  placeholder="Image URL"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 shrink-0"
                  onClick={() => {
                    const images = (section.content.images || []).filter((_: any, idx: number) => idx !== i);
                    updateContent('images', images);
                  }}
                >
                  <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const images = [...(section.content.images || []), { url: '', alt: '' }];
                updateContent('images', images);
              }}
            >
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
              Add Image
            </Button>
          </div>
          <div className="mt-4">
            <Label className="text-xs font-medium">Layout</Label>
            <div className="mt-1.5 flex gap-2">
              {[2, 3, 4].map(cols => (
                <button
                  key={cols}
                  onClick={() => updateContent('columns', cols)}
                  className={cn(
                    "flex-1 p-2 rounded-lg border text-xs font-medium transition-colors",
                    (section.content.columns || 3) === cols 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  {cols} Columns
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reorder Controls */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
        <Label className="text-xs font-medium mb-2 block">Reorder</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onMoveUp} disabled={!canMoveUp}>
            <Icon icon="solar:alt-arrow-up-linear" className="h-4 w-4 mr-1" />
            Move Up
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onMoveDown} disabled={!canMoveDown}>
            <Icon icon="solar:alt-arrow-down-linear" className="h-4 w-4 mr-1" />
            Move Down
          </Button>
        </div>
      </div>

      {/* Export HTML */}
      <ExportHTMLButton section={section} />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
          Done
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Countdown Preview Component
function CountdownPreview({ targetDate }: { targetDate?: string | Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const target = targetDate ? new Date(targetDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const calculateTime = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="text-center py-6 bg-stone-900 dark:bg-stone-800 rounded-xl">
      <div className="flex justify-center gap-4 sm:gap-6">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white">{String(value).padStart(2, '0')}</div>
            <div className="text-xs text-stone-400 capitalize">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Preview Component with Accordion
function FAQPreview({ items }: { items: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="py-4 space-y-2 max-w-md mx-auto">
      {items.slice(0, 3).map((item, i) => (
        <div key={i} className="rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(openIndex === i ? null : i);
            }}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <p className="text-sm font-medium text-foreground">{item.q || `Question ${i + 1}?`}</p>
            <Icon 
              icon={openIndex === i ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} 
              className="h-4 w-4 text-muted-foreground shrink-0 ml-2" 
            />
          </button>
          {openIndex === i && (
            <div className="px-3 pb-3 pt-0">
              <p className="text-xs text-muted-foreground">{item.a || 'Answer goes here...'}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// Export HTML Button Component
function ExportHTMLButton({ section }: { section: PageSection }) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const generateHTML = (): string => {
    const primaryColor = '#3b82f6'; // Default primary color
    
    switch (section.type) {
      case 'hero':
        return `<!-- Hero Section -->
<section style="padding: 4rem 1rem; text-align: center;">
  <div style="max-width: 800px; margin: 0 auto;">
    <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; color: #1a1a1a;">
      ${section.content.headline || 'Your Amazing Headline'}
    </h1>
    <p style="font-size: 1.125rem; color: #666; max-width: 600px; margin: 0 auto;">
      ${section.content.subheadline || 'A compelling subheadline that explains your value proposition'}
    </p>
  </div>
</section>`;

      case 'form':
        const fields = section.content.fields || ['name', 'email'];
        const fieldHTML = fields.map((f: string) => {
          const labels: Record<string, string> = { name: 'Name', email: 'Email', phone: 'Phone', company: 'Company', message: 'Message' };
          const types: Record<string, string> = { name: 'text', email: 'email', phone: 'tel', company: 'text', message: 'textarea' };
          if (f === 'message') {
            return `    <div style="margin-bottom: 1rem;">
      <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">${labels[f]}</label>
      <textarea placeholder="Your ${f}" rows="4" style="width: 100%; padding: 0.75rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-size: 1rem;"></textarea>
    </div>`;
          }
          return `    <div style="margin-bottom: 1rem;">
      <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem;">${labels[f]}</label>
      <input type="${types[f]}" placeholder="Your ${f}" style="width: 100%; padding: 0.75rem; border: 1px solid #e5e5e5; border-radius: 0.5rem; font-size: 1rem;" />
    </div>`;
        }).join('\n');
        
        return `<!-- Lead Form Section -->
<section style="padding: 3rem 1rem; background: #f9fafb;">
  <div style="max-width: 400px; margin: 0 auto;">
    <form>
${fieldHTML}
      <button type="submit" style="width: 100%; padding: 0.75rem 1.5rem; background: ${primaryColor}; color: white; border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: 500; cursor: pointer;">
        ${section.content.buttonText || 'Submit'}
      </button>
    </form>
  </div>
</section>`;

      case 'cta':
        return `<!-- Call to Action Section -->
<section style="padding: 4rem 1rem; background: ${primaryColor}10; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; color: #1a1a1a;">
      ${section.content.text || 'Ready to get started?'}
    </p>
    <a href="#" style="display: inline-block; padding: 0.75rem 2rem; background: ${primaryColor}; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: 500;">
      ${section.content.buttonText || 'Get Started'}
    </a>
  </div>
</section>`;

      case 'features':
        const featuresHTML = (section.content.items || []).map((item: any) => `
    <div style="text-align: center; padding: 1rem;">
      <div style="width: 3.5rem; height: 3.5rem; background: ${primaryColor}15; border-radius: 1rem; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
        <svg width="24" height="24" fill="${primaryColor}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <h3 style="font-weight: 600; margin-bottom: 0.5rem;">${item.title || 'Feature'}</h3>
      <p style="font-size: 0.875rem; color: #666;">${item.description || 'Feature description'}</p>
    </div>`).join('');
        
        return `<!-- Features Section -->
<section style="padding: 4rem 1rem;">
  <div style="max-width: 1000px; margin: 0 auto;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
${featuresHTML}
    </div>
  </div>
</section>`;

      case 'testimonial':
        return `<!-- Testimonial Section -->
<section style="padding: 4rem 1rem; background: #f9fafb; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto;">
    <svg width="40" height="40" fill="${primaryColor}" style="margin-bottom: 1rem; opacity: 0.5;" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
    <blockquote style="font-size: 1.125rem; font-style: italic; color: #444; margin-bottom: 1rem;">
      "${section.content.quote || 'This product changed my life!'}"
    </blockquote>
    <p style="font-weight: 500;">${section.content.author || '— Happy Customer'}</p>
  </div>
</section>`;

      case 'countdown':
        return `<!-- Countdown Section -->
<section style="padding: 4rem 1rem; background: #1a1a1a; color: white; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div id="countdown" style="display: flex; justify-content: center; gap: 2rem;">
      <div><span id="days" style="font-size: 3rem; font-weight: bold;">00</span><br><small style="color: #999;">Days</small></div>
      <div><span id="hours" style="font-size: 3rem; font-weight: bold;">00</span><br><small style="color: #999;">Hours</small></div>
      <div><span id="mins" style="font-size: 3rem; font-weight: bold;">00</span><br><small style="color: #999;">Mins</small></div>
      <div><span id="secs" style="font-size: 3rem; font-weight: bold;">00</span><br><small style="color: #999;">Secs</small></div>
    </div>
  </div>
</section>
<script>
  const targetDate = new Date("${section.content.targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}");
  setInterval(() => {
    const diff = targetDate - new Date();
    if (diff > 0) {
      document.getElementById('days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
      document.getElementById('hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      document.getElementById('mins').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      document.getElementById('secs').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }
  }, 1000);
</script>`;

      case 'faq':
        const faqHTML = (section.content.items || []).map((item: any, i: number) => `
    <div style="border: 1px solid #e5e5e5; border-radius: 0.75rem; margin-bottom: 0.75rem; overflow: hidden;">
      <button onclick="toggleFaq(${i})" style="width: 100%; padding: 1rem; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; border: none; cursor: pointer; text-align: left;">
        <span style="font-weight: 600;">${item.q || 'Question?'}</span>
        <span id="faq-icon-${i}">+</span>
      </button>
      <div id="faq-answer-${i}" style="display: none; padding: 0 1rem 1rem;">
        <p style="color: #666; font-size: 0.875rem;">${item.a || 'Answer'}</p>
      </div>
    </div>`).join('');
        
        return `<!-- FAQ Section -->
<section style="padding: 4rem 1rem;">
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 2rem;">Frequently Asked Questions</h2>
${faqHTML}
  </div>
</section>
<script>
  function toggleFaq(index) {
    const answer = document.getElementById('faq-answer-' + index);
    const icon = document.getElementById('faq-icon-' + index);
    if (answer.style.display === 'none') {
      answer.style.display = 'block';
      icon.textContent = '−';
    } else {
      answer.style.display = 'none';
      icon.textContent = '+';
    }
  }
</script>`;

      case 'pricing':
        const plansHTML = (section.content.plans || []).map((plan: any) => `
    <div style="padding: 1.5rem; border: 2px solid ${plan.popular ? primaryColor : '#e5e5e5'}; border-radius: 1rem; background: white; ${plan.popular ? 'box-shadow: 0 4px 20px rgba(0,0,0,0.1);' : ''}">
      ${plan.popular ? `<span style="display: inline-block; padding: 0.25rem 0.75rem; background: ${primaryColor}; color: white; font-size: 0.75rem; border-radius: 1rem; margin-bottom: 0.75rem;">Most Popular</span>` : ''}
      <h3 style="font-size: 1.125rem; font-weight: 600;">${plan.name}</h3>
      <p style="font-size: 2rem; font-weight: bold; margin: 0.75rem 0;">${plan.price}<span style="font-size: 0.875rem; font-weight: normal; color: #666;">/mo</span></p>
      <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
        ${(plan.features || []).map((f: string) => `<li style="padding: 0.5rem 0; font-size: 0.875rem;">✓ ${f}</li>`).join('')}
      </ul>
      <a href="#" style="display: block; text-align: center; padding: 0.75rem; background: ${plan.popular ? primaryColor : 'transparent'}; color: ${plan.popular ? 'white' : '#1a1a1a'}; border: 1px solid ${plan.popular ? primaryColor : '#e5e5e5'}; border-radius: 0.5rem; text-decoration: none; font-weight: 500;">Get Started</a>
    </div>`).join('');
        
        return `<!-- Pricing Section -->
<section style="padding: 4rem 1rem; background: #f9fafb;">
  <div style="max-width: 900px; margin: 0 auto;">
    <h2 style="font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 2rem;">Pricing</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
${plansHTML}
    </div>
  </div>
</section>`;

      case 'video':
        return `<!-- Video Section -->
<section style="padding: 4rem 1rem;">
  <div style="max-width: 800px; margin: 0 auto;">
    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 1rem;">
      <iframe src="${section.content.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
    </div>
  </div>
</section>`;

      case 'gallery':
        return `<!-- Gallery Section -->
<section style="padding: 4rem 1rem;">
  <div style="max-width: 1000px; margin: 0 auto;">
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
      ${[1, 2, 3, 4, 5, 6].map(() => `<div style="aspect-ratio: 1; background: #f3f4f6; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: #9ca3af;">Image</div>`).join('\n      ')}
    </div>
  </div>
</section>`;

      default:
        return `<!-- ${section.type} Section -->
<section style="padding: 4rem 1rem;">
  <div style="max-width: 800px; margin: 0 auto; text-align: center;">
    <p>Custom section content</p>
  </div>
</section>`;
    }
  };

  const copyHTML = () => {
    const html = generateHTML();
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
      <Label className="text-xs font-medium mb-2 block">Export HTML</Label>
      <p className="text-[10px] text-muted-foreground mb-2">Copy standalone HTML code to use on any website</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCode(!showCode)}>
          <Icon icon="solar:code-bold" className="h-4 w-4 mr-1" />
          {showCode ? 'Hide Code' : 'View Code'}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={copyHTML}>
          <Icon icon={copied ? "solar:check-circle-bold" : "solar:copy-linear"} className="h-4 w-4 mr-1" />
          {copied ? 'Copied!' : 'Copy HTML'}
        </Button>
      </div>
      {showCode && (
        <div className="mt-3 p-3 rounded-lg bg-stone-900 text-stone-100 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
          <pre className="whitespace-pre-wrap break-all">{generateHTML()}</pre>
        </div>
      )}
    </div>
  );
}


// Video Preview Component with Thumbnail
function VideoPreview({ videoUrl }: { videoUrl?: string }) {
  const getVideoId = (url: string): { type: 'youtube' | 'vimeo' | null; id: string | null } => {
    if (!url) return { type: null, id: null };
    
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
    if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
    
    return { type: null, id: null };
  };

  const { type, id } = getVideoId(videoUrl || '');
  
  // Get YouTube thumbnail
  const getThumbnailUrl = (): string | null => {
    if (type === 'youtube' && id) {
      return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
    if (type === 'vimeo' && id) {
      // Vimeo thumbnails require API call, use placeholder
      return null;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <div className="py-4">
      <div className="aspect-video bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden max-w-lg mx-auto relative group cursor-pointer">
        {thumbnailUrl ? (
          <>
            <img 
              src={thumbnailUrl} 
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to hqdefault if maxresdefault doesn't exist
                const target = e.target as HTMLImageElement;
                if (target.src.includes('maxresdefault')) {
                  target.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                }
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Icon icon="solar:play-bold" className="h-8 w-8 text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1">
              <Icon icon="logos:youtube-icon" className="h-3 w-3" />
              YouTube
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Icon icon="solar:play-circle-bold" className="h-16 w-16 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Add a YouTube or Vimeo URL</p>
          </div>
        )}
      </div>
    </div>
  );
}


// Gallery Preview Component
function GalleryPreview({ images, columns = 3 }: { images?: Array<{ url: string; alt?: string }>; columns?: number }) {
  const displayImages = images && images.length > 0 ? images.slice(0, 6) : null;
  
  return (
    <div className="py-4">
      <div 
        className="gap-2 max-w-md mx-auto"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, 1fr)` 
        }}
      >
        {displayImages ? (
          displayImages.map((img, i) => (
            <div key={i} className="aspect-square rounded-lg bg-stone-100 dark:bg-stone-800 overflow-hidden">
              {img.url ? (
                <img 
                  src={img.url} 
                  alt={img.alt || `Gallery image ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-stone-400" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/></svg></div>';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon icon="solar:gallery-linear" className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))
        ) : (
          [1, 2, 3, 4, 5, 6].slice(0, columns * 2).map(i => (
            <div key={i} className="aspect-square rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Icon icon="solar:gallery-linear" className="h-6 w-6 text-muted-foreground/30" />
            </div>
          ))
        )}
      </div>
      {displayImages && displayImages.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground mt-2">{images?.length} images</p>
      )}
    </div>
  );
}
