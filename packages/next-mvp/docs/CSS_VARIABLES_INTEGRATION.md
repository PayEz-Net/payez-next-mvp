# CSS Variables Integration Guide

How to properly inject CSS variables in your consuming Next.js application to make MVP auth components render with correct theme colors.

## The Problem

MVP authentication pages reference **CSS custom properties** (variables) in their inline styles:

```typescript
<div style={{ background: 'var(--bg-default)' }}>
  <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
    <p style={{ color: 'var(--text-primary)' }}>Hello</p>
  </div>
</div>
```

These variables (`--bg-default`, `--bg-card`, etc.) **must be defined on the document root** for the styles to apply. Without them, components render with no background or text colors.

---

## Solution: Inject CSS Variables from ThemeConfig

The MVP `ThemeProvider` accepts a `ThemeConfig` but only provides React Context—it doesn't automatically inject CSS variables into the DOM.

**You must manually inject CSS variables** when the theme changes.

### Implementation Pattern

Create a utility function to convert your theme colors to CSS variables:

```typescript
// lib/theme-utils.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

// Map your color format to CSS-compatible values
export function getThemeCSSVariables(theme: ThemeConfig): Record<string, string> {
  const isDarkMode = theme.id === 'dark-mode';

  return {
    '--bg-default': getTailwindColor(theme.colors.background),
    '--bg-card': getTailwindColor(theme.colors.card),
    '--border-default': getTailwindColor(theme.colors.border),
    '--text-primary': isDarkMode ? '#ffffff' : '#1a1a1a',
    '--text-secondary': isDarkMode ? '#d1d5db' : '#4b5563',
    '--text-muted': getTailwindColor(theme.colors.muted),
  };
}

// Convert Tailwind classes or hex to hex colors
function getTailwindColor(colorValue: string): string {
  // If already hex, return it
  if (colorValue.startsWith('#')) {
    return colorValue;
  }

  // Extract hex from gradient
  if (colorValue.includes('gradient')) {
    const fromMatch = colorValue.match(/from-(\w+-\d+)/);
    if (fromMatch) {
      return tailwindToHex(fromMatch[1]);
    }
  }

  // Convert Tailwind class to hex
  return tailwindToHex(colorValue);
}

function tailwindToHex(tailwindClass: string): string {
  // Mapping of common Tailwind colors to hex
  const colorMap: Record<string, string> = {
    'white': '#ffffff',
    'gray-50': '#f9fafb',
    'gray-100': '#f3f4f6',
    'gray-200': '#e5e7eb',
    'gray-300': '#d1d5db',
    'gray-400': '#9ca3af',
    'gray-500': '#6b7280',
    'gray-600': '#4b5563',
    'gray-700': '#374151',
    'gray-800': '#1f2937',
    'gray-900': '#111827',
    'slate-800': '#1e293b',
    'slate-900': '#0f172a',
    // ... add more as needed
  };

  return colorMap[tailwindClass] || '#ffffff';
}
```

### Inject in Your Provider

```typescript
// app/providers.tsx
'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@payez/next-mvp/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeCSSVariables } from '@/lib/theme-utils';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();

  // Inject CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = getThemeCSSVariables(currentTheme);

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [currentTheme]);

  return (
    <ThemeProvider theme={/* your MVP theme config */}>
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }) {
  return (
    <YourCustomThemeProvider>
      <InnerProviders>{children}</InnerProviders>
    </YourCustomThemeProvider>
  );
}
```

---

## Available CSS Variables

The MVP pages use these CSS variables internally:

| Variable | Used For | Example Value |
|----------|----------|----------------|
| `--bg-default` | Page background, main container | `#ffffff` |
| `--bg-card` | Card/panel backgrounds | `#f9fafb` |
| `--border-default` | Input borders, dividers | `#e5e7eb` |
| `--text-primary` | Headings, main text | `#1a1a1a` |
| `--text-secondary` | Secondary labels, hints | `#4b5563` |
| `--text-muted` | Disabled text, placeholders | `#999999` |

You **must** inject all 6 variables for proper rendering.

---

## How to Detect CSS Variable Issues

### In Browser DevTools

1. **Open the HTML inspector**
2. **Select the `<html>` root element**
3. **Check the computed styles panel**
4. **Look for CSS variables section**

You should see:
```css
--bg-default: rgb(255, 255, 255);
--bg-card: rgb(249, 250, 251);
--border-default: rgb(229, 231, 235);
--text-primary: rgb(26, 26, 26);
--text-secondary: rgb(75, 85, 99);
--text-muted: rgb(153, 153, 153);
```

### In Console

```javascript
// Check if variables are set
getComputedStyle(document.documentElement).getPropertyValue('--bg-default')
// Should return something like: " #ffffff" (note the space before color)

// Check all custom properties
Array.from(document.documentElement.style)
  .filter(prop => prop.startsWith('--'))
  .forEach(prop => {
    console.log(prop, document.documentElement.style.getPropertyValue(prop));
  });
```

---

## Complete Example: Ideal Resume Theme

Here's how `idealresume.online` implements CSS variable injection:

### 1. Theme Definition

```typescript
// lib/themes.ts
export interface Theme {
  id: string;
  colors: {
    background: string;   // Tailwind class or hex
    card: string;
    muted: string;
    border: string;
  };
}

export const oceanBlueTheme: Theme = {
  id: 'ocean-blue',
  colors: {
    background: 'bg-gradient-to-r from-blue-600 to-cyan-400',
    card: 'bg-white/95 backdrop-blur-sm border-white/40',
    muted: 'text-gray-700',
    border: 'border-white/40',
  },
};

export const darkModeTheme: Theme = {
  id: 'dark-mode',
  colors: {
    background: 'bg-gradient-to-br from-slate-800 to-slate-900',
    card: 'bg-white/10 backdrop-blur-sm border-white/20',
    muted: 'text-gray-300',
    border: 'border-white/20',
  },
};
```

### 2. Color Conversion Utility

```typescript
// lib/theme-utils.ts
export function getTailwindColor(colorValue: string): string {
  if (colorValue.startsWith('#')) return colorValue;

  const tailwindMap: Record<string, string> = {
    'white': '#ffffff',
    'gray-700': '#374151',
    'gray-300': '#d1d5db',
    'slate-800': '#1e293b',
    'slate-900': '#0f172a',
    'blue-600': '#2563eb',
    'cyan-400': '#22d3ee',
  };

  // Handle gradient: extract "from-blue-600"
  if (colorValue.includes('gradient')) {
    const fromMatch = colorValue.match(/from-(\w+-\d+)/);
    if (fromMatch) {
      const color = fromMatch[1];
      return tailwindMap[color] || '#ffffff';
    }
  }

  // Handle regular Tailwind with prefix
  const clean = colorValue.replace(/^(?:bg-|text-|border-)/, '');
  return tailwindMap[clean] || '#ffffff';
}

export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  const isDark = theme.id === 'dark-mode';

  return {
    '--bg-default': getTailwindColor(theme.colors.background),
    '--bg-card': getTailwindColor(theme.colors.card),
    '--border-default': getTailwindColor(theme.colors.border),
    '--text-primary': isDark ? '#ffffff' : '#1a1a1a',
    '--text-secondary': isDark ? '#d1d5db' : '#4b5563',
    '--text-muted': getTailwindColor(theme.colors.muted),
  };
}
```

### 3. Provider with CSS Variable Injection

```typescript
// app/providers.tsx
'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@payez/next-mvp/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeCSSVariables } from '@/lib/theme-utils';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { currentTheme } = useTheme();

  // Inject CSS variables for MVP components
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = getThemeCSSVariables(currentTheme);

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [currentTheme]);

  return (
    <ThemeProvider theme={generateMvpThemeConfig(currentTheme)}>
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CustomThemeProvider>
        <InnerProviders>{children}</InnerProviders>
      </CustomThemeProvider>
    </SessionProvider>
  );
}
```

### 4. Root Layout

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## Why This Pattern?

1. **Decoupling**: MVP doesn't need to know about your specific theme structure
2. **Flexibility**: Support any color format (hex, Tailwind, RGB, etc.)
3. **Runtime**: CSS variables are injected client-side, allowing dynamic theme switching
4. **Fallbacks**: If variables aren't set, components still have built-in defaults (though unstyled)

---

## Testing CSS Variable Injection

```typescript
// In your test/component file
it('should inject CSS variables', () => {
  const { container } = render(<MyApp />);

  // Wait for useEffect to run
  waitFor(() => {
    const bgDefault = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-default');

    expect(bgDefault.trim()).toBe('rgb(255, 255, 255)'); // white
  });
});
```

---

## Troubleshooting

**Variables not showing in DevTools?**
- Check that `useEffect` runs on component mount
- Verify `setProperty()` calls happen before components render
- Ensure parent layout wraps your pages with provider

**Colors still wrong?**
- Check color conversion logic (hex vs Tailwind)
- Verify theme object structure matches what you expect
- Look for JavaScript errors in console

**Performance issue with dynamic themes?**
- CSS variable injection is fast (direct DOM ops)
- If switching themes frequently, debounce the effect
- Consider memoizing `getThemeCSSVariables()` result

---

## Summary

To make MVP auth pages render with your theme colors:

1. ✅ Define your `ThemeConfig` or app `Theme`
2. ✅ Create `getThemeCSSVariables()` utility to convert colors to hex
3. ✅ Add `useEffect` hook in your provider to inject variables
4. ✅ Wrap your app with `ThemeProvider` (MVP) and your custom provider
5. ✅ Test in browser DevTools that variables are set on `<html>` element

That's it! MVP auth pages will now render with your theme colors.
