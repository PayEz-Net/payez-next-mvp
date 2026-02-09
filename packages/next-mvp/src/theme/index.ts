/**
 * Theme Module for @payez/next-mvp
 *
 * Main export for the theme system. Provides:
 * - ThemeProvider component
 * - Theme hooks (useTheme, useBranding, useColors, etc.)
 * - TypeScript types for theme configuration
 * - Default theme
 */

export { ThemeProvider } from './ThemeProvider';
export type { ThemeProviderProps } from './ThemeProvider';

export {
  useTheme,
  useBranding,
  useColors,
  useTypography,
  useLayout,
  useComponentTheme,
} from './useTheme';

export type {
  ThemeConfig,
  LoginPageTheme,
  ProfilePageTheme,
  RecoveryPageTheme,
} from './types';

export { defaultTheme } from './default';
export { mergeDeep } from './utils';
