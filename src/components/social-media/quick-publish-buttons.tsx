'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Helper function to get platform icon (client-safe)
function getBufferServiceIcon(service: string): string {
  const icons: Record<string, string> = {
    facebook: 'logos:facebook',
    instagram: 'skill-icons:instagram',
    linkedin: 'logos:linkedin-icon',
    twitter: 'ri:twitter-x-fill',
    pinterest: 'logos:pinterest',
    googlebusiness: 'logos:google-icon',
    tiktok: 'logos:tiktok-icon',
    youtube: 'logos:youtube-icon',
    mastodon: 'logos:mastodon-icon',
    threads: 'ri:threads-fill',
  };
  return icons[service?.toLowerCase()] || 'solar:share-circle-linear';
}

interface QuickPublishButtonsProps {
  content: string;
  imageUrl?: string;
  hashtags?: string[];
  compact?: boolean;
}

interface BufferProfile {
  id: string;
  service: string;
  formattedService?: string;
  formatted_service?: string;
  username?: string;
  formatted_username?: string;
  avatar?: string;
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
];

export function QuickPublishButtons({ content, imageUrl, hashtags = [], compact = false }: QuickPublishButtonsProps) {
  const { toast } = useToast();
  const { user, company } = useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [bufferConnected, setBufferConnected] = useState(false);
  const [bufferProfiles, setBufferProfiles] = useState<BufferProfile[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [showBufferDialog, setShowBufferDialog] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  useEffect(() => {
    if (user?.uid && company?.id) {
      loadBufferConnection();
    }
  }, [user?.uid, company?.id]);

  const loadBufferConnection = async () => {
    if (!user?.uid || !company?.id) return;
    try {
      // Dynamic import to avoid SSR issues
      const { getBufferConnectionAction } = await import('@/app/actions/buffer-actions');
      const result = await getBufferConnectionAction(user.uid, company.id);
      if (result.success && result.data) {
        setBufferConnected(result.data.connected);
        setBufferProfiles(result.data.profiles || []);
      }
    } catch (error) {
      console.error('Error loading Buffer connection:', error);
    }
  };

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

  const handleBufferPublish = async (publishNow: boolean = true) => {
    if (!user?.uid || !company?.id || selectedProfiles.length === 0) return;
    
    setPublishing(true);
    try {
      let finalContent = content;
      if (hashtags.length > 0) {
        finalContent = `${content}\n\n${hashtags.join(' ')}`;
      }

      // Dynamic import to avoid SSR issues
      const { publishToBufferAction } = await import('@/app/actions/buffer-actions');
      const result = await publishToBufferAction(user.uid, company.id, selectedProfiles, {
        text: finalContent,
        imageUrl,
        publishNow,
      });

      if (result.success) {
        toast({
          title: publishNow ? 'Published!' : 'Added to Queue!',
          description: `Your post has been ${publishNow ? 'published' : 'added to your Buffer queue'}.`,
        });
        setShowBufferDialog(false);
        setSelectedProfiles([]);
      } else {
        toast({
          title: 'Publish Failed',
          description: result.error || 'Could not publish to Buffer.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to publish content', variant: 'destructive' });
    } finally {
      setPublishing(false);
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

  const toggleProfile = (profileId: string) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
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
          {bufferConnected && bufferProfiles.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs">Publish via Buffer</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setShowBufferDialog(true)}
                className="cursor-pointer"
              >
                <Icon icon="solar:share-circle-linear" className="h-4 w-4 mr-2" />
                Select Channels...
                <Badge variant="secondary" className="ml-auto text-[10px]">{bufferProfiles.length}</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-xs">Quick Publish (Copy & Open)</DropdownMenuLabel>
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

        {/* Buffer Connected - Direct Publish */}
        {bufferConnected && bufferProfiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Publish via Buffer</div>
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30">
                {bufferProfiles.length} channels
              </Badge>
            </div>
            <Button
              onClick={() => setShowBufferDialog(true)}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              Publish to Buffer Channels
              <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        )}

        {/* Platform Buttons Grid - Copy & Open */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {bufferConnected ? 'Or copy & open manually' : 'Copy & Open'}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
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

      {/* Buffer Publish Dialog */}
      <Dialog open={showBufferDialog} onOpenChange={setShowBufferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              Publish via Buffer
            </DialogTitle>
            <DialogDescription>
              Select which channels to publish to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-64 overflow-y-auto">
            {bufferProfiles.map(profile => (
              <label
                key={profile.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedProfiles.includes(profile.id)}
                  onCheckedChange={() => toggleProfile(profile.id)}
                />
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon icon={getBufferServiceIcon(profile.service)} className="h-4 w-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile.formatted_username || profile.username || profile.formattedService || profile.formatted_service}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{profile.service}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowBufferDialog(false)} 
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleBufferPublish(false)} 
              disabled={selectedProfiles.length === 0 || publishing}
              className="w-full sm:w-auto"
            >
              <Icon icon="solar:clock-circle-linear" className="h-4 w-4 mr-2" />
              Add to Queue
            </Button>
            <Button 
              onClick={() => handleBufferPublish(true)} 
              disabled={selectedProfiles.length === 0 || publishing}
              className="w-full sm:w-auto"
            >
              {publishing ? (
                <Icon icon="solar:spinner-linear" className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Icon icon="solar:upload-linear" className="h-4 w-4 mr-2" />
              )}
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlatform && <Icon icon={selectedPlatform.icon} className="h-5 w-5" />}
              Publish to {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription>
              Your content has been copied to clipboard. Follow these steps:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">1</div>
              <p className="text-sm">Click "Open {selectedPlatform?.name}" below</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">2</div>
              <p className="text-sm">Create a new post on {selectedPlatform?.name}</p>
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
