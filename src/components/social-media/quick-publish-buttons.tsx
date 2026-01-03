'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickPublishButtonsProps {
  content: string;
  imageUrl?: string;
  hashtags?: string[];
  compact?: boolean;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  postUrl: string;
  characterLimit?: number;
  supportsImages: boolean;
  supportsHashtags: boolean;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'facebook', name: 'Facebook', icon: 'logos:facebook', color: '#1877F2', postUrl: 'https://www.facebook.com/', supportsImages: true, supportsHashtags: true },
  { id: 'instagram', name: 'Instagram', icon: 'skill-icons:instagram', color: '#E4405F', postUrl: 'https://www.instagram.com/', supportsImages: true, supportsHashtags: true },
  { id: 'twitter', name: 'X (Twitter)', icon: 'ri:twitter-x-fill', color: '#000000', postUrl: 'https://twitter.com/intent/tweet?text=', characterLimit: 280, supportsImages: true, supportsHashtags: true },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logos:linkedin-icon', color: '#0A66C2', postUrl: 'https://www.linkedin.com/feed/', characterLimit: 3000, supportsImages: true, supportsHashtags: true },
  { id: 'threads', name: 'Threads', icon: 'ri:threads-fill', color: '#000000', postUrl: 'https://www.threads.net/', characterLimit: 500, supportsImages: true, supportsHashtags: true },
  { id: 'pinterest', name: 'Pinterest', icon: 'logos:pinterest', color: '#E60023', postUrl: 'https://www.pinterest.com/pin-builder/', supportsImages: true, supportsHashtags: true },
  { id: 'tiktok', name: 'TikTok', icon: 'logos:tiktok-icon', color: '#000000', postUrl: 'https://www.tiktok.com/upload', supportsImages: false, supportsHashtags: true },
  { id: 'youtube', name: 'YouTube', icon: 'logos:youtube-icon', color: '#FF0000', postUrl: 'https://studio.youtube.com/', supportsImages: false, supportsHashtags: true },
];

export function QuickPublishButtons({ content, hashtags = [], compact = false }: QuickPublishButtonsProps) {
  const { toast } = useToast();
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);

  const copyToClipboard = async (text: string, type: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${type} Copied!`, description: 'Ready to paste on your social platform.' });
      return true;
    } catch {
      toast({ title: 'Copy Failed', variant: 'destructive' });
      return false;
    }
  };

  const handleQuickPublish = async (platformData: SocialPlatform) => {
    let finalContent = content;
    if (platformData.supportsHashtags && hashtags.length > 0) {
      finalContent = `${content}\n\n${hashtags.join(' ')}`;
    }
    if (platformData.characterLimit && finalContent.length > platformData.characterLimit) {
      finalContent = finalContent.substring(0, platformData.characterLimit - 3) + '...';
    }

    const copied = await copyToClipboard(finalContent);
    if (!copied) return;

    // For Twitter, we can pre-fill the tweet
    if (platformData.id === 'twitter') {
      const tweetUrl = `${platformData.postUrl}${encodeURIComponent(finalContent)}`;
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
      toast({ title: 'Opening X (Twitter)', description: 'Your content is pre-filled. Just click Tweet!' });
      return;
    }

    setSelectedPlatform(platformData);
    setShowInstructions(true);
  };

  const openPlatform = () => {
    if (selectedPlatform) {
      window.open(selectedPlatform.postUrl, '_blank', 'noopener,noreferrer');
    }
    setShowInstructions(false);
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Icon icon="solar:share-bold" className="h-4 w-4 mr-1.5" />
            Publish
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">Copy & Open Platform</DropdownMenuLabel>
          {SOCIAL_PLATFORMS.map(p => (
            <DropdownMenuItem key={p.id} onClick={() => handleQuickPublish(p)} className="cursor-pointer">
              <Icon icon={p.icon} className="h-4 w-4 mr-2" />
              {p.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => copyToClipboard(content)}>
            <Icon icon="solar:copy-linear" className="h-4 w-4 mr-2" />
            Copy Text Only
          </DropdownMenuItem>
          {hashtags.length > 0 && (
            <DropdownMenuItem onClick={() => copyToClipboard(hashtags.join(' '), 'Hashtags')}>
              <Icon icon="solar:hashtag-linear" className="h-4 w-4 mr-2" />
              Copy Hashtags
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon icon="solar:share-bold" className="h-4 w-4" />
          Quick Publish
        </div>

        {/* Platform Buttons Grid - Copy & Open */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Click to copy content & open platform
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {SOCIAL_PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => handleQuickPublish(p)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors group"
                title={`Publish to ${p.name}`}
              >
                <Icon icon={p.icon} className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => copyToClipboard(content)} className="h-8 text-xs">
            <Icon icon="solar:copy-linear" className="h-3.5 w-3.5 mr-1.5" />
            Copy Text
          </Button>
          {hashtags.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(hashtags.join(' '), 'Hashtags')} className="h-8 text-xs">
              <Icon icon="solar:hashtag-linear" className="h-3.5 w-3.5 mr-1.5" />
              Copy Hashtags
            </Button>
          )}
        </div>
      </div>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-md p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlatform && <Icon icon={selectedPlatform.icon} className="h-5 w-5" />}
              Publish to {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription>
              Your content has been copied to clipboard!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">✓</div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Content copied to clipboard</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">1</div>
              <p className="text-sm">Click "Open {selectedPlatform?.name}" below</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">2</div>
              <p className="text-sm">Create a new post</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">3</div>
              <p className="text-sm">Paste your content (Ctrl+V or Cmd+V)</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowInstructions(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={openPlatform} className="w-full sm:w-auto">
              <Icon icon="solar:link-round-linear" className="h-4 w-4 mr-2" />
              Open {selectedPlatform?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InlinePublishButton({ content, hashtags = [] }: { content: string; hashtags?: string[] }) {
  return <QuickPublishButtons content={content} hashtags={hashtags} compact={true} />;
}
