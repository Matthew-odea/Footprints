/**
 * Badge Component
 * 
 * Label tag for categories, status, or metadata
 * Pill-shaped with consistent styling
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';

export interface BadgeProps {
  /** Badge label text */
  label: string;
  /** Background color */
  bgColor?: string;
  /** Text color */
  textColor?: string;
  /** Badge size */
  size?: 'sm' | 'md';
  /** Additional styles */
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  bgColor = theme.colors.secondary,
  textColor = theme.colors.surface,
  size = 'md',
  style,
}) => {
  const sizeStyle = {
    sm: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      fontSize: theme.fontSize.xs,
    },
    md: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.fontSize.sm,
    },
  };

  const config = sizeStyle[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgColor,
          paddingHorizontal: config.paddingHorizontal,
          paddingVertical: config.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: config.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: theme.fontFamily.sans,
    fontWeight: '600',
  },
});

export default Badge;
