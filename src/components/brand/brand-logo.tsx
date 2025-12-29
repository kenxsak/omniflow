'use client';

import React from 'react';
import { useWhiteLabel } from '@/hooks/use-white-label';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Brand logo component that respects white-label settings
 * Shows custom logo if white-label is enabled, otherwise shows OmniFlow logo
 */
export function BrandLogo({ className, showText = true, size = 'md' }: BrandLogoProps) {
  const { isWhiteLabeled, brandName, logoUrl, logoDarkUrl } = useWhiteLabel();
  const { resolvedTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  // Determine which logo to use based on theme
  const currentLogo = resolvedTheme === 'dark' ? (logoDarkUrl || logoUrl) : logoUrl;

  if (isWhiteLabeled && currentLogo) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <img 
          src={currentLogo} 
          alt={brandName} 
          className={cn(sizeClasses[size], 'object-contain')}
        />
        {showText && (
          <span className={cn('font-bold', textSizeClasses[size])}>
            {brandName}
          </span>
        )}
      </div>
    );
  }

  // Default OmniFlow logo
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Light theme logo */}
      <img
        src="/favicon-light/android-chrome-192x192.png"
        alt={brandName}
        className={cn(sizeClasses[size], 'w-auto object-contain dark:hidden')}
      />
      {/* Dark theme logo */}
      <img
        src="/favicon-dark/android-chrome-192x192.png"
        alt={brandName}
        className={cn(sizeClasses[size], 'w-auto object-contain hidden dark:block')}
      />
      {showText && (
        <span className={cn('font-bold', textSizeClasses[size])}>
          {brandName}
        </span>
      )}
    </div>
  );
}

/**
 * Brand name text component that respects white-label settings
 */
export function BrandName({ className }: { className?: string }) {
  const { brandName } = useWhiteLabel();
  return <span className={className}>{brandName}</span>;
}
