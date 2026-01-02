"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, FileText, Video, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { handleAIChatMessage } from '@/app/actions/ai-chat-actions';

interface NextStepSuggestion {
  label: string;
  prompt: string;
  icon: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'error';
  metadata?: any;
  creditsConsumed?: number;
  nextSteps?: NextStepSuggestion[];
}

interface GuidedTrendingTopicsProps {
  onContentGenerated: (userMessage: Message, assistantMessage: Message) => void;
  onBack?: () => void;
}

interface TopicSuggestion {
  topic: string;
  reasoning: string;
  suggestedKeywords: string[];
  exampleTitles: string[];
}

export default function GuidedTrendingTopics({ onContentGenerated, onBack }: GuidedTrendingTopicsProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contentType, setContentType] = useState<'blog' | 'video'>('blog');
  const [niche, setNiche] = useState('');
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  
  const { appUser } = useAuth();
  const { toast } = useToast();

  const handleContentTypeSelect = () => {
    if (!contentType) {
      toast({
        title: 'Selection Required',
        description: 'Please select Blog or Video Script',
        variant: 'destructive'
      });
      return;
    }
    setStep(2);
  };

  const handleNicheSubmit = async () => {
    if (!niche.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter your business niche or topic',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-chat/trending-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessNiche: niche,
          contentType: contentType === 'blog' ? 'BlogPost' : 'YouTubeVideo',
          companyId: appUser?.companyId,
          userId: appUser?.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trending topics');
      }

      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        setTopics(data.suggestions.slice(0, 4));
        setStep(3);
      } else {
        throw new Error('No topics received');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get trending topics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleCreateContent = async () => {
    if (!selectedTopic) {
      toast({
        title: 'Selection Required',
        description: 'Please select a topic first',
        variant: 'destructive'
      });
      return;
    }

    if (!appUser?.companyId || !appUser?.uid) {
      toast({
        title: 'Error',
        description: 'Please sign in to generate content',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const prompt = contentType === 'blog' 
        ? `Write a blog post about ${selectedTopic}`
        : `Write a video script about ${selectedTopic}`;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: prompt,
        timestamp: new Date()
      };

      const result = await handleAIChatMessage(
        prompt, 
        appUser.companyId, 
        appUser.uid
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        type: result.type,
        metadata: result.metadata,
        creditsConsumed: result.creditsConsumed,
        nextSteps: result.nextSteps
      };

      onContentGenerated(userMessage, aiMessage);

      if (result.creditsConsumed && result.creditsConsumed > 0) {
        toast({
          title: '✨ Content Generated!',
          description: `Your ${contentType === 'blog' ? 'blog post' : 'video script'} is ready! (${result.creditsConsumed} credits used)`,
          duration: 4000
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate content',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
        <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
            1
          </div>
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">Content Type</span>
        </div>
        
        <div className={`h-0.5 w-6 sm:w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
        
        <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
            2
          </div>
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">Your Niche</span>
        </div>
        
        <div className={`h-0.5 w-6 sm:w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
        
        <div className={`flex items-center gap-1.5 sm:gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 text-xs sm:text-sm ${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
            3
          </div>
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">Select Topic</span>
        </div>
      </div>

      {/* Step 1: Content Type Selection */}
      {step === 1 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Step 1: Choose Content Type
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              What type of content would you like to create?
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6">
            <RadioGroup value={contentType} onValueChange={(value: 'blog' | 'video') => setContentType(value)}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Label
                  htmlFor="blog"
                  className={`flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    contentType === 'blog' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="blog" id="blog" className="sr-only" />
                  <FileText className={`h-8 w-8 sm:h-12 sm:w-12 ${contentType === 'blog' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <div className="font-semibold text-sm sm:text-lg">Blog Post</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Full article with SEO optimization
                    </div>
                  </div>
                </Label>

                <Label
                  htmlFor="video"
                  className={`flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    contentType === 'video' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="video" id="video" className="sr-only" />
                  <Video className={`h-8 w-8 sm:h-12 sm:w-12 ${contentType === 'video' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <div className="font-semibold text-sm sm:text-lg">Video Script</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Complete script for YouTube or TikTok
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              {onBack && (
                <Button variant="outline" onClick={onBack} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                  Back
                </Button>
              )}
              <Button onClick={handleContentTypeSelect} className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Niche Input */}
      {step === 2 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              Step 2: Enter Your Niche
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              What topic or industry should we find trending topics for?
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="niche" className="text-xs sm:text-sm">Business Niche or Topic</Label>
              <Input
                id="niche"
                placeholder="e.g., fitness coaching, ecommerce tools..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleNicheSubmit();
                  }
                }}
                className="h-9 sm:h-10 text-sm"
                disabled={isLoading}
              />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Selected: <span className="font-semibold">{contentType === 'blog' ? 'Blog Post' : 'Video Script'}</span>
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                Back
              </Button>
              <Button onClick={handleNicheSubmit} className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm" disabled={isLoading || !niche.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="truncate">Finding Topics...</span>
                  </>
                ) : (
                  'Get Trending Topics'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Topic Selection */}
      {step === 3 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              Step 3: Select a Trending Topic
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Choose one of these trending topics for your {contentType === 'blog' ? 'blog post' : 'video script'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              {topics.map((topicItem, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedTopic === topicItem.topic
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => handleTopicSelect(topicItem.topic)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedTopic === topicItem.topic
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedTopic === topicItem.topic && (
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary-foreground"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs sm:text-base mb-1 sm:mb-2">{topicItem.topic}</h4>
                        <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-3">{topicItem.reasoning}</p>
                        
                        {topicItem.exampleTitles && topicItem.exampleTitles.length > 0 && (
                          <div className="space-y-0.5 sm:space-y-1">
                            <p className="text-[9px] sm:text-xs font-medium text-muted-foreground">Example Titles:</p>
                            {topicItem.exampleTitles.slice(0, 2).map((title, idx) => (
                              <p key={idx} className="text-[9px] sm:text-xs text-muted-foreground pl-2 sm:pl-3 border-l-2 border-muted truncate">
                                {title}
                              </p>
                            ))}
                          </div>
                        )}

                        {topicItem.suggestedKeywords && topicItem.suggestedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 sm:mt-3">
                            {topicItem.suggestedKeywords.slice(0, 4).map((keyword, idx) => (
                              <span key={idx} className="text-[9px] sm:text-xs bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => { setStep(2); setSelectedTopic(''); }} disabled={isLoading} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                Back
              </Button>
              <Button 
                onClick={handleCreateContent} 
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm" 
                disabled={!selectedTopic || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span className="truncate">Generating...</span>
                  </>
                ) : (
                  <span className="truncate">Create {contentType === 'blog' ? 'Blog Post' : 'Video Script'}</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
