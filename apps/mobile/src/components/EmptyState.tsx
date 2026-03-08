/**
 * EmptyState Component
 * 
 * Friendly "nothing to show" pattern with icon, message, and CTA
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';
import { Heading, Body, Caption } from './Text';
import Button, { ButtonProps } from './Button';

export interface EmptyStateProps {
  /** Icon or emoji (e.g., "🚀") */
  icon?: string;
  /** Main heading */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Call-to-action button */
  action?: Omit<ButtonProps, 'onPress'> & { onPress: () => void };
  /** Additional styles */
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📦',
  title,
  subtitle,
  action,
  style,
}) => {
  return (
    <View style={ [styles.container, style] }>
      <View style={styles.content}>
        {icon && (
          <Heading
            style={styles.icon}
            color={theme.colors.textSecondary}
          >
            {icon}
          </Heading>
        )}

        <Heading
          color={theme.colors.text}
          align="center"
          style={styles.title}
        >
          {title}
        </Heading>

        {subtitle && (
          <Caption
            color={theme.colors.textSecondary}
            align="center"
            style={styles.subtitle}
          >
            {subtitle}
          </Caption>
        )}

        {action && (
          <Button
            {...action}
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.base,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    minWidth: 140,
    marginTop: theme.spacing.md,
  },
});

export default EmptyState;
