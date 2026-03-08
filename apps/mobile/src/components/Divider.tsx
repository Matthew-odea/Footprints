/**
 * Divider Component
 * 
 * Subtle separator line for visual structure
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';

export interface DividerProps {
  /** Vertical or horizontal */
  direction?: 'horizontal' | 'vertical';
  /** Additional styles */
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({
  direction = 'horizontal',
  style,
}) => {
  const isHorizontal = direction === 'horizontal';

  return (
    <View
      style={[
        isHorizontal ? styles.horizontal : styles.vertical,
        { borderColor: theme.colors.border },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    borderBottomWidth: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    borderRightWidth: 1,
    height: '100%',
  },
});

export default Divider;
