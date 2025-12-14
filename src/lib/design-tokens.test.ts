/**
 * Property-Based Tests for Design Token Completeness
 * 
 * **Feature: clerk-design-system, Property 1: Token Completeness**
 * **Validates: Requirements 2.4**
 * 
 * This test verifies that all required semantic tokens are defined
 * with valid OKLCH color values in both light and dark themes.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import {
  REQUIRED_TOKENS,
  extractTokensFromCSS,
  getMissingTokens,
  isValidColorValue,
  BODY_TEXT_PAIRS,
  calculateOklchContrast,
  WCAG_AA_BODY_TEXT,
} from './design-tokens';

// Load the globals.css content once
let cssContent: string;
let lightTokens: Map<string, string>;
let darkTokens: Map<string, string>;

beforeAll(() => {
  const cssPath = path.join(process.cwd(), 'src/app/globals.css');
  cssContent = fs.readFileSync(cssPath, 'utf-8');
  lightTokens = extractTokensFromCSS(cssContent, ':root');
  darkTokens = extractTokensFromCSS(cssContent, '.dark');
});

describe('Design Token Completeness - Property 1', () => {
  /**
   * **Feature: clerk-design-system, Property 1: Token Completeness**
   * **Validates: Requirements 2.4**
   * 
   * Property: For any theme (light or dark), all required semantic tokens
   * SHALL be defined with valid OKLCH color values.
   */
  describe('Property 1: Token Completeness', () => {
    it('should have all required tokens defined in light theme (:root)', () => {
      const missingTokens = getMissingTokens(lightTokens);
      
      expect(missingTokens).toEqual([]);
    });

    it('should have all required tokens defined in dark theme (.dark)', () => {
      const missingTokens = getMissingTokens(darkTokens);
      
      expect(missingTokens).toEqual([]);
    });

    /**
     * Property-based test: For any required token selected at random,
     * that token should exist in both light and dark themes.
     */
    it('property: any required token should exist in both themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...REQUIRED_TOKENS),
          (token) => {
            const existsInLight = lightTokens.has(token);
            const existsInDark = darkTokens.has(token);
            
            return existsInLight && existsInDark;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property-based test: For any required token, its value should be
     * a valid OKLCH color format.
     */
    it('property: any required token should have valid OKLCH color value in light theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...REQUIRED_TOKENS),
          (token) => {
            const value = lightTokens.get(token);
            if (!value) return false; // Token must exist
            return isValidColorValue(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: any required token should have valid OKLCH color value in dark theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...REQUIRED_TOKENS),
          (token) => {
            const value = darkTokens.get(token);
            if (!value) return false; // Token must exist
            return isValidColorValue(value);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Token Value Validation', () => {
    it('should recognize valid OKLCH color values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: Math.fround(1), noNaN: true }),
          fc.float({ min: 0, max: Math.fround(0.4), noNaN: true }),
          fc.integer({ min: 0, max: 360 }),
          (l, c, h) => {
            const oklchValue = `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h})`;
            return isValidColorValue(oklchValue);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should recognize valid OKLCH color values with alpha', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: Math.fround(1), noNaN: true }),
          fc.float({ min: 0, max: Math.fround(0.4), noNaN: true }),
          fc.integer({ min: 0, max: 360 }),
          fc.float({ min: 0, max: Math.fround(1), noNaN: true }),
          (l, c, h, a) => {
            const oklchValue = `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h} / ${a.toFixed(2)})`;
            return isValidColorValue(oklchValue);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Completeness Summary', () => {
    it('should have the expected number of required tokens', () => {
      // This ensures we're testing against the full list from the design doc
      expect(REQUIRED_TOKENS.length).toBeGreaterThanOrEqual(45);
    });

    it('should report all tokens present in both themes', () => {
      const lightMissing = getMissingTokens(lightTokens);
      const darkMissing = getMissingTokens(darkTokens);
      
      console.log(`Light theme tokens found: ${lightTokens.size}`);
      console.log(`Dark theme tokens found: ${darkTokens.size}`);
      
      if (lightMissing.length > 0) {
        console.log(`Missing in light theme: ${lightMissing.join(', ')}`);
      }
      if (darkMissing.length > 0) {
        console.log(`Missing in dark theme: ${darkMissing.join(', ')}`);
      }
      
      expect(lightMissing.length).toBe(0);
      expect(darkMissing.length).toBe(0);
    });
  });
});

/**
 * Property-Based Tests for Text Contrast Compliance
 * 
 * **Feature: clerk-design-system, Property 3: Text Contrast Compliance**
 * **Validates: Requirements 1.4, 1.5**
 * 
 * This test verifies that all foreground/background token pairs intended
 * for body text meet WCAG AA contrast requirements (4.5:1 minimum).
 */
describe('Text Contrast Compliance - Property 3', () => {
  /**
   * **Feature: clerk-design-system, Property 3: Text Contrast Compliance**
   * **Validates: Requirements 1.4, 1.5**
   * 
   * Property: For any foreground/background token pair intended for body text,
   * the contrast ratio SHALL be at least 4.5:1 (WCAG AA).
   */
  describe('Property 3: Text Contrast Compliance', () => {
    /**
     * Property-based test: For any body text token pair selected at random,
     * the contrast ratio should meet WCAG AA requirements (4.5:1).
     */
    it('property: any body text token pair should meet WCAG AA contrast (4.5:1) in light theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...BODY_TEXT_PAIRS),
          (pair) => {
            const fgValue = lightTokens.get(pair.foreground);
            const bgValue = lightTokens.get(pair.background);
            
            // Skip if tokens don't exist (covered by completeness test)
            if (!fgValue || !bgValue) return true;
            
            const contrast = calculateOklchContrast(fgValue, bgValue);
            
            // Skip if contrast calculation fails (invalid color format)
            if (contrast === null) return true;
            
            // WCAG AA requires 4.5:1 for body text
            return contrast >= WCAG_AA_BODY_TEXT;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: any body text token pair should meet WCAG AA contrast (4.5:1) in dark theme', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...BODY_TEXT_PAIRS),
          (pair) => {
            const fgValue = darkTokens.get(pair.foreground);
            const bgValue = darkTokens.get(pair.background);
            
            // Skip if tokens don't exist (covered by completeness test)
            if (!fgValue || !bgValue) return true;
            
            const contrast = calculateOklchContrast(fgValue, bgValue);
            
            // Skip if contrast calculation fails (invalid color format)
            if (contrast === null) return true;
            
            // WCAG AA requires 4.5:1 for body text
            return contrast >= WCAG_AA_BODY_TEXT;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Detailed test that reports all contrast ratios for debugging
     */
    it('should report contrast ratios for all body text pairs in light theme', () => {
      const results: Array<{ pair: string; contrast: number | null; passes: boolean }> = [];
      
      for (const pair of BODY_TEXT_PAIRS) {
        const fgValue = lightTokens.get(pair.foreground);
        const bgValue = lightTokens.get(pair.background);
        
        if (!fgValue || !bgValue) {
          results.push({ pair: pair.description, contrast: null, passes: false });
          continue;
        }
        
        const contrast = calculateOklchContrast(fgValue, bgValue);
        const passes = contrast !== null && contrast >= WCAG_AA_BODY_TEXT;
        results.push({ pair: pair.description, contrast, passes });
      }
      
      // Log results for debugging
      console.log('\nLight Theme Contrast Ratios:');
      for (const result of results) {
        const status = result.passes ? '✓' : '✗';
        const contrastStr = result.contrast !== null ? result.contrast.toFixed(2) : 'N/A';
        console.log(`  ${status} ${result.pair}: ${contrastStr}:1 (need ${WCAG_AA_BODY_TEXT}:1)`);
      }
      
      const failures = results.filter(r => !r.passes);
      expect(failures).toEqual([]);
    });

    it('should report contrast ratios for all body text pairs in dark theme', () => {
      const results: Array<{ pair: string; contrast: number | null; passes: boolean }> = [];
      
      for (const pair of BODY_TEXT_PAIRS) {
        const fgValue = darkTokens.get(pair.foreground);
        const bgValue = darkTokens.get(pair.background);
        
        if (!fgValue || !bgValue) {
          results.push({ pair: pair.description, contrast: null, passes: false });
          continue;
        }
        
        const contrast = calculateOklchContrast(fgValue, bgValue);
        const passes = contrast !== null && contrast >= WCAG_AA_BODY_TEXT;
        results.push({ pair: pair.description, contrast, passes });
      }
      
      // Log results for debugging
      console.log('\nDark Theme Contrast Ratios:');
      for (const result of results) {
        const status = result.passes ? '✓' : '✗';
        const contrastStr = result.contrast !== null ? result.contrast.toFixed(2) : 'N/A';
        console.log(`  ${status} ${result.pair}: ${contrastStr}:1 (need ${WCAG_AA_BODY_TEXT}:1)`);
      }
      
      const failures = results.filter(r => !r.passes);
      expect(failures).toEqual([]);
    });
  });
});
