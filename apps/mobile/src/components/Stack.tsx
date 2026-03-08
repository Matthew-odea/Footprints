/**
 * Stack Components (VStack, HStack)
 * 
 * Layout primitives using flexbox
 * - VStack: vertical (flex column)
 * - HStack: horizontal (flex row)
 * 
 * Handles alignment, justification, and spacing consistently
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';

interface StackProps {
  /** Stack content */
  children: React.ReactNode;
  /** Gap between items (uses spacing tokens) */
  space?: keyof typeof theme.spacing;
  /** Vertical alignment */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  /** Horizontal alignment (justify content) */
  justify?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  /** Additional styles */
  style?: ViewStyle;
  /** Flex value for responsive sizing */
  flex?: number;
  /** Test ID */
  testID?: string;
}

// ============================================================================
// VStack (Vertical Stack / Column)
// ============================================================================
export const VStack: React.FC<StackProps> = ({
  children,
  space = 'base',
  align = 'stretch',
  justify = 'flex-start',
  style,
  flex,
  testID,
}) => {
  const gap = theme.spacing[space] || theme.spacing.base;

  return (
    <View
      style={[
        styles.vstack,
        {
          gap,
          alignItems: align,
          justifyContent: justify,
          ...(flex && { flex }),
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

// ============================================================================
// HStack (Horizontal Stack / Row)
// ============================================================================
export const HStack: React.FC<StackProps> = ({
  children,
  space = 'base',
  align = 'center',
  justify = 'flex-start',
  style,
  flex,
  testID,
}) => {
  const gap = theme.spacing[space] || theme.spacing.base;

  return (
    <View
      style={[
        styles.hstack,
        {
          gap,
          alignItems: align,
          justifyContent: justify,
          ...(flex && { flex }),
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

// ============================================================================
// Spacer (flexible spacer to push items apart)
// ============================================================================
export const Spacer: React.FC<{ flex?: number }> = ({ flex = 1 }) => (
  <View style={{ flex }} />
);

const styles = StyleSheet.create({
  vstack: {
    flexDirection: 'column',
  },
  hstack: {
    flexDirection: 'row',
  },
});
