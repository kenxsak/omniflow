'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getPlatformBranding } from '@/app/actions/white-label-actions';

interface PublicWhiteLabelContextValue {
  brandName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
  loading: boolean;
}

const DEFAULT_BRAND_NAME = 'OmniFlow';
const DEFAULT_PRIMARY_COLOR = '#6366f1';

const PublicWhiteLabelContext = createContext<PublicWhiteLabelContextValue>({
  brandName: DEFAULT_BRAND_NAME,
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  supportEmail: null,
  privacyPolicyUrl: '/privacy-policy',
  termsOfServiceUrl: '/terms',
  loading: true,
});

export function PublicWhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicWhiteLabelContextValue>({
    brandName: DEFAULT_BRAND_NAME,
    logoUrl: null,
    logoDarkUrl: null,
    faviconUrl: null,
    primaryColor: DEFAULT_PRIMARY_COLOR,
    supportEmail: null,
    privacyPolicyUrl: '/privacy-policy',
    termsOfServiceUrl: '/terms',
    loading: true,
  });

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const result = await getPlatformBranding();
        if (result.success) {
          setSettings({
            brandName: result.settings.brandName,
            logoUrl: result.settings.logoUrl || null,
            logoDarkUrl: result.settings.logoDarkUrl || null,
            faviconUrl: result.settings.faviconUrl || null,
            primaryColor: result.settings.primaryColor,
            supportEmail: result.settings.supportEmail || null,
            privacyPolicyUrl: result.settings.privacyPolicyUrl || '/privacy-policy',
            termsOfServiceUrl: result.settings.termsOfServiceUrl || '/terms',
            loading: false,
          });
        }
      } catch (error) {
        console.error('Failed to load platform branding:', error);
        setSettings(prev => ({ ...prev, loading: false }));
      }
    };

    loadBranding();
  }, []);

  // Apply CSS custom properties for primary color
  useEffect(() => {
    if (settings.primaryColor && settings.primaryColor !== DEFAULT_PRIMARY_COLOR) {
      const root = document.documentElement;
      
      const hexToHsl = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '239 84% 67%';
        
        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      root.style.setProperty('--primary', hexToHsl(settings.primaryColor));
    }

    // Update favicon if provided
    if (settings.faviconUrl) {
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.setAttribute('href', settings.faviconUrl);
      }
    }
  }, [settings.primaryColor, settings.faviconUrl]);

  const value = useMemo(() => settings, [settings]);

  return (
    <PublicWhiteLabelContext.Provider value={value}>
      {children}
    </PublicWhiteLabelContext.Provider>
  );
}

export function usePublicWhiteLabel() {
  const context = useContext(PublicWhiteLabelContext);
  if (!context) {
    throw new Error('usePublicWhiteLabel must be used within a PublicWhiteLabelProvider');
  }
  return context;
}
