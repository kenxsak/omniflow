"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Animated } from './animated';

// Horizontal falling line animation for section dividers
function HorizontalFallingLine() {
  return (
    <div className="absolute bottom-0 left-0 h-px w-full overflow-hidden">
      <div className="falling-line-horizontal absolute h-px w-24 bg-gradient-to-r from-transparent via-foreground/40 to-transparent" />
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: 'default' | 'muted' | 'gradient' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  showDivider?: boolean;
}

export function Section({
  children,
  className,
  id,
  variant = 'default',
  size = 'lg',
  animate = true,
  showDivider = false,
}: SectionProps) {
  const variantClasses = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    gradient: 'bg-gradient-to-br from-primary/5 via-background to-accent/5',
    dark: 'bg-foreground text-background',
  };

  const sizeClasses = {
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20 lg:py-24',
    xl: 'py-20 sm:py-28 lg:py-32',
  };

  const content = (
    <section
      id={id}
      data-slot="section"
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        'relative overflow-hidden',
        showDivider && 'line-b',
        className
      )}
    >
      <div className="container-mobile">
        {children}
      </div>
      {showDivider && <HorizontalFallingLine />}
    </section>
  );

  if (animate) {
    return (
      <Animated animation="fadeUp" threshold={0.1}>
        {content}
      </Animated>
    );
  }

  return content;
}

export { HorizontalFallingLine };

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-2xl mb-8 sm:mb-10',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {badge && (
        <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {badge}
        </span>
      )}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight mb-2 sm:mb-3">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

interface FeatureGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureGrid({
  children,
  columns = 3,
  className,
}: FeatureGridProps) {
  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4 sm:gap-6', columnClasses[columns], className)}>
      {children}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  variant?: 'default' | 'bordered' | 'gradient';
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  variant = 'default',
}: FeatureCardProps) {
  const variantClasses = {
    default: 'bg-card border border-border',
    bordered: 'bg-card border border-border',
    gradient: 'bg-card border border-border',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4 sm:p-5 transition-colors duration-150 hover:bg-muted/30',
        variantClasses[variant],
        className
      )}
    >
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center mb-3 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
