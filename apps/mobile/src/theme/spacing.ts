/**
 * Spacing Tokens
 * 
 * Base 8px scale for consistent, predictable spacing
 * Breathing room over tightness - spacing should feel inviting
 */

export const spacing = {
  /** 4px - Micro spacing (rarely used, internal component adjustments) */
  xs: 4,
  /** 8px - Small spacing (internal component padding, tight groups) */
  sm: 8,
  /** 12px - Medium-small spacing (card internal spacing) */
  md: 12,
  /** 16px - Medium spacing (primary padding, between inline elements) */
  base: 16,
  /** 24px - Large spacing (between sections, vertical breathing) */
  lg: 24,
  /** 32px - Extra large spacing (major section breaks) */
  xl: 32,
  /** 48px - Double extra large spacing (screen-level breaks) */
  '2xl': 48,
  /** 64px - Quad spacing (rarely used, major vertical gaps) */
  '3xl': 64,
} as const;

/**
 * Padding presets for common component patterns
 */
export const padding = {
  // Card padding
  card: spacing.base,
  cardSmall: spacing.md,
  cardLarge: spacing.lg,

  // Screen padding
  screenVertical: spacing.base,
  screenHorizontal: spacing.base,

  // Button padding
  button: spacing.base,
  buttonSmall: spacing.sm,
  buttonLarge: spacing.lg,

  // Input padding
  input: spacing.md,
} as const;

/**
 * Margin presets for common spacing patterns
 */
export const margin = {
  // Section spacing (vertical)
  sectionTop: spacing.lg,
  sectionBottom: spacing.lg,
  sectionMargin: spacing.lg,

  // Card spacing
  cardMargin: spacing.base,
  cardMarginBottom: spacing.lg,

  // Component spacing
  componentBottom: spacing.md,

  // Between inline elements
  elementGap: spacing.sm,
} as const;

/**
 * Border radius scale for consistent curved corners
 * Balances modern (curved) with sophisticated (subtle radius)
 */
export const radius = {
  /** 4px - Subtle rounding (inputs, small buttons) */
  sm: 4,
  /** 8px - Standard rounding (cards, buttons) */
  base: 8,
  /** 12px - Medium rounding (larger cards, modal corners) */
  md: 12,
  /** 24px - Large rounding (pills, avatar circles, large buttons) */
  lg: 24,
  /** 999 - Fully rounded (circles, pill buttons, badges) */
  full: 999,
} as const;

/**
 * Shadow definitions for depth hierarchy
 * Three levels: subtle, medium, elevated
 */
export const shadows = {
  // Subtle shadow (cards, light emphasis)
  subtle: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  // Medium shadow (containers, secondary emphasis)
  medium: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  // Elevated shadow (modals, overlays, primary emphasis)
  elevated: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },

  // No shadow
  none: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type Padding = keyof typeof padding;
export type Margin = keyof typeof margin;
export type Radius = keyof typeof radius;
export type ShadowLevel = keyof typeof shadows;
