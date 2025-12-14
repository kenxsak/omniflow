"use client";

import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
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
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -1,
        duration: 0.15,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        duration: 0.15,
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
      className="overflow-hidden"
    >
      <CardContent className="p-4">
        {/* Clean header with title */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase truncate">
            {title}
          </span>
          <div className="h-6 w-6 rounded-md bg-muted/50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
            <Icon icon={icon} className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        
        {/* Main value - large and prominent */}
        <div className="text-2xl font-bold text-foreground tabular-nums">
          {value}
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        )}
        
        {/* Change indicator and period */}
        {(change || period) && (
          <div className="flex items-center gap-2 mt-2">
            {change && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold uppercase",
                negativeChange ? "text-destructive" : "text-success"
              )}>
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  negativeChange ? "bg-destructive" : "bg-success"
                )} />
                {change}
              </span>
            )}
            {period && (
              <span className="text-[11px] text-muted-foreground">{period}</span>
            )}
          </div>
        )}
        
        {actionHint && (
          <p className="text-[10px] text-muted-foreground mt-2 truncate">
            {actionHint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
