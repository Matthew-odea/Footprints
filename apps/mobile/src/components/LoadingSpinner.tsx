/**
 * LoadingSpinner Component
 * 
 * Centered loading indicator
 * Used when fetching data
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';
import { Caption } from './Text';

export interface LoadingSpinnerProps {
  /** Loading message or subtitle */
  message?: string;
  /** Spinner color */
  color?: string;
  /** Spinner size */
  size?: 'small' | 'large';
  /** Fill available space */
  fullScreen?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  color = theme.colors.primary,
  size = 'large',
  fullScreen = true,
  style,
}) => {
  return (
    <View
      style={[
        fullScreen && styles.fullScreen,
        styles.container,
        style,
      ]}
    >
      <ActivityIndicator
        size={size}
        color={color}
        style={styles.spinner}
      />
      {message && (
        <Caption
          color={theme.colors.textSecondary}
          style={{ marginTop: theme.spacing.md }}
        >
          {message}
        </Caption>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  spinner: {
    // ActivityIndicator styles applied via props
  },
});

export default LoadingSpinner;
