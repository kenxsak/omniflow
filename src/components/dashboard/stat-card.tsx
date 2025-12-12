"use client";

import { Icon } from '@iconify/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface StatCardProps {
  title: string;
  value: string | React.ReactNode;
  change?: string;
  icon: string;
  period?: string;
  negativeChange?: boolean;
  subtitle?: string;
  actionHint?: string;
  statusColor?: string;
  gradient?: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'none';
}

export default function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  period, 
  negativeChange = false,
  subtitle,
  actionHint,
  statusColor,
  gradient = 'none'
}: StatCardProps) {
  const changeIcon = negativeChange ? "solar:graph-down-linear" : "solar:graph-up-linear";
  const cardRef = useRef<HTMLDivElement>(null);

  const gradientClasses = {
    blue: 'card-gradient-blue',
    green: 'card-gradient-green',
    purple: 'card-gradient-purple',
    amber: 'card-gradient-amber',
    rose: 'card-gradient-rose',
    none: ''
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-emerald-600 dark:text-emerald-400',
    purple: 'text-purple-600 dark:text-purple-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    none: 'text-muted-foreground'
  };

  const iconBgColors = {
    blue: 'bg-blue-500/10',
    green: 'bg-emerald-500/10',
    purple: 'bg-purple-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
    none: 'bg-muted'
  };

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -2,
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "overflow-hidden transition-colors duration-300",
        gradientClasses[gradient]
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 sm:pb-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shrink-0 ml-2",
          iconBgColors[gradient]
        )}>
          <Icon icon={icon} className={cn("h-4 w-4 sm:h-5 sm:w-5", statusColor || iconColors[gradient])} />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
          {value}
        </div>
        <div className="flex flex-col gap-0.5 sm:gap-1 mt-1 sm:mt-2">
          <div className="flex items-center gap-1 flex-wrap">
            {change && (
              <p className={cn(
                "text-[10px] sm:text-xs flex items-center",
                negativeChange ? "text-destructive" : "text-emerald-600 dark:text-emerald-500"
              )}>
                <Icon icon={changeIcon} className="h-3 w-3 mr-0.5" />
                {change}
              </p>
            )}
            {period && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">{period}</p>
            )}
          </div>
          {actionHint && (
            <p className="text-[10px] sm:text-xs text-primary/70 mt-0.5 sm:mt-1 truncate">
              💡 {actionHint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
