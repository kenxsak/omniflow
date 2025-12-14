# Design Document: Clerk-Style Design System

## Overview

This design document defines a comprehensive color system redesign for OmniFlow, targeting the Clerk dashboard aesthetic. The system uses semantic design tokens with a disciplined neutral scale and refined indigo/violet primary accent. Both Light and Dark themes share the same brand identity through consistent hue families and visual hierarchy.

## Architecture

The design system follows a layered token architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Layer                          │
│  (Buttons, Cards, Inputs use semantic tokens)               │
├─────────────────────────────────────────────────────────────┤
│                   Semantic Token Layer                      │
│  (--primary, --background, --muted, etc.)                   │
├─────────────────────────────────────────────────────────────┤
│                    Primitive Scale Layer                    │
│  (Neutral 50-950, Indigo 50-900, Status colors)            │
└─────────────────────────────────────────────────────────────┘
```

### Theme Switching

- Light theme: `:root` selector
- Dark theme: `.dark` selector (applied to `<html>` element)
- Tokens automatically resolve to theme-appropriate values

### Tailwind Opacity Support (shadcn Pattern)

All semantic tokens are stored as **raw HSL components** (without the `hsl()` wrapper) to enable Tailwind's opacity modifier syntax:

```css
/* Token definition (raw HSL values) */
--primary: 243 75% 59%;

/* Tailwind usage with opacity */
bg-primary/90  → hsl(243 75% 59% / 0.9)
text-foreground/80 → hsl(var(--foreground) / 0.8)
border-border/50 → hsl(var(--border) / 0.5)
```

## Components and Interfaces

### Token Categories

1. **Surface Tokens**: background, card, popover, surface, surface2
2. **Text Tokens**: foreground, card-foreground, muted-foreground
3. **Interactive Tokens**: primary, secondary, accent, destructive
4. **Utility Tokens**: border, input, ring
5. **Status Tokens**: success, warning, destructive, info (each with muted + border variants)
6. **Sidebar Tokens**: sidebar, sidebar-foreground, sidebar-primary, etc.
7. **Chart Tokens**: chart-1 through chart-5

### Component Token Mapping

| Component | Background | Text | Border | Hover | Active |
|-----------|------------|------|--------|-------|--------|
| Page | background | foreground | - | - | - |
| Card | card | card-foreground | border | - | - |
| Button Primary | primary | primary-foreground | - | primary/90 | primary/80 |
| Button Secondary | secondary | secondary-foreground | border | secondary/80 | secondary/70 |
| Button Ghost | transparent | foreground | - | accent | accent/80 |
| Input | background | foreground | input | - | ring |
| Sidebar | sidebar | sidebar-foreground | sidebar-border | sidebar-accent | sidebar-primary |
| Badge | muted | muted-foreground | - | - | - |

## Data Models

### Palette Definition

#### Neutral Scale (Slate-based, subtle blue undertone)

50 = lightest, 950 = darkest (consistent across themes)

| Step | HSL Value | Usage |
|------|-----------|-------|
| 50 | 210 40% 98% | Lightest backgrounds |
| 100 | 210 40% 96% | Card backgrounds (light) |
| 200 | 214 32% 91% | Borders, dividers (light) |
| 300 | 213 27% 84% | Disabled states |
| 400 | 215 20% 65% | Placeholder text |
| 500 | 215 16% 47% | Muted text |
| 600 | 215 19% 35% | Secondary text |
| 700 | 215 25% 27% | Body text |
| 800 | 217 33% 17% | Headings |
| 900 | 222 47% 11% | Dark backgrounds |
| 950 | 229 84% 5% | Darkest backgrounds |

#### Primary Scale (Indigo/Violet - Clerk-like)

| Step | HSL Value | Usage |
|------|-----------|-------|
| 50 | 226 100% 97% | Subtle primary backgrounds |
| 100 | 226 100% 94% | Light primary tints |
| 200 | 228 96% 89% | Hover backgrounds |
| 300 | 230 94% 82% | Active backgrounds |
| 400 | 234 89% 74% | Light mode ring |
| 500 | 239 84% 67% | Primary accent (dark mode) |
| 600 | 243 75% 59% | Primary accent (light mode) |
| 700 | 245 58% 51% | Pressed states |
| 800 | 244 55% 41% | - |
| 900 | 242 47% 34% | Dark primary |

#### Status Colors (with muted + border tokens)

| Status | Main | Muted BG | Muted Text | Border |
|--------|------|----------|------------|--------|
| Success | 142 71% 45% | 143 76% 95% | 142 71% 29% | 142 69% 70% |
| Warning | 38 92% 50% | 48 96% 93% | 32 95% 35% | 43 96% 60% |
| Destructive | 0 72% 51% | 0 93% 95% | 0 72% 40% | 0 84% 70% |
| Info | 214 82% 51% | 214 95% 95% | 214 82% 40% | 214 82% 70% |

### Surface Hierarchy

| Level | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| background | 210 40% 98% | 222 47% 6% | Page background |
| surface | 0 0% 100% | 217 33% 9% | Cards, panels |
| surface2 | 210 40% 96% | 215 28% 13% | Nested containers |
| popover | 0 0% 100% | 217 33% 11% | Modals, dropdowns |



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Token Completeness
*For any* theme (light or dark), all required semantic tokens SHALL be defined with valid HSL component values.

Required tokens: background, foreground, card, card-foreground, popover, popover-foreground, muted, muted-foreground, border, input, primary, primary-foreground, secondary, secondary-foreground, accent, accent-foreground, destructive, destructive-foreground, destructive-muted, destructive-muted-foreground, destructive-border, ring, success, success-foreground, success-muted, success-muted-foreground, success-border, warning, warning-foreground, warning-muted, warning-muted-foreground, warning-border, info, info-foreground, info-muted, info-muted-foreground, info-border, sidebar, sidebar-foreground, sidebar-primary, sidebar-primary-foreground, sidebar-accent, sidebar-accent-foreground, sidebar-border, sidebar-ring, chart-1, chart-2, chart-3, chart-4, chart-5.

**Validates: Requirements 2.4**

### Property 2: Theme Token Parity
*For any* token defined in the light theme, an equivalent token with the same name SHALL exist in the dark theme.

**Validates: Requirements 1.3**

### Property 3: Text Contrast Compliance
*For any* foreground/background token pair intended for body text, the contrast ratio SHALL be at least 4.5:1 (WCAG AA).

**Validates: Requirements 1.4, 1.5**

### Property 4: Non-text Contrast Compliance
*For any* UI component token (borders, focus rings, icons), the contrast ratio against adjacent backgrounds SHALL be at least 3:1 (WCAG 2.1 1.4.11).

**Validates: Requirements 11.1, 11.2**

### Property 5: Primary Hue Consistency
*For any* primary-related token, the hue value SHALL fall within the indigo/violet range (230-260 degrees) in both light and dark themes.

**Validates: Requirements 3.1, 3.4**

### Property 6: Primary Saturation Bounds
*For any* primary color token, the saturation SHALL be between 50% and 90% to ensure a refined, non-neon appearance.

**Validates: Requirements 3.3**

### Property 7: Surface Hierarchy Progression
*For any* surface level sequence (background → surface → surface2 → popover), the lightness values SHALL progress logically.

**Validates: Requirements 13.1, 13.2**

### Property 8: No Hardcoded Colors
*For any* component file in the codebase, color values SHALL only reference semantic tokens via CSS variables or Tailwind utilities mapped to tokens.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 9: Tailwind Opacity Support
*For any* semantic token, the value SHALL be stored as raw HSL components (e.g., "243 75% 59%") to enable Tailwind opacity modifiers.

**Validates: Requirements 10.1, 10.2**

### Property 10: Chart Color Distinguishability
*For any* pair of chart tokens (chart-1 through chart-5), the colors SHALL be visually distinguishable.

**Validates: Requirements 9.1, 9.2**


## Error Handling

### Invalid Color Values
- If a token value cannot be parsed as valid HSL components, the system should fall back to a safe default
- CSS custom properties with invalid values will be ignored by browsers

### Missing Tokens
- Components should gracefully handle missing tokens by using fallback values
- Build-time validation should catch missing required tokens

## Testing Strategy

### Unit Testing
- Validate CSS variable syntax (raw HSL components format)
- Test Tailwind configuration generates expected utilities with opacity support
- Verify token existence in both theme definitions

### Property-Based Testing
- Use fast-check for TypeScript property-based testing
- Test contrast calculations across all token pairs
- Validate hue/saturation bounds for primary colors

### Accessibility Testing
- Automated WCAG contrast checking with axe-core
- Color blindness simulation testing

---

## Implementation: Semantic Tokens (CSS Variables)

### Light Theme (:root)

```css
:root {
  /* ===== NEUTRAL SCALE (raw HSL components) ===== */
  --neutral-50: 210 40% 98%;
  --neutral-100: 210 40% 96%;
  --neutral-200: 214 32% 91%;
  --neutral-300: 213 27% 84%;
  --neutral-400: 215 20% 65%;
  --neutral-500: 215 16% 47%;
  --neutral-600: 215 19% 35%;
  --neutral-700: 215 25% 27%;
  --neutral-800: 217 33% 17%;
  --neutral-900: 222 47% 11%;
  --neutral-950: 229 84% 5%;

  /* ===== PRIMARY SCALE (Indigo/Violet) ===== */
  --primary-50: 226 100% 97%;
  --primary-100: 226 100% 94%;
  --primary-200: 228 96% 89%;
  --primary-300: 230 94% 82%;
  --primary-400: 234 89% 74%;
  --primary-500: 239 84% 67%;
  --primary-600: 243 75% 59%;
  --primary-700: 245 58% 51%;
  --primary-800: 244 55% 41%;
  --primary-900: 242 47% 34%;

  /* ===== SEMANTIC TOKENS (raw HSL for opacity support) ===== */
  
  /* Backgrounds & Surfaces */
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  
  --surface: 0 0% 100%;
  --surface2: 210 40% 96%;
  
  /* Muted */
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  
  /* Primary (Indigo/Violet accent) */
  --primary: 243 75% 59%;
  --primary-foreground: 0 0% 100%;
  
  /* Secondary */
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  
  /* Accent */
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  
  /* Borders & Inputs */
  --border: 214 32% 91%;
  --border2: 213 27% 84%;
  --input: 214 32% 91%;
  --ring: 243 75% 59%;

  
  /* Destructive (with muted + border) */
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --destructive-muted: 0 93% 95%;
  --destructive-muted-foreground: 0 72% 40%;
  --destructive-border: 0 84% 70%;
  
  /* Success (with muted + border) */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  --success-muted: 143 76% 95%;
  --success-muted-foreground: 142 71% 29%;
  --success-border: 142 69% 70%;
  
  /* Warning (with muted + border) */
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 0%;
  --warning-muted: 48 96% 93%;
  --warning-muted-foreground: 32 95% 35%;
  --warning-border: 43 96% 60%;
  
  /* Info (with muted + border) */
  --info: 214 82% 51%;
  --info-foreground: 0 0% 100%;
  --info-muted: 214 95% 95%;
  --info-muted-foreground: 214 82% 40%;
  --info-border: 214 82% 70%;
  
  /* Sidebar */
  --sidebar: 0 0% 100%;
  --sidebar-foreground: 215 25% 27%;
  --sidebar-primary: 243 75% 59%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 210 40% 96%;
  --sidebar-accent-foreground: 222 47% 11%;
  --sidebar-border: 214 32% 91%;
  --sidebar-ring: 243 75% 59%;
  
  /* Charts (Professional, non-neon) */
  --chart-1: 243 75% 59%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  
  /* Radius */
  --radius: 0.5rem;
}
```

### Dark Theme (.dark)

```css
.dark {
  /* ===== SEMANTIC TOKENS (Dark - raw HSL) ===== */
  
  /* Backgrounds & Surfaces */
  --background: 222 47% 6%;
  --foreground: 210 40% 98%;
  
  --card: 217 33% 9%;
  --card-foreground: 210 40% 98%;
  
  --popover: 217 33% 11%;
  --popover-foreground: 210 40% 98%;
  
  --surface: 217 33% 9%;
  --surface2: 215 28% 13%;

  
  /* Muted */
  --muted: 215 28% 13%;
  --muted-foreground: 215 20% 65%;
  
  /* Primary (lighter for dark mode) */
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
  
  /* Secondary */
  --secondary: 215 28% 17%;
  --secondary-foreground: 210 40% 98%;
  
  /* Accent */
  --accent: 215 28% 17%;
  --accent-foreground: 210 40% 98%;
  
  /* Borders & Inputs */
  --border: 215 28% 17%;
  --border2: 215 25% 22%;
  --input: 215 28% 17%;
  --ring: 234 89% 74%;
  
  /* Destructive (Dark - with muted + border) */
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --destructive-muted: 0 63% 12%;
  --destructive-muted-foreground: 0 84% 60%;
  --destructive-border: 0 62% 35%;
  
  /* Success (Dark - with muted + border) */
  --success: 142 69% 58%;
  --success-foreground: 144 61% 8%;
  --success-muted: 144 61% 12%;
  --success-muted-foreground: 142 69% 58%;
  --success-border: 142 50% 30%;
  
  /* Warning (Dark - with muted + border) */
  --warning: 43 96% 58%;
  --warning-foreground: 32 81% 8%;
  --warning-muted: 32 81% 12%;
  --warning-muted-foreground: 43 96% 58%;
  --warning-border: 43 70% 35%;
  
  /* Info (Dark - with muted + border) */
  --info: 214 82% 65%;
  --info-foreground: 215 61% 8%;
  --info-muted: 215 61% 12%;
  --info-muted-foreground: 214 82% 65%;
  --info-border: 214 60% 35%;
  
  /* Sidebar */
  --sidebar: 222 47% 6%;
  --sidebar-foreground: 215 20% 65%;
  --sidebar-primary: 239 84% 67%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 215 28% 13%;
  --sidebar-accent-foreground: 210 40% 98%;
  --sidebar-border: 215 28% 17%;
  --sidebar-ring: 234 89% 74%;
  
  /* Charts (Dark mode adjusted) */
  --chart-1: 234 89% 74%;
  --chart-2: 173 58% 50%;
  --chart-3: 197 50% 45%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
}
```

---

## Component Usage Map

### App Background / Page Sections

```css
/* Page background */
.page { background: hsl(var(--background)); color: hsl(var(--foreground)); }

/* Content sections */
.section { background: hsl(var(--surface)); }

/* Nested containers (box-in-box) */
.nested { background: hsl(var(--surface2)); border: 1px solid hsl(var(--border)); }
```

### Cards / Modals / Popovers

```css
/* Standard card */
.card {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

/* Modal/Dialog */
.modal {
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  border: 1px solid hsl(var(--border));
}
```


### Sidebar + Navigation

```css
/* Sidebar container */
.sidebar {
  background: hsl(var(--sidebar));
  color: hsl(var(--sidebar-foreground));
  border-right: 1px solid hsl(var(--sidebar-border));
}

/* Nav item - active (Clerk-style: subtle primary tint) */
.nav-item.active {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--sidebar-primary));
}
```

### Buttons

```css
/* Primary button */
.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
.btn-primary:hover { background: hsl(var(--primary) / 0.9); }

/* Secondary button */
.btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border: 1px solid hsl(var(--border));
}

/* Destructive button */
.btn-destructive {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}
```

### Inputs

```css
/* Input field */
.input {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--input));
}

.input::placeholder { color: hsl(var(--muted-foreground)); }

.input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.input.error { border-color: hsl(var(--destructive)); }
```

### Badges / Status Pills (ALL using tokens - no hardcoded colors)

```css
/* Default badge */
.badge {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

/* Status badges - ALL using semantic tokens */
.badge-success { 
  background: hsl(var(--success-muted)); 
  color: hsl(var(--success-muted-foreground)); 
}
.badge-warning { 
  background: hsl(var(--warning-muted)); 
  color: hsl(var(--warning-muted-foreground)); 
}
.badge-destructive { 
  background: hsl(var(--destructive-muted)); 
  color: hsl(var(--destructive-muted-foreground)); 
}
.badge-info { 
  background: hsl(var(--info-muted)); 
  color: hsl(var(--info-muted-foreground)); 
}

/* Primary badge (for active/selected states) */
.badge-primary { 
  background: hsl(var(--primary) / 0.1); 
  color: hsl(var(--primary)); 
}
```

### Alerts / Notice Bars (ALL using tokens - no hardcoded colors)

```css
.alert { border-radius: var(--radius); padding: 1rem; }

.alert-info { 
  background: hsl(var(--info-muted)); 
  color: hsl(var(--info-muted-foreground)); 
  border: 1px solid hsl(var(--info-border)); 
}
.alert-success { 
  background: hsl(var(--success-muted)); 
  color: hsl(var(--success-muted-foreground)); 
  border: 1px solid hsl(var(--success-border)); 
}
.alert-warning { 
  background: hsl(var(--warning-muted)); 
  color: hsl(var(--warning-muted-foreground)); 
  border: 1px solid hsl(var(--warning-border)); 
}
.alert-destructive { 
  background: hsl(var(--destructive-muted)); 
  color: hsl(var(--destructive-muted-foreground)); 
  border: 1px solid hsl(var(--destructive-border)); 
}
```

### Tables

```css
.table { border: 1px solid hsl(var(--border)); }
.table th { background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); }
.table td { border-top: 1px solid hsl(var(--border)); }
.table tr:hover { background: hsl(var(--accent)); }
```


---

## Tailwind Configuration (with opacity support)

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // All colors use hsl() with <alpha-value> for opacity support
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          muted: "hsl(var(--destructive-muted) / <alpha-value>)",
          "muted-foreground": "hsl(var(--destructive-muted-foreground) / <alpha-value>)",
          border: "hsl(var(--destructive-border) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
          muted: "hsl(var(--success-muted) / <alpha-value>)",
          "muted-foreground": "hsl(var(--success-muted-foreground) / <alpha-value>)",
          border: "hsl(var(--success-border) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
          muted: "hsl(var(--warning-muted) / <alpha-value>)",
          "muted-foreground": "hsl(var(--warning-muted-foreground) / <alpha-value>)",
          border: "hsl(var(--warning-border) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground) / <alpha-value>)",
          muted: "hsl(var(--info-muted) / <alpha-value>)",
          "muted-foreground": "hsl(var(--info-muted-foreground) / <alpha-value>)",
          border: "hsl(var(--info-border) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        surface: {
          DEFAULT: "hsl(var(--surface) / <alpha-value>)",
          2: "hsl(var(--surface2) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          primary: "hsl(var(--sidebar-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
        },
        chart: {
          1: "hsl(var(--chart-1) / <alpha-value>)",
          2: "hsl(var(--chart-2) / <alpha-value>)",
          3: "hsl(var(--chart-3) / <alpha-value>)",
          4: "hsl(var(--chart-4) / <alpha-value>)",
          5: "hsl(var(--chart-5) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```


---

## Implementation Examples

### Example 1: Primary Button (with opacity support)

```tsx
// bg-primary/90 works because tokens are raw HSL components
<button className="bg-primary text-primary-foreground hover:bg-primary/90 
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
  focus-visible:ring-offset-2 rounded-md px-4 py-2 font-medium">
  Save Changes
</button>
```

### Example 2: Card with Nested Surface

```tsx
<div className="bg-card text-card-foreground border border-border rounded-lg p-6">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-muted-foreground mt-2">Card description.</p>
  
  {/* Box-in-box pattern using surface2 */}
  <div className="bg-surface-2 border border-border rounded-md p-4 mt-4">
    <p className="text-sm">Nested content area</p>
  </div>
</div>
```

### Example 3: Sidebar Active Item (Clerk-style)

```tsx
<nav className="bg-sidebar border-r border-sidebar-border p-2">
  <a href="/dashboard" 
     className="flex items-center gap-3 px-3 py-2 rounded-md
       text-sidebar-foreground hover:bg-sidebar-accent
       data-[active=true]:bg-primary/10 data-[active=true]:text-sidebar-primary"
     data-active="true">
    <HomeIcon className="h-4 w-4" />
    Dashboard
  </a>
</nav>
```

### Example 4: Status Badges (using token-only colors)

```tsx
// All status colors use semantic tokens - no hardcoded values
<span className="bg-success-muted text-success-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium">
  Completed
</span>

<span className="bg-warning-muted text-warning-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium">
  Pending
</span>

<span className="bg-destructive-muted text-destructive-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium">
  Failed
</span>

<span className="bg-info-muted text-info-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium">
  Scheduled
</span>
```

### Example 5: Alert with Border Token

```tsx
// Alert using all semantic tokens including border
<div className="bg-warning-muted text-warning-muted-foreground border border-warning-border rounded-lg p-4">
  <p className="font-medium">Warning</p>
  <p className="text-sm mt-1">This action cannot be undone.</p>
</div>
```

---

## Migration Checklist

1. **Update globals.css**
   - Replace all token values with raw HSL components (remove `hsl()` wrapper)
   - Add new tokens: destructive-muted, destructive-muted-foreground, destructive-border
   - Add new tokens: success-border, warning-border, info-border
   - Ensure both `:root` and `.dark` have all tokens

2. **Update tailwind.config.ts**
   - Change all color mappings to use `hsl(var(--token) / <alpha-value>)` pattern
   - Add destructive.muted, destructive.muted-foreground, destructive.border
   - Add border variants for success, warning, info

3. **Search and Replace Hardcoded Colors**
   - Search for: `#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`
   - Replace with appropriate semantic token references
   - Pay special attention to badge and alert components

4. **Update Component Files**
   - Badge component: replace hardcoded destructive colors with tokens
   - Alert component: replace hardcoded border colors with tokens
   - Ensure all status variants use -muted, -muted-foreground, -border tokens

5. **Validate**
   - Test opacity modifiers work: `bg-primary/90`, `text-foreground/80`
   - Run accessibility audit for contrast compliance
   - Test theme switching
