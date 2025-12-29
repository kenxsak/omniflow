'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CONTENT_TEMPLATES, 
  TEMPLATE_CATEGORIES,
  type ContentTemplate 
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

interface ContentTemplatesSelectorProps {
  onSelectTemplate: (template: ContentTemplate) => void;
  currentPlatform?: string;
}

export function ContentTemplatesSelector({ 
  onSelectTemplate,
  currentPlatform 
}: ContentTemplatesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = CONTENT_TEMPLATES.filter(template => {
    // Filter by search
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    // Filter by platform if specified
    const matchesPlatform = !currentPlatform || template.platforms.includes(currentPlatform);
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const handleSelect = (template: ContentTemplate) => {
    onSelectTemplate(template);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Icon icon="solar:document-add-bold" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Use Template</span>
          <span className="sm:hidden">Template</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b border-stone-200 dark:border-stone-800">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon icon="solar:document-text-bold" className="h-5 w-5" />
            Content Templates
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose a template to quickly create professional content
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Icon 
              icon="solar:magnifer-linear" 
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 h-9"
            />
          </div>

          {/* Category Tabs - Wrap on desktop, scroll on mobile */}
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_CATEGORIES.map((category) => (
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

        {/* Templates Grid */}
        <ScrollArea className="h-[400px] px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Icon icon="solar:document-text-linear" className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No templates found</p>
                <p className="text-xs mt-1">Try a different search or category</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={cn(
                    "text-left p-3 sm:p-4 rounded-xl border border-stone-200 dark:border-stone-800",
                    "hover:border-primary/40 hover:bg-stone-50 dark:hover:bg-stone-900/50",
                    "transition-all group active:scale-[0.98]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 sm:p-2.5 rounded-lg flex-shrink-0",
                      "bg-stone-100 dark:bg-stone-800",
                      "group-hover:bg-primary/10 dark:group-hover:bg-primary/20",
                      "transition-colors"
                    )}>
                      <Icon 
                        icon={template.icon} 
                        className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium">{template.name}</h4>
                        {template.isPremium && (
                          <Badge variant="secondary" className="text-[9px] h-4">Pro</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.platforms.slice(0, 3).map((platform) => (
                          <Badge 
                            key={platform} 
                            variant="outline" 
                            className="text-[9px] h-4 px-1.5"
                          >
                            {platform}
                          </Badge>
                        ))}
                        {template.platforms.length > 3 && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            +{template.platforms.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Template Preview Card for displaying selected template
 */
export function TemplatePreviewCard({ 
  template, 
  onClear 
}: { 
  template: ContentTemplate; 
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
        <Icon icon={template.icon} className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{template.name}</span>
          <Badge variant="secondary" className="text-[9px]">{template.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClear}>
        <Icon icon="solar:close-circle-linear" className="h-4 w-4" />
      </Button>
    </div>
  );
}
