/**
 * Enhanced Geo-detection utilities for pricing localization
 * Auto-detects user location using multiple fallback methods
 * Supports 32 worldwide currencies with localized pricing
 */

export type SupportedCurrency = 
  | 'USD' | 'INR' | 'EUR' | 'GBP' 
  | 'CAD' | 'AUD' | 'JPY' | 'CNY' 
  | 'BRL' | 'MXN' | 'SGD' | 'AED'
  | 'CHF' | 'SEK' | 'NOK' | 'DKK'
  | 'NZD' | 'ZAR' | 'KRW' | 'THB'
  | 'MYR' | 'PHP' | 'IDR' | 'VND'
  | 'PLN' | 'CZK' | 'HUF' | 'TRY'
  | 'SAR' | 'QAR' | 'KWD' | 'BHD';

export interface GeoLocation {
  country: string;
  countryCode: string;
  currency: SupportedCurrency;
  timezone?: string;
}

// Currency metadata with symbols and flags
export const CURRENCY_DATA: Record<SupportedCurrency, { symbol: string; name: string; flag: string }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  SEK: { symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  DKK: { symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  ZAR: { symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  KRW: { symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  THB: { symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  VND: { symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  PLN: { symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  CZK: { symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  HUF: { symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  TRY: { symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  QAR: { symbol: '﷼', name: 'Qatari Riyal', flag: '🇶🇦' },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  BHD: { symbol: '.د.ب', name: 'Bahraini Dinar', flag: '🇧🇭' },
};


// Localized pricing for each currency (includes demo plan for testing)
// Demo prices set to minimum allowed by payment gateways (Stripe min: $0.50)
export const FIXED_PRICING: Record<SupportedCurrency, { demo?: number; starter: number; pro: number; enterprise: number }> = {
  // Americas - Stripe minimum $0.50
  USD: { demo: 0.50, starter: 29, pro: 99, enterprise: 249 },
  CAD: { demo: 0.50, starter: 39, pro: 135, enterprise: 339 },
  BRL: { demo: 2, starter: 149, pro: 499, enterprise: 1249 },
  MXN: { demo: 10, starter: 499, pro: 1699, enterprise: 4249 },
  // Europe - Stripe minimum €0.50
  EUR: { demo: 0.50, starter: 27, pro: 92, enterprise: 230 },
  GBP: { demo: 0.30, starter: 23, pro: 78, enterprise: 197 },
  CHF: { demo: 0.50, starter: 26, pro: 89, enterprise: 225 },
  SEK: { demo: 3, starter: 299, pro: 999, enterprise: 2499 },
  NOK: { demo: 3, starter: 299, pro: 999, enterprise: 2499 },
  DKK: { demo: 2.50, starter: 199, pro: 679, enterprise: 1699 },
  PLN: { demo: 2, starter: 119, pro: 399, enterprise: 999 },
  CZK: { demo: 15, starter: 649, pro: 2199, enterprise: 5499 },
  HUF: { demo: 200, starter: 9999, pro: 34999, enterprise: 87499 },
  TRY: { demo: 15, starter: 899, pro: 2999, enterprise: 7499 },
  // Asia Pacific - INR uses Razorpay (₹1 minimum)
  INR: { demo: 1, starter: 1999, pro: 7999, enterprise: 20999 },
  JPY: { demo: 50, starter: 4290, pro: 14590, enterprise: 36790 },
  CNY: { demo: 4, starter: 199, pro: 699, enterprise: 1749 },
  SGD: { demo: 0.50, starter: 39, pro: 135, enterprise: 339 },
  AUD: { demo: 0.50, starter: 45, pro: 155, enterprise: 389 },
  NZD: { demo: 0.50, starter: 49, pro: 165, enterprise: 415 },
  KRW: { demo: 500, starter: 38900, pro: 132900, enterprise: 334900 },
  THB: { demo: 20, starter: 999, pro: 3499, enterprise: 8749 },
  MYR: { demo: 2, starter: 129, pro: 449, enterprise: 1129 },
  PHP: { demo: 25, starter: 1599, pro: 5499, enterprise: 13749 },
  IDR: { demo: 8000, starter: 449000, pro: 1549000, enterprise: 3879000 },
  VND: { demo: 12000, starter: 699000, pro: 2399000, enterprise: 5999000 },
  // Middle East
  AED: { demo: 2, starter: 109, pro: 369, enterprise: 919 },
  SAR: { demo: 2, starter: 109, pro: 369, enterprise: 929 },
  QAR: { demo: 2, starter: 109, pro: 369, enterprise: 909 },
  KWD: { demo: 0.15, starter: 9, pro: 30, enterprise: 76 },
  BHD: { demo: 0.20, starter: 11, pro: 37, enterprise: 94 },
  // Africa
  ZAR: { demo: 10, starter: 549, pro: 1849, enterprise: 4649 },
};

// Comprehensive country to currency mapping (100+ countries)
const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  // Americas
  US: 'USD', CA: 'CAD', BR: 'BRL', MX: 'MXN',
  AR: 'USD', CL: 'USD', CO: 'USD', PE: 'USD', VE: 'USD',
  EC: 'USD', UY: 'USD', PY: 'USD', BO: 'USD', CR: 'USD',
  PA: 'USD', GT: 'USD', HN: 'USD', SV: 'USD', NI: 'USD',
  PR: 'USD', DO: 'USD', CU: 'USD', JM: 'USD', TT: 'USD',
  // Europe - Non-Euro
  GB: 'GBP', UK: 'GBP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', TR: 'TRY', RU: 'EUR', UA: 'EUR',
  RO: 'EUR', BG: 'EUR', RS: 'EUR', BA: 'EUR', AL: 'EUR',
  MK: 'EUR', ME: 'EUR', XK: 'EUR', MD: 'EUR', BY: 'EUR', IS: 'EUR',
  // Eurozone (20 countries)
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR',
  DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR',
  LU: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', SK: 'EUR', SI: 'EUR', 
  ES: 'EUR', HR: 'EUR',
  // Asia Pacific
  IN: 'INR', JP: 'JPY', CN: 'CNY', HK: 'CNY', TW: 'CNY',
  SG: 'SGD', AU: 'AUD', NZ: 'NZD', KR: 'KRW', TH: 'THB',
  MY: 'MYR', PH: 'PHP', ID: 'IDR', VN: 'VND', BD: 'INR',
  PK: 'INR', LK: 'INR', NP: 'INR', MM: 'THB', KH: 'THB',
  LA: 'THB', BN: 'SGD', MO: 'CNY', MN: 'CNY', KZ: 'USD',
  UZ: 'USD', TM: 'USD', KG: 'USD', TJ: 'USD', AF: 'USD',
  // Middle East
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD',
  OM: 'AED', JO: 'AED', LB: 'AED', SY: 'AED', IQ: 'AED',
  IR: 'AED', YE: 'AED', PS: 'AED', IL: 'USD',
  // Africa
  ZA: 'ZAR', EG: 'USD', NG: 'USD', KE: 'USD', GH: 'USD',
  TZ: 'USD', UG: 'USD', ET: 'USD', MA: 'EUR', DZ: 'EUR',
  TN: 'EUR', LY: 'EUR', SD: 'USD', AO: 'USD', MZ: 'USD',
  ZW: 'USD', ZM: 'USD', BW: 'ZAR', NA: 'ZAR', SZ: 'ZAR',
  LS: 'ZAR', MW: 'USD', RW: 'USD', SN: 'EUR', CI: 'EUR',
  CM: 'EUR', CD: 'USD', MU: 'USD', MG: 'USD',
  // Oceania
  FJ: 'AUD', PG: 'AUD', NC: 'AUD', VU: 'AUD', WS: 'NZD',
  TO: 'NZD', PF: 'EUR', GU: 'USD',
};


// Timezone to country mapping for fallback detection
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Americas
  'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Phoenix': 'US', 'America/Toronto': 'CA',
  'America/Vancouver': 'CA', 'America/Montreal': 'CA', 'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR', 'America/Lima': 'PE',
  'America/Bogota': 'CO', 'America/Santiago': 'CL',
  // Europe
  'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
  'Europe/Budapest': 'HU', 'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR',
  'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA', 'Europe/Lisbon': 'PT',
  'Europe/Dublin': 'IE', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG',
  // Asia
  'Asia/Kolkata': 'IN', 'Asia/Mumbai': 'IN', 'Asia/Delhi': 'IN',
  'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Beijing': 'CN',
  'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG', 'Asia/Seoul': 'KR',
  'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Taipei': 'TW',
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP',
  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ', 'Pacific/Fiji': 'FJ',
  // Africa
  'Africa/Johannesburg': 'ZA', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ',
};

// Get currency for a country code
export function getCurrencyForCountry(countryCode: string): SupportedCurrency {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'USD';
}

// Get country from timezone
export function getCountryFromTimezone(timezone: string): string | null {
  return TIMEZONE_TO_COUNTRY[timezone] || null;
}

// Get currency symbol
export function getCurrencySymbol(currency: SupportedCurrency): string {
  return CURRENCY_DATA[currency]?.symbol || '$';
}

// Get currency flag emoji
export function getCurrencyFlag(currency: SupportedCurrency): string {
  return CURRENCY_DATA[currency]?.flag || '🌍';
}

// Get currency name
export function getCurrencyName(currency: SupportedCurrency): string {
  return CURRENCY_DATA[currency]?.name || currency;
}


// Get price for a plan in a specific currency
export function getPriceForPlan(planId: string, currency: SupportedCurrency): number {
  const pricing = FIXED_PRICING[currency] || FIXED_PRICING.USD;
  
  // Map plan IDs to pricing tiers
  const planMap: Record<string, 'demo' | 'starter' | 'pro' | 'enterprise'> = {
    'plan_free': 'starter',
    'plan_demo': 'demo',
    'plan_starter': 'starter',
    'plan_pro': 'pro',
    'plan_enterprise': 'enterprise',
    // Fallback mappings
    'free': 'starter',
    'demo': 'demo',
    'starter': 'starter',
    'pro': 'pro',
    'enterprise': 'enterprise',
  };
  
  const tier = planMap[planId.toLowerCase()] || 'starter';
  
  // Handle demo tier - return demo price or fallback to 1
  if (tier === 'demo') {
    return pricing.demo || 1;
  }
  
  return pricing[tier];
}

// Get price with billing cycle (monthly/yearly with discount)
export function getPriceForPlanWithBillingCycle(
  planId: string, 
  currency: SupportedCurrency, 
  billingCycle: 'monthly' | 'yearly',
  yearlyDiscountPercent: number = 20
): number {
  const monthlyPrice = getPriceForPlan(planId, currency);
  
  if (billingCycle === 'yearly') {
    const yearlyTotal = monthlyPrice * 12;
    const discount = yearlyTotal * (yearlyDiscountPercent / 100);
    return Math.round((yearlyTotal - discount) / 12);
  }
  
  return monthlyPrice;
}

// Detect user location using multiple fallback methods
export async function detectUserLocation(): Promise<GeoLocation> {
  // Try timezone-based detection first (instant, no API call)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryCode = getCountryFromTimezone(timezone);
    
    if (countryCode) {
      const currency = getCurrencyForCountry(countryCode);
      return {
        country: countryCode,
        countryCode,
        currency,
        timezone,
      };
    }
  } catch {
    // Timezone detection failed, continue to API fallbacks
  }

  // Try multiple geo-IP APIs with fallbacks
  const geoApis = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data: { country_code?: string; country?: string; timezone?: string }) => ({
        countryCode: data.country_code,
        country: data.country,
        timezone: data.timezone,
      }),
    },
    {
      url: 'https://ip-api.com/json/?fields=countryCode,country,timezone',
      parse: (data: { countryCode?: string; country?: string; timezone?: string }) => ({
        countryCode: data.countryCode,
        country: data.country,
        timezone: data.timezone,
      }),
    },
    {
      url: 'https://ipwho.is/',
      parse: (data: { country_code?: string; country?: string; timezone?: { id?: string } }) => ({
        countryCode: data.country_code,
        country: data.country,
        timezone: data.timezone?.id,
      }),
    },
  ];

  for (const api of geoApis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(api.url, { 
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const parsed = api.parse(data);
        
        if (parsed.countryCode) {
          const currency = getCurrencyForCountry(parsed.countryCode);
          return {
            country: parsed.country || parsed.countryCode,
            countryCode: parsed.countryCode,
            currency,
            timezone: parsed.timezone,
          };
        }
      }
    } catch {
      // API failed, try next one
      continue;
    }
  }

  // Default fallback to USD
  return {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    timezone: undefined,
  };
}

// Get all supported currencies for the currency selector
export function getAllCurrencies(): Array<{
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
}> {
  return Object.entries(CURRENCY_DATA).map(([code, data]) => ({
    code: code as SupportedCurrency,
    ...data,
  }));
}
