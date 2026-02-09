# MVP Theming Guide

Complete guide to customizing the PayEz MVP authentication components with your brand colors, logos, and styling.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Theme Structure](#theme-structure)
3. [Creating a Theme](#creating-a-theme)
4. [CSS Variables](#css-variables)
5. [Component-Specific Customization](#component-specific-customization)
6. [Typography & Layout](#typography--layout)
7. [Examples](#examples)
8. [Common Issues & Solutions](#common-issues--solutions)

---

## Quick Start

The MVP uses a **React Context-based theme system**. To customize your authentication pages:

### 1. Create Your Theme Configuration

```typescript
// lib/my-theme.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const myTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logo.svg",        // Shown on light backgrounds
      dark: "/logo-dark.svg",    // Shown on dark backgrounds
      alt: "My App",
      height: "h-12",
      width: "w-auto",
    },
    appName: "My Application",
    tagline: "Secure Authentication",
  },

  colors: {
    primary: "#3b82f6",           // Main action color
    secondary: "#6366f1",         // Secondary actions
    accent: "#ec4899",            // Highlights
    background: "bg-white",       // Page background (Tailwind or hex)
    card: "bg-gray-50",           // Card backgrounds
    muted: "text-gray-600",       // Muted text
    border: "border-gray-200",    // Border color
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
```

### 2. Wrap Your App with ThemeProvider

```typescript
// app/layout.tsx
import { ThemeProvider } from '@payez/next-mvp/theme';
import { myTheme } from '@/lib/my-theme';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider theme={myTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

That's it! Your authentication pages are now themed.

---

## Theme Structure

The `ThemeConfig` interface defines all customizable properties:

### `branding` - Logo and App Identity

```typescript
branding: {
  logo: {
    light: string;      // SVG or image path for light backgrounds
    dark: string;       // SVG or image path for dark backgrounds
    alt: string;        // Alt text for accessibility
    height: string;     // CSS class (e.g., "h-12", "h-16")
    width: string;      // CSS class (e.g., "w-auto", "w-32")
  };
  appName: string;      // Your app name (shown in headers)
  tagline: string;      // Short tagline (shown in headers)
}
```

### `colors` - Color Palette

All color values support:
- **Hex colors**: `"#3b82f6"`, `"#ffffff"`
- **Tailwind classes**: `"bg-blue-500"`, `"text-gray-700"`, `"border-red-200"`
- **RGB**: `"rgb(59, 130, 246)"`

```typescript
colors: {
  primary: string;      // Main action buttons, links
  secondary: string;    // Secondary buttons, accents
  accent: string;       // Highlights, emphasis
  background: string;   // Page/viewport background
  card: string;         // Card/panel backgrounds
  muted: string;        // Disabled text, placeholders
  border: string;       // Input borders, dividers
}
```

### `typography` - Font Styling

```typescript
typography: {
  fontFamily: string;       // Font stack (e.g., "'Inter', sans-serif")
  headingWeight: string;    // Heading font weight (e.g., "font-bold", "font-semibold")
  bodyWeight: string;       // Body text weight (e.g., "font-normal", "font-light")
}
```

### `layout` - Component Layout

```typescript
layout: {
  maxWidth: string;    // Max width of components (Tailwind class, e.g., "max-w-md")
  padding: string;     // Padding (Tailwind class, e.g., "p-6")
  spacing: string;     // Vertical spacing (Tailwind class, e.g., "space-y-4")
}
```

### `components` - Page-Specific Overrides (Optional)

Fine-tune individual auth pages:

```typescript
components?: {
  loginPage?: {
    cardBackground?: string;    // Override background for login card
    gradient?: string;          // Gradient for login page background
    buttonColor?: string;       // Override button color
    showLogo?: boolean;         // Show/hide logo (default: true)
  };
  profilePage?: {
    layout?: "full-width" | "centered";
    showAvatar?: boolean;
  };
  recoveryPage?: {
    layout?: "centered";        // Always centered
  };
  verifyCodePage?: {
    layout?: "centered";        // Always centered
  };
}
```

---

## Creating a Theme

### Option 1: Simple Theme (Single Color Scheme)

For a basic light theme:

```typescript
// lib/light-theme.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const lightTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
      alt: "Company",
      height: "h-12",
      width: "w-auto",
    },
    appName: "My App",
    tagline: "Welcome",
  },
  colors: {
    primary: "#000000",
    secondary: "#666666",
    accent: "#ff6600",
    background: "#ffffff",
    card: "#f8f8f8",
    muted: "#999999",
    border: "#e0e0e0",
  },
  typography: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    headingWeight: "font-bold",
    bodyWeight: "font-normal",
  },
  layout: {
    maxWidth: "max-w-sm",
    padding: "p-8",
    spacing: "space-y-6",
  },
};
```

### Option 2: Dynamic Theme (Light/Dark Mode)

For apps that support multiple themes:

```typescript
// contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import { ThemeProvider } from '@payez/next-mvp/theme';
import { lightTheme, darkTheme } from '@/lib/themes';

const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({
  isDark: false,
  toggleTheme: () => {},
});

export function CustomThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const currentTheme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark) }}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
```

### Option 3: Brand-Specific Theme (Multi-Brand)

For platforms serving multiple brands:

```typescript
// lib/brand-themes.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const themes: Record<string, ThemeConfig> = {
  'acme-corp': {
    branding: {
      logo: { light: "/brands/acme-logo.svg", ... },
      appName: "ACME Corp",
      tagline: "Trusted Since 1975",
    },
    colors: { primary: "#1a1a1a", ... },
    // ...
  },
  'tech-startup': {
    branding: {
      logo: { light: "/brands/startup-logo.svg", ... },
      appName: "Tech Startup",
      tagline: "Innovation First",
    },
    colors: { primary: "#00ff00", ... },
    // ...
  },
};

export function getBrandTheme(brandId: string): ThemeConfig {
  return themes[brandId] || themes['acme-corp'];
}
```

---

## CSS Variables

The MVP authentication components internally use **CSS custom properties** for styling. When you provide a `ThemeConfig`, the CSS variables are automatically set on the document root.

### Available CSS Variables

The MVP pages reference these CSS variables internally:

| Variable | Purpose | Example |
|----------|---------|---------|
| `--bg-default` | Page background | `#ffffff` |
| `--bg-card` | Card/container background | `#f8f8f8` |
| `--border-default` | Border color | `#e0e0e0` |
| `--text-primary` | Main text color | `#1a1a1a` |
| `--text-secondary` | Secondary text | `#666666` |
| `--text-muted` | Muted/disabled text | `#999999` |

### Injecting CSS Variables Manually

If your app doesn't use `ThemeProvider` (e.g., testing MVP in isolation), you can manually set CSS variables:

```typescript
// In a useEffect hook
useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--bg-default', '#ffffff');
  root.style.setProperty('--bg-card', '#f8f8f8');
  root.style.setProperty('--border-default', '#e0e0e0');
  root.style.setProperty('--text-primary', '#1a1a1a');
  root.style.setProperty('--text-secondary', '#666666');
  root.style.setProperty('--text-muted', '#999999');
}, []);
```

---

## Component-Specific Customization

### Login Page

The login page is the most prominent auth component. Customize it separately:

```typescript
const theme: ThemeConfig = {
  // ... base theme ...
  components: {
    loginPage: {
      // Use a gradient background
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

      // Override card styling
      cardBackground: "#ffffff",

      // Custom button color
      buttonColor: "#667eea",

      // Show your logo
      showLogo: true,
    },
  },
};
```

### Recovery Page

Password recovery pages are typically centered, minimal designs:

```typescript
const theme: ThemeConfig = {
  // ... base theme ...
  components: {
    recoveryPage: {
      layout: "centered",  // Always centered, read-only
    },
  },
};
```

### Verify Code Page

2FA verification pages can also be customized:

```typescript
const theme: ThemeConfig = {
  // ... base theme ...
  components: {
    verifyCodePage: {
      layout: "centered",  // Always centered
    },
  },
};
```

---

## Typography & Layout

### Font Selection

Choose fonts that match your brand:

```typescript
typography: {
  // Google Fonts (requires @import in CSS)
  fontFamily: "'Poppins', sans-serif",

  // System fonts (fastest)
  fontFamily: "system-ui, -apple-system, sans-serif",

  // Custom web fonts
  fontFamily: "'CustomFont', 'Fallback Font', sans-serif",

  headingWeight: "font-bold",      // h1, h2, labels
  bodyWeight: "font-normal",       // Body text, inputs
}
```

### Layout Sizing

Control how components size and space:

```typescript
layout: {
  // Maximum width of the form container
  maxWidth: "max-w-sm",    // 384px (small)
  maxWidth: "max-w-md",    // 448px (medium) - DEFAULT
  maxWidth: "max-w-lg",    // 512px (large)

  // Padding inside containers
  padding: "p-4",          // 1rem
  padding: "p-6",          // 1.5rem - DEFAULT
  padding: "p-8",          // 2rem

  // Vertical spacing between elements
  spacing: "space-y-3",    // 0.75rem between elements
  spacing: "space-y-4",    // 1rem between elements - DEFAULT
  spacing: "space-y-6",    // 1.5rem between elements
}
```

---

## Examples

### Example 1: Dark Corporate Theme

```typescript
// lib/corporate-dark-theme.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const corporateDarkTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logo-light.svg",
      dark: "/logo-dark.svg",
      alt: "Corporation",
      height: "h-12",
      width: "w-auto",
    },
    appName: "Enterprise Portal",
    tagline: "Secure Access",
  },

  colors: {
    primary: "#3b82f6",           // Blue
    secondary: "#8b5cf6",         // Purple
    accent: "#ec4899",            // Pink
    background: "bg-gray-950",    // Almost black
    card: "bg-gray-900",          // Dark gray
    muted: "text-gray-500",       // Medium gray
    border: "border-gray-800",    // Dark border
  },

  typography: {
    fontFamily: "'Inter', sans-serif",
    headingWeight: "font-bold",
    bodyWeight: "font-normal",
  },

  layout: {
    maxWidth: "max-w-md",
    padding: "p-8",
    spacing: "space-y-6",
  },

  components: {
    loginPage: {
      buttonColor: "#3b82f6",
      showLogo: true,
    },
  },
};
```

### Example 2: Vibrant SaaS Theme

```typescript
// lib/saas-theme.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const saasTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
      alt: "SaaS Startup",
      height: "h-10",
      width: "w-32",
    },
    appName: "BuildIt",
    tagline: "Create. Deploy. Scale.",
  },

  colors: {
    primary: "#00d084",           // Bright green
    secondary: "#00a884",         // Teal
    accent: "#ff6b35",            // Orange
    background: "#f5f7fa",        // Light blue-gray
    card: "#ffffff",              // White
    muted: "#6c757d",             // Gray
    border: "#dee2e6",            // Light gray
  },

  typography: {
    fontFamily: "'Outfit', sans-serif",
    headingWeight: "font-semibold",
    bodyWeight: "font-normal",
  },

  layout: {
    maxWidth: "max-w-sm",
    padding: "p-6",
    spacing: "space-y-4",
  },
};
```

### Example 3: Minimalist Design System

```typescript
// lib/minimal-theme.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const minimalTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/minimal-logo.svg",
      dark: "/minimal-logo-dark.svg",
      alt: "Minimal Co",
      height: "h-8",
      width: "w-auto",
    },
    appName: "Minimal",
    tagline: "Clean & Simple",
  },

  colors: {
    primary: "#000000",           // Black
    secondary: "#404040",         // Dark gray
    accent: "#000000",            // Black
    background: "#ffffff",        // White
    card: "#ffffff",              // White
    muted: "#a0a0a0",            // Light gray
    border: "#e0e0e0",           // Very light gray
  },

  typography: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    headingWeight: "font-bold",
    bodyWeight: "font-light",     // Thin body for minimal look
  },

  layout: {
    maxWidth: "max-w-sm",
    padding: "p-4",               // Less padding for compact look
    spacing: "space-y-3",         // Tighter spacing
  },
};
```

---

## Common Issues & Solutions

### Issue: Colors Not Applying

**Symptom**: Theme colors don't appear on auth pages.

**Solution 1: Ensure ThemeProvider wraps auth routes**
```typescript
// app/layout.tsx - CORRECT
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider theme={myTheme}>
          {children}  {/* All routes including /login, /recovery get theme */}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Solution 2: If using custom context, inject CSS variables**
```typescript
// In your InnerProviders or wrapper component
useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--bg-default', '#ffffff');
  // ... set other variables
}, [theme]);
```

### Issue: Logo Not Showing

**Symptom**: Auth pages show broken image icon.

**Solutions**:
1. **Check file path**: Ensure logo path is correct and file exists
   ```typescript
   logo: {
     light: "/logo.svg",  // ✅ Public folder
     dark: "/logo-dark.svg",
   }
   ```

2. **Use absolute URLs**: For imported images
   ```typescript
   import logoSvg from '@/public/logo.svg';

   logo: {
     light: logoSvg,  // ✅ Import instead of string
     dark: logoDarkSvg,
   }
   ```

3. **Check CORS**: If logo is from CDN, ensure CORS is configured

### Issue: Fonts Not Loading

**Symptom**: Auth pages show wrong font family.

**Solutions**:
1. **Add @import to global CSS**
   ```css
   /* app/globals.css */
   @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
   ```

2. **Use system fonts** (no loading required)
   ```typescript
   fontFamily: "system-ui, -apple-system, sans-serif"
   ```

3. **Define custom font in tailwind.config.ts**
   ```typescript
   // tailwind.config.ts
   export default {
     theme: {
       fontFamily: {
         sans: ['Poppins', 'sans-serif'],
       },
     },
   };
   ```

### Issue: Text Too Small or Large

**Symptom**: Form labels or input text appear wrong size.

**Solution**: Adjust layout and typography
```typescript
layout: {
  padding: "p-6",      // Increase padding
  spacing: "space-y-6", // Increase spacing
},
typography: {
  // Font size is inherent to component; can't be overridden
  // Instead, adjust padding to change visual weight
}
```

### Issue: Mobile Layout Broken

**Symptom**: Auth pages don't fit on mobile screens.

**Solution**: Reduce padding on mobile
```typescript
layout: {
  maxWidth: "max-w-sm",  // Will be responsive by default
  padding: "p-4",        // Smaller padding works better on mobile
  spacing: "space-y-4",  // Tighter spacing
}
```

### Issue: Component Styles Override My Theme

**Symptom**: Some colors don't match your theme.

**Explanation**: MVP components have default fallbacks. Ensure:
1. All colors in your theme are valid (hex, Tailwind class, or RGB)
2. `ThemeProvider` wraps your entire app
3. CSS variables are being injected (check browser DevTools)

**Debug**:
```typescript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue('--bg-default')
// Should return your color (e.g., "#ffffff")
```

---

## Advanced: Theme Hook Usage

The MVP exports a `useTheme()` hook to access theme values in your components:

```typescript
'use client';

import { useTheme, useColors, useBranding } from '@payez/next-mvp/theme';

export function MyComponent() {
  const theme = useTheme();           // Full theme config
  const colors = useColors();         // Just colors
  const branding = useBranding();    // Just branding

  return (
    <div style={{ background: colors.primary }}>
      <img src={branding.logo.light} alt={branding.logo.alt} />
      <h1>{branding.appName}</h1>
    </div>
  );
}
```

---

## TypeScript Support

Full TypeScript support for theme configuration:

```typescript
import { ThemeConfig } from '@payez/next-mvp/theme';

// This will error if structure doesn't match
const myTheme: ThemeConfig = {
  branding: {
    // ... must include all required fields
  },
  colors: {
    primary: "#3b82f6",
    // ... etc
  },
  // ...
};
```

---

## Summary

The MVP theming system makes it easy to:
- ✅ Apply your brand colors and logos
- ✅ Customize fonts and typography
- ✅ Control layout and spacing
- ✅ Maintain consistent styling across all auth pages
- ✅ Support light/dark modes
- ✅ Switch themes dynamically

Start with the [Quick Start](#quick-start) section and customize from there!
