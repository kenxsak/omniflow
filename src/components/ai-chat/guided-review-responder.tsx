"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface GuidedReviewResponderProps {
  onResponseGenerated: (response: string, reviewText: string) => void;
  onBack?: () => void;
}

export default function GuidedReviewResponder({ onResponseGenerated, onBack }: GuidedReviewResponderProps) {
  const [reviewText, setReviewText] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  
  const { appUser, company } = useAuth();
  const { toast } = useToast();

  // Load business name from company data
  useEffect(() => {
    if (company?.name) {
      setBusinessName(company.name);
    }
  }, [company]);

  const handleGenerate = async () => {
    if (!reviewText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter the customer review text',
        variant: 'destructive'
      });
      return;
    }

    if (!businessName.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter your business name',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-chat/review-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText,
          sentiment,
          businessName,
          companyId: appUser?.companyId,
          userId: appUser?.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate review response');
      }

      const data = await response.json();
      
      if (data.response) {
        setGeneratedResponse(data.response);
        toast({
          title: 'Response Generated',
          description: 'Your review response is ready!',
        });
      } else {
        throw new Error('No response received');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate review response',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (generatedResponse) {
      navigator.clipboard.writeText(generatedResponse);
      toast({
        title: 'Copied!',
        description: 'Response copied to clipboard',
      });
    }
  };

  const handleUseResponse = () => {
    if (generatedResponse) {
      onResponseGenerated(generatedResponse, reviewText);
    }
  };

  const handleReset = () => {
    setReviewText('');
    setSentiment('neutral');
    setGeneratedResponse('');
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            Review Responder
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Generate professional responses to customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6">
          {/* Review Input Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="review-text" className="text-xs sm:text-sm">Customer Review Text *</Label>
              <Textarea
                id="review-text"
                placeholder="Paste the customer review here..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                disabled={isLoading}
                className="resize-none text-sm min-h-[100px] sm:min-h-[120px]"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Copy and paste the review you received from your customer
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="sentiment" className="text-xs sm:text-sm">Review Sentiment *</Label>
                <Select 
                  value={sentiment} 
                  onValueChange={(value: 'positive' | 'negative' | 'neutral') => setSentiment(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sentiment" className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">
                      <div className="flex items-center gap-2">
                        <span className="text-success">😊</span>
                        <span className="text-sm">Positive</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="negative">
                      <div className="flex items-center gap-2">
                        <span className="text-destructive">😞</span>
                        <span className="text-sm">Negative</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="neutral">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">😐</span>
                        <span className="text-sm">Neutral</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  How would you classify this review?
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="business-name" className="text-xs sm:text-sm">Your Business Name *</Label>
                <Input
                  id="business-name"
                  placeholder="e.g., My Awesome Cafe"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isLoading}
                  className="h-9 sm:h-10 text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Your business name for the response
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            {onBack && (
              <Button variant="outline" onClick={onBack} disabled={isLoading} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                Back
              </Button>
            )}
            <Button 
              onClick={handleGenerate} 
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              disabled={isLoading || !reviewText.trim() || !businessName.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  <span className="truncate">Generating...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Generate Response
                </>
              )}
            </Button>
          </div>

          {/* Generated Response Section */}
          {generatedResponse && (
            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-xs sm:text-sm">Response Generated</span>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Suggested Response:</Label>
                <Textarea
                  value={generatedResponse}
                  readOnly
                  rows={5}
                  className="bg-muted/50 resize-none text-sm min-h-[120px] sm:min-h-[150px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="outline" onClick={handleCopyResponse} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                  <Copy className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Copy
                </Button>
                <Button onClick={handleUseResponse} className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm">
                  Use This Response
                </Button>
                <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm">
                  New Review
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-3 sm:p-4 md:pt-6">
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p className="font-medium text-foreground text-xs sm:text-sm">💡 Tips for better responses:</p>
            <ul className="list-disc pl-4 sm:pl-5 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
              <li>Select the correct sentiment for appropriate tone</li>
              <li>Positive: Thank customer, reinforce experience</li>
              <li>Negative: Apologize sincerely, offer to help</li>
              <li>Neutral: Acknowledge feedback, invite engagement</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
