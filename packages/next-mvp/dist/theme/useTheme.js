"use strict";
/**
 * Theme Hooks for @payez/next-mvp
 *
 * Convenience hooks for accessing specific parts of the theme configuration.
 * These hooks can only be used within components wrapped by ThemeProvider.
 */
'use client';
/**
 * Theme Hooks for @payez/next-mvp
 *
 * Convenience hooks for accessing specific parts of the theme configuration.
 * These hooks can only be used within components wrapped by ThemeProvider.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTheme = useTheme;
exports.useBranding = useBranding;
exports.useColors = useColors;
exports.useTypography = useTypography;
exports.useLayout = useLayout;
exports.useComponentTheme = useComponentTheme;
const ThemeProvider_1 = require("./ThemeProvider");
/**
 * Access the full theme configuration
 */
function useTheme() {
    return (0, ThemeProvider_1.useTheme)();
}
/**
 * Access branding configuration (logo, app name, tagline)
 */
function useBranding() {
    const theme = (0, ThemeProvider_1.useTheme)();
    return theme.branding;
}
/**
 * Access color configuration
 */
function useColors() {
    const theme = (0, ThemeProvider_1.useTheme)();
    return theme.colors;
}
/**
 * Access typography configuration
 */
function useTypography() {
    const theme = (0, ThemeProvider_1.useTheme)();
    return theme.typography;
}
/**
 * Access layout configuration
 */
function useLayout() {
    const theme = (0, ThemeProvider_1.useTheme)();
    return theme.layout;
}
/**
 * Access component-specific theme overrides
 */
function useComponentTheme() {
    const theme = (0, ThemeProvider_1.useTheme)();
    return theme.components;
}
