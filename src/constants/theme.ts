/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1B1A',
    background: '#F6F4F0',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECE8E1',
    textSecondary: '#77726A',
    accent: '#E07B39',
    accentSoft: '#FCEBDD',
    success: '#2F9E5B',
    successSoft: '#DFF3E7',
    partial: '#C99A06',
    partialSoft: '#FBF1D3',
    danger: '#D14343',
    dangerSoft: '#FBE3E3',
    onAccent: '#FFFFFF',
  },
  dark: {
    text: '#F5F3EF',
    background: '#0F0F11',
    backgroundElement: '#1C1C20',
    backgroundSelected: '#2A2A30',
    textSecondary: '#A39E96',
    accent: '#F29A5A',
    accentSoft: '#3A2617',
    success: '#4CC38A',
    successSoft: '#17301F',
    partial: '#F5C542',
    partialSoft: '#352C10',
    danger: '#F16A6A',
    dangerSoft: '#3A1818',
    onAccent: '#141414',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 72 }) ?? 0;
export const MaxContentWidth = 800;
