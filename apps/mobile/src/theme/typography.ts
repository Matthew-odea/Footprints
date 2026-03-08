/**
 * Typography Tokens
 * 
 * Font sizes, weights, and families for Footprints
 * Warm serif headlines (personal, journalistic) + clean sans body (modern, readable)
 * Minimum 12pt for accessibility on mobile (5.4" baseline)
 */

export const fontSize = {
  /** 12pt - Captions, metadata, small labels */
  xs: 12,
  /** 14pt - Secondary text, helper text */
  sm: 14,
  /** 16pt - Body text, primary content (minimum readable size) */
  base: 16,
  /** 18pt - Section headings, subheadings */
  lg: 18,
  /** 20pt - Card titles, larger headings */
  xl: 20,
  /** 24pt - Page titles, prominent headlines */
  '2xl': 24,
  /** 32pt - Hero titles, screen headers (rarely used) */
  '3xl': 32,
} as const;

export const fontWeight = {
  /** 400 - Regular text, body content */
  regular: '400' as const,
  /** 600 - Semibold, medium emphasis, some headings */
  semibold: '600' as const,
  /** 700 - Bold, strong emphasis, primary headings */
  bold: '700' as const,
} as const;

export const lineHeight = {
  /** 1.2 - Tight line height for headlines (warm, journalistic) */
  tight: 1.2,
  /** 1.5 - Normal line height for body text (readable, professional) */
  normal: 1.5,
  /** 1.75 - Relaxed line height for long-form text or accessibility */
  relaxed: 1.75,
} as const;

export const letterSpacing = {
  /** Tight letter spacing (rarely used, default omitted) */
  tight: -0.4,
  /** Normal letter spacing (default) */
  normal: 0,
  /** Wide letter spacing for emphasis (rarely used) */
  wide: 0.5,
} as const;

export const fontFamily = {
  /** Serif font for headlines - warm, personal, journalistic feel */
  serif: 'Georgia, Garamond, serif',
  /** Sans font for body - modern, clean, readable */
  sans: 'InterVariable, Inter, system-ui, -apple-system, sans-serif',
} as const;

/**
 * Pre-composed typography styles for common use cases
 * Includes size, weight, line height, letter spacing
 */
export const typographyStyles = {
  // Headings - Serif
  pageTitle: {
    fontSize: fontSize['2xl'],
    fontFamily: fontFamily.serif,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  heading: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.serif,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
  },
  subheading: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },

  // Body - Sans
  body: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },

  // Labels & Captions
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },
  captionSmall: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.tight,
  },

  // Buttons
  buttonPrimary: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
  buttonSmall: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.sans,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
  },
} as const;

export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypographyStyle = keyof typeof typographyStyles;
