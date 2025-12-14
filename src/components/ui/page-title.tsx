"use client";

import type { FC, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const PageTitle: FC<PageTitleProps> = ({ title, description, badge, actions, className }) => {
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: -5 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div 
      ref={titleRef}
      className={cn(
        "flex items-start justify-between",
        className
      )}
    >
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-stone-800 dark:text-stone-200 font-semibold text-lg">
            {title}
          </p>
          {badge}
        </div>
        {description && (
          <p className="text-stone-500 dark:text-stone-400 font-normal text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
