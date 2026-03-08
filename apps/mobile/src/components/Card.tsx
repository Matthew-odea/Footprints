/**
 * Card Component
 * 
 * Surface container with consistent padding, shadow, and border radius
 * Used throughout the app for grouped content
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable, GestureResponderEvent } from 'react-native';
import { theme } from '@/theme';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Depth shadow level */
  shadow?: 'none' | 'subtle' | 'medium' | 'elevated';
  /** Callback when card is pressed */
  onPress?: (event: GestureResponderEvent) => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const Card = React.forwardRef<any, CardProps>(
  (
    {
      children,
      padding = 'md',
      shadow = 'subtle',
      onPress,
      style,
      testID,
    },
    ref
  ) => {
    const paddingValue = {
      sm: theme.padding.cardSmall,
      md: theme.padding.card,
      lg: theme.padding.cardLarge,
    }[padding];

    const shadowStyle = theme.shadows[shadow];

    const CardView = onPress ? Pressable : View;

    return (
      <CardView
        ref={ref}
        style={({ pressed }) => [
          styles.card,
          {
            padding: paddingValue,
            ...shadowStyle,
          },
          pressed && onPress && styles.cardPressed,
          style,
        ]}
        onPress={onPress}
        testID={testID}
      >
        {children}
      </CardView>
    );
  }
);

Card.displayName = 'Card';

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.base,
  },
  cardPressed: {
    opacity: 0.95,
  },
});

export default Card;
