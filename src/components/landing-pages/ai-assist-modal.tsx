'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  generateSectionContent,
  getAIQuotaForLandingPages,
  type SectionType,
  type ToneType,
} from '@/app/actions/landing-page-actions';
import AIUpgradePrompt from '@/components/ai/ai-upgrade-prompt';

interface AIAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: SectionType;
  onApply: (content: Record<string, any>) => void;
}

const TONE_OPTIONS: { value: ToneType; label: string; icon: string }[] = [
  { value: 'professional', label: 'Professional', icon: 'solar:briefcase-bold' },
  { value: 'casual', label: 'Casual', icon: 'solar:chat-round-dots-bold' },
  { value: 'friendly', label: 'Friendly', icon: 'solar:emoji-funny-circle-bold' },
  { value: 'urgent', label: 'Urgent', icon: 'solar:alarm-bold' },
];

const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero Section',
  features: 'Features',
  faq: 'FAQ',
  testimonial: 'Testimonial',
  cta: 'Call to Action',
  pricing: 'Pricing Plans',
};

export function AIAssistModal({ isOpen, onClose, sectionType, onApply }: AIAssistModalProps) {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, any> | null>(null);
  const [quota, setQuota] = useState({ remaining: 0, limit: 0, exceeded: false });
  const [loadingQuota, setLoadingQuota] = useState(true);

  // Load quota on mount
  useEffect(() => {
    async function loadQuota() {
      if (!company?.id) return;
      setLoadingQuota(true);
      const q = await getAIQuotaForLandingPages(company.id);
      setQuota(q);
      setLoadingQuota(false);
    }
    if (isOpen) {
      loadQuota();
      setGeneratedContent(null);
    }
  }, [isOpen, company?.id]);

  const handleGenerate = async () => {
    if (!appUser?.uid || !company?.id) {
      toast({ title: 'Error', description: 'Please sign in to use AI Assist', variant: 'destructive' });
      return;
    }

    if (productDescription.length < 20) {
      toast({ title: 'Too Short', description: 'Please describe your product in at least 20 characters', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const result = await generateSectionContent({
        companyId: company.id,
        userId: appUser.uid,
        sectionType,
        productDescription,
        targetAudience: targetAudience || undefined,
        tone,
      });

      if (result.success && result.content) {
        setGeneratedContent(result.content);
        setQuota({ 
          remaining: result.creditsRemaining || 0, 
          limit: result.creditsLimit || 0, 
          exceeded: (result.creditsRemaining || 0) <= 0 
        });
        toast({ title: '✨ Content Generated!', description: 'Review and apply the generated content' });
      } else if (result.errorCode === 'no_credits') {
        setQuota({ remaining: 0, limit: result.creditsLimit || 0, exceeded: true });
        toast({ title: 'No Credits', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to generate content', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApply(generatedContent);
      onClose();
      toast({ title: '✓ Applied', description: 'AI content applied to your section' });
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    handleGenerate();
  };

  if (!isOpen) return null;

  // Show upgrade prompt if no credits
  if (!loadingQuota && quota.exceeded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-950 rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:magic-stick-3-bold" className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AI Assist</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-5">
            <AIUpgradePrompt
              currentPlan={(company as any)?.planId?.includes('free') ? 'free' : 
                          (company as any)?.planId?.includes('starter') ? 'starter' :
                          (company as any)?.planId?.includes('pro') ? 'pro' : 'enterprise'}
              operationType="text_generation"
              creditsRemaining={quota.remaining}
              creditsLimit={quota.limit}
              isHardLimit={true}
              variant="inline"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-950 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Icon icon="solar:magic-stick-3-bold" className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Assist</h2>
                <p className="text-xs text-muted-foreground">Generate {SECTION_LABELS[sectionType]}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
            </Button>
          </div>
          {/* Credits Display */}
          {!loadingQuota && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Icon icon="solar:bolt-bold" className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{quota.remaining}</span> / {quota.limit} credits remaining
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {!generatedContent ? (
            /* Input Form */
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium">Describe Your Product/Service *</Label>
                <Textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g., We help small businesses automate their marketing with AI-powered tools. Our platform includes email campaigns, social media scheduling, and lead management..."
                  className="mt-1.5"
                  rows={4}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {productDescription.length}/20 characters minimum
                </p>
              </div>

              <div>
                <Label className="text-xs font-medium">Target Audience (Optional)</Label>
                <Textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Small business owners, marketing managers, entrepreneurs..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Tone</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {TONE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTone(option.value)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all",
                        tone === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                      )}
                    >
                      <Icon icon={option.icon} className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || productDescription.length < 20}
                className="w-full gap-2"
              >
                {generating ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4" />
                    Generate (1 credit)
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Generated Content Preview */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Generated Content</span>
                </div>
                
                <GeneratedContentPreview sectionType={sectionType} content={generatedContent} />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApply} className="flex-1 gap-2">
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={generating || quota.remaining <= 0}
                  className="gap-2"
                >
                  {generating ? (
                    <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon icon="solar:refresh-bold" className="h-4 w-4" />
                  )}
                  Regenerate (1 credit)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Preview component for generated content
function GeneratedContentPreview({ sectionType, content }: { sectionType: SectionType; content: Record<string, any> }) {
  switch (sectionType) {
    case 'hero':
      return (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Headline</p>
            <p className="font-semibold">{content.headline}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subheadline</p>
            <p className="text-sm text-muted-foreground">{content.subheadline}</p>
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Features</p>
          {content.items?.map((item: any, i: number) => (
            <div key={i} className="p-2 rounded-lg bg-white/50 dark:bg-stone-900/50">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">FAQ Items</p>
          {content.items?.map((item: any, i: number) => (
            <div key={i} className="p-2 rounded-lg bg-white/50 dark:bg-stone-900/50">
              <p className="font-medium text-sm">{item.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      );

    case 'testimonial':
      return (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quote</p>
            <p className="text-sm italic">"{content.quote}"</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Author</p>
            <p className="text-sm font-medium">{content.author}</p>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ This is a sample testimonial. Replace with real customer feedback.
          </p>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CTA Text</p>
            <p className="font-semibold">{content.text}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Button Text</p>
            <span className="inline-flex px-3 py-1 bg-primary text-primary-foreground text-sm rounded-lg">
              {content.buttonText}
            </span>
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pricing Plans</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            ⚠️ Add your own prices. These are plan suggestions only.
          </p>
          {content.plans?.map((plan: any, i: number) => (
            <div key={i} className={cn(
              "p-2 rounded-lg",
              plan.popular ? "bg-primary/10 border border-primary/30" : "bg-white/50 dark:bg-stone-900/50"
            )}>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{plan.name}</p>
                {plan.popular && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded">Popular</span>
                )}
              </div>
              <ul className="mt-1 space-y-0.5">
                {plan.features?.slice(0, 3).map((f: string, fi: number) => (
                  <li key={fi} className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon icon="solar:check-circle-bold" className="h-3 w-3 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">Content generated successfully</p>;
  }
}

// AI Assist Button Component (to be used in section editors)
export function AIAssistButton({ 
  sectionType, 
  onApply,
  className 
}: { 
  sectionType: SectionType; 
  onApply: (content: Record<string, any>) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show for supported section types
  const supportedTypes: SectionType[] = ['hero', 'features', 'faq', 'testimonial', 'cta', 'pricing'];
  if (!supportedTypes.includes(sectionType)) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-300 dark:border-violet-700 hover:from-violet-500/20 hover:to-purple-500/20", className)}
      >
        <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <span className="text-violet-700 dark:text-violet-300">AI Assist</span>
      </Button>

      <AIAssistModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        sectionType={sectionType}
        onApply={onApply}
      />
    </>
  );
}
