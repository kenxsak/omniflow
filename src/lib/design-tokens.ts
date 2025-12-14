/**
 * Design Token Definitions for Clerk-Style Design System
 * 
 * This module defines the required semantic tokens that must be present
 * in both light and dark themes for the design system to be complete.
 */

/**
 * Required semantic tokens as defined in the design document.
 * These tokens must be present in both :root (light) and .dark themes.
 * 
 * **Feature: clerk-design-system, Property 1: Token Completeness**
 * **Validates: Requirements 2.4**
 */
export const REQUIRED_TOKENS = [
  // Core backgrounds & surfaces
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  
  // Muted
  'muted',
  'muted-foreground',
  
  // Primary
  'primary',
  'primary-foreground',
  
  // Secondary
  'secondary',
  'secondary-foreground',
  
  // Accent
  'accent',
  'accent-foreground',
  
  // Borders & Inputs
  'border',
  'input',
  'ring',
  
  // Destructive (with muted + border variants)
  'destructive',
  'destructive-foreground',
  'destructive-muted',
  'destructive-muted-foreground',
  'destructive-border',
  
  // Success (with muted + border variants)
  'success',
  'success-foreground',
  'success-muted',
  'success-muted-foreground',
  'success-border',
  
  // Warning (with muted + border variants)
  'warning',
  'warning-foreground',
  'warning-muted',
  'warning-muted-foreground',
  'warning-border',
  
  // Info (with muted + border variants)
  'info',
  'info-foreground',
  'info-muted',
  'info-muted-foreground',
  'info-border',
  
  // Sidebar
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  
  // Charts
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
] as const;

export type RequiredToken = typeof REQUIRED_TOKENS[number];

/**
 * Regex pattern to match OKLCH color values
 * Format: oklch(L C H) or oklch(L C H / alpha)
 */
export const OKLCH_PATTERN = /oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+)?\s*\)/;

/**
 * Regex pattern to match HSL color values (raw components format)
 * Format: H S% L% (without hsl() wrapper for Tailwind opacity support)
 */
export const HSL_RAW_PATTERN = /^\d+\s+\d+%\s+\d+%$/;

/**
 * Validates that a token value is a valid color format (OKLCH or HSL raw)
 */
export function isValidColorValue(value: string): boolean {
  const trimmed = value.trim();
  return OKLCH_PATTERN.test(trimmed) || HSL_RAW_PATTERN.test(trimmed);
}

/**
 * Parses CSS content and extracts token definitions from a selector block
 */
export function extractTokensFromCSS(cssContent: string, selector: ':root' | '.dark'): Map<string, string> {
  const tokens = new Map<string, string>();
  
  // Find the selector block - using [\s\S] instead of . with s flag for compatibility
  const selectorRegex = selector === ':root' 
    ? /:root\s*\{([\s\S]*?)\}(?=\s*(?:\.|@|$))/
    : /\.dark\s*\{([\s\S]*?)\}(?=\s*(?:\.|@|$))/;
  
  const match = cssContent.match(selectorRegex);
  if (!match) return tokens;
  
  const blockContent = match[1];
  
  // Extract CSS custom properties (--token-name: value)
  const propertyRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let propMatch;
  
  while ((propMatch = propertyRegex.exec(blockContent)) !== null) {
    const tokenName = propMatch[1];
    const tokenValue = propMatch[2].trim();
    tokens.set(tokenName, tokenValue);
  }
  
  return tokens;
}

/**
 * Checks if all required tokens are present in a token map
 */
export function getMissingTokens(tokens: Map<string, string>): string[] {
  return REQUIRED_TOKENS.filter(token => !tokens.has(token));
}

/**
 * Checks if all tokens have valid color values
 */
export function getInvalidTokens(tokens: Map<string, string>): Array<{ token: string; value: string }> {
  const invalid: Array<{ token: string; value: string }> = [];
  
  for (const requiredToken of REQUIRED_TOKENS) {
    const value = tokens.get(requiredToken);
    if (value && !isValidColorValue(value)) {
      invalid.push({ token: requiredToken, value });
    }
  }
  
  return invalid;
}

/**
 * Foreground/Background token pairs for body text contrast testing
 * These pairs must meet WCAG AA 4.5:1 contrast ratio
 * 
 * **Feature: clerk-design-system, Property 3: Text Contrast Compliance**
 * **Validates: Requirements 1.4, 1.5**
 */
export const BODY_TEXT_PAIRS: Array<{ foreground: string; background: string; description: string }> = [
  { foreground: 'foreground', background: 'background', description: 'Main page text' },
  { foreground: 'card-foreground', background: 'card', description: 'Card text' },
  { foreground: 'popover-foreground', background: 'popover', description: 'Popover text' },
  { foreground: 'muted-foreground', background: 'muted', description: 'Muted text on muted bg' },
  { foreground: 'muted-foreground', background: 'background', description: 'Muted text on page bg' },
  { foreground: 'primary-foreground', background: 'primary', description: 'Primary button text' },
  { foreground: 'secondary-foreground', background: 'secondary', description: 'Secondary button text' },
  { foreground: 'accent-foreground', background: 'accent', description: 'Accent text' },
  { foreground: 'destructive-foreground', background: 'destructive', description: 'Destructive button text' },
  { foreground: 'destructive-muted-foreground', background: 'destructive-muted', description: 'Destructive muted text' },
  { foreground: 'success-foreground', background: 'success', description: 'Success button text' },
  { foreground: 'success-muted-foreground', background: 'success-muted', description: 'Success muted text' },
  { foreground: 'warning-foreground', background: 'warning', description: 'Warning button text' },
  { foreground: 'warning-muted-foreground', background: 'warning-muted', description: 'Warning muted text' },
  { foreground: 'info-foreground', background: 'info', description: 'Info button text' },
  { foreground: 'info-muted-foreground', background: 'info-muted', description: 'Info muted text' },
  { foreground: 'sidebar-foreground', background: 'sidebar', description: 'Sidebar text' },
  { foreground: 'sidebar-primary-foreground', background: 'sidebar-primary', description: 'Sidebar primary text' },
  { foreground: 'sidebar-accent-foreground', background: 'sidebar-accent', description: 'Sidebar accent text' },
];

/**
 * Parse OKLCH color string to components
 * Format: oklch(L C H) or oklch(L C H / alpha)
 */
export function parseOklch(value: string): { l: number; c: number; h: number; alpha?: number } | null {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/);
  if (!match) return null;
  
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    alpha: match[4] ? parseFloat(match[4]) : undefined,
  };
}

/**
 * Convert OKLCH to approximate sRGB for contrast calculation
 * This is a simplified conversion - for production, use a proper color library
 * 
 * Based on the OKLCH to sRGB conversion algorithm
 */
export function oklchToSrgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  // Convert hue to radians
  const hRad = (h * Math.PI) / 180;
  
  // OKLCH to OKLab
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  
  // OKLab to linear sRGB (approximate)
  // Using the inverse of the OKLab matrix
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  
  // Linear sRGB
  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
  
  // Clamp to [0, 1]
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bVal = Math.max(0, Math.min(1, bVal));
  
  return { r, g, b: bVal };
}

/**
 * Calculate relative luminance for sRGB color
 * Per WCAG 2.1 definition
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculate WCAG contrast ratio between two colors
 * Returns a value >= 1 (higher is better contrast)
 */
export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate contrast ratio between two OKLCH color strings
 */
export function calculateOklchContrast(color1: string, color2: string): number | null {
  const oklch1 = parseOklch(color1);
  const oklch2 = parseOklch(color2);
  
  if (!oklch1 || !oklch2) return null;
  
  const rgb1 = oklchToSrgb(oklch1.l, oklch1.c, oklch1.h);
  const rgb2 = oklchToSrgb(oklch2.l, oklch2.c, oklch2.h);
  
  const lum1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  return contrastRatio(lum1, lum2);
}

/**
 * WCAG AA minimum contrast ratios
 */
export const WCAG_AA_BODY_TEXT = 4.5;
export const WCAG_AA_LARGE_TEXT = 3.0;
export const WCAG_AA_UI_COMPONENTS = 3.0;
