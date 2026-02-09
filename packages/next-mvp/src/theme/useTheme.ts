/**
 * Theme Hooks for @payez/next-mvp
 *
 * Convenience hooks for accessing specific parts of the theme configuration.
 * These hooks can only be used within components wrapped by ThemeProvider.
 */

'use client';

import { useTheme as useThemeContext } from './ThemeProvider';

/**
 * Access the full theme configuration
 */
export function useTheme() {
  return useThemeContext();
}

/**
 * Access branding configuration (logo, app name, tagline)
 */
export function useBranding() {
  const theme = useThemeContext();
  return theme.branding;
}

/**
 * Access color configuration
 */
export function useColors() {
  const theme = useThemeContext();
  return theme.colors;
}

/**
 * Access typography configuration
 */
export function useTypography() {
  const theme = useThemeContext();
  return theme.typography;
}

/**
 * Access layout configuration
 */
export function useLayout() {
  const theme = useThemeContext();
  return theme.layout;
}

/**
 * Access component-specific theme overrides
 */
export function useComponentTheme() {
  const theme = useThemeContext();
  return theme.components;
}
