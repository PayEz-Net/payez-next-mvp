/**
 * Theme Provider for @payez/next-mvp
 *
 * Provides theme configuration to all child components via React Context.
 * Consumer apps wrap their app with this provider and pass custom theme config.
 */

'use client';

import React, { createContext, useContext } from 'react';
import { ThemeConfig } from './types';
import { defaultTheme } from './default';
import { mergeDeep } from './utils';

const ThemeContext = createContext<ThemeConfig>(defaultTheme);

export interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: Partial<ThemeConfig>;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  // Deep merge consumer theme with defaults
  const mergedTheme = mergeDeep(defaultTheme, theme || {});

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
