/**
 * Text Components
 * 
 * Semantic text components for typography hierarchy
 * Enforces consistent text styling across the app
 * 
 * Composed hierarchy:
 * - Title (24pt, serif, bold) - Page titles, hero content
 * - Heading (18pt, serif, bold) - Section headings
 * - Subheading (18pt, sans, semibold) - Secondary headings
 * - Body (16pt, sans, regular) - Primary content
 * - BodySmall (14pt, sans, regular) - Secondary content
 * - Label (14pt, sans, semibold) - Form labels, captions
 * - Caption (12pt, sans, regular) - Meta information, timestamps
 */

import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { theme } from '@/theme';

interface TextComponentProps {
  /** Text content */
  children: string | React.ReactNode;
  /** Text color */
  color?: string;
  /** Align text */
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  /** Number of lines to show */
  numberOfLines?: number;
  /** Additional styles */
  style?: TextStyle;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// Title (24pt, serif, bold)
// ============================================================================
export const Title: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.text,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      styles.title,
      theme.typographyStyles.pageTitle,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// Heading (18pt, serif, bold)
// ============================================================================
export const Heading: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.text,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.heading,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// Subheading (18pt, sans, semibold)
// ============================================================================
export const Subheading: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.text,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.subheading,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// Body (16pt, sans, regular)
// ============================================================================
export const Body: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.text,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.body,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// BodySmall (14pt, sans, regular)
// ============================================================================
export const BodySmall: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.textSecondary,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.bodySmall,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// Label (14pt, sans, semibold)
// ============================================================================
export const Label: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.text,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.label,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// Caption (12pt, sans, regular)
// ============================================================================
export const Caption: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.textSecondary,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.caption,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

// ============================================================================
// CaptionSmall (12pt, sans, regular, tight)
// ============================================================================
export const CaptionSmall: React.FC<TextComponentProps> = ({
  children,
  color = theme.colors.textSecondary,
  align = 'left',
  numberOfLines,
  style,
  testID,
}) => (
  <RNText
    style={[
      theme.typographyStyles.captionSmall,
      { color, textAlign: align },
      style,
    ]}
    numberOfLines={numberOfLines}
    testID={testID}
  >
    {children}
  </RNText>
);

const styles = StyleSheet.create({
  title: {
    // Applies theme.typographyStyles.pageTitle
  },
});
