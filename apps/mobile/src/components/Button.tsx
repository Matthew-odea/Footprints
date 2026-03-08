/**
 * Button Component
 * 
 * Primary interactive element with multiple variants
 * Variants: primary, secondary, outline
 * Sizes: sm, md, lg
 * States: default, disabled, loading
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  AccessibilityRole,
} from 'react-native';
import { theme } from '@/theme';

export interface ButtonProps {
  /** Button label text */
  label: string;
  /** Callback when pressed */
  onPress: () => void;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disable button interaction */
  disabled?: boolean;
  /** Show loading spinner and disable */
  loading?: boolean;
  /** Optional icon or element before label */
  leftElement?: React.ReactNode;
  /** Optional icon or element after label */
  rightElement?: React.ReactNode;
  /** Flex value for responsive sizing */
  flex?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

const Button = React.forwardRef<any, ButtonProps>(
  (
    {
      label,
      onPress,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      leftElement,
      rightElement,
      flex,
      style,
      accessibilityLabel,
      accessibilityHint,
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const buttonStyle = getButtonStyle(variant, size, isDisabled);
    const textStyle = getTextStyle(variant, size);

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          buttonStyle,
          pressed && !isDisabled && styles.pressed,
          flex && { flex },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <ActivityIndicator
            size={size === 'sm' ? 'small' : 'small'}
            color={getLoaderColor(variant)}
          />
        ) : (
          <>
            {leftElement}
            <Text style={[styles.text, textStyle]} numberOfLines={1}>
              {label}
            </Text>
            {rightElement}
          </>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

function getButtonStyle(
  variant: ButtonProps['variant'],
  size: ButtonProps['size'],
  disabled: boolean
) {
  const baseSize = {
    sm: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.sm,
      minHeight: 32,
    },
    md: {
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.base,
      minHeight: 44,
    },
    lg: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      minHeight: 52,
    },
  };

  const baseVariant = {
    primary: {
      backgroundColor: disabled ? theme.colors.disabled : theme.colors.primary,
    },
    secondary: {
      backgroundColor: disabled ? theme.colors.disabled : theme.colors.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: disabled ? theme.colors.disabled : theme.colors.primary,
    },
  };

  return [baseSize[size || 'md'], baseVariant[variant || 'primary']];
}

function getTextStyle(variant: ButtonProps['variant'], size: ButtonProps['size']) {
  const variantStyle = {
    primary: { color: theme.colors.surface },
    secondary: { color: theme.colors.surface },
    outline: { color: theme.colors.primary },
  };

  const sizeStyle = {
    sm: theme.typographyStyles.buttonSmall,
    md: theme.typographyStyles.buttonPrimary,
    lg: theme.typographyStyles.buttonPrimary,
  };

  return [variantStyle[variant || 'primary'], sizeStyle[size || 'md']];
}

function getLoaderColor(variant: ButtonProps['variant']) {
  return variant === 'outline' ? theme.colors.primary : theme.colors.surface;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

export default Button;
