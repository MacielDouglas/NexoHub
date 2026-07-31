/**
 * Nexohub theme — light only, banking-grade fintech feel.
 * Primary: tech blue #2563EB · Secondary: innovation purple #7C3AED
 * Background: #e2e8f0 · Foreground: #1F2937
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F2937',
    background: '#e2e8f0',
    backgroundElement: '#ffffff',
    backgroundSelected: '#eff2f7',
    textSecondary: '#64748B',
    primary: '#2563EB',
    primaryForeground: '#ffffff',
    secondary: '#7C3AED',
    secondaryForeground: '#ffffff',
    border: '#cbd5e1',
    danger: '#DC2626',
    success: '#16A34A',
  },
  dark: {
    text: '#1F2937',
    background: '#e2e8f0',
    backgroundElement: '#ffffff',
    backgroundSelected: '#eff2f7',
    textSecondary: '#64748B',
    primary: '#2563EB',
    primaryForeground: '#ffffff',
    secondary: '#7C3AED',
    secondaryForeground: '#ffffff',
    border: '#cbd5e1',
    danger: '#DC2626',
    success: '#16A34A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
