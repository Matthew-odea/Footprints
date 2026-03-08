/**
 * Theme System
 * 
 * Central export of all design tokens for Footprints
 * Use these throughout the app instead of hardcoded values
 * 
 * Import example:
 *   import { theme } from '@/theme';
 *   const { colors, spacing, typography } = theme;
 */

export * from './colors';
export * from './typography';
export * from './spacing';

import { colors, semanticColors } from './colors';
import {
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  fontFamily,
  typographyStyles,
} from './typography';
import { spacing, padding, margin, radius, shadows } from './spacing';

/**
 * Unified theme object containing all design tokens
 * Organize by category for easy discovery and use
 */
export const theme = {
  colors,
  semanticColors,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  fontFamily,
  typographyStyles,
  spacing,
  padding,
  margin,
  radius,
  shadows,
} as const;

export default theme;

/**
 * Quick reference of most-used tokens
 * Print this in your head when building:
 * 
 * Colors:
 *   - Primary action: colors.primary (terracotta)
 *   - Secondary action: colors.secondary (sage)
 *   - Celebration: colors.accent (coral)
 *   - Text: colors.text (charcoal) / colors.textSecondary (gray)
 *   - Background: colors.background (cream)
 * 
 * Spacing (8px scale):
 *   - Inside cards: spacing.base (16px)
 *   - Between sections: spacing.lg (24px)
 *   - Small gaps: spacing.sm (8px)
 * 
 * Typography:
 *   - Headlines: typographyStyles.pageTitle / .heading (serif, bold)
 *   - Body: typographyStyles.body (sans, regular)
 *   - Labels: typographyStyles.label (sans, semibold)
 * 
 * Borders & Shadows:
 *   - Card radius: radius.base (8px)
 *   - Card shadow: shadows.subtle
 *   - Modal: radius.md (12px), shadows.elevated
 */
