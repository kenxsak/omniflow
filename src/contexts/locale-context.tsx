"use client";

/**
 * Locale Context
 * 
 * Provides comprehensive internationalization support:
 * - Timezone-aware date/time formatting
 * - Locale-aware number formatting
 * - Date format preferences (DD/MM vs MM/DD)
 * - Relative time formatting
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { enUS, enIN, enGB, de, fr, es, pt, ja, zhCN, ko, ar } from 'date-fns/locale';

// Locale mapping for date-fns
const localeMap: Record<string, Locale> = {
  'en-US': enUS,
  'en-IN': enIN,
  'en-GB': enGB,
  'de-DE': de,
  'fr-FR': fr,
  'es-ES': es,
  'pt-BR': pt,
  'ja-JP': ja,
  'zh-CN': zhCN,
  'ko-KR': ko,
  'ar-SA': ar,
};

// Country to locale mapping
const countryToLocale: Record<string, string> = {
  'India': 'en-IN',
  'United States': 'en-US',
  'USA': 'en-US',
  'United Kingdom': 'en-GB',
  'UK': 'en-GB',
  'Germany': 'de-DE',
  'France': 'fr-FR',
  'Spain': 'es-ES',
  'Brazil': 'pt-BR',
  'Japan': 'ja-JP',
  'China': 'zh-CN',
  'South Korea': 'ko-KR',
  'Saudi Arabia': 'ar-SA',
  'UAE': 'ar-SA',
  'Australia': 'en-AU',
  'Canada': 'en-CA',
  'Singapore': 'en-SG',
};

// Date format patterns by locale
const dateFormatPatterns: Record<string, { short: string; medium: string; long: string }> = {
  'en-US': { short: 'MM/dd/yyyy', medium: 'MMM d, yyyy', long: 'MMMM d, yyyy' },
  'en-IN': { short: 'dd/MM/yyyy', medium: 'd MMM yyyy', long: 'd MMMM yyyy' },
  'en-GB': { short: 'dd/MM/yyyy', medium: 'd MMM yyyy', long: 'd MMMM yyyy' },
  'de-DE': { short: 'dd.MM.yyyy', medium: 'd. MMM yyyy', long: 'd. MMMM yyyy' },
  'fr-FR': { short: 'dd/MM/yyyy', medium: 'd MMM yyyy', long: 'd MMMM yyyy' },
  'ja-JP': { short: 'yyyy/MM/dd', medium: 'yyyy年M月d日', long: 'yyyy年M月d日' },
  'zh-CN': { short: 'yyyy/MM/dd', medium: 'yyyy年M月d日', long: 'yyyy年M月d日' },
};

export interface LocaleContextType {
  // Core settings
  locale: string;
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD';
  
  // Date/Time formatting
  formatDate: (date: Date | string | null | undefined, style?: 'short' | 'medium' | 'long') => string;
  formatTime: (date: Date | string | null | undefined, includeSeconds?: boolean) => string;
  formatDateTime: (date: Date | string | null | undefined, style?: 'short' | 'medium' | 'long') => string;
  formatRelative: (date: Date | string | null | undefined) => string;
  
  // Timezone conversion
  toUserTimezone: (utcDate: Date | string) => Date;
  toUTC: (localDate: Date) => Date;
  
  // Number formatting
  formatNumber: (num: number, decimals?: number) => string;
  formatPercent: (num: number, decimals?: number) => string;
  formatCompact: (num: number) => string;
  
  // Utilities
  getDateFnsLocale: () => Locale;
  setTimezone: (tz: string) => void;
  setDateFormat: (format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD') => void;
}

const defaultContext: LocaleContextType = {
  locale: 'en-US',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  formatDate: () => '',
  formatTime: () => '',
  formatDateTime: () => '',
  formatRelative: () => '',
  toUserTimezone: (d) => new Date(d),
  toUTC: (d) => d,
  formatNumber: (n) => n.toString(),
  formatPercent: (n) => `${n}%`,
  formatCompact: (n) => n.toString(),
  getDateFnsLocale: () => enUS,
  setTimezone: () => {},
  setDateFormat: () => {},
};

const LocaleContext = createContext<LocaleContextType>(defaultContext);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { company, loading } = useAuth();
  
  const [locale, setLocale] = useState('en-US');
  const [timezone, setTimezoneState] = useState('UTC');
  const [dateFormat, setDateFormatState] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD'>('MM/DD/YYYY');

  // Initialize from company settings
  useEffect(() => {
    if (!loading && company) {
      // Set locale based on country
      const detectedLocale = countryToLocale[company.country || ''] || 'en-US';
      setLocale(detectedLocale);
      
      // Set timezone
      if (company.timezone) {
        setTimezoneState(company.timezone);
      } else {
        // Fallback to browser timezone
        try {
          const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezoneState(browserTz);
        } catch {
          setTimezoneState('UTC');
        }
      }
      
      // Set date format based on locale
      if (detectedLocale === 'en-US') {
        setDateFormatState('MM/DD/YYYY');
      } else if (detectedLocale === 'ja-JP' || detectedLocale === 'zh-CN' || detectedLocale === 'ko-KR') {
        setDateFormatState('YYYY/MM/DD');
      } else {
        setDateFormatState('DD/MM/YYYY');
      }
    }
  }, [company, loading]);

  const getDateFnsLocale = useCallback((): Locale => {
    return localeMap[locale] || enUS;
  }, [locale]);

  const parseDate = useCallback((date: Date | string | null | undefined): Date | null => {
    if (!date) return null;
    
    if (date instanceof Date) {
      return isValid(date) ? date : null;
    }
    
    try {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  const toUserTimezone = useCallback((utcDate: Date | string): Date => {
    const date = parseDate(utcDate);
    if (!date) return new Date();
    
    try {
      return toZonedTime(date, timezone);
    } catch {
      return date;
    }
  }, [timezone, parseDate]);

  const toUTC = useCallback((localDate: Date): Date => {
    try {
      return fromZonedTime(localDate, timezone);
    } catch {
      return localDate;
    }
  }, [timezone]);

  const formatDate = useCallback((
    date: Date | string | null | undefined,
    style: 'short' | 'medium' | 'long' = 'medium'
  ): string => {
    const parsed = parseDate(date);
    if (!parsed) return '-';
    
    try {
      const patterns = dateFormatPatterns[locale] || dateFormatPatterns['en-US'];
      const pattern = patterns[style];
      return formatInTimeZone(parsed, timezone, pattern, { locale: getDateFnsLocale() });
    } catch {
      return '-';
    }
  }, [locale, timezone, parseDate, getDateFnsLocale]);

  const formatTime = useCallback((
    date: Date | string | null | undefined,
    includeSeconds: boolean = false
  ): string => {
    const parsed = parseDate(date);
    if (!parsed) return '-';
    
    try {
      const pattern = includeSeconds ? 'h:mm:ss a' : 'h:mm a';
      return formatInTimeZone(parsed, timezone, pattern, { locale: getDateFnsLocale() });
    } catch {
      return '-';
    }
  }, [timezone, parseDate, getDateFnsLocale]);

  const formatDateTime = useCallback((
    date: Date | string | null | undefined,
    style: 'short' | 'medium' | 'long' = 'medium'
  ): string => {
    const parsed = parseDate(date);
    if (!parsed) return '-';
    
    try {
      const patterns = dateFormatPatterns[locale] || dateFormatPatterns['en-US'];
      const datePattern = patterns[style];
      const fullPattern = `${datePattern}, h:mm a`;
      return formatInTimeZone(parsed, timezone, fullPattern, { locale: getDateFnsLocale() });
    } catch {
      return '-';
    }
  }, [locale, timezone, parseDate, getDateFnsLocale]);

  const formatRelative = useCallback((date: Date | string | null | undefined): string => {
    const parsed = parseDate(date);
    if (!parsed) return '-';
    
    try {
      return formatDistanceToNow(parsed, { addSuffix: true, locale: getDateFnsLocale() });
    } catch {
      return '-';
    }
  }, [parseDate, getDateFnsLocale]);

  const formatNumber = useCallback((num: number, decimals: number = 0): string => {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    } catch {
      return num.toFixed(decimals);
    }
  }, [locale]);

  const formatPercent = useCallback((num: number, decimals: number = 1): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num / 100);
    } catch {
      return `${num.toFixed(decimals)}%`;
    }
  }, [locale]);

  const formatCompact = useCallback((num: number): string => {
    try {
      // For Indian locale, use lakhs/crores notation
      if (locale === 'en-IN') {
        if (num >= 10000000) {
          return `${(num / 10000000).toFixed(1)}Cr`;
        } else if (num >= 100000) {
          return `${(num / 100000).toFixed(1)}L`;
        } else if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
      }
      
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(num);
    } catch {
      return num.toString();
    }
  }, [locale]);

  const setTimezone = useCallback((tz: string) => {
    setTimezoneState(tz);
  }, []);

  const setDateFormat = useCallback((format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD') => {
    setDateFormatState(format);
  }, []);

  const value: LocaleContextType = {
    locale,
    timezone,
    dateFormat,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelative,
    toUserTimezone,
    toUTC,
    formatNumber,
    formatPercent,
    formatCompact,
    getDateFnsLocale,
    setTimezone,
    setDateFormat,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  return useContext(LocaleContext);
}
