'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Template } from '@/types/templates';
import { applyTemplate } from '@/app/actions/template-actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface TemplatePreviewProps {
  template: Template | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (subject: string | undefined, content: string) => void;
}

export default function TemplatePreview({ template, isOpen, onOpenChange, onApply }: TemplatePreviewProps) {
  const { appUser, company } = useAuth();
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (template && isOpen) {
      const autoFillValues: Record<string, string> = {};
      
      if (company) {
        if (template.variables.includes('business')) {
          autoFillValues['business'] = company.name || '';
        }
        if (template.variables.includes('businessName')) {
          autoFillValues['businessName'] = company.name || '';
        }
        if (template.variables.includes('company')) {
          autoFillValues['company'] = company.name || '';
        }
      }
      
      setVariableValues(autoFillValues);
    }
  }, [template, isOpen, company]);

  if (!template) return null;

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [variable]: value }));
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const result = await applyTemplate({
        templateId: template.id,
        variableValues,
      }, appUser?.companyId);

      if (result) {
        onApply(result.subject, result.content);
        toast({
          title: 'Template Applied!',
          description: 'The template has been filled into your form.',
        });
        onOpenChange(false);
        setVariableValues({});
      } else {
        toast({
          title: 'Error',
          description: 'Failed to apply template.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while applying the template.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const highlightVariables = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, index) => {
      if (part.match(/\{[^}]+\}/)) {
        return (
          <span key={index} className="bg-warning-muted px-1 rounded font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const substituteVariables = (text: string) => {
    let result = text;
    for (const [key, value] of Object.entries(variableValues)) {
      if (value) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, value);
      }
    }
    return result;
  };

  const allVariablesFilled = template.variables.every(v => variableValues[v] && variableValues[v].trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="relative">
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
          {template.variables.length > 0 && (
            <>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Fill in Template Variables</h3>
                <div className="grid gap-3">
                  {template.variables.map((variable) => (
                    <div key={variable} className="grid gap-1.5">
                      <Label htmlFor={`var-${variable}`} className="capitalize text-sm font-medium">
                        {variable.replace(/_/g, ' ')}
                      </Label>
                      <Input
                        id={`var-${variable}`}
                        placeholder={`Enter ${variable}`}
                        value={variableValues[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg h-11"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="bg-stone-200 dark:bg-stone-800" />
            </>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Preview
              {allVariablesFilled && (
                <span className="ml-2 text-emerald-600 dark:text-emerald-400 normal-case">
                  ✓ All variables filled
                </span>
              )}
            </h3>
            {template.subject && (
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">Subject:</Label>
                <div className="bg-stone-100 dark:bg-stone-900 p-3 rounded-lg text-sm mt-1 border border-stone-200 dark:border-stone-800">
                  {allVariablesFilled ? (
                    <span className="text-foreground">{substituteVariables(template.subject)}</span>
                  ) : (
                    highlightVariables(substituteVariables(template.subject))
                  )}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Content:</Label>
              <div className="bg-stone-100 dark:bg-stone-900 p-4 rounded-lg text-sm mt-1 whitespace-pre-wrap border border-stone-200 dark:border-stone-800">
                {allVariablesFilled ? (
                  <span className="text-foreground">{substituteVariables(template.content)}</span>
                ) : (
                  highlightVariables(substituteVariables(template.content))
                )}
              </div>
            </div>
            {!allVariablesFilled && template.variables.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Fill in all variables above to see the final preview
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-stone-200 dark:border-stone-800">{template.type.toUpperCase()}</Badge>
            <span>•</span>
            <span>{template.industry.join(', ')}</span>
          </div>
        </DialogBody>

        <DialogFooter>
          <button 
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2.5 text-sm font-semibold font-mono uppercase tracking-wide text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleApply} disabled={isApplying} className="px-4 py-2.5 h-auto text-sm font-semibold font-mono uppercase tracking-wide">
            {isApplying ? 'Applying...' : 'Use Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
