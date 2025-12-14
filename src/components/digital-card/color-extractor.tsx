'use client';

import { useState } from 'react';
import { extractColorsFromImage, isValidImageUrl } from '@/lib/color-extraction';
import { Loader2, Check } from 'lucide-react';
import { ColorExtractIcon } from '@/components/icons/color-extract-icon';
import { cn } from '@/lib/utils';

interface ColorExtractorProps {
  logoUrl: string;
  onColorsExtracted: (colors: { primary: string; secondary: string }) => void;
  className?: string;
}

export function ColorExtractor({ logoUrl, onColorsExtracted, className }: ColorExtractorProps) {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExtractColors = async () => {
    setError(null);
    setSuccess(false);
    
    if (!logoUrl) {
      setError('Add logo');
      setTimeout(() => setError(null), 2000);
      return;
    }

    if (!isValidImageUrl(logoUrl)) {
      setError('Invalid');
      setTimeout(() => setError(null), 2000);
      return;
    }

    setExtracting(true);
    
    try {
      const colors = await extractColorsFromImage(logoUrl);
      onColorsExtracted(colors);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      console.error('Color extraction error:', err);
      setError('Failed');
      setTimeout(() => setError(null), 2000);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExtractColors}
      disabled={extracting}
      className={cn(
        'flex items-center justify-center gap-2 h-11 px-3 rounded-lg',
        'border border-stone-200 dark:border-stone-800',
        'bg-stone-50 dark:bg-stone-900',
        'hover:bg-stone-100 dark:hover:bg-stone-800',
        'hover:border-stone-300 dark:hover:border-stone-700',
        'transition-all cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      title={logoUrl ? 'Extract colors from logo' : 'Add a logo URL first'}
    >
      {extracting ? (
        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
      ) : success ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : error ? (
        <span className="text-[10px] text-destructive whitespace-nowrap">{error}</span>
      ) : (
        <ColorExtractIcon className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {extracting ? 'Extracting' : success ? 'Done!' : error ? '' : 'Auto'}
      </span>
    </button>
  );
}
