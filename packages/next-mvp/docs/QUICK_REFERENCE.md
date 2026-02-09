# MVP Theme - Quick Reference Card

One-page reference for common theming tasks.

## 📍 File Locations

```
E:\Repos\PayEz-Next-MVP\packages\next-mvp\docs\
├─ THEMING.md                    (Main guide)
├─ CSS_VARIABLES_INTEGRATION.md  (CSS variables)
├─ THEME_EXAMPLES.md             (9 themes)
├─ INDEX.md                      (Documentation map)
└─ QUICK_REFERENCE.md            (This file)
```

---

## ⚡ Quick Start (2 Minutes)

```typescript
// 1. Define your theme
import { ThemeConfig } from '@payez/next-mvp/theme';

const myTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logo.svg",
      dark: "/logo-dark.svg",
      alt: "My App",
      height: "h-12",
      width: "w-auto",
    },
    appName: "My App",
    tagline: "Welcome",
  },
  colors: {
    primary: "#3b82f6",
    secondary: "#6366f1",
    accent: "#ec4899",
    background: "#ffffff",
    card: "#f9fafb",
    muted: "#6b7280",
    border: "#e5e7eb",
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    headingWeight: "font-semibold",
    bodyWeight: "font-normal",
  },
  layout: {
    maxWidth: "max-w-md",
    padding: "p-6",
    spacing: "space-y-4",
  },
};

// 2. Wrap your app
import { ThemeProvider } from '@payez/next-mvp/theme';

export function Providers({ children }) {
  return (
    <ThemeProvider theme={myTheme}>
      {children}
    </ThemeProvider>
  );
}

// 3. Use in layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Done! Your app is now themed.

---

## 🎨 Theme Color Formats

All color fields accept:

```typescript
colors: {
  primary: "#3b82f6",              // ✅ Hex
  secondary: "rgb(99, 102, 241)",  // ✅ RGB
  accent: "blue-500",              // ✅ Tailwind (bg-, text-, border-)
  background: "bg-white",          // ✅ Tailwind class
  card: "#ffffff",                 // ✅ All formats work!
}
```

---

## 🎭 Branding Configuration

```typescript
branding: {
  logo: {
    light: "/logo.svg",           // Light background
    dark: "/logo-dark.svg",       // Dark background
    alt: "Company Name",          // Alt text
    height: "h-12",               // Tailwind class
    width: "w-auto",              // Tailwind class
  },
  appName: "My App",              // Shown in headers
  tagline: "Short tagline",       // Shown in headers
}
```

---

## 🖼️ Copy a Ready-Made Theme

```typescript
// From THEME_EXAMPLES.md, pick one:

import { lightProfessionalTheme } from './my-themes';
import { darkMinimalTheme } from './my-themes';
import { vibrantSaasTheme } from './my-themes';
import { corporateBlueTheme } from './my-themes';
import { greenTechTheme } from './my-themes';
import { purpleModernTheme } from './my-themes';
import { highContrastTheme } from './my-themes';
import { lightDynamicTheme, darkDynamicTheme } from './my-themes';
import { brandThemes } from './my-themes';

// Use any of them
<ThemeProvider theme={lightProfessionalTheme}>
  {children}
</ThemeProvider>
```

---

## 🌓 Light/Dark Mode

```typescript
const lightTheme: ThemeConfig = {
  colors: {
    primary: "#1a365d",
    background: "#ffffff",
    card: "#f9fafb",
    border: "#e5e7eb",
    muted: "text-gray-600",
  },
  // ...
};

const darkTheme: ThemeConfig = {
  colors: {
    primary: "#60a5fa",
    background: "#111827",
    card: "#1f2937",
    border: "#374151",
    muted: "text-gray-400",
  },
  // ...
};

// Toggle between them
const [isDark, setIsDark] = useState(false);
const theme = isDark ? darkTheme : lightTheme;

<ThemeProvider theme={theme}>
  {children}
</ThemeProvider>
```

---

## 🌐 Multi-Brand

```typescript
const themes = {
  'acme-corp': { /* ... */ },
  'tech-startup': { /* ... */ },
  'creative-studio': { /* ... */ },
};

const getBrandTheme = (brandId) => themes[brandId] || themes['acme-corp'];

// In your app
<ThemeProvider theme={getBrandTheme(currentBrand)}>
  {children}
</ThemeProvider>
```

---

## 🔧 CSS Variable Injection

If pages render white/unstyled:

```typescript
// app/providers.tsx
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

function InnerProviders({ children }) {
  const { currentTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-default', '#ffffff');
    root.style.setProperty('--bg-card', '#f9fafb');
    root.style.setProperty('--border-default', '#e5e7eb');
    root.style.setProperty('--text-primary', '#1a1a1a');
    root.style.setProperty('--text-secondary', '#4b5563');
    root.style.setProperty('--text-muted', '#999999');
  }, [currentTheme]);

  return <ThemeProvider theme={mvpThemeConfig}>{children}</ThemeProvider>;
}
```

---

## 📋 Available CSS Variables

```typescript
// CSS variables the MVP uses internally
--bg-default         // Page background
--bg-card            // Card/container background
--border-default     // Border color
--text-primary       // Main text
--text-secondary     // Secondary text
--text-muted         // Muted/disabled text
```

---

## 🎯 Layout Options

```typescript
layout: {
  // Width of form container
  maxWidth: "max-w-sm",      // 384px (small)
  maxWidth: "max-w-md",      // 448px (medium) - DEFAULT
  maxWidth: "max-w-lg",      // 512px (large)

  // Padding inside containers
  padding: "p-4",            // 1rem
  padding: "p-6",            // 1.5rem - DEFAULT
  padding: "p-8",            // 2rem

  // Vertical spacing between elements
  spacing: "space-y-3",      // 0.75rem
  spacing: "space-y-4",      // 1rem - DEFAULT
  spacing: "space-y-6",      // 1.5rem
}
```

---

## 🔍 Debug Styling

**In browser console:**

```javascript
// Check if CSS variables are set
getComputedStyle(document.documentElement).getPropertyValue('--bg-default')
// Should return: " #ffffff"

// Set manually if not working
document.documentElement.style.setProperty('--bg-default', '#ffffff');
document.documentElement.style.setProperty('--bg-card', '#f9fafb');
```

**In browser DevTools:**
1. Inspect `<html>` element
2. Check "Styles" panel
3. Look for CSS variables section
4. Verify values match your theme

---

## ❌ Common Issues

| Issue | Solution |
|-------|----------|
| Pages render white | Inject CSS variables (see above) |
| Logo not showing | Check file path, ensure public folder |
| Font not loading | Add `@import` to global CSS or use system fonts |
| Colors not applying | Wrap entire app with `ThemeProvider` |
| Mobile layout broken | Reduce padding: `p-4` instead of `p-8` |
| Contrast too low | Use WCAG AA color combinations |
| Dark mode doesn't apply | Create separate dark theme configuration |

---

## 📚 Full Documentation

For complete information:

| Need | Read |
|------|------|
| Everything | [THEMING.md](./THEMING.md) |
| Just examples | [THEME_EXAMPLES.md](./THEME_EXAMPLES.md) |
| CSS variables | [CSS_VARIABLES_INTEGRATION.md](./CSS_VARIABLES_INTEGRATION.md) |
| Navigation | [INDEX.md](./INDEX.md) |

---

## 🚀 Typography

```typescript
typography: {
  fontFamily: "'Inter', sans-serif",
  // Google Fonts: "@import url('...')" in CSS
  // System: "system-ui, -apple-system, sans-serif"
  // Custom: "'YourFont', sans-serif"

  headingWeight: "font-semibold",  // h1, h2, labels
  // Options: font-light, font-normal, font-semibold, font-bold

  bodyWeight: "font-normal",       // Body text
  // Options: font-light, font-normal, font-semibold
}
```

---

## 🎨 Component Customization

```typescript
components: {
  loginPage: {
    cardBackground: "#ffffff",
    gradient: "linear-gradient(...)",
    buttonColor: "#3b82f6",
    showLogo: true,
  },
  recoveryPage: {
    layout: "centered",
  },
  verifyCodePage: {
    layout: "centered",
  },
}
```

---

## 📊 Theme Structure (Cheat Sheet)

```typescript
ThemeConfig {
  branding: {
    logo: { light, dark, alt, height, width }
    appName: string
    tagline: string
  }
  colors: {
    primary, secondary, accent
    background, card, muted, border
  }
  typography: {
    fontFamily, headingWeight, bodyWeight
  }
  layout: {
    maxWidth, padding, spacing
  }
  components?: {
    loginPage?, profilePage?, recoveryPage?, verifyCodePage?
  }
}
```

---

## ✅ Checklist: Testing Your Theme

- [ ] Logo displays on both light and dark pages
- [ ] All text is readable (sufficient contrast)
- [ ] Form inputs have visible focus states
- [ ] Error messages are visible
- [ ] Button text is visible on button background
- [ ] Mobile layout looks good
- [ ] Dark mode colors aren't pure black/white
- [ ] CSS variables are injected (check DevTools)

---

## 🔗 Quick Links

**Start here:**
- [INDEX.md](./INDEX.md) - Documentation map
- [THEMING.md Quick Start](./THEMING.md#quick-start) - 2-step setup

**Get themes:**
- [THEME_EXAMPLES.md](./THEME_EXAMPLES.md) - 9 ready-made themes

**Debug issues:**
- [THEMING.md - Common Issues](./THEMING.md#common-issues--solutions)
- [CSS_VARIABLES_INTEGRATION.md](./CSS_VARIABLES_INTEGRATION.md)

**Learn more:**
- [THEMING.md](./THEMING.md) - Complete reference
- [CSS_VARIABLES_INTEGRATION.md](./CSS_VARIABLES_INTEGRATION.md) - CSS variable guide

---

## 💬 Need Help?

| Question | Answer |
|----------|--------|
| How do I change colors? | See "Quick Start" above |
| Pages render white? | See "CSS Variable Injection" above |
| Want a complete example? | Copy from [THEME_EXAMPLES.md](./THEME_EXAMPLES.md) |
| Light/dark mode? | See "Light/Dark Mode" above |
| Multi-brand/multi-tenant? | See "Multi-Brand" above |
| Deep dive? | Read [THEMING.md](./THEMING.md) |

---

**Version:** MVP 2.5.10+
**Last Updated:** November 27, 2025

Quick Reference © 2025 PayEz Team
