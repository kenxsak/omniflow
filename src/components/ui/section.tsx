"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Animated } from './animated';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: 'default' | 'muted' | 'gradient' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

export function Section({
  children,
  className,
  id,
  variant = 'default',
  size = 'lg',
  animate = true,
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
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        'relative overflow-hidden',
        className
      )}
    >
      <div className="container-mobile">
        {children}
      </div>
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
        'max-w-3xl mb-8 sm:mb-12',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {badge && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-primary/10 text-primary mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
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
    default: 'bg-card hover:shadow-lg',
    bordered: 'bg-card border-2 hover:border-primary/30 hover:shadow-lg',
    gradient: 'bg-gradient-to-br from-card to-muted/50 hover:shadow-lg',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1',
        variantClasses[variant],
        className
      )}
    >
      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
