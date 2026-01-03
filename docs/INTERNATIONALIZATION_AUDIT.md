# OmniFlow Internationalization (i18n) Audit & Roadmap

## Executive Summary

This document audits OmniFlow's internationalization capabilities against industry leaders (HubSpot, Salesforce, Zoho, Freshworks) and provides a roadmap for achieving global standards.

---

## Current State Assessment

### ✅ What's Working Well

| Feature | Status | Implementation |
|---------|--------|----------------|
| Currency detection by country | ✅ Done | `getCurrencyByCountry()` in `currency-converter.ts` |
| Currency formatting | ✅ Done | `Intl.NumberFormat` with locale support |
| Indian numbering (lakhs/crores) | ✅ Done | Using `en-IN` locale |
| Multi-currency deals | ✅ Done | Deals store their own currency |
| Payment gateways | ✅ Done | Stripe (global) + Razorpay (India) |
| Company timezone field | ✅ Done | `timezone` field in Company type |
| Exchange rates | ✅ Done | API with 24hr cache + fallback rates |
| **Geo-detection on signup** | ✅ Done | `useGeoDetection()` hook with IP geolocation |
| **Locale context** | ✅ Done | `LocaleProvider` with timezone-aware formatting |
| **Auto-fill country on signup** | ✅ Done | Country selector with auto-detection |
| **Timezone-aware date formatting** | ✅ Done | `useLocale()` hook with `date-fns-tz` |

### ❌ Remaining Gaps

| Feature | Priority | Status | Industry Standard |
|---------|----------|--------|-------------------|
| Timezone-aware email scheduling | HIGH | ⚠️ Partial | Send at recipient's local time |
| Phone number auto-formatting | MEDIUM | ⚠️ Partial | libphonenumber integration |
| Multi-language UI | LOW | ❌ Missing | i18n framework (next-intl) |
| RTL support | LOW | ❌ Missing | Arabic, Hebrew markets |

---

## Recently Implemented Features

### 1. Geo-Detection System (✅ Complete)

**Files Created:**
- `src/lib/geo-detection.ts` - IP geolocation with country/timezone/currency detection
- `src/hooks/use-geo-detection.ts` - React hook for auto-detecting user location
- `src/contexts/locale-context.tsx` - Timezone-aware date/time formatting

**Features:**
- Auto-detects country, timezone, currency, and calling code from IP
- Uses multiple free APIs with fallbacks (ipapi.co, ip-api.com)
- Falls back to browser timezone if APIs fail
- Caches results in sessionStorage for 24 hours

### 2. Signup Page Integration (✅ Complete)

**Changes:**
- Country selector with auto-detection
- Stores geo data in sessionStorage for onboarding pickup
- Shows "Auto-detected from your location" indicator

### 3. Onboarding Locale Setup (✅ Complete)

**Changes:**
- Auto-sets company locale (country, timezone, currency) during onboarding
- Uses signup geo data or fresh geo-detection
- `setupCompanyLocaleAction()` server action for secure updates

### 4. Locale Context Provider (✅ Complete)

**Features:**
- `formatDate()` - Locale-aware date formatting (DD/MM vs MM/DD)
- `formatTime()` - Timezone-aware time formatting
- `formatDateTime()` - Combined date/time formatting
- `formatRelative()` - "2 hours ago" style formatting
- `formatNumber()` - Locale-aware number formatting
- `formatCompact()` - Indian lakhs/crores notation
- `toUserTimezone()` / `toUTC()` - Timezone conversion utilities

---

## Detailed Gap Analysis

### 1. Currency Management

#### Current Implementation
```typescript
// ✅ Good - Using Intl.NumberFormat
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
```

#### Missing Features
- [ ] **Multi-currency invoices** - Invoice should store currency, not just amount
- [ ] **Currency conversion in reports** - Show totals in company's base currency
- [ ] **Historical exchange rates** - For accurate reporting on past transactions

#### Recommendation
```typescript
// Store currency with every monetary value
interface Invoice {
  amount: number;
  currency: string;        // 'INR', 'USD', etc.
  amountInBaseCurrency: number;  // Converted to company's base currency
  exchangeRateUsed: number;      // Rate at time of creation
}
```

---

### 2. Timezone Management

#### Current State
- Company has `timezone` field but it's not consistently used
- Dates display in browser's local timezone
- Email scheduling doesn't consider recipient timezone

#### Industry Standard (HubSpot/Salesforce)
1. **User-level timezone** - Each user can set their preferred timezone
2. **Display conversion** - All timestamps shown in user's timezone
3. **Smart scheduling** - "Send at 9 AM recipient's time"
4. **Timezone-aware analytics** - Reports respect timezone

#### Implementation Roadmap

**Phase 1: Display Timezone (Quick Win)**
```typescript
// Create a timezone context similar to currency
interface TimezoneContextType {
  timezone: string;
  formatDateTime: (date: Date | string) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  toUserTimezone: (utcDate: Date) => Date;
  toUTC: (localDate: Date) => Date;
}
```

**Phase 2: Email Scheduling**
```typescript
// Smart send options
interface EmailScheduleOptions {
  sendAt: 'immediate' | 'scheduled' | 'optimal';
  scheduledTime?: Date;  // UTC
  sendInRecipientTimezone?: boolean;  // Send at X AM their time
  recipientLocalTime?: string;  // "09:00"
}
```

---

### 3. Number & Decimal Formatting

#### Regional Differences
| Region | Number Format | Currency Format |
|--------|--------------|-----------------|
| India | 1,00,00,000.50 | ₹1,00,00,000.50 |
| USA | 10,000,000.50 | $10,000,000.50 |
| Germany | 10.000.000,50 | 10.000.000,50 € |
| France | 10 000 000,50 | 10 000 000,50 € |

#### Current Implementation
✅ Using `Intl.NumberFormat` which handles this automatically when correct locale is passed.

#### Gap
- Not all number displays use the formatting function
- Some places have hardcoded `.toFixed(2)`

#### Fix Required
Audit all number displays and ensure they use:
```typescript
const { formatCurrency } = useCurrency();
const formatNumber = (num: number) => new Intl.NumberFormat(locale).format(num);
```

---

### 4. Geo-location & Auto-detection

#### Industry Standard Flow
```
User visits signup page
    ↓
IP Geolocation API called (ipapi.co, ipinfo.io)
    ↓
Auto-detect: Country, Timezone, Currency
    ↓
Pre-fill: Country dropdown, Phone code, Currency
    ↓
User can override if needed
```

#### Implementation Plan

**Option 1: Client-side (Free)**
```typescript
// Using free IP geolocation
async function detectUserLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return {
      country: data.country_name,
      countryCode: data.country_code,
      timezone: data.timezone,
      currency: data.currency,
      callingCode: data.country_calling_code,
    };
  } catch {
    return null; // Fallback to manual selection
  }
}
```

**Option 2: Server-side (More Reliable)**
```typescript
// In middleware.ts or API route
import { geolocation } from '@vercel/functions';

export function middleware(request: NextRequest) {
  const geo = geolocation(request);
  // geo.country, geo.city, geo.region
}
```

---

### 5. Date Format Localization

#### Regional Preferences
| Region | Date Format | Example |
|--------|-------------|---------|
| India | DD/MM/YYYY | 25/12/2024 |
| USA | MM/DD/YYYY | 12/25/2024 |
| Japan | YYYY/MM/DD | 2024/12/25 |
| Germany | DD.MM.YYYY | 25.12.2024 |

#### Implementation
```typescript
// Add to LocaleContext
const formatDate = (date: Date, style: 'short' | 'medium' | 'long' = 'medium') => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: style,
  }).format(date);
};

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
```

---

## Priority Implementation Roadmap

### Phase 1: Quick Wins (✅ COMPLETE)
- [x] Add geo-detection on signup page
- [x] Create `useLocale()` hook with timezone support
- [x] Create `LocaleProvider` context
- [x] Add timezone selector in company settings
- [x] Auto-setup company locale during onboarding
- [x] Update activity timeline to use locale formatting

### Phase 2: Core Features (In Progress)
- [ ] Timezone-aware email scheduling
- [ ] Multi-currency invoice support
- [ ] Date format preferences in user settings
- [ ] Phone number formatting with libphonenumber
- [ ] Update all date displays across the app to use `useLocale()`

### Phase 3: Advanced (2-4 weeks)
- [ ] Send emails at recipient's local time
- [ ] Currency conversion in analytics/reports
- [ ] Historical exchange rate tracking
- [ ] Multi-language UI (next-intl)

---

## Competitor Comparison

| Feature | OmniFlow | HubSpot | Zoho | Freshworks |
|---------|----------|---------|------|------------|
| Auto-detect country | ✅ | ✅ | ✅ | ✅ |
| Multi-currency | ✅ | ✅ | ✅ | ✅ |
| Timezone per user | ✅ | ✅ | ✅ | ✅ |
| Smart email timing | ⚠️ | ✅ | ✅ | ⚠️ |
| Date format options | ✅ | ✅ | ✅ | ✅ |
| Indian numbering | ✅ | ✅ | ✅ | ✅ |
| Razorpay integration | ✅ | ❌ | ✅ | ✅ |
| Multi-language | ❌ | ✅ | ✅ | ✅ |
| RTL support | ❌ | ✅ | ✅ | ⚠️ |

---

## India-Specific Compliance

### GST Requirements
- [ ] GSTIN field in company profile
- [ ] GST-compliant invoice format
- [ ] HSN/SAC codes for services
- [ ] State-wise GST (CGST/SGST/IGST)

### RBI Compliance (for payments)
- [x] Razorpay integration (RBI compliant)
- [ ] Two-factor authentication for payments
- [ ] Transaction limits display

### Data Localization
- [ ] Option to store data in India region (Firebase Mumbai)
- [ ] Data residency compliance documentation

---

## Recommended Tech Stack

| Purpose | Recommended Library |
|---------|-------------------|
| Date/Time | `date-fns` + `date-fns-tz` |
| Phone Numbers | `libphonenumber-js` |
| Currency | `Intl.NumberFormat` (native) |
| i18n | `next-intl` or `react-i18next` |
| Geo Detection | `@vercel/functions` or `ipapi.co` |

---

## Next Steps

1. **Immediate**: Implement geo-detection on signup
2. **This Week**: Create timezone context and fix date displays
3. **This Month**: Add timezone-aware email scheduling
4. **Q1 2026**: Multi-language support

