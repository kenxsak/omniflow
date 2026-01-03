/**
 * TOTP (Time-based One-Time Password) Library
 * 
 * Implements RFC 6238 for Google Authenticator compatibility
 * Uses Web Crypto API for HMAC-SHA1
 */

// Base32 alphabet for encoding/decoding secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random secret for TOTP
 * Returns a base32-encoded string (20 bytes = 32 characters)
 */
export function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Generate the otpauth:// URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = process.env.NEXT_PUBLIC_APP_NAME || 'Platform'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Verify a TOTP code
 * Allows for 1 time step tolerance (30 seconds before/after)
 */
export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  // Check current time step and ±1 for clock drift tolerance
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor((now + i * timeStep) / timeStep);
    const expectedCode = await generateTOTPCode(secret, counter);
    if (expectedCode === code) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a TOTP code for a given counter
 */
async function generateTOTPCode(secret: string, counter: number): Promise<string> {
  const secretBytes = base32Decode(secret);
  const counterBytes = new Uint8Array(8);
  
  // Convert counter to big-endian bytes
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  // Generate HMAC
  const signature = await crypto.subtle.sign('HMAC', key, counterBytes.buffer as ArrayBuffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Generate 6-digit code
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Base32 encode bytes to string
 */
function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(value >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

/**
 * Base32 decode string to bytes
 */
function base32Decode(str: string): Uint8Array {
  const cleanStr = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleanStr) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}
