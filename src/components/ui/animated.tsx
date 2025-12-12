"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

type AnimationType = 
  | 'fadeUp' 
  | 'fadeDown' 
  | 'fadeIn' 
  | 'scaleIn' 
  | 'slideInLeft' 
  | 'slideInRight'
  | 'bounce'
  | 'none';

interface AnimatedProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
  as?: keyof JSX.IntrinsicElements;
}

// Quick, subtle animations - no latency, instant feel
const animationConfigs: Record<AnimationType, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
  fadeUp: {
    from: { opacity: 0, y: 12 },
    to: { opacity: 1, y: 0 }
  },
  fadeDown: {
    from: { opacity: 0, y: -12 },
    to: { opacity: 1, y: 0 }
  },
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 }
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 }
  },
  slideInLeft: {
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 }
  },
  slideInRight: {
    from: { opacity: 0, x: 20 },
    to: { opacity: 1, x: 0 }
  },
  bounce: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 }
  },
  none: {
    from: {},
    to: {}
  }
};

export function Animated({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 0.3, // Faster default - instant feel
  className,
  once = true,
  threshold = 0.05, // Lower threshold - trigger earlier
  as: Component = 'div'
}: AnimatedProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || animation === 'none') return;

    const config = animationConfigs[animation];
    
    // Set initial state
    gsap.set(element, config.from);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !hasAnimated.current)) {
            hasAnimated.current = true;
            // Ignore delay prop - animate immediately
            gsap.to(element, {
              ...config.to,
              duration,
              delay: 0, // No delay - instant
              ease: animation === 'bounce' ? 'back.out(1.2)' : 'power2.out'
            });
            if (once) {
              observer.unobserve(element);
            }
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(element);
    };
  }, [animation, duration, once, threshold]);

  return React.createElement(
    Component,
    { ref: elementRef, className },
    children
  );
}

// Stagger container for animating children
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  childDelay?: number;
  as?: keyof JSX.IntrinsicElements;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0, // No stagger by default - all items load together
  childDelay = 0,
  as: Component = 'div'
}: StaggerContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('[data-stagger-item]');
    if (items.length === 0) return;

    gsap.set(items, { opacity: 0, y: 8 }); // Very small movement

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(items, {
              opacity: 1,
              y: 0,
              duration: 0.2, // Very fast
              ease: 'power2.out',
              stagger: staggerDelay, // 0 by default = all at once
              delay: 0
            });
            observer.unobserve(container);
          }
        });
      },
      { threshold: 0.01 } // Trigger immediately
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(items);
    };
  }, [staggerDelay]);

  return React.createElement(
    Component,
    { ref: containerRef, className },
    children
  );
}

// Stagger item wrapper
export function StaggerItem({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-stagger-item className={className}>
      {children}
    </div>
  );
}

// Animated counter component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 0.8, // Faster counter
  delay = 0,
  className,
  prefix = '',
  suffix = '',
  decimals = 0
}: AnimatedCounterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef({ value: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(counterRef.current, {
              value,
              duration,
              delay: 0, // No delay
              ease: 'power2.out',
              onUpdate: () => {
                if (element) {
                  const displayValue = decimals > 0
                    ? counterRef.current.value.toFixed(decimals)
                    : Math.round(counterRef.current.value).toLocaleString();
                  element.textContent = `${prefix}${displayValue}${suffix}`;
                }
              }
            });
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.1 } // Trigger earlier
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(counterRef.current);
    };
  }, [value, duration, prefix, suffix, decimals]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

// Parallax wrapper
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className }: ParallaxProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const offset = (scrollY - elementTop) * speed;
      
      gsap.set(element, { y: offset });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}

// Magnetic button effect
interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function Magnetic({ children, className, strength = 0.3 }: MagneticProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      
      gsap.to(element, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(element);
    };
  }, [strength]);

  return (
    <div ref={elementRef} className={cn('inline-block', className)}>
      {children}
    </div>
  );
}
