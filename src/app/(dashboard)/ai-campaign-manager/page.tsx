"use client";

import React, { useState, type FormEvent, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { showAISuccessToast } from '@/lib/ai-toast-helpers';
import { cn } from '@/lib/utils';

import { KeywordPlannerSection } from '@/components/ai-ads-manager/keyword-planner-section';
import { GoogleSearchAdCopySection } from '@/components/ai-ads-manager/google-search-ad-copy-section';
import { FacebookInstagramAdSection } from '@/components/ai-ads-manager/facebook-instagram-ad-section';
import { LinkedInAdSection } from '@/components/ai-ads-manager/linkedin-ad-section';
import { YouTubeAdSection } from '@/components/ai-ads-manager/youtube-ad-section';
import { TiktokReelsAdSection } from '@/components/ai-ads-manager/tiktok-reels-ad-section';

import {
  generateTrackedGoogleAdsKeywordsAction,
  generateTrackedGoogleSearchAdCopyAction,
  generateTrackedFacebookAdAction,
  generateTrackedLinkedInAdAction,
  generateTrackedYouTubeAdAction,
  generateTrackedTiktokReelsAdAction
} from '@/app/actions/tracked-ai-ads-actions';

import type { GenerateGoogleAdsKeywordsInput, GenerateGoogleAdsKeywordsOutput, KeywordDetail } from '@/ai/flows/generate-google-ads-keywords-flow';
import type { GenerateGoogleSearchAdCopyInput, AdCopyVariation as GoogleAdVariation } from '@/ai/flows/generate-google-search-ad-copy-flow';
import type { GenerateFacebookInstagramAdContentInput, GenerateFacebookInstagramAdContentOutput } from '@/ai/flows/generate-facebook-instagram-ad-content-flow';
import type { GenerateLinkedInAdContentInput, GenerateLinkedInAdContentOutput } from '@/ai/flows/generate-linkedin-ad-content-flow';
import type { GenerateYouTubeAdContentInput, GenerateYouTubeAdContentOutput } from '@/ai/flows/generate-youtube-ad-content-flow';
import type { GenerateTiktokReelsAdContentInput, GenerateTiktokReelsAdContentOutput } from '@/ai/flows/generate-tiktok-reels-ad-content-flow';

// Navigation tabs configuration
const navTabs = [
  { id: 'keywords', label: 'Keyword Planner', icon: 'solar:magnifer-linear', platform: 'Google' },
  { id: 'google', label: 'Google Ads', icon: 'solar:text-bold-linear', platform: 'Google' },
  { id: 'facebook', label: 'Facebook & Instagram', icon: 'solar:gallery-linear', platform: 'Meta' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'solar:case-linear', platform: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube', icon: 'solar:play-circle-linear', platform: 'YouTube' },
  { id: 'tiktok', label: 'TikTok & Reels', icon: 'solar:music-note-linear', platform: 'TikTok' },
];

export default function AiAdsManagerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState('keywords');

  const adCopyGeneratorRef = useRef<HTMLDivElement>(null);
  const facebookAdGeneratorRef = useRef<HTMLDivElement>(null);
  const linkedinAdGeneratorRef = useRef<HTMLDivElement>(null);
  const youtubeAdsGeneratorRef = useRef<HTMLDivElement>(null);
  const tiktokReelsAdGeneratorRef = useRef<HTMLDivElement>(null);

  // State for Google Ads Keyword Planner
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [keywordInputs, setKeywordInputs] = useState<GenerateGoogleAdsKeywordsInput>({
    productOrService: '',
    targetAudience: '',
    landingPageUrl: '',
    campaignGoals: '',
    targetLanguage: 'English',
    numSuggestionsPerCategory: 7,
    targetCurrency: 'USD',
  });
  const [generatedKeywordsOutput, setGeneratedKeywordsOutput] = useState<GenerateGoogleAdsKeywordsOutput['keywordSuggestions'] | null>(null);

  // State for Google Ads Copy Generator
  const [isGeneratingGoogleAds, setIsGeneratingGoogleAds] = useState(false);
  const [googleAdsInput, setGoogleAdsInput] = useState<GenerateGoogleSearchAdCopyInput>({
    productOrService: '',
    targetAudience: '',
    keywords: '',
    uniqueSellingPoints: '',
    callToAction: '',
    numVariations: 1,
    targetLanguage: 'English',
  });
  const [googleAdCopyVariations, setGoogleAdCopyVariations] = useState<GoogleAdVariation[] | null>(null);

  // State for Facebook/Instagram Ad Generator
  const [isGeneratingFacebookAds, setIsGeneratingFacebookAds] = useState(false);
  const [facebookAdsInput, setFacebookAdsInput] = useState<GenerateFacebookInstagramAdContentInput>({
    productOrService: '',
    targetAudience: '',
    adObjective: 'Website Traffic',
    keyMessage: '',
    desiredTone: 'Friendly',
    platformFocus: 'Both',
    numVariations: 1,
    targetLanguage: 'English',
  });
  const [facebookAdContentOutput, setFacebookAdContentOutput] = useState<GenerateFacebookInstagramAdContentOutput | null>(null);

  // State for LinkedIn Ad Generator
  const [isGeneratingLinkedInAds, setIsGeneratingLinkedInAds] = useState(false);
  const [linkedInAdsInput, setLinkedInAdsInput] = useState<GenerateLinkedInAdContentInput>({
    b2bProductOrService: '',
    targetIndustry: '',
    targetRole: '',
    adObjective: 'Lead Generation',
    valueProposition: '',
    desiredTone: 'Professional',
    numVariations: 1,
    targetLanguage: 'English',
  });
  const [linkedInAdContentOutput, setLinkedInAdContentOutput] = useState<GenerateLinkedInAdContentOutput | null>(null);

  // State for YouTube Ad Generator
  const [isGeneratingYouTubeAds, setIsGeneratingYouTubeAds] = useState(false);
  const [youtubeAdsInput, setYoutubeAdsInput] = useState<Omit<GenerateYouTubeAdContentInput, 'desiredVideoStyleAndLength'> & { videoFormat: string; videoStyle: string }>({
    productOrService: '',
    targetAudience: '',
    adObjective: 'BrandAwareness',
    keyMessagePoints: '',
    videoFormat: 'Skippable In-stream Ad (15-30s)',
    videoStyle: 'Animated Explainer',
    overallTone: 'Friendly',
    numVariations: 1,
    targetLanguage: 'English',
  });
  const [youtubeAdContentOutput, setYoutubeAdContentOutput] = useState<GenerateYouTubeAdContentOutput | null>(null);

  // State for TikTok/Reels Ad Generator
  const [isGeneratingTiktokReelsAds, setIsGeneratingTiktokReelsAds] = useState(false);
  const [tiktokReelsAdsInput, setTiktokReelsAdsInput] = useState<GenerateTiktokReelsAdContentInput>({
    productOrService: '',
    targetDemographic: '',
    adVibe: 'Funny & Relatable',
    keyMessage: '',
    numVariations: 1,
    targetLanguage: 'English',
  });
  const [tiktokReelsAdContentOutput, setTiktokReelsAdContentOutput] = useState<GenerateTiktokReelsAdContentOutput | null>(null);

  const handleInputChange = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, field: string, value: string | number) => {
    setter((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const handleKeywordInputChange = (field: keyof GenerateGoogleAdsKeywordsInput, value: string | number) => handleInputChange(setKeywordInputs, field, value);
  const handleGoogleAdsInputChange = (field: keyof GenerateGoogleSearchAdCopyInput, value: string | number) => handleInputChange(setGoogleAdsInput, field, value);
  const handleFacebookAdsInputChange = (field: keyof GenerateFacebookInstagramAdContentInput, value: string | number) => handleInputChange(setFacebookAdsInput, field, value);
  const handleLinkedInAdsInputChange = (field: keyof GenerateLinkedInAdContentInput, value: string | number) => handleInputChange(setLinkedInAdsInput, field, value);
  const handleYouTubeAdsInputChange = (field: string, value: string | number) => handleInputChange(setYoutubeAdsInput, field, value);
  const handleTiktokReelsAdsInputChange = (field: keyof GenerateTiktokReelsAdContentInput, value: string | number) => handleInputChange(setTiktokReelsAdsInput, field, value);

  // Centralized AI handler using tracked actions
  const callTrackedAI = useCallback(async (
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setResult: React.Dispatch<React.SetStateAction<any>>,
    trackedAction: (companyId: string, userId: string, payload: any) => Promise<any>,
    payload: any,
    featureName: string,
    resultAccessor: (data: any) => any
  ) => {
    if (!appUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const response = await trackedAction(appUser.companyId, appUser.uid, payload);
      
      if (response.success && response.data) {
        setResult(resultAccessor(response.data));
        showAISuccessToast(toast, featureName, response.quotaInfo);
      } else {
        throw new Error(response.error || 'AI generation failed.');
      }
    } catch (error: any) {
      let errorMessage = error.message || 'An unknown error occurred.';
      if (errorMessage.includes('Schema validation failed')) {
        const match = errorMessage.match(/Parse Errors:\s*-\s*([^\n]+)/);
        errorMessage = match?.[1] ? `Validation error: ${match[1]}` : 'AI generated invalid content. Please try again.';
      }
      toast({ title: `${featureName} Failed`, description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [appUser, toast]);

  const handleGenerateKeywordsSubmit = async (e: FormEvent) => { e.preventDefault(); await callTrackedAI(setIsGeneratingKeywords, setGeneratedKeywordsOutput, generateTrackedGoogleAdsKeywordsAction, keywordInputs, "Keywords", (data) => data.keywordSuggestions); };
  const handleGenerateGoogleAdCopySubmit = async (e: FormEvent) => { e.preventDefault(); await callTrackedAI(setIsGeneratingGoogleAds, setGoogleAdCopyVariations, generateTrackedGoogleSearchAdCopyAction, googleAdsInput, "Google Ad Copy", (data) => data.adVariations); };
  const handleGenerateFacebookAdContentSubmit = async (e: FormEvent) => { e.preventDefault(); await callTrackedAI(setIsGeneratingFacebookAds, setFacebookAdContentOutput, generateTrackedFacebookAdAction, facebookAdsInput, "Facebook/IG Ads", (data) => data); };
  const handleGenerateLinkedInAdContentSubmit = async (e: FormEvent) => { e.preventDefault(); await callTrackedAI(setIsGeneratingLinkedInAds, setLinkedInAdContentOutput, generateTrackedLinkedInAdAction, linkedInAdsInput, "LinkedIn Ads", (data) => data); };
  const handleGenerateTiktokReelsAdContentSubmit = async (e: FormEvent) => { e.preventDefault(); await callTrackedAI(setIsGeneratingTiktokReelsAds, setTiktokReelsAdContentOutput, generateTrackedTiktokReelsAdAction, tiktokReelsAdsInput, "TikTok/Reels Ads", (data) => data); };

  const handleGenerateYouTubeAdContentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const combinedVideoStyleAndLength = `${youtubeAdsInput.videoStyle} - ${youtubeAdsInput.videoFormat}`;
    const payload: GenerateYouTubeAdContentInput = { ...youtubeAdsInput, desiredVideoStyleAndLength: combinedVideoStyleAndLength };
    await callTrackedAI(setIsGeneratingYouTubeAds, setYoutubeAdContentOutput, generateTrackedYouTubeAdAction, payload, "YouTube Ads", (data) => data);
  };

  const scrollToRef = useCallback((ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const useKeywordsForAdCopy = useCallback(() => {
    if (generatedKeywordsOutput) {
      const keywordsToUse = [
        ...generatedKeywordsOutput.primaryKeywords.map(kw => kw.keyword), 
        ...generatedKeywordsOutput.longTailKeywords.map(kw => kw.keyword)
      ].filter(Boolean).join(', ');
      handleGoogleAdsInputChange('keywords', keywordsToUse);
      toast({ title: "Keywords Pre-filled" });
      setActiveTab('google');
    } else {
      toast({ title: "No Keywords Generated", variant: "destructive" });
    }
  }, [generatedKeywordsOutput, toast]);

  const copyToClipboard = useCallback((text: string | string[], type: string) => {
    const textToCopy = Array.isArray(text) ? text.join(type === "Hashtags" ? " " : '\n') : text;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy)
      .then(() => toast({ title: `${type} Copied!` }))
      .catch(() => toast({ title: 'Copy Failed', variant: 'destructive' }));
  }, [toast]);

  const copyIndividualKeyword = useCallback((keywordObj: KeywordDetail) => {
    const text = `${keywordObj.keyword}${keywordObj.estimatedCompetition ? ` [Comp: ${keywordObj.estimatedCompetition}]` : ''}${keywordObj.estimatedCpcRange ? ` [CPC: ${keywordObj.estimatedCpcRange}]` : ''}`;
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: `Keyword Copied!` }))
      .catch(() => toast({ title: 'Copy Failed', variant: 'destructive' }));
  }, [toast]);
  
  const copyAllKeywordsInCategory = useCallback((keywords: KeywordDetail[], categoryName: string) => {
    const textToCopy = keywords.map(kw => `${kw.keyword}${kw.estimatedCompetition ? ` [Comp: ${kw.estimatedCompetition}]` : ''}${kw.estimatedCpcRange ? ` [CPC: ${kw.estimatedCpcRange}]` : ''}`).join('\n');
    copyToClipboard(textToCopy, `All ${categoryName}`);
  }, [copyToClipboard]);
  
  const useImagePromptAndGo = useCallback((promptText?: string | null) => {
    if (!promptText) {
      toast({ title: "No Prompt", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(promptText)
      .then(() => {
        toast({
          title: "Image Prompt Copied!",
          description: (<span>Go to <Link href="/social-media" className="underline">Content Factory</Link> to generate the image.</span>),
          duration: 5000,
        });
      })
      .catch(() => toast({ title: "Copy Failed", variant: 'destructive' }));
  }, [toast]);

  const handleUseAdForEmail = useCallback((details: { name: string; subject: string; content: string }) => {
    const htmlContent = `<h1>Hi {{ contact.FIRSTNAME }},</h1>\n\n<p>${details.content.replace(/\n/g, '<br />')}</p>\n\n<p>Best regards,</p>\n<p>[Your Company Name]</p>`;
    const query = new URLSearchParams({ name: details.name, subject: details.subject, content: htmlContent });
    router.push(`/email-marketing/create-campaign?${query.toString()}`);
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Ads Manager</h1>
          <p className="text-xs text-muted-foreground">Plan and generate ad creatives across multiple platforms</p>
        </div>
        <Link href="/social-media">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Icon icon="solar:document-text-linear" className="mr-1.5 h-3.5 w-3.5" />
            Content Factory
          </Button>
        </Link>
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
        {/* Keyword Planner Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:magnifer-linear" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Google Ads Keyword Planner</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Generate keyword ideas with AI-estimated competition and CPC ranges.</p>
                
                <div className="border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Competition and CPC data are AI-generated estimates for directional guidance only. Use Google's official Keyword Planner for accurate data.
                    </p>
                  </div>
                </div>

                <KeywordPlannerSection
                  isLoading={isGeneratingKeywords}
                  inputs={keywordInputs}
                  output={generatedKeywordsOutput}
                  onInputChange={handleKeywordInputChange}
                  onSubmit={handleGenerateKeywordsSubmit}
                  onUseKeywordsForAdCopy={useKeywordsForAdCopy}
                  onCopyToClipboard={copyToClipboard}
                  onCopyIndividualKeyword={copyIndividualKeyword}
                  onCopyAllKeywordsInCategory={copyAllKeywordsInCategory}
                />
              </div>
            </div>
          </div>
        )}

        {/* Google Ads Tab */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:text-bold-linear" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Google Search Ad Copy</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Generate headlines and descriptions for Google Search campaigns.</p>

                <GoogleSearchAdCopySection
                  isLoading={isGeneratingGoogleAds}
                  inputs={googleAdsInput}
                  variations={googleAdCopyVariations}
                  onInputChange={handleGoogleAdsInputChange}
                  onSubmit={handleGenerateGoogleAdCopySubmit}
                  onCopyToClipboard={copyToClipboard}
                  adCopyGeneratorRef={adCopyGeneratorRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* Facebook & Instagram Tab */}
        {activeTab === 'facebook' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:gallery-linear" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Facebook & Instagram Ads</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Create engaging ad content for Meta platforms.</p>

                <FacebookInstagramAdSection
                  isLoading={isGeneratingFacebookAds}
                  inputs={facebookAdsInput}
                  output={facebookAdContentOutput}
                  onInputChange={handleFacebookAdsInputChange}
                  onSubmit={handleGenerateFacebookAdContentSubmit}
                  onCopyToClipboard={copyToClipboard}
                  onUseImagePromptAndGo={useImagePromptAndGo}
                  onUseAdForEmail={handleUseAdForEmail}
                  facebookAdGeneratorRef={facebookAdGeneratorRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn Tab */}
        {activeTab === 'linkedin' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:case-linear" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">LinkedIn Ads</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Generate professional B2B ad content for LinkedIn.</p>

                <LinkedInAdSection
                  isLoading={isGeneratingLinkedInAds}
                  inputs={linkedInAdsInput}
                  output={linkedInAdContentOutput}
                  onInputChange={handleLinkedInAdsInputChange}
                  onSubmit={handleGenerateLinkedInAdContentSubmit}
                  onCopyToClipboard={copyToClipboard}
                  onUseImagePromptAndGo={useImagePromptAndGo}
                  onUseAdForEmail={handleUseAdForEmail}
                  linkedinAdGeneratorRef={linkedinAdGeneratorRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === 'youtube' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:play-circle-linear" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">YouTube Ads</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Create video ad scripts and campaign strategies for YouTube.</p>

                <YouTubeAdSection
                  isLoading={isGeneratingYouTubeAds}
                  inputs={youtubeAdsInput}
                  output={youtubeAdContentOutput}
                  onInputChange={handleYouTubeAdsInputChange}
                  onSubmit={handleGenerateYouTubeAdContentSubmit}
                  onCopyToClipboard={copyToClipboard}
                  onUseImagePromptAndGo={useImagePromptAndGo}
                  youtubeAdsGeneratorRef={youtubeAdsGeneratorRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* TikTok & Reels Tab */}
        {activeTab === 'tiktok' && (
          <div className="space-y-4">
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:music-note-linear" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">TikTok & Reels Ads</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Generate trendy short-form video ad concepts.</p>

                <TiktokReelsAdSection
                  isLoading={isGeneratingTiktokReelsAds}
                  inputs={tiktokReelsAdsInput}
                  output={tiktokReelsAdContentOutput}
                  onInputChange={handleTiktokReelsAdsInputChange}
                  onSubmit={handleGenerateTiktokReelsAdContentSubmit}
                  onCopyToClipboard={copyToClipboard}
                  tiktokReelsAdGeneratorRef={tiktokReelsAdGeneratorRef}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50 dark:bg-stone-900/50 p-4">
        <div className="flex items-start gap-3">
          <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Image Prompts:</strong> Copy prompts and use them in the <Link href="/social-media" className="underline">Content Factory</Link> to generate images.</p>
            <p><strong>Email Campaigns:</strong> Use the "Use for Email" button to create email campaigns from your ad content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
