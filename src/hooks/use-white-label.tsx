'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { WhiteLabelSettings } from '@/types/saas';
import { useAuth } from '@/hooks/use-auth';
import { getWhiteLabelSettings } from '@/app/actions/white-label-actions';

interface WhiteLabelContextValue {
  settings: WhiteLabelSettings | null;
  isWhiteLabeled: boolean;
  brandName: string;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  primaryForeground: string;
  accentColor: string;
  footerText: string | null;
  supportEmail: string | null;
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
  loginWelcomeText: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_BRAND_NAME = 'OmniFlow';
const DEFAULT_PRIMARY_COLOR = '#6366f1';
const DEFAULT_PRIMARY_FOREGROUND = '#ffffff';
const DEFAULT_ACCENT_COLOR = '#8b5cf6';

const WhiteLabelContext = createContext<WhiteLabelContextValue>({
  settings: null,
  isWhiteLabeled: false,
  brandName: DEFAULT_BRAND_NAME,
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  primaryForeground: DEFAULT_PRIMARY_FOREGROUND,
  accentColor: DEFAULT_ACCENT_COLOR,
  footerText: null,
  supportEmail: null,
  privacyPolicyUrl: null,
  termsOfServiceUrl: null,
  loginWelcomeText: null,
  loading: true,
  refresh: async () => {},
});

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const { company } = useAuth();
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    if (!company?.id) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const result = await getWhiteLabelSettings(company.id);
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Failed to load white-label settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [company?.id]);

  // Apply CSS custom properties when settings change
  useEffect(() => {
    if (settings?.enabled) {
      const root = document.documentElement;
      
      // Convert hex to HSL for CSS variables
      const hexToHsl = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '239 84% 67%'; // Default indigo
        
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
      root.style.setProperty('--primary-foreground', hexToHsl(settings.primaryForeground || '#ffffff'));
      
      if (settings.accentColor) {
        root.style.setProperty('--accent', hexToHsl(settings.accentColor));
      }

      // Update favicon if provided
      if (settings.faviconUrl) {
        const existingFavicon = document.querySelector('link[rel="icon"]');
        if (existingFavicon) {
          existingFavicon.setAttribute('href', settings.faviconUrl);
        } else {
          const favicon = document.createElement('link');
          favicon.rel = 'icon';
          favicon.href = settings.faviconUrl;
          document.head.appendChild(favicon);
        }
      }

      // Update document title with brand name
      if (settings.brandName) {
        const currentTitle = document.title;
        if (currentTitle.includes('OmniFlow')) {
          document.title = currentTitle.replace('OmniFlow', settings.brandName);
        }
      }
    }
  }, [settings]);

  const value = useMemo<WhiteLabelContextValue>(() => ({
    settings,
    isWhiteLabeled: settings?.enabled ?? false,
    brandName: (settings?.enabled && settings?.brandName) ? settings.brandName : DEFAULT_BRAND_NAME,
    logoUrl: settings?.enabled ? settings.logoUrl || null : null,
    logoDarkUrl: settings?.enabled ? settings.logoDarkUrl || null : null,
    faviconUrl: settings?.enabled ? settings.faviconUrl || null : null,
    primaryColor: settings?.enabled ? settings.primaryColor : DEFAULT_PRIMARY_COLOR,
    primaryForeground: settings?.enabled ? (settings.primaryForeground || DEFAULT_PRIMARY_FOREGROUND) : DEFAULT_PRIMARY_FOREGROUND,
    accentColor: settings?.enabled ? (settings.accentColor || DEFAULT_ACCENT_COLOR) : DEFAULT_ACCENT_COLOR,
    footerText: settings?.enabled ? settings.footerText || null : null,
    supportEmail: settings?.enabled ? settings.supportEmail || null : null,
    privacyPolicyUrl: settings?.enabled ? settings.privacyPolicyUrl || null : null,
    termsOfServiceUrl: settings?.enabled ? settings.termsOfServiceUrl || null : null,
    loginWelcomeText: settings?.enabled ? settings.loginWelcomeText || null : null,
    loading,
    refresh: loadSettings,
  }), [settings, loading]);

  return (
    <WhiteLabelContext.Provider value={value}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
}
