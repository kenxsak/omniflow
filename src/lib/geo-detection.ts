/**
 * Geo Detection Library
 * 
 * Auto-detects user's location, timezone, currency, and phone code
 * Uses free IP geolocation APIs with fallbacks
 */

export interface GeoData {
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  callingCode: string;
  city?: string;
  region?: string;
  ip?: string;
}

// Country to timezone mapping (primary timezone for each country)
const countryTimezones: Record<string, string> = {
  'IN': 'Asia/Kolkata',
  'US': 'America/New_York',
  'GB': 'Europe/London',
  'AU': 'Australia/Sydney',
  'CA': 'America/Toronto',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'SG': 'Asia/Singapore',
  'AE': 'Asia/Dubai',
  'SA': 'Asia/Riyadh',
  'BR': 'America/Sao_Paulo',
  'MX': 'America/Mexico_City',
  'ZA': 'Africa/Johannesburg',
  'NZ': 'Pacific/Auckland',
  'KR': 'Asia/Seoul',
  'ID': 'Asia/Jakarta',
  'MY': 'Asia/Kuala_Lumpur',
  'TH': 'Asia/Bangkok',
  'PH': 'Asia/Manila',
  'VN': 'Asia/Ho_Chi_Minh',
  'PK': 'Asia/Karachi',
  'BD': 'Asia/Dhaka',
  'LK': 'Asia/Colombo',
  'NP': 'Asia/Kathmandu',
  'EG': 'Africa/Cairo',
  'NG': 'Africa/Lagos',
  'KE': 'Africa/Nairobi',
  'IL': 'Asia/Jerusalem',
  'TR': 'Europe/Istanbul',
  'RU': 'Europe/Moscow',
  'PL': 'Europe/Warsaw',
  'NL': 'Europe/Amsterdam',
  'BE': 'Europe/Brussels',
  'CH': 'Europe/Zurich',
  'AT': 'Europe/Vienna',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Oslo',
  'DK': 'Europe/Copenhagen',
  'FI': 'Europe/Helsinki',
  'IE': 'Europe/Dublin',
  'PT': 'Europe/Lisbon',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  'GR': 'Europe/Athens',
};

// Country to currency mapping
const countryCurrencies: Record<string, string> = {
  'IN': 'INR', 'US': 'USD', 'GB': 'GBP', 'AU': 'AUD', 'CA': 'CAD',
  'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  'BE': 'EUR', 'AT': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR',
  'FI': 'EUR', 'JP': 'JPY', 'CN': 'CNY', 'SG': 'SGD', 'AE': 'AED',
  'SA': 'SAR', 'BR': 'BRL', 'MX': 'MXN', 'ZA': 'ZAR', 'NZ': 'NZD',
  'KR': 'KRW', 'ID': 'IDR', 'MY': 'MYR', 'TH': 'THB', 'PH': 'PHP',
  'VN': 'VND', 'PK': 'PKR', 'BD': 'BDT', 'LK': 'LKR', 'NP': 'NPR',
  'EG': 'EGP', 'NG': 'NGN', 'KE': 'KES', 'IL': 'ILS', 'TR': 'TRY',
  'RU': 'RUB', 'PL': 'PLN', 'CH': 'CHF', 'SE': 'SEK', 'NO': 'NOK',
  'DK': 'DKK', 'HK': 'HKD', 'TW': 'TWD', 'QA': 'QAR', 'KW': 'KWD',
  'BH': 'BHD', 'OM': 'OMR', 'JO': 'JOD',
};

// Country calling codes
const countryCallingCodes: Record<string, string> = {
  'IN': '+91', 'US': '+1', 'GB': '+44', 'AU': '+61', 'CA': '+1',
  'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34', 'NL': '+31',
  'BE': '+32', 'AT': '+43', 'IE': '+353', 'PT': '+351', 'GR': '+30',
  'FI': '+358', 'JP': '+81', 'CN': '+86', 'SG': '+65', 'AE': '+971',
  'SA': '+966', 'BR': '+55', 'MX': '+52', 'ZA': '+27', 'NZ': '+64',
  'KR': '+82', 'ID': '+62', 'MY': '+60', 'TH': '+66', 'PH': '+63',
  'VN': '+84', 'PK': '+92', 'BD': '+880', 'LK': '+94', 'NP': '+977',
  'EG': '+20', 'NG': '+234', 'KE': '+254', 'IL': '+972', 'TR': '+90',
  'RU': '+7', 'PL': '+48', 'CH': '+41', 'SE': '+46', 'NO': '+47',
  'DK': '+45', 'HK': '+852', 'TW': '+886', 'QA': '+974', 'KW': '+965',
  'BH': '+973', 'OM': '+968', 'JO': '+962',
};

// Country code to name mapping
const countryNames: Record<string, string> = {
  'IN': 'India', 'US': 'United States', 'GB': 'United Kingdom',
  'AU': 'Australia', 'CA': 'Canada', 'DE': 'Germany', 'FR': 'France',
  'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'BE': 'Belgium',
  'AT': 'Austria', 'IE': 'Ireland', 'PT': 'Portugal', 'GR': 'Greece',
  'FI': 'Finland', 'JP': 'Japan', 'CN': 'China', 'SG': 'Singapore',
  'AE': 'UAE', 'SA': 'Saudi Arabia', 'BR': 'Brazil', 'MX': 'Mexico',
  'ZA': 'South Africa', 'NZ': 'New Zealand', 'KR': 'South Korea',
  'ID': 'Indonesia', 'MY': 'Malaysia', 'TH': 'Thailand', 'PH': 'Philippines',
  'VN': 'Vietnam', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka',
  'NP': 'Nepal', 'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya',
  'IL': 'Israel', 'TR': 'Turkey', 'RU': 'Russia', 'PL': 'Poland',
  'CH': 'Switzerland', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark',
  'HK': 'Hong Kong', 'TW': 'Taiwan', 'QA': 'Qatar', 'KW': 'Kuwait',
  'BH': 'Bahrain', 'OM': 'Oman', 'JO': 'Jordan',
};

/**
 * Detect user's geo data from IP address
 * Uses multiple free APIs with fallbacks
 */
export async function detectGeoLocation(): Promise<GeoData | null> {
  // Try primary API (ipapi.co - 1000 free requests/day)
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.country_code) {
        return {
          country: data.country_name || countryNames[data.country_code] || data.country_code,
          countryCode: data.country_code,
          timezone: data.timezone || countryTimezones[data.country_code] || 'UTC',
          currency: data.currency || countryCurrencies[data.country_code] || 'USD',
          callingCode: data.country_calling_code || countryCallingCodes[data.country_code] || '+1',
          city: data.city,
          region: data.region,
          ip: data.ip,
        };
      }
    }
  } catch (error) {
    console.warn('Primary geo API failed, trying fallback...');
  }

  // Fallback API (ip-api.com - 45 requests/minute)
  try {
    const response = await fetch('http://ip-api.com/json/?fields=status,country,countryCode,city,region,timezone', {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.countryCode) {
        const cc = data.countryCode;
        return {
          country: data.country || countryNames[cc] || cc,
          countryCode: cc,
          timezone: data.timezone || countryTimezones[cc] || 'UTC',
          currency: countryCurrencies[cc] || 'USD',
          callingCode: countryCallingCodes[cc] || '+1',
          city: data.city,
          region: data.region,
        };
      }
    }
  } catch (error) {
    console.warn('Fallback geo API also failed');
  }

  // Try browser timezone as last resort
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryFromTz = getCountryFromTimezone(browserTimezone);
    if (countryFromTz) {
      return {
        country: countryNames[countryFromTz] || countryFromTz,
        countryCode: countryFromTz,
        timezone: browserTimezone,
        currency: countryCurrencies[countryFromTz] || 'USD',
        callingCode: countryCallingCodes[countryFromTz] || '+1',
      };
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Get country code from timezone string
 */
function getCountryFromTimezone(timezone: string): string | null {
  for (const [code, tz] of Object.entries(countryTimezones)) {
    if (tz === timezone) return code;
  }
  
  // Try to extract from timezone string (e.g., "Asia/Kolkata" -> India)
  if (timezone.startsWith('Asia/Kolkata') || timezone.startsWith('Asia/Calcutta')) return 'IN';
  if (timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles')) return 'US';
  if (timezone.includes('Europe/London')) return 'GB';
  
  return null;
}

/**
 * Get geo data for a specific country code
 */
export function getGeoDataForCountry(countryCode: string): GeoData {
  const cc = countryCode.toUpperCase();
  return {
    country: countryNames[cc] || cc,
    countryCode: cc,
    timezone: countryTimezones[cc] || 'UTC',
    currency: countryCurrencies[cc] || 'USD',
    callingCode: countryCallingCodes[cc] || '+1',
  };
}

/**
 * Get all supported countries for dropdowns
 */
export function getSupportedCountries(): Array<{ code: string; name: string; callingCode: string }> {
  return Object.entries(countryNames)
    .map(([code, name]) => ({
      code,
      name,
      callingCode: countryCallingCodes[code] || '+1',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all supported timezones grouped by region
 */
export function getSupportedTimezones(): Array<{ value: string; label: string; offset: string }> {
  const timezones = [
    // Asia
    { value: 'Asia/Kolkata', label: 'India (IST)', offset: '+05:30' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+04:00' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
    { value: 'Asia/Shanghai', label: 'China (CST)', offset: '+08:00' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', offset: '+08:00' },
    { value: 'Asia/Seoul', label: 'Seoul (KST)', offset: '+09:00' },
    { value: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: '+07:00' },
    { value: 'Asia/Jakarta', label: 'Jakarta (WIB)', offset: '+07:00' },
    { value: 'Asia/Karachi', label: 'Pakistan (PKT)', offset: '+05:00' },
    { value: 'Asia/Dhaka', label: 'Bangladesh (BST)', offset: '+06:00' },
    { value: 'Asia/Riyadh', label: 'Saudi Arabia (AST)', offset: '+03:00' },
    // Americas
    { value: 'America/New_York', label: 'New York (EST)', offset: '-05:00' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: '-08:00' },
    { value: 'America/Chicago', label: 'Chicago (CST)', offset: '-06:00' },
    { value: 'America/Denver', label: 'Denver (MST)', offset: '-07:00' },
    { value: 'America/Toronto', label: 'Toronto (EST)', offset: '-05:00' },
    { value: 'America/Vancouver', label: 'Vancouver (PST)', offset: '-08:00' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)', offset: '-03:00' },
    { value: 'America/Mexico_City', label: 'Mexico City (CST)', offset: '-06:00' },
    // Europe
    { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: '+01:00' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)', offset: '+01:00' },
    { value: 'Europe/Madrid', label: 'Madrid (CET)', offset: '+01:00' },
    { value: 'Europe/Rome', label: 'Rome (CET)', offset: '+01:00' },
    { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)', offset: '+03:00' },
    // Oceania
    { value: 'Australia/Sydney', label: 'Sydney (AEST)', offset: '+10:00' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST)', offset: '+10:00' },
    { value: 'Australia/Perth', label: 'Perth (AWST)', offset: '+08:00' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)', offset: '+12:00' },
    // Africa
    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: '+02:00' },
    { value: 'Africa/Cairo', label: 'Cairo (EET)', offset: '+02:00' },
    { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: '+01:00' },
    { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: '+03:00' },
    // UTC
    { value: 'UTC', label: 'UTC', offset: '+00:00' },
  ];
  
  return timezones;
}


/**
 * Detect user location (alias for detectGeoLocation)
 */
export async function detectUserLocation(): Promise<GeoData | null> {
  return detectGeoLocation();
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
    'CNY': '¥', 'AUD': 'A$', 'CAD': 'C$', 'CHF': 'Fr', 'HKD': 'HK$',
    'SGD': 'S$', 'SEK': 'kr', 'KRW': '₩', 'NOK': 'kr', 'NZD': 'NZ$',
    'MXN': '$', 'BRL': 'R$', 'ZAR': 'R', 'AED': 'د.إ', 'SAR': '﷼',
    'THB': '฿', 'MYR': 'RM', 'PHP': '₱', 'IDR': 'Rp', 'VND': '₫',
    'PKR': '₨', 'BDT': '৳', 'LKR': 'Rs', 'NPR': 'Rs', 'EGP': 'E£',
    'NGN': '₦', 'KES': 'KSh', 'ILS': '₪', 'TRY': '₺', 'RUB': '₽',
    'PLN': 'zł', 'DKK': 'kr', 'TWD': 'NT$', 'QAR': 'ر.ق', 'KWD': 'د.ك',
    'BHD': '.د.ب', 'OMR': 'ر.ع.', 'JOD': 'د.ا',
  };
  return symbols[currencyCode] || currencyCode;
}

/**
 * Get price for a plan based on currency
 */
export function getPriceForPlan(planId: string, currency: string): number {
  // Base prices in USD
  const basePrices: Record<string, number> = {
    'starter': 29,
    'professional': 79,
    'business': 199,
    'enterprise': 499,
  };
  
  // Exchange rates (approximate)
  const exchangeRates: Record<string, number> = {
    'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'INR': 83, 'JPY': 149,
    'CNY': 7.24, 'AUD': 1.53, 'CAD': 1.36, 'CHF': 0.88, 'SGD': 1.34,
    'AED': 3.67, 'SAR': 3.75, 'BRL': 4.97, 'MXN': 17.15, 'ZAR': 18.5,
  };
  
  const basePrice = basePrices[planId.toLowerCase()] || 29;
  const rate = exchangeRates[currency] || 1;
  
  return Math.round(basePrice * rate);
}

/**
 * Get price for a plan with billing cycle
 */
export function getPriceForPlanWithBillingCycle(
  planId: string, 
  currency: string, 
  billingCycle: 'monthly' | 'yearly'
): number {
  const monthlyPrice = getPriceForPlan(planId, currency);
  
  if (billingCycle === 'yearly') {
    // 20% discount for yearly
    return Math.round(monthlyPrice * 12 * 0.8);
  }
  
  return monthlyPrice;
}


/**
 * Supported currency type
 */
export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF' | 'SGD' | 'AED' | 'SAR' | 'BRL' | 'MXN' | 'ZAR';
