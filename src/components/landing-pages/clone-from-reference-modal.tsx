'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  clonePageFromReference,
  getAIQuotaForLandingPages,
} from '@/app/actions/landing-page-actions';
import AIUpgradePrompt from '@/components/ai/ai-upgrade-prompt';

interface CloneFromReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageCreated: (page: {
    name: string;
    sections: Array<{ type: string; content: Record<string, any> }>;
    settings: { primaryColor: string; fontFamily: string };
  }) => void;
}

type InputMethod = 'screenshot' | 'url';

export function CloneFromReferenceModal({ isOpen, onClose, onPageCreated }: CloneFromReferenceModalProps) {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [inputMethod, setInputMethod] = useState<InputMethod>('screenshot');
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generating, setGenerating] = useState(false);
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
    }
  }, [isOpen, company?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please upload an image under 10MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setScreenshotBase64(base64);
      setScreenshotPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setScreenshotBase64(base64);
        setScreenshotPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!appUser?.uid || !company?.id) {
      toast({ title: 'Error', description: 'Please sign in', variant: 'destructive' });
      return;
    }

    if (productDescription.length < 20) {
      toast({ title: 'Too Short', description: 'Please describe your product in at least 20 characters', variant: 'destructive' });
      return;
    }

    if (inputMethod === 'screenshot' && !screenshotBase64) {
      toast({ title: 'Missing Screenshot', description: 'Please upload a screenshot', variant: 'destructive' });
      return;
    }

    if (inputMethod === 'url' && !referenceUrl) {
      toast({ title: 'Missing URL', description: 'Please enter a reference URL', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const result = await clonePageFromReference({
        companyId: company.id,
        userId: appUser.uid,
        screenshotBase64: inputMethod === 'screenshot' ? screenshotBase64 || undefined : undefined,
        referenceUrl: inputMethod === 'url' ? referenceUrl : undefined,
        productDescription,
        productName: productName || undefined,
        targetAudience: targetAudience || undefined,
      });

      if (result.success && result.page) {
        setQuota({
          remaining: result.creditsRemaining || 0,
          limit: result.creditsLimit || 0,
          exceeded: (result.creditsRemaining || 0) <= 0,
        });
        
        toast({ 
          title: '🎉 Page Created!', 
          description: `Generated ${result.page.sections.length} sections from reference` 
        });
        
        onPageCreated(result.page);
        onClose();
        
        // Reset form
        setScreenshotBase64(null);
        setScreenshotPreview(null);
        setReferenceUrl('');
        setProductDescription('');
        setProductName('');
        setTargetAudience('');
        
      } else if (result.errorCode === 'no_credits') {
        setQuota({ remaining: 0, limit: result.creditsLimit || 0, exceeded: true });
        toast({ title: 'Not Enough Credits', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to create page', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  // Show upgrade prompt if not enough credits (need 3)
  if (!loadingQuota && quota.remaining < 3) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-950 rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:copy-bold" className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Clone from Reference</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <Icon icon="solar:info-circle-bold" className="inline h-4 w-4 mr-1" />
                Page cloning requires <strong>3 credits</strong>. You have {quota.remaining} credits remaining.
              </p>
            </div>
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
      <div className="bg-white dark:bg-stone-950 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Icon icon="solar:copy-bold" className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Clone from Reference</h2>
                <p className="text-xs text-muted-foreground">Upload a screenshot or paste a URL to recreate any landing page</p>
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
                <span className="font-medium text-foreground">{quota.remaining}</span> / {quota.limit} credits
                <span className="ml-2 text-amber-600 dark:text-amber-400">(This uses 3 credits)</span>
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh]">
          <div className="space-y-5">
            {/* Input Method Toggle */}
            <div>
              <Label className="text-xs font-medium mb-2 block">Reference Source</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setInputMethod('screenshot')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border text-sm transition-all",
                    inputMethod === 'screenshot'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <Icon icon="solar:gallery-bold" className="h-5 w-5" />
                  Upload Screenshot
                </button>
                <button
                  onClick={() => setInputMethod('url')}
                  className={cn(
                    "flex items-center justify-center gap-2 p-3 rounded-xl border text-sm transition-all",
                    inputMethod === 'url'
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <Icon icon="solar:link-bold" className="h-5 w-5" />
                  Paste URL
                </button>
              </div>
            </div>

            {/* Screenshot Upload */}
            {inputMethod === 'screenshot' && (
              <div>
                <Label className="text-xs font-medium mb-2 block">Screenshot of Reference Page</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                    screenshotPreview
                      ? "border-primary bg-primary/5"
                      : "border-stone-300 dark:border-stone-700 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {screenshotPreview ? (
                    <div className="space-y-3">
                      <img 
                        src={screenshotPreview} 
                        alt="Reference screenshot" 
                        className="max-h-48 mx-auto rounded-lg shadow-md"
                      />
                      <p className="text-xs text-muted-foreground">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto">
                        <Icon icon="solar:upload-bold" className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Drop screenshot here or click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* URL Input */}
            {inputMethod === 'url' && (
              <div>
                <Label className="text-xs font-medium">Reference URL</Label>
                <Input
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com/landing-page"
                  className="mt-1.5"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  AI will generate a similar page structure based on the URL context
                </p>
              </div>
            )}

            <div className="h-px bg-stone-200 dark:bg-stone-800" />

            {/* Product Info */}
            <div>
              <Label className="text-xs font-medium">Your Product/Service Description *</Label>
              <Textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe what your product/service does, its key benefits, and what makes it unique..."
                className="mt-1.5"
                rows={3}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {productDescription.length}/20 characters minimum
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Product Name (Optional)</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Your Product"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Target Audience (Optional)</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Small business owners"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating || productDescription.length < 20 || (inputMethod === 'screenshot' && !screenshotBase64) || (inputMethod === 'url' && !referenceUrl)}
              className="w-full gap-2"
              size="lg"
            >
              {generating ? (
                <>
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin" />
                  Analyzing & Creating Page...
                </>
              ) : (
                <>
                  <Icon icon="solar:magic-stick-3-bold" className="h-5 w-5" />
                  Create Page (3 credits)
                </>
              )}
            </Button>

            {/* Tips */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <p className="text-xs font-medium mb-2 flex items-center gap-1">
                <Icon icon="solar:lightbulb-bold" className="h-4 w-4 text-amber-500" />
                Tips for best results
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use a full-page screenshot for best analysis</li>
                <li>• Describe your product in detail for relevant content</li>
                <li>• AI will adapt the structure, not copy the exact design</li>
                <li>• You can edit all sections after creation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
