# Implementation Plan

- [x] 1. Update globals.css token definitions
  - [x] 1.1 Replace :root token block with Clerk-style indigo/violet primary and complete semantic tokens
    - Update primary to indigo/violet (hue ~255-270)
    - Add missing tokens: primary-hover, primary-active, secondary-hover, secondary-active
    - Add status tokens: success, warning, info with muted/foreground/border variants
    - Add destructive-muted, destructive-muted-foreground, destructive-border
    - Fix shadow system conflicts (keep one coherent shadow system)
    - _Requirements: 2.1, 2.4, 3.1, 3.3_
  - [x] 1.2 Replace .dark token block with matching dark theme tokens
    - Ensure primary remains indigo/violet (not white) but brighter
    - Add all status tokens for dark mode
    - Maintain same brand feel as light mode
    - _Requirements: 1.2, 1.3, 2.4_
  - [x] 1.3 Update @theme inline block for Tailwind alpha/opacity support
    - Ensure bg-primary/10, text-foreground/80, border-border/50 work correctly
    - Keep OKLCH format compatible with opacity modifiers
    - _Requirements: 10.1, 10.2_

- [x] 2. Remove hardcoded Tailwind palette colors from globals.css
  - [x] 2.1 Delete/replace .card-gradient-* selectors with token-based equivalents
    - Remove .card-gradient-blue, .card-gradient-green, .card-gradient-purple, .card-gradient-amber, .card-gradient-rose
    - Replace with semantic token-based variants using muted/accent tokens
    - _Requirements: 12.1, 12.2_
  - [x] 2.2 Delete/replace .mobile-badge-* selectors with token-based equivalents
    - Remove .mobile-badge-success, .mobile-badge-warning, .mobile-badge-error
    - Replace with status-muted token variants
    - _Requirements: 12.1, 5.5_

- [x] 3. Update UI components to use semantic tokens





  - [x] 3.1 Update Alert component to use status tokens


    - Replace hardcoded emerald colors with success-muted, success-muted-foreground, success-border
    - Replace hardcoded amber colors with warning-muted, warning-muted-foreground, warning-border
    - Replace hardcoded blue colors with info-muted, info-muted-foreground, info-border
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 12.1_

  - [x] 3.2 Update Badge component to use status tokens

    - Replace hardcoded emerald colors with success-muted, success-muted-foreground
    - Replace hardcoded amber colors with warning-muted, warning-muted-foreground
    - Replace hardcoded blue colors with info-muted, info-muted-foreground
    - Replace hardcoded purple colors with primary-based tokens
    - _Requirements: 5.5, 12.1_

- [x] 4. Update Tailwind configuration





  - [x] 4.1 Add destructive muted/border token mappings


    - Add destructive.muted, destructive.muted-foreground, destructive.border
    - _Requirements: 10.1, 10.3_

- [x] 5. Checkpoint - Verify token system works





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Write property test for token completeness





  - **Property 1: Token Completeness**
  - **Validates: Requirements 2.4**

- [x] 7. Write property test for contrast compliance





  - **Property 3: Text Contrast Compliance**
  - **Validates: Requirements 1.4, 1.5**

- [x] 8. Final Checkpoint - Verify complete implementation





  - Ensure all tests pass, ask the user if questions arise.
