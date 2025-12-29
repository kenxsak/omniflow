'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  IMAGE_STYLE_PRESETS, 
  IMAGE_STYLE_CATEGORIES,
  type ImageStylePreset 
} from '@/lib/content-templates';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ImageStylePresetsProps {
  selectedStyle: ImageStylePreset | null;
  onSelectStyle: (style: ImageStylePreset | null) => void;
}

export function ImageStylePresets({ 
  selectedStyle,
  onSelectStyle 
}: ImageStylePresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredStyles = IMAGE_STYLE_PRESETS.filter(style => 
    selectedCategory === 'all' || style.category === selectedCategory
  );

  const handleSelect = (style: ImageStylePreset) => {
    onSelectStyle(style);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectStyle(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium">Style Preset</label>
        {selectedStyle && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 text-[10px] px-1.5 text-muted-foreground"
            onClick={handleClear}
          >
            Clear
          </Button>
        )}
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-9 justify-start text-sm",
              selectedStyle && "border-primary/50"
            )}
          >
            {selectedStyle ? (
              <div className="flex items-center gap-2">
                <Icon icon={selectedStyle.icon} className="h-4 w-4 text-primary" />
                <span>{selectedStyle.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon icon="solar:pallete-2-linear" className="h-4 w-4" />
                <span>Choose a style...</span>
              </div>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[85vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Icon icon="solar:pallete-2-bold" className="h-5 w-5" />
              Image Style Presets
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a style to enhance your image prompt automatically
            </DialogDescription>
          </DialogHeader>

          {/* Category Tabs - Wrap on desktop, scroll on mobile */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-1.5">
              {IMAGE_STYLE_CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs whitespace-nowrap"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon icon={category.icon} className="h-3.5 w-3.5 mr-1.5" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Styles Grid */}
          <ScrollArea className="h-[350px] px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleSelect(style)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border",
                    "hover:bg-stone-50 dark:hover:bg-stone-900",
                    "transition-all",
                    selectedStyle?.id === style.id 
                      ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" 
                      : "border-stone-200 dark:border-stone-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      selectedStyle?.id === style.id 
                        ? "bg-primary/10" 
                        : "bg-stone-100 dark:bg-stone-800"
                    )}>
                      <Icon 
                        icon={style.icon} 
                        className={cn(
                          "h-5 w-5",
                          selectedStyle?.id === style.id ? "text-primary" : "text-muted-foreground"
                        )} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium">{style.name}</span>
                        {style.isPremium && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Pro</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {style.description}
                      </p>
                    </div>
                    {selectedStyle?.id === style.id && (
                      <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Selected Style Preview */}
      {selectedStyle && (
        <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon icon={selectedStyle.icon} className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">{selectedStyle.name}</span>
            <Badge variant="outline" className="text-[8px] h-4 ml-auto">{selectedStyle.category}</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            Will add: <span className="italic">{selectedStyle.promptSuffix.substring(0, 80)}...</span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Quick Style Pills for inline selection
 */
export function QuickStylePills({ 
  onSelectStyle,
  selectedStyleId 
}: { 
  onSelectStyle: (style: ImageStylePreset) => void;
  selectedStyleId?: string;
}) {
  // Show only popular styles
  const popularStyles = IMAGE_STYLE_PRESETS.filter(s => 
    ['photorealistic', 'flat-illustration', '3d-render', 'minimalist', 'social-media'].includes(s.id)
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {popularStyles.map((style) => (
        <Button
          key={style.id}
          variant={selectedStyleId === style.id ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-[10px] px-2"
          onClick={() => onSelectStyle(style)}
        >
          <Icon icon={style.icon} className="h-3 w-3 mr-1" />
          {style.name}
        </Button>
      ))}
    </div>
  );
}
