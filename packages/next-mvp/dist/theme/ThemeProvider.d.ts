/**
 * Theme Provider for @payez/next-mvp
 *
 * Provides theme configuration to all child components via React Context.
 * Consumer apps wrap their app with this provider and pass custom theme config.
 */
import React from 'react';
import { ThemeConfig } from './types';
export interface ThemeProviderProps {
    children: React.ReactNode;
    theme?: Partial<ThemeConfig>;
}
export declare function ThemeProvider({ children, theme }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useTheme(): ThemeConfig;
