---
name: Urban Epicure AI
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393d'
  surface-container-lowest: '#0c0e11'
  surface-container-low: '#1a1c1f'
  surface-container: '#1e2023'
  surface-container-high: '#282a2d'
  surface-container-highest: '#333538'
  on-surface: '#e2e2e6'
  on-surface-variant: '#e4bebc'
  inverse-surface: '#e2e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#ab8987'
  outline-variant: '#5b403f'
  surface-tint: '#ffb3b1'
  primary: '#ffb3b1'
  on-primary: '#680011'
  primary-container: '#ff535a'
  on-primary-container: '#5b000e'
  inverse-primary: '#bb162c'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#71d7cf'
  on-tertiary: '#003734'
  tertiary-container: '#32a099'
  on-tertiary-container: '#00302d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#8ef4eb'
  tertiary-fixed-dim: '#71d7cf'
  on-tertiary-fixed: '#00201e'
  on-tertiary-fixed-variant: '#00504c'
  background: '#111317'
  on-background: '#e2e2e6'
  surface-variant: '#333538'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system drives a hyper-local, intelligence-driven culinary discovery engine tailored for Bangalore’s discerning dining demographic. The aesthetic fuses data precision with gastronomic warmth: high-contrast dark surfaces evoke late-night urban exploration, while deliberate crimson and amber accents echo authentic flavors and culinary ratings.

### Style Archetype
- **Modern Utilitarian with Warm Accents:** Grounded in a charcoal-dominant dark canvas that reduces visual fatigue while maximizing information density.
- **Tone:** Discerning, direct, reliable, and frictionless. The interface deliberately avoids decorative purple gradients, holographic glows, or faux-cyberpunk gimmicks.
- **Target Audience:** Tech-literate urban diners, food critics, and professionals seeking tailored food and beverage recommendations across Indiranagar, Koramangala, Whitefield, and beyond.

## Colors

The palette relies on deep charcoal substrates layered under elevated slate containers, punctuated by high-signal functional tones.

### Color Distribution & Application
- **Base Canvas (`#0B0D10`):** Default application background, full-height viewport canvas.
- **Surface Elevation 1 (`#14181F`):** Primary cards, list rows, top navigation bar, bottom dock.
- **Surface Elevation 2 (`#1A1F29`):** Interactive card hovers, modal overlays, nested parameter tiles, chat/input blocks.
- **Borders & Dividers (`#2A3140`):** Structural 1px definition lines for surfaces, table lines, and input bounds.
- **Primary Accent (`#E23744`):** Warm dining coral/red. Used exclusively for affirmative calls to action, active tabs, query trigger buttons, and high-confidence AI match badges.
- **Secondary Accent (`#F59E0B`):** Warm amber. Reserved for rating stars, critic accolades, and delivery/wait-time indicators.
- **Content Hierarchy:**
  - **High-Emphasis Text (`#F2F4F8`):** Restful off-white for headings, restaurant titles, and active input values.
  - **Medium-Emphasis Text (`#9AA3B2`):** Muted slate for metadata (neighborhood, distance, cuisine tags, pricing brackets).
  - **Low-Emphasis (`#525C6E`):** Placeholder values, inactive indicators, micro timestamps.

## Typography

Typography establishes an editorial yet engineered rhythm. Headings employ **Plus Jakarta Sans** for modern geometric structure and tight tracking, while descriptive AI outputs and body data rely on **Manrope** for superior legibility across numeric and technical readouts.

### Usage Standards
- Headings display tight letter-spacing (`-0.02em` on sizes above 20px) to command visual hierarchy within compact card formats.
- Body copy uses neutral, relaxed tracking (`0em`) to retain readability in dark environments.
- Labels, tag chips, and ratings use semi-bold and bold weights with tabular numeric layout where numbers are displayed.

## Layout & Spacing

The layout model emphasizes high-density visual scanning and structural clarity, optimized for web apps, desktop dashboards, and mobile responsive containers.

### Grid & Layout Rules
- **Desktop (>= 1024px):** 12-column fluid grid. Content max-width is clamped at 1280px. Gutters are fixed at `gutter-desktop` (1.5rem / 24px) with canvas margins of `margin-desktop` (2rem / 32px).
- **Tablet (768px - 1023px):** 8-column layout. Gutters and canvas margins scale to `1rem` (16px).
- **Mobile (< 768px):** 4-column layout or single-column stack. Margins remain `1rem` (16px) to maximize card width.
- **Rhythm:** Internal component padding prioritizes vertical compactness (`space-sm` for tags, `space-md` for standard cards, `space-lg` for prompt input wells).

## Elevation & Depth

Visual hierarchy uses physical planar layering rather than heavy drop shadows. Depth is achieved via surface-level tone shifts and crisp 1px structural outlines.

### Elevation Hierarchy
- **Level 0 (App Canvas):** `#0B0D10`. Receded base layer.
- **Level 1 (Card & Content Blocks):** `#14181F` background with a continuous `1px solid #2A3140` border. No drop shadow.
- **Level 2 (Popovers, Tooltips, Active Modals):** `#1A1F29` surface, `1px solid #3B4459` border, paired with an ambient shadow: `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.6)`.
- **Level 3 (Floating Action Docks & AI Query Bar):** `#14181F` surface with `1px solid rgba(226, 55, 68, 0.3)` on focus, accompanied by a subtle ambient tinted shadow: `box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.7)`.

## Shapes

The design uses a clean `roundedness: 2` geometry, applying controlled curvature that keeps UI elements looking modern and approachable without turning bubbly or toy-like.

### Token Map
- **Base Elements (Inputs, Buttons, List Items):** `0.5rem` (8px).
- **Surface Panels & Recommendation Cards (`rounded-lg`):** `1rem` (16px).
- **Large Modals & Map Containers (`rounded-xl`):** `1.5rem` (24px).
- **Pills / Tags (Chips, Badges, Filter Buttons):** `9999px` full round for distinct semantic contrast against card edges.

## Components

### Buttons
- **Primary:** Background `#E23744`, text `#FFFFFF`, border none, font `label-lg`, height 40px, padding `0 18px`. Hover: `#C92F3B`. Active: `#B02732`.
- **Secondary / Ghost:** Background `#14181F`, text `#F2F4F8`, border `1px solid #2A3140`. Hover: `#1A1F29` with border `#3B4459`.
- **Icon Action:** 36x36px square with 8px radius, background `#14181F`, icon fill `#9AA3B2`. Hover color shifts to `#F2F4F8`.

### Chips & Filter Tags
- **Default State:** Background `#14181F`, border `1px solid #2A3140`, text `#9AA3B2`, typography `label-md`, pill-shaped (height 28px, padding `0 12px`).
- **Selected State:** Background `rgba(226, 55, 68, 0.15)`, border `1px solid #E23744`, text `#F2F4F8`.
- **Rating Chip:** Amber tint `rgba(245, 158, 11, 0.12)`, border `1px solid rgba(245, 158, 11, 0.35)`, text `#F59E0B`, displaying star icon alongside numeric score in bold `label-sm`.

### Recommendation Cards
- **Structure:** Background `#14181F`, border `1px solid #2A3140`, radius `1rem`, padding `space-md` (12px) to `space-lg` (20px).
- **Content Flow:** 
  1. Top bar: Restaurant name (`headline-sm`) with rating pill aligned to the right.
  2. Sub-bar: Neighborhood string (e.g., "Indiranagar · 1.8 km") and cost indicator (`$$$`) in `body-sm` (`#9AA3B2`).
  3. AI Insight Well: A dedicated `#1A1F29` callout box inside the card with a left edge border of 2px `#E23744`, rendering the AI match rationale in `body-sm`.
  4. Footer: Cuisine tags (pill-shaped) and an actionable order/reserve button.

### Input Fields & AI Prompt Bar
- **Text & Prompt Input:** Background `#14181F`, border `1px solid #2A3140`, radius `0.5rem`, text `#F2F4F8`, placeholder `#525C6E`.
- **Active Focus:** Border transitions to `1px solid #E23744`, no outer glow.
- **Embedded Prompt Trigger:** Right-aligned icon action or button nested within the input container.

### Checkboxes & Radios
- **Control Base:** 18x18px box, background `#14181F`, border `1px solid #2A3140`, radius `4px` (checkbox) or `50%` (radio).
- **Checked State:** Background `#E23744`, border `#E23744`, with white checkmark glyph or center dot.

### Lists & Key-Value Specs
- Table-style lists display horizontal divider borders (`1px solid #2A3140`) without vertical lines. Hovering over a row highlights the background to `#1A1F29`.