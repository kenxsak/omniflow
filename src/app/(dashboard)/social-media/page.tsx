"use client";

import React, { useState, type FormEvent, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  addStoredSocialMediaPostAction,
  getStoredSocialMediaPostsAction,
  updateStoredSocialMediaPostAction
} from '@/app/actions/social-media-actions';
import { 
  generateTrackedSocialContentAction, 
  generateTrackedHashtagAction,
  generateTrackedEnhancedPromptAction,
  generateTrackedTrendingTopicAction
} from '@/app/actions/tracked-ai-content-actions';
import { generateTrackedImageAction } from '@/app/actions/tracked-ai-media-actions';
import { generateTrackedReviewResponseAction } from '@/app/actions/tracked-ai-assistants';
import type { GenerateSocialMediaContentInput, GenerateSocialMediaContentOutput, SocialMediaPostVariation } from '@/ai/flows/generate-social-media-content-flow';
import type { GenerateHashtagSuggestionsInput } from '@/ai/flows/generate-hashtag-suggestions-flow';
import type { AiReviewResponderInput } from '@/ai/flows/ai-review-responder';
import type { GenerateEnhancedPromptInput, GenerateEnhancedPromptOutput, PromptGoal } from '@/ai/flows/generate-enhanced-prompt-flow';
import type { GetTrendingTopicSuggestionsInput, GetTrendingTopicSuggestionsOutput, ContentCreationType, PlanningHorizon } from '@/ai/flows/get-trending-topic-suggestions-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { SocialMediaPost } from '@/types/social-media';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { languageOptions } from '@/lib/language-options';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { showAIContentReadyToast, showAIImageGeneratedToast, showAISuccessToast, showAITaskCompleteToast } from '@/lib/ai-toast-helpers';
import { QuickPublishButtons } from '@/components/social-media/quick-publish-buttons';
import { ContentTemplatesSelector, TemplatePreviewCard } from '@/components/social-media/content-templates-selector';
import { ImageStylePresets, QuickStylePills } from '@/components/social-media/image-style-presets';
import { SEOScorePanel } from '@/components/social-media/seo-score-panel';
import type { ContentTemplate, ImageStylePreset } from '@/lib/content-templates';

type SocialPlatform = GenerateSocialMediaContentInput['platform'];
type SocialTone = GenerateSocialMediaContentInput['tone'];
type ImageAspectRatio = "Default" | "Square (1:1)" | "Landscape (16:9)" | "Portrait (9:16)" | "Portrait (4:5)";

interface ExtendedSocialMediaPostVariation extends SocialMediaPostVariation {
  suggestedHashtagsForVariation?: string[] | null;
  isFetchingHashtags?: boolean;
}

interface ExtendedGenerateSocialMediaContentOutput extends GenerateSocialMediaContentOutput {
  variations: ExtendedSocialMediaPostVariation[];
}

const parseAndRenderScript = (scriptText: string, useImagePromptAndGo: (promptText: string) => void) => {
  if (!scriptText) return null;
  const lines = scriptText.split('\n');
  const promptRegex = /\[IMAGE PROMPT FOR AI:\s*(.*?)\s*\]/i;

  return lines.map((line, index) => {
    const match = line.match(promptRegex);
    if (match && match[1]) {
      const extractedPrompt = match[1].trim();
      if (extractedPrompt) {
        return (
          <div key={index} className="flex items-center justify-between group my-1 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
            <span className="text-xs text-muted-foreground italic mr-2 flex-grow">
              Visual: {extractedPrompt}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs opacity-50 group-hover:opacity-100 transition-opacity"
              onClick={() => useImagePromptAndGo(extractedPrompt)}
            >
              <Icon icon="solar:magic-stick-3-linear" className="mr-1 h-3 w-3" /> Use for Image
            </Button>
          </div>
        );
      }
    }
    return <p key={index} className="text-sm whitespace-pre-wrap font-sans my-0.5">{line || '\u00A0'}</p>; 
  });
};

// Navigation tabs configuration
const navTabs = [
  { id: 'trends', label: 'Trending Topics', icon: 'solar:lightbulb-linear' },
  { id: 'enhancer', label: 'Prompt Enhancer', icon: 'solar:magic-stick-3-linear' },
  { id: 'content', label: 'Content Generator', icon: 'solar:document-text-linear' },
  { id: 'image', label: 'Image Generator', icon: 'solar:gallery-linear' },
  { id: 'hashtags', label: 'Hashtags', icon: 'solar:hashtag-linear' },
  { id: 'reviews', label: 'Review Responder', icon: 'solar:chat-round-dots-linear' },
];

export default function SocialMediaPage() {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const [activeTab, setActiveTab] = useState('content');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);

  const [contentInputs, setContentInputs] = useState<GenerateSocialMediaContentInput>({
    topic: '', platform: 'TwitterX', tone: 'Casual', goal: '', keywords: '', callToAction: '',
    includeHashtags: true, numVariations: 1, blogPostApproximateWords: undefined, targetLanguage: 'English',
    websiteUrl: '',
  });
  const [generatedContent, setGeneratedContent] = useState<ExtendedGenerateSocialMediaContentOutput | null>(null);

  const [imagePrompt, setImagePrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<ImageAspectRatio>("Default");
  const [generatedImageDataUri, setGeneratedImageDataUri] = useState<string | null>(null);
  const [promptForGeneratedImage, setPromptForGeneratedImage] = useState<string>('');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [includeLogo, setIncludeLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [trendInputs, setTrendInputs] = useState<GetTrendingTopicSuggestionsInput>({
    businessNiche: '', contentType: 'BlogPost', planningHorizon: 'Weekly', targetRegion: 'Global',
  });
  const [trendingSuggestions, setTrendingSuggestions] = useState<GetTrendingTopicSuggestionsOutput['suggestions'] | null>(null);

  const [hashtagInputs, setHashtagInputs] = useState<GenerateHashtagSuggestionsInput>({
    topicOrKeywords: '', platform: 'General', numSuggestions: 10,
  });
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[] | null>(null);

  const [reviewInput, setReviewInput] = useState<AiReviewResponderInput>({ reviewText: '', sentiment: 'neutral', businessName: '' });
  const [reviewResponse, setReviewResponse] = useState<string | null>(null);

  const [enhancedPromptInputs, setEnhancedPromptInputs] = useState<GenerateEnhancedPromptInput>({
    originalPrompt: '', promptGoal: 'ImageGeneration', desiredStyle: '', keyElements: ''
  });
  const [enhancedPromptResult, setEnhancedPromptResult] = useState<GenerateEnhancedPromptOutput | null>(null);
  
  // New state for templates and image styles
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStylePreset | null>(null);
  const [showSEOPanel, setShowSEOPanel] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (company) {
      setReviewInput(prev => ({ ...prev, businessName: company.name || 'Your Company' }));
      setContentInputs(prev => ({ ...prev, websiteUrl: company.website || '' }));
    }
  }, [company]);

  const handleContentInputChange = (field: keyof GenerateSocialMediaContentInput, value: string | boolean | number | undefined) => {
    setContentInputs(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle template selection
  const handleTemplateSelect = useCallback((template: ContentTemplate) => {
    setSelectedTemplate(template);
    // Set the platform if template specifies one
    if (template.platforms.length > 0) {
      const platform = template.platforms[0] as SocialPlatform;
      handleContentInputChange('platform', platform);
    }
    // Set the tone
    if (template.suggestedTone) {
      handleContentInputChange('tone', template.suggestedTone as SocialTone);
    }
    // Set the prompt template
    handleContentInputChange('topic', template.promptTemplate);
    // Set CTA if available
    if (template.suggestedCTA) {
      handleContentInputChange('callToAction', template.suggestedCTA);
    }
    toast({ title: 'Template Applied', description: `Fill in the [PLACEHOLDERS] in the prompt.` });
  }, [toast]);

  const handleTrendInputChange = (field: keyof GetTrendingTopicSuggestionsInput, value: string) => {
    setTrendInputs(prev => ({ ...prev, [field]: value }));
  };
  const handleHashtagInputChange = (field: keyof GenerateHashtagSuggestionsInput, value: string | number | undefined) => {
    setHashtagInputs(prev => ({ ...prev, [field]: value as any }));
  };
  const handleReviewInputChange = (field: keyof AiReviewResponderInput, value: string) => {
    setReviewInput(prev => ({ ...prev, [field]: value as any }));
  };
  const handleEnhancedPromptInputChange = (field: keyof GenerateEnhancedPromptInput, value: string) => {
    setEnhancedPromptInputs(prev => ({ ...prev, [field]: value as any}));
  };
  
  useEffect(() => {
    const editPostIdQuery = searchParams.get('editPostId');
    if (editPostIdQuery && appUser?.companyId) {
      const loadPostForEditing = async () => {
        setEditingPostId(editPostIdQuery);
        const result = await getStoredSocialMediaPostsAction(appUser.uid, appUser.companyId);
        
        if (!result.success || !result.data) {
          toast({ title: 'Error', description: 'Could not fetch saved posts.', variant: 'destructive' });
          return;
        }

        const postToEdit = result.data.find((p) => p.id === editPostIdQuery);

        if (postToEdit) {
          setEditingPost(postToEdit);
          handleContentInputChange('platform', postToEdit.platform);
          handleContentInputChange('salesPageContent', postToEdit.textContent); 
          handleContentInputChange('topic', `// Edit request for the loaded content. What should I change?`);
          
          setGeneratedContent({
            variations: [{
              textContent: postToEdit.textContent,
              suggestedImagePrompt: postToEdit.suggestedImagePrompt,
              suggestedVideoScriptIdea: postToEdit.suggestedVideoScriptIdea,
              suggestedVideoTitle: postToEdit.suggestedVideoTitle,
              suggestedVideoDescription: postToEdit.suggestedVideoDescription,
              suggestedVideoKeywordsTags: postToEdit.suggestedVideoKeywordsTags,
              suggestedVideoHashtags: postToEdit.suggestedVideoHashtags,
              suggestedVideoThumbnailPrompt: postToEdit.suggestedVideoThumbnailPrompt,
              isFetchingHashtags: false,
              suggestedHashtagsForVariation: null,
            }],
          });
          
          setActiveTab('content');
          toast({ title: 'Editing Saved Content', description: 'Content loaded. Type your edit request in the prompt field.' });

          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('editPostId');
          router.replace(currentUrl.toString(), { scroll: false });
        } else {
          toast({ title: 'Error', description: 'Could not find the saved post to edit.', variant: 'destructive' });
        }
      };
      loadPostForEditing();
    }
  }, [searchParams, router, toast, appUser]);

  const copyToClipboard = useCallback((text: string | string[], type: string) => {
    const textToCopy = Array.isArray(text) ? text.join(type === "Hashtags" || type === "Keywords/Tags" ? " " : "\n") : text;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast({ title: `${type} Copied!` }))
      .catch(() => toast({ title: 'Copy Failed', variant: 'destructive' }));
  }, [toast]);

  const fetchHashtagsForVariation = useCallback(async (variationIndex: number, topic: string, platform: SocialPlatform) => {
    if (!appUser) return;
    setGeneratedContent(prev => {
      if (!prev) return null;
      const newVariations = [...prev.variations];
      if (newVariations[variationIndex]) {
        newVariations[variationIndex] = { ...newVariations[variationIndex], isFetchingHashtags: true, suggestedHashtagsForVariation: null };
      }
      return { ...prev, variations: newVariations };
    });

    try {
      let hashtagPlatform: GenerateHashtagSuggestionsInput['platform'] = 'General';
      if (platform === 'Instagram') hashtagPlatform = 'Instagram';
      else if (platform === 'TwitterX') hashtagPlatform = 'Twitter/X';
      else if (platform === 'LinkedIn') hashtagPlatform = 'LinkedIn';

      const result = await generateTrackedHashtagAction(appUser.companyId, appUser.uid, {
        topicOrKeywords: topic,
        platform: hashtagPlatform,
        numSuggestions: 5,
      });

      if (!result.success || !result.data) throw new Error(result.error || 'Failed to generate hashtags.');

      setGeneratedContent(prev => {
        if (!prev) return null;
        const newVariations = [...prev.variations];
        if (newVariations[variationIndex]) {
          newVariations[variationIndex] = {
            ...newVariations[variationIndex],
            suggestedHashtagsForVariation: result.data!.hashtagSuggestions,
            isFetchingHashtags: false,
          };
        }
        return { ...prev, variations: newVariations };
      });
    } catch (error) {
      console.error(`Error fetching hashtags for variation ${variationIndex}:`, error);
      setGeneratedContent(prev => {
        if (!prev) return null;
        const newVariations = [...prev.variations];
        if (newVariations[variationIndex]) {
          newVariations[variationIndex] = { ...newVariations[variationIndex], isFetchingHashtags: false, suggestedHashtagsForVariation: ['#error'] };
        }
        return { ...prev, variations: newVariations };
      });
    }
  }, [appUser]);

  const handleSaveOrUpdatePost = useCallback(async (variation: SocialMediaPostVariation) => {
    if (!appUser?.companyId) {
        toast({ title: 'Error', description: 'Could not save, user or company info missing.', variant: 'destructive' });
        return;
    }
    
    let postStatus: 'Draft' | 'Scheduled' | 'Posted';
    if (editingPostId && editingPost) {
      postStatus = editingPost.status;
    } else {
      postStatus = (contentInputs.platform === 'BlogPost' || contentInputs.platform === 'SalesLandingPage') 
        ? 'Posted' : 'Draft';
    }
    
    let finalPayload: Omit<SocialMediaPost, 'id' | 'createdAt'> = {
        platform: contentInputs.platform,
        textContent: variation.textContent,
        companyId: appUser.companyId,
        originalTopic: contentInputs.topic || undefined,
        suggestedImagePrompt: variation.suggestedImagePrompt,
        imageUrl: generatedImageDataUri || undefined,
        isAiGeneratedImage: !!generatedImageDataUri,
        imageAiHint: variation.suggestedImagePrompt?.split(',').slice(0, 2).join(' ') || undefined,
        status: postStatus,
        suggestedVideoTitle: variation.suggestedVideoTitle,
        suggestedVideoDescription: variation.suggestedVideoDescription,
        suggestedVideoKeywordsTags: variation.suggestedVideoKeywordsTags,
    };
    
    try {
      if (editingPostId) {
          const result = await updateStoredSocialMediaPostAction(appUser.uid, { ...finalPayload, id: editingPostId });
           if (!result.success) throw new Error(result.error);
          toast({ title: "Content Updated" });
      } else {
          const result = await addStoredSocialMediaPostAction(appUser.uid, finalPayload);
          
          // Handle limit reached error with upgrade prompt
          if (!result.success) {
            if (result.limitReached) {
              toast({ 
                title: '📦 Storage Limit Reached', 
                description: (
                  <div className="space-y-2">
                    <p>{result.error}</p>
                    <Link href="/settings?tab=billing" className="text-primary underline font-medium">
                      Upgrade your plan →
                    </Link>
                  </div>
                ),
                variant: 'destructive',
                duration: 8000,
              });
              return;
            }
            throw new Error(result.error || 'Failed to save post');
          }
          
          const isInstantlyLive = contentInputs.platform === 'BlogPost' || contentInputs.platform === 'SalesLandingPage';
          toast({
              title: isInstantlyLive ? "Content Published!" : "Saved to Content Hub",
              description: (<span>View in <Link href="/social-media/content-hub" className="underline font-bold">Content Hub</Link></span>),
          });
      }
      setEditingPostId(null);
      setEditingPost(null);
      handleContentInputChange('salesPageContent', undefined);

    } catch (error: any) {
        console.error("Error saving post:", error);
        toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    }
  }, [contentInputs, toast, editingPostId, editingPost, appUser, generatedImageDataUri]);

  const handleContentFormSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!contentInputs.topic || !appUser) {
        toast({ title: 'Missing Prompt/Topic', variant: "destructive" });
        return;
    }
    
    setIsLoadingContent(true); 
    setGeneratedContent(null);
    try {
      const result = await generateTrackedSocialContentAction(appUser.companyId, appUser.uid, contentInputs);
      
      if (result.success && result.data) {
        const extendedResult: ExtendedGenerateSocialMediaContentOutput = {
          ...result.data,
          variations: result.data.variations.map(v => ({ ...v, suggestedHashtagsForVariation: null, isFetchingHashtags: false }))
        };
        setGeneratedContent(extendedResult);

        if ((contentInputs.platform === 'SalesLandingPage' || contentInputs.platform === 'BlogPost') && result.data.variations.length > 0) {
            handleContentInputChange('salesPageContent', result.data.variations[0].textContent);
        }
        
        showAIContentReadyToast(toast, "Content", result.quotaInfo);

        if (result.data.variations.length > 0 && contentInputs.includeHashtags && 
            ['TwitterX', 'Instagram', 'LinkedIn', 'Facebook'].includes(contentInputs.platform)) {
          result.data.variations.forEach((variation, index) => {
            const topicForHashtags = contentInputs.keywords || contentInputs.topic;
            if (topicForHashtags) {
              fetchHashtagsForVariation(index, topicForHashtags, contentInputs.platform);
            }
          });
        }
      } else {
        throw new Error(result.error || 'AI generation failed.');
      }
    } catch (error: any) {
      toast({ title: 'Generation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingContent(false);
    }
  }, [contentInputs, fetchHashtagsForVariation, toast, appUser]);
  
  const parseAspectRatioFromPrompt = useCallback((promptText: string): ImageAspectRatio => {
    const lowerPrompt = promptText.toLowerCase();
    if (lowerPrompt.includes("square") || lowerPrompt.includes("1:1")) return "Square (1:1)";
    if (lowerPrompt.includes("16:9") || lowerPrompt.includes("landscape")) return "Landscape (16:9)";
    if (lowerPrompt.includes("9:16") || lowerPrompt.includes("vertical")) return "Portrait (9:16)";
    if (lowerPrompt.includes("4:5") || lowerPrompt.includes("portrait")) return "Portrait (4:5)";
    return "Default";
  }, []);

  const useImagePromptAndGo = useCallback((promptText: string) => {
    setImagePrompt(promptText);
    const parsedRatio = parseAspectRatioFromPrompt(promptText);
    setSelectedAspectRatio(parsedRatio);
    setActiveTab('image');
    toast({ title: "Image Prompt Set", description: `Aspect ratio: ${parsedRatio}`});
  }, [parseAspectRatioFromPrompt, toast]);

  // Handle logo upload for branding
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file (PNG, JPG, SVG)', variant: 'destructive' });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Logo must be under 2MB', variant: 'destructive' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setBrandLogo(dataUri);
      setIncludeLogo(true);
      toast({ title: 'Logo Uploaded', description: 'Your brand logo will be added to generated images' });
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const removeLogo = useCallback(() => {
    setBrandLogo(null);
    setIncludeLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }, []);

  const handleImageGenerationSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    if (!imagePrompt || !appUser) {
      toast({ title: 'Missing Image Prompt', description: 'Please describe the image you want to create', variant: 'destructive' }); return;
    }
    setIsGeneratingImage(true); setGeneratedImageDataUri(null);
    
    // Map user-friendly aspect ratio names to API values
    let aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | undefined = undefined;
    if (selectedAspectRatio !== "Default") {
        const ratioMapping: Record<string, "1:1" | "16:9" | "9:16" | "4:3" | "3:4"> = { 
          "Square (1:1)": "1:1", 
          "Landscape (16:9)": "16:9", 
          "Portrait (9:16)": "9:16", 
          "Portrait (4:5)": "3:4" // Map 4:5 to closest supported ratio
        };
        aspectRatio = ratioMapping[selectedAspectRatio];
    }

    // Apply style preset to prompt if selected
    let finalPrompt = imagePrompt;
    if (selectedImageStyle) {
      finalPrompt = imagePrompt + selectedImageStyle.promptSuffix;
    }

    setPromptForGeneratedImage(finalPrompt);
    try {
      // Build input - brand logo is optional
      const imageInput: any = { 
        prompt: finalPrompt, 
        aspectRatio: aspectRatio
      };
      
      // Only add brand logo if user has uploaded one AND wants it included
      if (brandLogo && includeLogo) {
        imageInput.brandLogo = brandLogo;
        imageInput.brandName = company?.name || undefined;
      }
      
      const result = await generateTrackedImageAction(appUser.companyId, appUser.uid, imageInput);

      if (result.success && result.data?.imageDataUri) {
        setGeneratedImageDataUri(result.data.imageDataUri);
        
        if (generatedContent?.variations[0]?.textContent) {
            const placeholderRegex = /https?:\/\/placehold\.co\/[\w/.]+|https?:\/\/picsum\.photos\/seed\/[^/]+\/\d+\/\d+/g;
            const updatedHtml = generatedContent.variations[0].textContent.replace(placeholderRegex, result.data.imageDataUri);
            setGeneratedContent(prev => {
                if (!prev) return null;
                const newVariations = [...prev.variations];
                newVariations[0] = { ...newVariations[0], textContent: updatedHtml };
                return { ...prev, variations: newVariations };
            });
             handleContentInputChange('salesPageContent', updatedHtml);
        }

        showAIImageGeneratedToast(toast, result.quotaInfo);
      } else {
        throw new Error(result.error || 'Image generation failed.');
      }
    } catch (error: any) {
      toast({ title: 'Image Generation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [imagePrompt, selectedAspectRatio, selectedImageStyle, toast, generatedContent, appUser, brandLogo, includeLogo, company]);

  const handleTrendFormSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!trendInputs.businessNiche || !appUser) {
      toast({ title: 'Missing Business Niche', variant: "destructive" }); return;
    }
    setIsLoadingTrends(true); setTrendingSuggestions(null);
    try {
      const result = await generateTrackedTrendingTopicAction(appUser.companyId, appUser.uid, trendInputs);
      if(!result.success || !result.data) throw new Error(result.error || 'Failed to get trends.');
      setTrendingSuggestions(result.data.suggestions);
      showAISuccessToast(toast, "Trending Topics", result.quotaInfo);
    } catch (error: any) {
      toast({ title: 'Trend Suggestion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingTrends(false);
    }
  }, [trendInputs, toast, appUser]);

  const handleHashtagFormSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!hashtagInputs.topicOrKeywords || !appUser) {
      toast({ title: "Topic/Keywords Required", variant: "destructive" }); return;
    }
    setIsGeneratingHashtags(true); setHashtagSuggestions(null);
    try {
      const result = await generateTrackedHashtagAction(appUser.companyId, appUser.uid, hashtagInputs);
       if(!result.success || !result.data) throw new Error(result.error || 'Failed to generate hashtags.');
      setHashtagSuggestions(result.data.hashtagSuggestions);
      showAISuccessToast(toast, "Hashtags", result.quotaInfo);
    } catch (error: any) {
      toast({ title: 'Error Generating Hashtags', description: error.message, variant: 'destructive' });
    } finally {
      setIsGeneratingHashtags(false);
    }
  }, [hashtagInputs, toast, appUser]);

  const handleReviewSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewInput.reviewText || !reviewInput.businessName || !appUser) {
      toast({ title: "Missing Information", variant: "destructive" });
      return;
    }
    setIsReviewLoading(true);
    setReviewResponse(null);
    try {
      const result = await generateTrackedReviewResponseAction(appUser.companyId, appUser.uid, reviewInput);
      if(!result.success || !result.data) throw new Error(result.error || 'Failed to generate response.');
      setReviewResponse(result.data.response);
      showAITaskCompleteToast(toast, "Review response", result.quotaInfo);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setIsReviewLoading(false);
  }, [reviewInput, toast, appUser]);
  
  const handleEnhancedPromptSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!enhancedPromptInputs.originalPrompt || !appUser) {
      toast({ title: "Original Idea Required", variant: "destructive" });
      return;
    }
    setIsEnhancingPrompt(true);
    setEnhancedPromptResult(null);
    try {
      const result = await generateTrackedEnhancedPromptAction(appUser.companyId, appUser.uid, enhancedPromptInputs);
       if(!result.success || !result.data) throw new Error(result.error || 'Failed to enhance prompt.');
      setEnhancedPromptResult(result.data);
      showAISuccessToast(toast, "Enhanced Prompt", result.quotaInfo);
    } catch (error: any) {
      toast({ title: "Prompt Enhancement Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsEnhancingPrompt(false);
    }
  }, [enhancedPromptInputs, toast, appUser]);

  const useEnhancedPrompt = useCallback((promptText: string, goal: PromptGoal) => {
    if (goal === 'ImageGeneration') {
      setImagePrompt(promptText);
      setActiveTab('image');
      toast({ title: "Image Prompt Set" });
    } else if (goal === 'TextContent' || goal === 'VideoScriptIdea') {
      const platformForContent = goal === 'TextContent' ? 'BlogPost' : 'YouTubeVideoScript';
      handleContentInputChange('platform', platformForContent as SocialPlatform);
      handleContentInputChange('topic', promptText);
      setActiveTab('content');
      toast({ title: "Content Idea Set" });
    } else if (goal === 'SalesPageBrief') {
        handleContentInputChange('platform', 'SalesLandingPage');
        handleContentInputChange('topic', promptText);
        setActiveTab('content');
        toast({ title: "Sales Page Brief Set" });
    }
  }, [toast]);

  const downloadImage = useCallback(async () => {
    if (!generatedImageDataUri) return;
    
    // If no logo, download directly
    if (!brandLogo || !includeLogo) {
      const link = document.createElement('a');
      link.href = generatedImageDataUri;
      const fileNamePromptPart = imagePrompt.substring(0, 20).replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      link.download = `omniflow-ai-image-${fileNamePromptPart || 'generated'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Image Download Started' });
      return;
    }
    
    // With logo - composite the images using canvas
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      
      // Load the main image
      const mainImg = new Image();
      mainImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        mainImg.onload = () => resolve();
        mainImg.onerror = reject;
        mainImg.src = generatedImageDataUri;
      });
      
      // Set canvas size to main image
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;
      
      // Draw main image
      ctx.drawImage(mainImg, 0, 0);
      
      // Load and draw logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = reject;
        logoImg.src = brandLogo;
      });
      
      // Calculate logo size (max 15% of image width, maintain aspect ratio)
      const maxLogoWidth = canvas.width * 0.15;
      const maxLogoHeight = canvas.height * 0.15;
      let logoWidth = logoImg.width;
      let logoHeight = logoImg.height;
      
      if (logoWidth > maxLogoWidth) {
        const ratio = maxLogoWidth / logoWidth;
        logoWidth = maxLogoWidth;
        logoHeight = logoHeight * ratio;
      }
      if (logoHeight > maxLogoHeight) {
        const ratio = maxLogoHeight / logoHeight;
        logoHeight = maxLogoHeight;
        logoWidth = logoWidth * ratio;
      }
      
      // Position logo in bottom-right corner with padding
      const padding = Math.min(canvas.width, canvas.height) * 0.03;
      const logoX = canvas.width - logoWidth - padding;
      const logoY = canvas.height - logoHeight - padding;
      
      // Draw semi-transparent background for logo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const bgPadding = 8;
      ctx.beginPath();
      ctx.roundRect(logoX - bgPadding, logoY - bgPadding, logoWidth + bgPadding * 2, logoHeight + bgPadding * 2, 8);
      ctx.fill();
      
      // Draw logo
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
      
      // Download the composited image
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      const fileNamePromptPart = imagePrompt.substring(0, 20).replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      link.download = `omniflow-branded-${fileNamePromptPart || 'generated'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Branded Image Downloaded', description: 'Your logo has been added to the image' });
    } catch (error) {
      console.error('Error compositing image:', error);
      // Fallback to downloading without logo
      const link = document.createElement('a');
      link.href = generatedImageDataUri;
      const fileNamePromptPart = imagePrompt.substring(0, 20).replace(/\s+/g, '_').replace(/[^\w-]/g, '');
      link.download = `omniflow-ai-image-${fileNamePromptPart || 'generated'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Image Downloaded', description: 'Logo could not be added', variant: 'destructive' });
    }
  }, [generatedImageDataUri, imagePrompt, brandLogo, includeLogo, toast]);
  
  const useTrendSuggestionForContent = useCallback((topic: string, keywords: string[]) => {
    handleContentInputChange('topic', topic);
    handleContentInputChange('keywords', keywords.join(', '));
    let platformToSet: SocialPlatform = trendInputs.contentType === 'YouTubeVideo' ? 'YouTubeVideoScript' : 'BlogPost';
    handleContentInputChange('platform', platformToSet);
    toast({ title: "Content Inputs Set" });
    setActiveTab('content');
  }, [trendInputs.contentType, toast]);
  
  const useKeywordsForHashtagSuggester = useCallback((keywords: string[]) => {
    setHashtagInputs(prev => ({ ...prev, topicOrKeywords: keywords.join(', ') }));
    toast({ title: "Keywords Set for Hashtags" });
    setActiveTab('hashtags');
  }, [toast]);
  
  const useHashtagsForHashtagSuggester = useCallback((hashtags: string[]) => {
    setHashtagInputs(prev => ({...prev, topicOrKeywords: hashtags.map(h => h.replace('#', '')).join(', ')}));
    toast({ title: "Hashtags Set" });
    setActiveTab('hashtags');
  }, [toast]);

  const useImagePromptForGenerator = useCallback((prompt: string) => {
    if (prompt) {
      setImagePrompt(prompt);
      setSelectedAspectRatio(parseAspectRatioFromPrompt(prompt));
      toast({ title: "Image Prompt Set" });
      setActiveTab('image');
    }
  }, [parseAspectRatioFromPrompt, toast]);

  const handlePreviewInNewTab = useCallback((content: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Content Factory</h1>
          <p className="text-xs text-muted-foreground">Generate text, images, video ideas, and discover trending topics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Link href="/social-media/planner">
              <Icon icon="solar:calendar-mark-linear" className="h-4 w-4 mr-1.5" style={{ color: '#3b82f6' }} />
              <span className="hidden sm:inline">Content </span>Planner
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-900/20">
            <Link href="/social-media/content-hub">
              <Icon icon="solar:folder-with-files-linear" className="h-4 w-4 mr-1.5" style={{ color: '#14b8a6' }} />
              <span className="hidden sm:inline">Content </span>Hub
            </Link>
          </Button>
        </div>
      </header>

      {/* Navigation Tabs - Clerk Style */}
      <nav className="relative border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-hide">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon icon={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-3 bottom-0 h-0.5 bg-foreground rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {/* Trending Topics Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-amber-500 dark:bg-amber-400" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="solar:lightbulb-linear" className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  <h2 className="text-sm font-semibold">Trending Topic Suggester</h2>
                </div>
                <form onSubmit={handleTrendFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Business Niche *</Label>
                      <Input value={trendInputs.businessNiche} onChange={(e) => handleTrendInputChange('businessNiche', e.target.value)} placeholder="e.g., Sustainable Home Decor" required className="mt-1.5 h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Content Type *</Label>
                      <Select value={trendInputs.contentType} onValueChange={(value: ContentCreationType) => handleTrendInputChange('contentType', value)}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BlogPost">Blog Post</SelectItem>
                          <SelectItem value="YouTubeVideo">YouTube Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Planning Horizon *</Label>
                      <Select value={trendInputs.planningHorizon} onValueChange={(value: PlanningHorizon) => handleTrendInputChange('planningHorizon', value)}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Target Region (Optional)</Label>
                      <Input value={trendInputs.targetRegion || ''} onChange={(e) => handleTrendInputChange('targetRegion', e.target.value)} placeholder="e.g., Global, USA" className="mt-1.5 h-9 text-sm" />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoadingTrends} size="sm" className="h-8 text-white" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    {isLoadingTrends && <Icon icon="solar:refresh-linear" className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    <Icon icon="solar:magnifer-linear" className="mr-2 h-3.5 w-3.5" />
                    Get Trends
                  </Button>
                </form>
              </div>
            </div>

            {trendingSuggestions && trendingSuggestions.length > 0 && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">Topic Suggestions</h3>
                  <Accordion type="single" collapsible className="w-full space-y-2">
                    {trendingSuggestions.map((s, i) => (
                      <AccordionItem value={`trend-${i}`} key={i} className="border border-stone-200 dark:border-stone-800 rounded-lg px-3">
                        <AccordionTrigger className="text-sm hover:no-underline py-3">{s.topic}</AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-3 text-xs">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => useTrendSuggestionForContent(s.topic, s.suggestedKeywords)}>
                            <Icon icon="solar:arrow-right-linear" className="mr-1 h-3 w-3" />Use for Content
                          </Button>
                          <p className="text-muted-foreground">{s.reasoning}</p>
                          <div>
                            <span className="font-medium">Keywords:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.suggestedKeywords.map(kw => <Badge key={kw} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => copyToClipboard(kw, "Keyword")}>{kw}</Badge>)}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] mt-1" onClick={() => useKeywordsForHashtagSuggester(s.suggestedKeywords)}>
                              <Icon icon="solar:hashtag-linear" className="mr-1 h-3 w-3" />Use for Hashtags
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Enhancer Tab */}
        {activeTab === 'enhancer' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  <h2 className="text-sm font-semibold">Prompt Enhancer</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Turn simple ideas into powerful, detailed prompts for AI image generation and content creation.</p>
                <form onSubmit={handleEnhancedPromptSubmit} className="space-y-4">
                  <div>
                    <Label className="text-xs">Your Basic Idea *</Label>
                    <Textarea 
                      value={enhancedPromptInputs.originalPrompt} 
                      onChange={(e) => handleEnhancedPromptInputChange('originalPrompt', e.target.value)} 
                      placeholder={enhancedPromptInputs.promptGoal === 'ImageGeneration' 
                        ? "e.g., A marketing image for my CRM software" 
                        : "e.g., A sales page for my SaaS company"
                      } 
                      required 
                      rows={3} 
                      className="mt-1.5 text-sm" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Output Type *</Label>
                    <Select value={enhancedPromptInputs.promptGoal} onValueChange={(value: PromptGoal) => handleEnhancedPromptInputChange('promptGoal', value as string)}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ImageGeneration">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:gallery-linear" className="h-3.5 w-3.5" />
                            Image Generation
                          </div>
                        </SelectItem>
                        <SelectItem value="SalesPageBrief">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:document-text-linear" className="h-3.5 w-3.5" />
                            Sales Page Brief
                          </div>
                        </SelectItem>
                        <SelectItem value="TextContent">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:pen-new-square-linear" className="h-3.5 w-3.5" />
                            Text Content
                          </div>
                        </SelectItem>
                        <SelectItem value="VideoScriptIdea">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:video-frame-linear" className="h-3.5 w-3.5" />
                            Video Script Idea
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Contextual tips based on output type */}
                  {enhancedPromptInputs.promptGoal === 'ImageGeneration' && (
                    <div className="p-3 rounded-lg bg-stone-100 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50">
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Icon icon="solar:lightbulb-linear" className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>For best results, mention: subject, style (photorealistic, illustration, 3D), colors, mood, and composition. The AI will expand your idea into a detailed image prompt.</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Style/Tone (Optional)</Label>
                      <Input 
                        value={enhancedPromptInputs.desiredStyle || ''} 
                        onChange={(e) => handleEnhancedPromptInputChange('desiredStyle', e.target.value)} 
                        placeholder={enhancedPromptInputs.promptGoal === 'ImageGeneration' 
                          ? "e.g., photorealistic, minimalist, neon" 
                          : "e.g., professional, witty, casual"
                        } 
                        className="mt-1.5 h-9 text-sm" 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Key Elements (Optional)</Label>
                      <Input 
                        value={enhancedPromptInputs.keyElements || ''} 
                        onChange={(e) => handleEnhancedPromptInputChange('keyElements', e.target.value)} 
                        placeholder={enhancedPromptInputs.promptGoal === 'ImageGeneration' 
                          ? "e.g., dark background, gradient, tech" 
                          : "e.g., benefits, testimonials, CTA"
                        } 
                        className="mt-1.5 h-9 text-sm" 
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isEnhancingPrompt} size="sm" className="h-8 text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                    {isEnhancingPrompt && <Icon icon="solar:refresh-linear" className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-3.5 w-3.5" />
                    Enhance Prompt
                  </Button>
                </form>
              </div>
            </div>

            {enhancedPromptResult && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Enhanced Prompt</h3>
                    {enhancedPromptInputs.promptGoal === 'ImageGeneration' && (
                      <Badge variant="secondary" className="text-[9px]">Ready for Image Generation</Badge>
                    )}
                  </div>
                  <Textarea value={enhancedPromptResult.enhancedPrompt} readOnly rows={5} className="text-sm bg-stone-50 dark:bg-stone-900" />
                  
                  {/* Action buttons based on prompt goal */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => copyToClipboard(enhancedPromptResult.enhancedPrompt, "Enhanced Prompt")}>
                      <Icon icon="solar:copy-linear" className="mr-1.5 h-3.5 w-3.5" /> Copy Prompt
                    </Button>
                    
                    {enhancedPromptInputs.promptGoal === 'ImageGeneration' ? (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => useEnhancedPrompt(enhancedPromptResult.enhancedPrompt, enhancedPromptInputs.promptGoal as PromptGoal)}>
                          <Icon icon="solar:pen-new-square-linear" className="mr-1.5 h-3.5 w-3.5" /> Edit in Image Generator
                        </Button>
                        <Button size="sm" className="h-8 text-xs" onClick={async () => {
                          // Direct image generation with enhanced prompt
                          if (!appUser) return;
                          setImagePrompt(enhancedPromptResult.enhancedPrompt);
                          setActiveTab('image');
                          setIsGeneratingImage(true);
                          setGeneratedImageDataUri(null);
                          setPromptForGeneratedImage(enhancedPromptResult.enhancedPrompt);
                          
                          try {
                            const imageInput: any = { 
                              prompt: enhancedPromptResult.enhancedPrompt, 
                              aspectRatio: undefined 
                            };
                            if (brandLogo && includeLogo) {
                              imageInput.brandLogo = brandLogo;
                              imageInput.brandName = company?.name || undefined;
                            }
                            const result = await generateTrackedImageAction(appUser.companyId, appUser.uid, imageInput);
                            if (result.success && result.data?.imageDataUri) {
                              setGeneratedImageDataUri(result.data.imageDataUri);
                              showAIImageGeneratedToast(toast, result.quotaInfo);
                            } else {
                              throw new Error(result.error || 'Image generation failed.');
                            }
                          } catch (error: any) {
                            toast({ title: 'Image Generation Failed', description: error.message, variant: 'destructive' });
                          } finally {
                            setIsGeneratingImage(false);
                          }
                        }} disabled={isGeneratingImage}>
                          {isGeneratingImage ? (
                            <Icon icon="solar:refresh-linear" className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Icon icon="solar:gallery-add-linear" className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {brandLogo ? 'Generate Branded Image' : 'Generate Image Now'}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="h-8 text-xs" onClick={() => useEnhancedPrompt(enhancedPromptResult.enhancedPrompt, enhancedPromptInputs.promptGoal as PromptGoal)}>
                        <Icon icon="solar:arrow-right-linear" className="mr-1.5 h-3.5 w-3.5" /> Use This Prompt
                      </Button>
                    )}
                  </div>
                  
                  {/* Brand logo indicator for image generation */}
                  {enhancedPromptInputs.promptGoal === 'ImageGeneration' && brandLogo && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50">
                      <div className="h-8 w-8 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-0.5 flex items-center justify-center overflow-hidden">
                        <NextImage src={brandLogo} alt="Brand logo" width={28} height={28} className="object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium">Brand logo will be used</p>
                        <p className="text-[10px] text-muted-foreground">AI will incorporate your branding into the image</p>
                      </div>
                    </div>
                  )}
                  
                  {enhancedPromptResult.guidanceNotes && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200/50 dark:border-stone-700/50">
                      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">AI Guidance</p>
                      <p className="text-xs text-muted-foreground">{enhancedPromptResult.guidanceNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Generator Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-blue-500 dark:bg-blue-400" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:document-text-linear" className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <h2 className="text-sm font-semibold">Content Generator</h2>
                  </div>
                  <ContentTemplatesSelector 
                    onSelectTemplate={handleTemplateSelect}
                    currentPlatform={contentInputs.platform}
                  />
                </div>
                
                {/* Selected Template Preview */}
                {selectedTemplate && (
                  <TemplatePreviewCard 
                    template={selectedTemplate} 
                    onClear={() => setSelectedTemplate(null)} 
                  />
                )}
                
                <form onSubmit={handleContentFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Platform *</Label>
                      <Select value={contentInputs.platform} onValueChange={(value: SocialPlatform) => { handleContentInputChange('platform', value); setGeneratedContent(null); }}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SalesLandingPage">Sales Landing Page (HTML)</SelectItem>
                          <SelectItem value="BlogPost">Blog Post (HTML)</SelectItem>
                          <SelectItem value="TwitterX">Twitter / X</SelectItem>
                          <SelectItem value="Instagram">Instagram Post</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn Post</SelectItem>
                          <SelectItem value="Facebook">Facebook Post</SelectItem>
                          <SelectItem value="YouTubeVideoScript">YouTube Video Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tone *</Label>
                      <Select value={contentInputs.tone} onValueChange={(value: SocialTone) => handleContentInputChange('tone', value)}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Humorous">Humorous</SelectItem>
                          <SelectItem value="Inspirational">Inspirational</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Witty">Witty</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Describe What You Want *</Label>
                    <Textarea value={contentInputs.topic} onChange={(e) => handleContentInputChange('topic', e.target.value)} placeholder="e.g., A blog post about AI in marketing" rows={4} required className="mt-1.5 text-sm" />
                  </div>
                  {(contentInputs.platform === 'SalesLandingPage' || contentInputs.platform === 'BlogPost') && (
                    <div>
                      <Label className="text-xs">Base Content (For Editing)</Label>
                      <Textarea value={contentInputs.salesPageContent || ''} onChange={(e) => handleContentInputChange('salesPageContent', e.target.value)} placeholder="Leave empty for new content, or paste existing content to edit" rows={6} className="mt-1.5 text-xs font-mono" />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Target Language</Label>
                    <Select value={contentInputs.targetLanguage || 'English'} onValueChange={(value) => handleContentInputChange('targetLanguage', value)}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {languageOptions.map(lang => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={isLoadingContent} size="sm" className="h-8 text-white" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    {isLoadingContent && <Icon icon="solar:refresh-linear" className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-3.5 w-3.5" />
                    {editingPostId ? 'Re-Generate' : 'Generate Content'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Generated Content Results */}
            {generatedContent && generatedContent.variations.length > 0 && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Generated Content</h3>
                    <div className="flex items-center gap-2">
                      {/* SEO Score for Blog Posts */}
                      {contentInputs.platform === 'BlogPost' && generatedContent.variations[0]?.textContent && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => setShowSEOPanel(!showSEOPanel)}
                        >
                          <Icon icon="solar:chart-2-bold" className="mr-1 h-3 w-3" />
                          SEO Score
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSaveOrUpdatePost(generatedContent.variations[0])}>
                        <Icon icon="solar:diskette-linear" className="mr-1 h-3 w-3" />
                        {editingPostId ? 'Update' : 'Save to Hub'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* SEO Score Panel */}
                  {showSEOPanel && contentInputs.platform === 'BlogPost' && generatedContent.variations[0]?.textContent && (
                    <SEOScorePanel 
                      htmlContent={generatedContent.variations[0].textContent}
                      onClose={() => setShowSEOPanel(false)}
                    />
                  )}
                  
                  {generatedContent.variations.map((variation, index) => {
                    const isWebPage = contentInputs.platform === 'SalesLandingPage' || contentInputs.platform === 'BlogPost';
                    const isYouTube = contentInputs.platform === 'YouTubeVideoScript';
                    
                    return (
                      <div key={index} className="space-y-4">
                        {variation.textContent && (
                          <div>
                            {isWebPage ? (
                              <Tabs defaultValue="preview" className="w-full">
                                <TabsList className="h-8">
                                  <TabsTrigger value="preview" className="text-xs h-7"><Icon icon="solar:eye-linear" className="mr-1 h-3 w-3" />Preview</TabsTrigger>
                                  <TabsTrigger value="code" className="text-xs h-7"><Icon icon="solar:code-linear" className="mr-1 h-3 w-3" />Code</TabsTrigger>
                                </TabsList>
                                <TabsContent value="preview" className="mt-2">
                                  <Button className="w-full h-9 text-xs" variant="outline" onClick={() => handlePreviewInNewTab(variation.textContent)}>
                                    <Icon icon="solar:square-arrow-right-up-linear" className="mr-2 h-3.5 w-3.5" />
                                    Open Preview in New Tab
                                  </Button>
                                </TabsContent>
                                <TabsContent value="code">
                                  <ScrollArea className="h-[400px] border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 p-3">
                                    <pre className="text-xs whitespace-pre-wrap font-mono">{variation.textContent}</pre>
                                  </ScrollArea>
                                  <Button variant="outline" size="sm" className="h-7 text-xs mt-2" onClick={() => copyToClipboard(variation.textContent, 'HTML')}>
                                    <Icon icon="solar:copy-linear" className="mr-1 h-3 w-3" /> Copy HTML
                                  </Button>
                                </TabsContent>
                              </Tabs>
                            ) : isYouTube ? (
                              <ScrollArea className="h-80 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 p-3">
                                {parseAndRenderScript(variation.textContent, useImagePromptAndGo)}
                              </ScrollArea>
                            ) : (
                              <>
                                <ScrollArea className="h-48 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 p-3">
                                  <pre className="text-sm whitespace-pre-wrap font-sans">{variation.textContent}</pre>
                                </ScrollArea>
                                <Button variant="outline" size="sm" className="h-7 text-xs mt-2" onClick={() => copyToClipboard(variation.textContent, 'Text')}>
                                  <Icon icon="solar:copy-linear" className="mr-1 h-3 w-3" /> Copy Text
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Hashtags */}
                        {variation.suggestedHashtagsForVariation && variation.suggestedHashtagsForVariation.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Hashtags</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {variation.suggestedHashtagsForVariation.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => copyToClipboard(tag, "Hashtag")}>{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {variation.isFetchingHashtags && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Icon icon="solar:refresh-linear" className="mr-2 h-3 w-3 animate-spin" />Fetching hashtags...
                          </div>
                        )}

                        {/* YouTube specific fields */}
                        {isYouTube && (
                          <div className="space-y-3">
                            {variation.suggestedVideoTitle && (
                              <div>
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Video Title</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input value={variation.suggestedVideoTitle} readOnly className="h-8 text-xs bg-stone-50 dark:bg-stone-900" />
                                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(variation.suggestedVideoTitle!, 'Title')}>
                                    <Icon icon="solar:copy-linear" className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            {variation.suggestedVideoThumbnailPrompt && (
                              <div>
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Thumbnail Prompt</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Input value={variation.suggestedVideoThumbnailPrompt} readOnly className="h-8 text-xs bg-stone-50 dark:bg-stone-900" />
                                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => useImagePromptAndGo(variation.suggestedVideoThumbnailPrompt!)}>
                                    <Icon icon="solar:gallery-linear" className="mr-1 h-3 w-3" />Use for Image
                                  </Button>
                                </div>
                              </div>
                            )}
                            {variation.suggestedVideoDescription && (
                              <div>
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Description</span>
                                <Textarea value={variation.suggestedVideoDescription} readOnly rows={4} className="mt-1 text-xs bg-stone-50 dark:bg-stone-900" />
                              </div>
                            )}
                            {variation.suggestedVideoKeywordsTags && variation.suggestedVideoKeywordsTags.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Keywords/Tags</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {variation.suggestedVideoKeywordsTags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => copyToClipboard(tag, "Tag")}>{tag}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Image Prompt */}
                        {variation.suggestedImagePrompt && !isYouTube && (
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Image Prompt</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Input value={variation.suggestedImagePrompt} readOnly className="h-8 text-xs bg-stone-50 dark:bg-stone-900" />
                              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => useImagePromptAndGo(variation.suggestedImagePrompt!)}>
                                <Icon icon="solar:gallery-linear" className="mr-1 h-3 w-3" />Use for Image
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Quick Publish to Social Media */}
                        {!isWebPage && !isYouTube && variation.textContent && (
                          <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                            <QuickPublishButtons 
                              content={variation.textContent}
                              imageUrl={generatedImageDataUri || undefined}
                              hashtags={variation.suggestedHashtagsForVariation?.filter((h): h is string => h !== '#error') || []}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Generator Tab */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-teal-500 dark:bg-teal-400" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="solar:gallery-linear" className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                  <h2 className="text-sm font-semibold">AI Image Generator</h2>
                  <Badge variant="secondary" className="text-[10px]">Premium</Badge>
                </div>
                <form onSubmit={handleImageGenerationSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs">Image Prompt *</Label>
                      {imagePrompt.length > 10 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs text-muted-foreground hover:text-foreground"
                          onClick={async () => {
                            if (!appUser || !imagePrompt) return;
                            setIsEnhancingPrompt(true);
                            try {
                              const result = await generateTrackedEnhancedPromptAction(appUser.companyId, appUser.uid, {
                                originalPrompt: imagePrompt,
                                promptGoal: 'ImageGeneration',
                                desiredStyle: '',
                                keyElements: ''
                              });
                              if (result.success && result.data?.enhancedPrompt) {
                                setImagePrompt(result.data.enhancedPrompt);
                                toast({ title: 'Prompt Enhanced', description: 'Your prompt has been improved for better image generation' });
                              } else {
                                throw new Error(result.error || 'Failed to enhance prompt');
                              }
                            } catch (error: any) {
                              toast({ title: 'Enhancement Failed', description: error.message, variant: 'destructive' });
                            } finally {
                              setIsEnhancingPrompt(false);
                            }
                          }}
                          disabled={isEnhancingPrompt}
                        >
                          {isEnhancingPrompt ? (
                            <Icon icon="solar:refresh-linear" className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Icon icon="solar:magic-stick-3-linear" className="mr-1 h-3 w-3" />
                          )}
                          Enhance Prompt
                        </Button>
                      )}
                    </div>
                    <Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Describe the image you want... (e.g., A happy team celebrating success in a modern office)" rows={3} required className="text-sm" />
                    
                    {/* Quick Prompt Ideas for Non-Tech Users */}
                    {!imagePrompt && (
                      <div className="mt-2">
                        <p className="text-[10px] text-muted-foreground mb-1.5">Quick ideas (click to use):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Professional team meeting in modern office",
                            "Happy customers using a mobile app",
                            "Business growth chart with upward trend",
                            "Friendly customer service representative",
                            "Modern workspace with laptop and coffee",
                            "Celebration with confetti and success",
                          ].map((idea) => (
                            <button
                              key={idea}
                              type="button"
                              onClick={() => setImagePrompt(idea)}
                              className="px-2 py-1 text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {idea}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {imagePrompt && (
                      <p className="text-[10px] text-muted-foreground mt-1">Tip: Click "Enhance Prompt" to improve your description</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Aspect Ratio</Label>
                    <Select value={selectedAspectRatio} onValueChange={(value: ImageAspectRatio) => setSelectedAspectRatio(value)}>
                      <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default">Default (AI Decides)</SelectItem>
                        <SelectItem value="Square (1:1)">Square (1:1)</SelectItem>
                        <SelectItem value="Landscape (16:9)">Landscape (16:9)</SelectItem>
                        <SelectItem value="Portrait (9:16)">Portrait (9:16)</SelectItem>
                        <SelectItem value="Portrait (4:5)">Portrait (4:5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Image Style Presets */}
                  <ImageStylePresets
                    selectedStyle={selectedImageStyle}
                    onSelectStyle={setSelectedImageStyle}
                  />
                  
                  {/* Brand Logo Section - Collapsible, Optional */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="w-full flex items-center justify-between p-3 border border-dashed border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-900/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium">Add Brand Logo</span>
                          <Badge variant="outline" className="text-[9px]">Optional</Badge>
                        </div>
                        <Icon icon="solar:alt-arrow-down-linear" className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-white dark:bg-stone-950">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground">Upload your logo to create branded images</p>
                          {brandLogo && (
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive" onClick={removeLogo}>
                              <Icon icon="solar:trash-bin-minimalistic-linear" className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        {brandLogo ? (
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-1 flex items-center justify-center overflow-hidden">
                              <NextImage src={brandLogo} alt="Brand logo" width={40} height={40} className="object-contain" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium text-foreground">Logo ready</p>
                              <p className="text-[10px] text-muted-foreground">AI will incorporate your branding</p>
                            </div>
                            <label className="cursor-pointer">
                              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
                                <span>
                                  <Icon icon="solar:refresh-linear" className="h-3 w-3 mr-1" />
                                  Change
                                </span>
                              </Button>
                              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="flex flex-col items-center justify-center gap-1.5 py-3 border border-dashed border-stone-300 dark:border-stone-600 rounded-lg hover:border-stone-400 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                              <Icon icon="solar:upload-linear" className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Click to upload logo</span>
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button type="submit" disabled={isGeneratingImage} size="sm" className="h-9 w-full text-white" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
                    {isGeneratingImage ? (
                      <>
                        <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />
                        Creating Image...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:gallery-add-linear" className="mr-2 h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>

            {isGeneratingImage && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-8">
                <div className="flex items-center justify-center">
                  <Icon icon="solar:refresh-linear" className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Generating AI image...</span>
                </div>
              </div>
            )}

            {generatedImageDataUri && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-4">Generated Image</h3>
                  
                  {/* Professional side-by-side layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Image Preview */}
                    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl p-3 bg-stone-50 dark:bg-stone-900 flex items-center justify-center min-h-[300px]">
                      <NextImage 
                        src={generatedImageDataUri} 
                        alt={promptForGeneratedImage || "AI generated"} 
                        width={400} 
                        height={400} 
                        className="rounded-lg object-contain max-h-[400px] w-auto" 
                      />
                      {/* Logo overlay */}
                      {brandLogo && includeLogo && (
                        <div className="absolute bottom-5 right-5 h-12 w-12 rounded-lg bg-white/95 dark:bg-stone-900/95 p-1.5 shadow-lg border border-stone-200 dark:border-stone-700">
                          <NextImage src={brandLogo} alt="Brand logo" width={40} height={40} className="object-contain w-full h-full" />
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Details & Actions */}
                    <div className="flex flex-col justify-between space-y-4">
                      {/* Prompt Section */}
                      {promptForGeneratedImage && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Prompt Used</span>
                          <div className="relative">
                            <Textarea 
                              value={promptForGeneratedImage} 
                              readOnly 
                              rows={4}
                              className="text-sm bg-stone-50 dark:bg-stone-900 resize-none pr-10" 
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground" 
                              onClick={() => copyToClipboard(promptForGeneratedImage, 'Prompt')}
                            >
                              <Icon icon="solar:copy-linear" className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Info Section */}
                      <div className="space-y-3">
                        {brandLogo && includeLogo && (
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50">
                            <Icon icon="solar:magic-stick-3-linear" className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-medium">AI Branded Image</p>
                              <p className="text-[10px] text-muted-foreground">Generated with your logo&apos;s colors and style</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50">
                          <Icon icon="solar:palette-linear" className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">AI Generated</p>
                            <p className="text-[10px] text-muted-foreground">Created with Gemini 2.5 Flash Image</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button variant="default" size="sm" className="h-9 flex-1" onClick={downloadImage}>
                          <Icon icon="solar:download-linear" className="mr-2 h-4 w-4" />
                          Download Image
                        </Button>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => copyToClipboard(promptForGeneratedImage, 'Prompt')}>
                          <Icon icon="solar:copy-linear" className="mr-2 h-4 w-4" />
                          Copy Prompt
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hashtags Tab */}
        {activeTab === 'hashtags' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-emerald-500 dark:bg-emerald-400" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="solar:hashtag-linear" className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <h2 className="text-sm font-semibold">Hashtag Suggester</h2>
                </div>
                <form onSubmit={handleHashtagFormSubmit} className="space-y-4">
                  <div>
                    <Label className="text-xs">Topic / Keywords *</Label>
                    <Input value={hashtagInputs.topicOrKeywords} onChange={(e) => handleHashtagInputChange('topicOrKeywords', e.target.value)} placeholder="e.g., Sustainable fashion, AI marketing" required className="mt-1.5 h-9 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select value={hashtagInputs.platform || 'General'} onValueChange={(value) => handleHashtagInputChange('platform', value as GenerateHashtagSuggestionsInput['platform'])}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="TikTok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs"># Hashtags</Label>
                      <Input type="number" min="3" max="20" value={hashtagInputs.numSuggestions} onChange={(e) => handleHashtagInputChange('numSuggestions', parseInt(e.target.value, 10))} className="mt-1.5 h-9 text-sm" />
                    </div>
                  </div>
                  <Button type="submit" disabled={isGeneratingHashtags} size="sm" className="h-8 text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    {isGeneratingHashtags && <Icon icon="solar:refresh-linear" className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    <Icon icon="solar:hashtag-linear" className="mr-2 h-3.5 w-3.5" />
                    Suggest Hashtags
                  </Button>
                </form>
              </div>
            </div>

            {hashtagSuggestions && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Suggestions</h3>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(hashtagSuggestions, "Hashtags")}>
                      <Icon icon="solar:copy-linear" className="mr-1 h-3 w-3" /> Copy All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {hashtagSuggestions.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700" onClick={() => copyToClipboard(tag, "Hashtag")}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Responder Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-rose-500 dark:bg-rose-400" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="solar:chat-round-dots-linear" className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                  <h2 className="text-sm font-semibold">Review Responder</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Generate professional responses to customer reviews.</p>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <Label className="text-xs">Customer Review *</Label>
                    <Textarea value={reviewInput.reviewText} onChange={(e) => handleReviewInputChange('reviewText', e.target.value)} placeholder="Paste customer review here..." required rows={4} className="mt-1.5 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Sentiment *</Label>
                      <Select value={reviewInput.sentiment} onValueChange={(value: AiReviewResponderInput['sentiment']) => handleReviewInputChange('sentiment', value as string)}>
                        <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Business Name *</Label>
                      <Input value={reviewInput.businessName} onChange={(e) => handleReviewInputChange('businessName', e.target.value)} placeholder="Your business name" required className="mt-1.5 h-9 text-sm" />
                    </div>
                  </div>
                  <Button type="submit" disabled={isReviewLoading} size="sm" className="h-8 text-white" style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' }}>
                    {isReviewLoading && <Icon icon="solar:refresh-linear" className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    <Icon icon="solar:magic-stick-3-linear" className="mr-2 h-3.5 w-3.5" />
                    Generate Response
                  </Button>
                </form>
              </div>
            </div>

            {reviewResponse && (
              <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                <div className="p-4 sm:p-6 space-y-3">
                  <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Suggested Response</h3>
                  <Textarea value={reviewResponse} readOnly rows={5} className="text-sm bg-stone-50 dark:bg-stone-900" />
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyToClipboard(reviewResponse, "Response")}>
                    <Icon icon="solar:copy-linear" className="mr-1 h-3 w-3" /> Copy Response
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-900/50 p-4">
        <div className="flex items-start gap-3">
          <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Text & Scripts:</strong> Copy generated content for WordPress, social media, or video editors.</p>
            <p><strong>Images:</strong> Download AI-generated images or use prompts with external tools.</p>
            <p><strong>Content Hub:</strong> Save your content to the <Link href="/social-media/content-hub" className="underline">Content Hub</Link> for later use.</p>
          </div>
        </div>
      </div>

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="social-media" />
    </div>
  );
}
