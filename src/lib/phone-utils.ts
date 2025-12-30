/**
 * Phone number utility functions
 * Handles normalization and formatting of phone numbers
 */

/**
 * Normalizes a phone number to E.164 format (+countrycode number)
 * Accepts various input formats:
 * - 919876543210 → +919876543210
 * - +919876543210 → +919876543210
 * - 91 9876 543210 → +919876543210
 * - (91) 9876-543210 → +919876543210
 */
export function normalizePhone(phone: string | number | undefined | null): string | undefined {
  if (!phone) return undefined;
  
  // Convert to string and remove all non-digit characters except leading +
  let cleaned = String(phone).trim();
  
  // Remove spaces, dashes, parentheses, dots
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '');
  
  if (!cleaned) return undefined;
  
  // If it's just digits, add + prefix
  if (/^\d+$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  
  // If it doesn't start with +, add it
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/^\+/, '');
  }
  
  // Validate: should be + followed by 7-15 digits
  if (!/^\+\d{7,15}$/.test(cleaned)) {
    return undefined;
  }
  
  return cleaned;
}

/**
 * Formats a phone number for display (adds spaces for readability)
 * +919876543210 → +91 98765 43210
 */
export function formatPhoneForDisplay(phone: string | undefined | null): string {
  if (!phone) return '';
  
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;
  
  // Simple formatting: +CC XXXXX XXXXX
  const digits = normalized.slice(1); // Remove +
  
  if (digits.length <= 10) {
    // Short number: +1 234 567 8901
    return '+' + digits.slice(0, 2) + ' ' + digits.slice(2, 7) + ' ' + digits.slice(7);
  } else {
    // Long number: +91 98765 43210
    return '+' + digits.slice(0, 2) + ' ' + digits.slice(2, 7) + ' ' + digits.slice(7);
  }
}

/**
 * Validates if a phone number is valid
 */
export function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  return normalized !== undefined;
}

/**
 * Extracts country code from a phone number
 * +919876543210 → 91
 */
export function getCountryCode(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  const normalized = normalizePhone(phone);
  if (!normalized) return undefined;
  
  // Common country codes by length
  const digits = normalized.slice(1);
  
  // Check for common 1-digit codes (1 = US/Canada)
  if (digits.startsWith('1') && digits.length === 11) return '1';
  
  // Check for common 2-digit codes (91 = India, 44 = UK, etc.)
  if (digits.length >= 12) return digits.slice(0, 2);
  
  // Default: assume 2-digit country code
  return digits.slice(0, 2);
}
