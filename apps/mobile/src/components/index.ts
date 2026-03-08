/**
 * Component Library Exports
 * 
 * Foundational UI components for Footprints
 * All components use theme tokens for consistent styling
 * 
 * Usage:
 *   import { Button, Card, VStack, HStack, Heading, Body } from '@/components';
 */

// Layout
export { Button, type ButtonProps } from './Button';
export { Card, type CardProps } from './Card';
export { VStack, HStack, Spacer, type StackProps } from './Stack';

// Typography
export { Title, Heading, Subheading, Body, BodySmall, Label, Caption, CaptionSmall } from './Text';

// Media
export { default as Avatar, type AvatarProps } from './Avatar';

// Feedback & Status
export { default as Badge, type BadgeProps } from './Badge';
export { default as Divider, type DividerProps } from './Divider';
export { default as LoadingSpinner, type LoadingSpinnerProps } from './LoadingSpinner';
export { default as EmptyState, type EmptyStateProps } from './EmptyState';

// Input
export { default as Input, type InputProps } from './Input';
