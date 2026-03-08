/**
 * Avatar Component
 * 
 * Circular profile image with initials fallback
 * Used for user representation throughout the app
 */

import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
import { theme } from '@/theme';

export interface AvatarProps {
  /** URL to user image */
  imageUrl?: string;
  /** Fallback: full name for initials (e.g., "Alice Brown" -> "AB") */
  name?: string;
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Background color for initials fallback */
  bgColor?: string;
  /** Text color for initials */
  textColor?: string;
  /** Additional styles */
  style?: ViewStyle;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name = 'User',
  size = 'md',
  bgColor = theme.colors.primary,
  textColor = theme.colors.surface,
  style,
  accessibilityLabel,
}) => {
  const sizeConfig = {
    sm: { width: 32, height: 32, fontSize: 12 },
    md: { width: 48, height: 48, fontSize: 14 },
    lg: { width: 64, height: 64, fontSize: 16 },
    xl: { width: 80, height: 80, fontSize: 18 },
  };

  const config = sizeConfig[size];
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: config.width,
          height: config.height,
          borderRadius: config.width / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
      accessible
      accessibilityLabel={accessibilityLabel || `Avatar for ${name}`}
      accessibilityRole="image"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: config.width / 2 },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: config.fontSize,
              color: textColor,
              fontWeight: '700',
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

/**
 * Extract initials from name (e.g., "Alice Brown" -> "AB")
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: theme.fontFamily.sans,
  },
});

export default Avatar;
