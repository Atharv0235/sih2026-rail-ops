---
name: Pristine Rail Operations
colors:
  surface: '#f4fbf6'
  surface-dim: '#d4dcd7'
  surface-bright: '#f4fbf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5f0'
  surface-container: '#e8f0ea'
  surface-container-high: '#e2eae5'
  surface-container-highest: '#dde4df'
  on-surface: '#161d1a'
  on-surface-variant: '#3c4a44'
  inverse-surface: '#2b322f'
  inverse-on-surface: '#ebf3ed'
  outline: '#6c7a74'
  outline-variant: '#bbcac2'
  surface-tint: '#006b54'
  primary: '#006b54'
  on-primary: '#ffffff'
  primary-container: '#14c9a0'
  on-primary-container: '#004e3d'
  inverse-primary: '#3edeb4'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#585e70'
  on-tertiary: '#ffffff'
  tertiary-container: '#acb2c6'
  on-tertiary-container: '#3e4455'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#63fbcf'
  primary-fixed-dim: '#3edeb4'
  on-primary-fixed: '#002118'
  on-primary-fixed-variant: '#00513f'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#dce2f7'
  tertiary-fixed-dim: '#c0c6db'
  on-tertiary-fixed: '#151b2a'
  on-tertiary-fixed-variant: '#404657'
  background: '#f4fbf6'
  on-background: '#161d1a'
  surface-variant: '#dde4df'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-padding: 24px
  gutter: 16px
---

## Brand & Style

The design system is engineered for **RAIL-OPS**, a modern railway management platform. The brand personality is efficient, high-integrity, and serene, aimed at operations managers who require clarity amidst complex data. 

The aesthetic follows a **Modern SaaS/Corporate** style with a focus on "Pristine" utility. It utilizes heavy whitespace and soft, rounded containers to reduce the cognitive load of dense logistical information. The visual mood is professional yet approachable, utilizing a "Mint Teal" primary accent to signify movement, safety, and a fresh departure from legacy industrial software.

## Colors

This design system utilizes a high-clarity, light-mode-first palette. The **Mint Teal** (#14C9A0) serves as the primary action color, used for CTA buttons, active navigation states, and success indicators. 

- **Primary:** Mint Teal for interaction and brand presence.
- **Surface:** Pure White (#FFFFFF) for cards and modals to pop against the light gray background.
- **Neutral/Text:** Charcoal (#111827) for high-contrast headings; Slate (#5C6274) for secondary metadata and body descriptions.
- **Semantic:** Use Mint-based tints (e.g., #E8FAF5) for background washes on badges or active list items.

## Typography

The system utilizes **Geist** for its technical precision and modern character. The type scale is designed to handle hierarchical data common in CRM environments. 

- **Headings:** Use bold weights and tight letter-spacing for a modern, "Swiss" feel.
- **Body:** Standardized at 16px for readability, with 14px used for dense data tables.
- **Labels:** Uppercase or semi-bold labels are used for metadata headers and small pill text to ensure legibility at small scales.
- **Hierarchy:** Maintain clear vertical rhythm by ensuring line heights are consistently 1.25x to 1.5x the font size.

## Layout & Spacing

The design system employs a **Fixed-Fluid hybrid grid**. Sidebars and navigation elements remain fixed, while the central workspace expands. 

- **The 8px Rule:** All spacing, margins, and paddings must be multiples of 8px (or 4px for tight internal component spacing).
- **Desktop:** 12-column grid with 24px margins.
- **Content Density:** Maintain wide internal paddings within cards (24px to 32px) to preserve the "Pristine" SaaS aesthetic. 
- **Reflow:** On mobile, the sidebar collapses into a bottom navigation bar or a hamburger menu, and card horizontal padding reduces to 16px.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** supplemented by **Ambient Shadows**.

- **Level 0 (Background):** #F8F9FA.
- **Level 1 (Cards/Surfaces):** #FFFFFF with a very soft shadow: `0px 4px 20px rgba(0, 0, 0, 0.03)`.
- **Level 2 (Active/Hover):** When a card or element is interacted with, the shadow intensifies slightly to `0px 8px 30px rgba(0, 0, 0, 0.06)` to simulate lift.
- **Outlines:** Use a 1px border of #E5E7EB for cards to define boundaries clearly without relying solely on shadows, maintaining a clean, "architectural" feel.

## Shapes

The design system is defined by its generous **20px corner radius** on all primary containers and cards. This creates a soft, approachable silhouette that balances the technical nature of railway operations.

- **Standard Components:** Buttons and input fields use a slightly tighter radius (8px to 12px) for a focused look.
- **Status Badges:** Always use the "Pill" shape (full radius) to distinguish them from interactive buttons.
- **Images/Avatars:** Use circles for user profiles and the 20px radius for asset thumbnails.

## Components

### Buttons & Inputs
- **Primary Button:** Mint Teal background, white text, 12px radius. High-affordance, subtle hover lift.
- **Secondary Button:** White background with #E5E7EB border, Charcoal text.
- **Input Fields:** 1px #E5E7EB border, 12px padding. Focus state uses a 2px Mint Teal ring with 10% opacity.

### Badges & Status
- **Pill Badges:** Used for status (e.g., "Active," "Delayed"). Background is 10% opacity of the semantic color (Mint for success, Amber for caution) with 100% opacity text.

### Cards
- **Main Surface:** 20px corner radius, white background, 1px subtle border. Internal padding should be a minimum of 24px.

### Navigation
- **Active State:** Navigation items use a Mint Teal vertical bar (4px wide) on the left and a light Mint background wash (#E8FAF5) to indicate selection.

### Tables
- **Pristine Table:** No vertical lines. 1px horizontal #F3F4F6 separators. Header row in Slate (#5C6274) with `label-md` typography.