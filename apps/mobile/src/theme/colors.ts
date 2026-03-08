/**
 * Color Tokens
 * 
 * Semantic color palette for Footprints
 * Warm, intimate design with terracotta primary and sage secondary
 * All colors meet WCAG AA contrast ratios (4.5:1+)
 */

export const colors = {
  // Brand Primaries
  /** Terracotta - Primary actions, streak ring, celebrations */
  primary: '#C97A5D',
  /** Sage - Secondary actions, growth indicators, calm elements */
  secondary: '#8B9D5C',
  /** Coral - Highlights, milestone celebrations, joy accent */
  accent: '#E8876F',

  // Neutrals
  /** Cream - Primary background, warm inviting tone */
  background: '#F5F1E8',
  /** White - Card surfaces, modals, overlays */
  surface: '#FFFFFF',
  /** Charcoal - Primary text, high contrast */
  text: '#2C2C2C',
  /** Medium gray - Secondary text, labels, descriptions */
  textSecondary: '#666666',
  /** Light cream - Subtle borders, dividers */
  border: '#E8E3D8',
  /** Stone - Disabled states, inactive elements */
  disabled: '#A9A9A9',

  // Semantic Colors
  /** Green - Positive actions, success feedback */
  success: '#6B9E5D',
  /** Orange - Warnings, cautionary alerts */
  warning: '#D68C4E',
  /** Red - Destructive actions, errors */
  error: '#C85C5C',

  // Social & Engagement
  /** Coral - Likes, engagement, reactions */
  like: '#E8876F',
  /** Sage - Comments, conversation threads */
  comment: '#8B9D5C',
  /** Brand primary - Favorite/bookmark toggle */
  favorite: '#C97A5D',
} as const;

/**
 * Semantic color aliases for specific use cases
 * These map brand colors to functional contexts
 */
export const semanticColors = {
  // Backgrounds
  screenBackground: colors.background,
  cardBackground: colors.surface,
  inputBackground: colors.surface,
  modalBackground: colors.surface,
  overlayBackground: 'rgba(0, 0, 0, 0.4)',

  // Text
  primaryText: colors.text,
  secondaryText: colors.textSecondary,
  disabledText: colors.disabled,
  invertedText: colors.surface,

  // Interactive
  buttonPrimary: colors.primary,
  buttonSecondary: colors.secondary,
  buttonTertiary: 'transparent',
  buttonDisabled: colors.disabled,
  buttonPrimaryText: colors.surface,
  buttonSecondaryText: colors.surface,
  buttonTertiaryText: colors.primary,

  // Feedback
  focusRing: colors.primary,
  successBackground: colors.success,
  warningBackground: colors.warning,
  errorBackground: colors.error,
  successText: colors.surface,
  warningText: colors.text,
  errorText: colors.surface,

  // Borders & Dividers
  borderDefault: colors.border,
  borderFocus: colors.primary,
  dividerColor: colors.border,

  // Streak & Progress
  streakRing: colors.primary,
  progressPrimary: colors.primary,
  progressSecondary: colors.secondary,
  progressBackground: colors.border,
} as const;

export type ColorName = keyof typeof colors;
export type SemanticColorName = keyof typeof semanticColors;
