"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImagePlus, Save, Share2, ArrowRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ContentWorkflowActionsProps {
  onCreateImage?: () => void;
  onSave?: () => void;
  hasImage?: boolean;
  isSaved?: boolean;
  isGeneratingImage?: boolean;
  contentType?: 'blog' | 'sales_page' | 'social_post' | 'other';
  content?: string;
}

const shareOptions = [
  { id: 'facebook', label: 'Facebook', icon: 'logos:facebook', color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', icon: 'skill-icons:instagram', color: '#E4405F' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'logos:linkedin-icon', color: '#0A66C2' },
  { id: 'twitter', label: 'X (Twitter)', icon: 'ri:twitter-x-fill', color: '#000' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logos:whatsapp-icon', color: '#25D366' },
];

export default function ContentWorkflowActions({
  onCreateImage,
  onSave,
  hasImage = false,
  isSaved = false,
  isGeneratingImage = false,
  contentType = 'blog',
  content = ''
}: ContentWorkflowActionsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    // For now, open native share or copy to clipboard
    const shareText = content.substring(0, 500);
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`, '_blank');
    } else {
      // Copy to clipboard for platforms without direct share
      await navigator.clipboard.writeText(shareText);
      toast({
        title: 'Copied!',
        description: `Content copied. Open ${platform} to paste and share.`,
      });
    }
    
    setIsSharing(false);
  };
  
  const getWorkflowSteps = () => {
    if (contentType === 'blog' || contentType === 'sales_page') {
      return [
        {
          id: 'image',
          label: 'Create Image',
          description: 'Generate a featured image',
          icon: ImagePlus,
          action: onCreateImage,
          completed: hasImage,
          disabled: isGeneratingImage,
          showCheck: hasImage
        },
        {
          id: 'save',
          label: 'Save to Hub',
          description: 'Save to Content Hub',
          icon: Save,
          action: onSave,
          completed: isSaved,
          disabled: false,
          showCheck: isSaved
        },
        {
          id: 'share',
          label: 'Share Now',
          description: 'Share to social media',
          icon: Share2,
          isShareButton: true,
          completed: false,
          disabled: false,
          showCheck: false
        }
      ];
    } else {
      return [
        {
          id: 'save',
          label: 'Save to Hub',
          description: 'Save to Content Hub',
          icon: Save,
          action: onSave,
          completed: isSaved,
          disabled: false,
          showCheck: isSaved
        },
        {
          id: 'share',
          label: 'Share Now',
          description: 'Share to social media',
          icon: Share2,
          isShareButton: true,
          completed: false,
          disabled: false,
          showCheck: false
        }
      ];
    }
  };

  const steps = getWorkflowSteps();

  return (
    <Card className="p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary">
          <span>✨ Next Steps</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-1.5 sm:gap-2">
              {step.isShareButton ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-auto py-2 sm:py-3 flex-col items-start flex-1"
                      disabled={isSharing}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="p-1.5 sm:p-2 rounded-md bg-muted">
                          <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-semibold text-[10px] sm:text-sm flex items-center gap-1.5 sm:gap-2">
                            <span className="truncate">{step.label}</span>
                          </div>
                          <div className="text-[9px] sm:text-xs opacity-80 truncate">{step.description}</div>
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {shareOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.id}
                        onClick={() => handleShare(option.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon icon={option.icon} className="h-4 w-4" />
                        <span>{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant={step.completed ? "default" : "outline"}
                  className="w-full h-auto py-2 sm:py-3 flex-col items-start flex-1"
                  onClick={step.action}
                  disabled={step.disabled}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={`p-1.5 sm:p-2 rounded-md ${step.completed ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                      <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-[10px] sm:text-sm flex items-center gap-1.5 sm:gap-2">
                        <span className="truncate">{step.label}</span>
                        {step.showCheck && <span className="text-success flex-shrink-0">✓</span>}
                      </div>
                      <div className="text-[9px] sm:text-xs opacity-80 truncate">{step.description}</div>
                    </div>
                  </div>
                </Button>
              )}
              
              {index < steps.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <p className="text-[9px] sm:text-xs text-muted-foreground text-center mt-1.5 sm:mt-2">
          Complete each step to publish your content
        </p>
      </div>
    </Card>
  );
}
