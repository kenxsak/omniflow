"use client";

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

// Animation presets - instant, no delays, quick and smooth
export const animationPresets = {
  fadeUp: {
    from: { opacity: 0, y: 12 },
    to: { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
  },
  fadeDown: {
    from: { opacity: 0, y: -12 },
    to: { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
  },
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: 0.2, ease: "power2.out" }
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.96 },
    to: { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }
  },
  slideInLeft: {
    from: { opacity: 0, x: -15 },
    to: { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" }
  },
  slideInRight: {
    from: { opacity: 0, x: 15 },
    to: { opacity: 1, x: 0, duration: 0.25, ease: "power2.out" }
  },
  staggerUp: {
    from: { opacity: 0, y: 8 },
    to: { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", stagger: 0 }
  },
  bounce: {
    from: { scale: 0.95 },
    to: { scale: 1, duration: 0.3, ease: "back.out(1.2)" }
  },
  pulse: {
    to: { scale: 1.02, duration: 0.2, ease: "power2.inOut", yoyo: true, repeat: 1 }
  },
  shake: {
    to: { x: [-3, 3, -3, 3, 0], duration: 0.3, ease: "power2.inOut" }
  }
};

// Hook for basic element animation on mount - instant
export function useAnimateOnMount(
  preset: keyof typeof animationPresets = 'fadeUp',
  delay: number = 0
) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const animation = animationPresets[preset];
    gsap.fromTo(element, animation.from, { ...animation.to, delay: 0 }); // No delay

    return () => {
      gsap.killTweensOf(element);
    };
  }, [preset]);

  return elementRef;
}

// Hook for staggered children animation - instant, no delays
export function useStaggerAnimation(
  selector: string = '.stagger-item',
  delay: number = 0
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll(selector);
    if (elements.length === 0) return;

    gsap.fromTo(
      elements,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out",
        stagger: 0, // All at once
        delay: 0 // No delay
      }
    );

    return () => {
      gsap.killTweensOf(elements);
    };
  }, [selector]);

  return containerRef;
}

// Hook for scroll-triggered animations - trigger early
export function useScrollAnimation(
  preset: keyof typeof animationPresets = 'fadeUp',
  threshold: number = 0.01 // Very low threshold - trigger immediately
) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const animation = animationPresets[preset];
    
    // Set initial state
    gsap.set(element, animation.from);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(element, { ...animation.to, delay: 0 });
            observer.unobserve(element);
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
  }, [preset, threshold]);

  return elementRef;
}

// Hook for hover animations
export function useHoverAnimation() {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      gsap.to(element, {
        scale: 1.02,
        y: -2,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(element);
    };
  }, []);

  return elementRef;
}

// Hook for number counter animation - faster
export function useCounterAnimation(
  endValue: number,
  duration: number = 0.6,
  delay: number = 0
) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef({ value: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    gsap.to(counterRef.current, {
      value: endValue,
      duration,
      delay: 0, // No delay
      ease: "power2.out",
      onUpdate: () => {
        if (element) {
          element.textContent = Math.round(counterRef.current.value).toLocaleString();
        }
      }
    });

    return () => {
      gsap.killTweensOf(counterRef.current);
    };
  }, [endValue, duration]);

  return elementRef;
}

// Utility function for triggering animations imperatively
export function animateElement(
  element: HTMLElement | null,
  preset: keyof typeof animationPresets
) {
  if (!element) return;
  
  const animation = animationPresets[preset];
  return gsap.fromTo(element, animation.from, animation.to);
}

// Utility for creating a timeline
export function createTimeline(paused: boolean = false) {
  return gsap.timeline({ paused });
}

// Page transition animation - instant
export function pageTransitionIn(container: HTMLElement | null) {
  if (!container) return;
  
  return gsap.fromTo(
    container,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }
  );
}

export function pageTransitionOut(container: HTMLElement | null) {
  if (!container) return;
  
  return gsap.to(container, {
    opacity: 0,
    y: -8,
    duration: 0.15,
    ease: "power2.in"
  });
}
