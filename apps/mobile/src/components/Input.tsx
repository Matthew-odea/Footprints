/**
 * Input Component
 * 
 * Text input field with focus states and consistent styling
 * Supports label, placeholder, error states
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  Text,
  AccessibilityRole,
} from 'react-native';
import { theme } from '@/theme';

export interface InputProps {
  /** Input value */
  value: string;
  /** Callback on text change */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional label above input */
  label?: string;
  /** Optional error message below input */
  error?: string;
  /** Input type */
  secureTextEntry?: boolean;
  /** Keyboard type */
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  /** Multiline input */
  multiline?: boolean;
  /** Maximum characters */
  maxLength?: number;
  /** Additional container styles */
  style?: ViewStyle;
  /** Disable input */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** Callback when focused */
  onFocus?: () => void;
  /** Callback when blurred */
  onBlur?: () => void;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      label,
      error,
      secureTextEntry = false,
      keyboardType = 'default',
      multiline = false,
      maxLength,
      style,
      disabled = false,
      accessibilityLabel,
      accessibilityHint,
      onFocus,
      onBlur,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
      ? theme.colors.error
      : isFocused
        ? theme.colors.primary
        : theme.colors.border;

    return (
      <View style={style}>
        {label && (
          <Text
            style={[
              styles.label,
              theme.typographyStyles.label,
              { color: error ? theme.colors.error : theme.colors.text },
            ]}
          >
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            theme.typographyStyles.body,
            {
              borderColor,
              backgroundColor: disabled ? theme.colors.disabled : theme.colors.surface,
              color: disabled ? theme.colors.textSecondary : theme.colors.text,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              minHeight: multiline ? 100 : 44,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          accessibilityRole="none"
        />
        {error && (
          <Text
            style={[
              styles.error,
              theme.typographyStyles.caption,
              { color: theme.colors.error },
            ]}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderRadius: theme.radius.base,
    borderWidth: 1,
    fontFamily: theme.fontFamily.sans,
  },
  error: {
    marginTop: theme.spacing.xs,
  },
});

export default Input;
