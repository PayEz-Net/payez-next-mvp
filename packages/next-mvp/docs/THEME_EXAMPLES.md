# MVP Theme Examples

Ready-to-use theme configurations for common use cases.

## Table of Contents

1. [Light Professional](#light-professional)
2. [Dark Minimal](#dark-minimal)
3. [Vibrant SaaS](#vibrant-saas)
4. [Corporate Blue](#corporate-blue)
5. [Green Tech](#green-tech)
6. [Purple Modern](#purple-modern)
7. [High Contrast](#high-contrast)
8. [Dynamic Light/Dark](#dynamic-lightdark)
9. [Multi-Brand Themes](#multi-brand-themes)

---

## Light Professional

Clean, professional theme suitable for enterprise applications.

```typescript
// lib/themes/light-professional.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const lightProfessionalTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/professional-light.svg",
      dark: "/logos/professional-dark.svg",
      alt: "Professional Corp",
      height: "h-10",
      width: "w-auto",
    },
    appName: "Professional Portal",
    tagline: "Enterprise Access",
  },

  colors: {
    primary: "#1a365d",           // Deep blue
    secondary: "#2c5282",         // Medium blue
    accent: "#3182ce",            // Bright blue
    background: "#f7fafc",        // Off-white
    card: "#ffffff",              // White
    muted: "#718096",             // Gray
    border: "#cbd5e0",            // Light gray
  },

  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    headingWeight: "font-semibold",
    bodyWeight: "font-normal",
  },

  layout: {
    maxWidth: "max-w-md",
    padding: "p-6",
    spacing: "space-y-4",
  },

  components: {
    loginPage: {
      buttonColor: "#1a365d",
      showLogo: true,
    },
  },
};
```

**Use Case**: Banking, legal, insurance, government portals.

---

## Dark Minimal

Minimalist dark theme for privacy-focused applications.

```typescript
// lib/themes/dark-minimal.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const darkMinimalTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/minimal-white.svg",
      dark: "/logos/minimal-white.svg",
      alt: "Minimal",
      height: "h-8",
      width: "w-auto",
    },
    appName: "Minimal",
    tagline: "Clean & Simple",
  },

  colors: {
    primary: "#ffffff",           // White text on dark
    secondary: "#e2e8f0",         // Light gray
    accent: "#ffffff",            // White accents
    background: "#000000",        // Pure black
    card: "#1a202c",              // Very dark gray
    muted: "#a0aec0",            // Medium gray
    border: "#2d3748",            // Dark border
  },

  typography: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    headingWeight: "font-bold",
    bodyWeight: "font-light",
  },

  layout: {
    maxWidth: "max-w-sm",
    padding: "p-4",
    spacing: "space-y-3",
  },

  components: {
    loginPage: {
      buttonColor: "#ffffff",
      showLogo: true,
    },
  },
};
```

**Use Case**: Privacy apps, security tools, dark mode-first applications.

---

## Vibrant SaaS

Modern, vibrant theme for SaaS startups.

```typescript
// lib/themes/vibrant-saas.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const vibrantSaasTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/saas-logo.svg",
      dark: "/logos/saas-logo-dark.svg",
      alt: "SaaS Startup",
      height: "h-12",
      width: "w-auto",
    },
    appName: "NextBuild",
    tagline: "Deploy Faster",
  },

  colors: {
    primary: "#10b981",           // Green
    secondary: "#06b6d4",         // Cyan
    accent: "#f59e0b",            // Amber
    background: "#f3f4f6",        // Light gray
    card: "#ffffff",              // White
    muted: "#6b7280",             // Medium gray
    border: "#e5e7eb",            // Light border
  },

  typography: {
    fontFamily: "'Poppins', sans-serif",
    headingWeight: "font-semibold",
    bodyWeight: "font-normal",
  },

  layout: {
    maxWidth: "max-w-sm",
    padding: "p-6",
    spacing: "space-y-4",
  },

  components: {
    loginPage: {
      gradient: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
      buttonColor: "#10b981",
      showLogo: true,
    },
  },
};
```

**Use Case**: Developer tools, DevOps platforms, productivity apps.

---

## Corporate Blue

Classic corporate theme with blue gradient.

```typescript
// lib/themes/corporate-blue.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const corporateBlueTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/corporate.svg",
      dark: "/logos/corporate-light.svg",
      alt: "Corporation Inc",
      height: "h-12",
      width: "w-40",
    },
    appName: "Corporate Platform",
    tagline: "Trusted by Enterprises",
  },

  colors: {
    primary: "#003f87",           // Deep corporate blue
    secondary: "#1e5ba8",         // Mid blue
    accent: "#2b7fd4",            // Bright blue
    background: "bg-gradient-to-r from-blue-50 to-indigo-50",
    card: "#ffffff",
    muted: "#64748b",
    border: "#cbd5e0",
  },

  typography: {
    fontFamily: "'Roboto', sans-serif",
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
      gradient: "linear-gradient(135deg, #003f87 0%, #1e5ba8 100%)",
      buttonColor: "#003f87",
      showLogo: true,
    },
  },
};
```

**Use Case**: Large corporations, Fortune 500 companies, enterprise software.

---

## Green Tech

Eco-friendly, modern tech theme with green accent.

```typescript
// lib/themes/green-tech.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const greenTechTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/greentech.svg",
      dark: "/logos/greentech-dark.svg",
      alt: "GreenTech",
      height: "h-10",
      width: "w-auto",
    },
    appName: "GreenTech",
    tagline: "Sustainable Technology",
  },

  colors: {
    primary: "#059669",           // Emerald green
    secondary: "#10b981",         // Bright green
    accent: "#14b8a6",            // Teal
    background: "#ecfdf5",        // Mint
    card: "#ffffff",
    muted: "#6b7280",
    border: "#d1fae5",
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

  components: {
    loginPage: {
      buttonColor: "#059669",
      showLogo: true,
    },
  },
};
```

**Use Case**: Climate tech, sustainability platforms, eco-conscious brands.

---

## Purple Modern

Modern, creative theme with purple palette.

```typescript
// lib/themes/purple-modern.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const purpleModernTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/purple-logo.svg",
      dark: "/logos/purple-logo-light.svg",
      alt: "Creative Studio",
      height: "h-12",
      width: "w-auto",
    },
    appName: "Creative Hub",
    tagline: "Design & Collaborate",
  },

  colors: {
    primary: "#7c3aed",           // Purple
    secondary: "#a855f7",         // Light purple
    accent: "#ec4899",            // Pink
    background: "#f5f3ff",        // Light purple
    card: "#ffffff",
    muted: "#9333ea",
    border: "#e9d5ff",
  },

  typography: {
    fontFamily: "'DM Sans', sans-serif",
    headingWeight: "font-bold",
    bodyWeight: "font-normal",
  },

  layout: {
    maxWidth: "max-w-sm",
    padding: "p-6",
    spacing: "space-y-5",
  },

  components: {
    loginPage: {
      gradient: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
      buttonColor: "#7c3aed",
      showLogo: true,
    },
  },
};
```

**Use Case**: Design tools, creative platforms, art/media applications.

---

## High Contrast

Accessible theme with high contrast ratios for readability.

```typescript
// lib/themes/high-contrast.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const highContrastTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logos/accessible.svg",
      dark: "/logos/accessible.svg",
      alt: "Accessible App",
      height: "h-12",
      width: "w-auto",
    },
    appName: "Access First",
    tagline: "For Everyone",
  },

  colors: {
    primary: "#000000",           // Pure black
    secondary: "#333333",         // Dark gray
    accent: "#ffcc00",            // Bright yellow
    background: "#ffffff",        // Pure white
    card: "#f5f5f5",              // Light gray
    muted: "#666666",
    border: "#000000",            // Black borders for contrast
  },

  typography: {
    fontFamily: "'Arial', sans-serif",  // System font
    headingWeight: "font-bold",
    bodyWeight: "font-normal",
  },

  layout: {
    maxWidth: "max-w-md",
    padding: "p-6",
    spacing: "space-y-4",
  },

  components: {
    loginPage: {
      buttonColor: "#000000",
      showLogo: true,
    },
  },
};
```

**Use Case**: Government, healthcare, accessibility-first applications.

---

## Dynamic Light/Dark

Theme that automatically switches between light and dark modes.

```typescript
// lib/themes/dynamic.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

const baseTheme = {
  branding: {
    logo: {
      light: "/logo-light.svg",
      dark: "/logo-dark.svg",
      alt: "Dynamic App",
      height: "h-12",
      width: "w-auto",
    },
    appName: "Dynamic",
    tagline: "Adapts to You",
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

export const lightDynamicTheme: ThemeConfig = {
  ...baseTheme,
  colors: {
    primary: "#2563eb",
    secondary: "#7c3aed",
    accent: "#ec4899",
    background: "#ffffff",
    card: "#f9fafb",
    muted: "#6b7280",
    border: "#e5e7eb",
  },
};

export const darkDynamicTheme: ThemeConfig = {
  ...baseTheme,
  colors: {
    primary: "#60a5fa",
    secondary: "#a78bfa",
    accent: "#f472b6",
    background: "#111827",
    card: "#1f2937",
    muted: "#9ca3af",
    border: "#374151",
  },
};

// Usage in your app
export function getTheme(isDark: boolean): ThemeConfig {
  return isDark ? darkDynamicTheme : lightDynamicTheme;
}
```

**Use Case**: Any app with light/dark mode toggle.

---

## Multi-Brand Themes

Support multiple brands with centralized theme configuration.

```typescript
// lib/themes/brands.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

export const brandThemes: Record<string, ThemeConfig> = {
  'acme-corp': {
    branding: {
      logo: {
        light: "/brands/acme-light.svg",
        dark: "/brands/acme-dark.svg",
        alt: "ACME Corp",
        height: "h-12",
        width: "w-auto",
      },
      appName: "ACME Portal",
      tagline: "Corporate Excellence",
    },
    colors: {
      primary: "#1a365d",
      secondary: "#2c5282",
      accent: "#3182ce",
      background: "#f7fafc",
      card: "#ffffff",
      muted: "#718096",
      border: "#cbd5e0",
    },
    typography: {
      fontFamily: "'Roboto', sans-serif",
      headingWeight: "font-bold",
      bodyWeight: "font-normal",
    },
    layout: {
      maxWidth: "max-w-md",
      padding: "p-6",
      spacing: "space-y-4",
    },
  },

  'startup-inc': {
    branding: {
      logo: {
        light: "/brands/startup.svg",
        dark: "/brands/startup-dark.svg",
        alt: "Startup Inc",
        height: "h-10",
        width: "w-auto",
      },
      appName: "Startup Inc",
      tagline: "Build Something Great",
    },
    colors: {
      primary: "#10b981",
      secondary: "#06b6d4",
      accent: "#f59e0b",
      background: "#f3f4f6",
      card: "#ffffff",
      muted: "#6b7280",
      border: "#e5e7eb",
    },
    typography: {
      fontFamily: "'Poppins', sans-serif",
      headingWeight: "font-semibold",
      bodyWeight: "font-normal",
    },
    layout: {
      maxWidth: "max-w-sm",
      padding: "p-6",
      spacing: "space-y-4",
    },
  },

  'creative-studio': {
    branding: {
      logo: {
        light: "/brands/creative.svg",
        dark: "/brands/creative-light.svg",
        alt: "Creative Studio",
        height: "h-12",
        width: "w-auto",
      },
      appName: "Creative Studio",
      tagline: "Design & Innovation",
    },
    colors: {
      primary: "#7c3aed",
      secondary: "#a855f7",
      accent: "#ec4899",
      background: "#f5f3ff",
      card: "#ffffff",
      muted: "#9333ea",
      border: "#e9d5ff",
    },
    typography: {
      fontFamily: "'DM Sans', sans-serif",
      headingWeight: "font-bold",
      bodyWeight: "font-normal",
    },
    layout: {
      maxWidth: "max-w-sm",
      padding: "p-6",
      spacing: "space-y-5",
    },
  },
};

export function getBrandTheme(brandId: string): ThemeConfig {
  return brandThemes[brandId] || brandThemes['acme-corp'];
}

// Usage in your app
export function useCurrentBrandTheme(brandId?: string): ThemeConfig {
  const id = brandId || getCurrentBrandId(); // Implement your own logic
  return getBrandTheme(id);
}
```

**Implementation Pattern**:

```typescript
// app/layout.tsx or app/providers.tsx
import { getBrandTheme } from '@/lib/themes/brands';

function InnerProviders({ children, brandId }: { children: React.ReactNode; brandId: string }) {
  const theme = getBrandTheme(brandId);

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}
```

**Use Case**: Multi-tenant platforms, white-label solutions, agency platforms.

---

## Using These Themes

### Import and Use

```typescript
// app/layout.tsx
import { ThemeProvider } from '@payez/next-mvp/theme';
import { lightProfessionalTheme } from '@/lib/themes/light-professional';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider theme={lightProfessionalTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Customize Further

Start with any theme and customize specific properties:

```typescript
import { lightProfessionalTheme } from '@/lib/themes/light-professional';

const myCustomTheme: ThemeConfig = {
  ...lightProfessionalTheme,
  branding: {
    ...lightProfessionalTheme.branding,
    appName: "My Custom App",
  },
  colors: {
    ...lightProfessionalTheme.colors,
    primary: "#my-custom-color",
  },
};
```

---

## Theme Testing Checklist

When implementing any theme, verify:

- ✅ Logo displays correctly on light and dark pages
- ✅ All text is readable (sufficient contrast)
- ✅ Form inputs have visible focus states
- ✅ Error messages stand out
- ✅ Button text is visible on button background
- ✅ Mobile layout looks good (test on small screens)
- ✅ Dark mode doesn't use pure black (#000000) with pure white text (causes strain)
- ✅ Colors are accessible (WCAG AA minimum)

---

## Performance Tip

If you're using many themes, lazy-load theme configurations:

```typescript
// lib/themes/index.ts
export async function loadTheme(name: string): Promise<ThemeConfig> {
  const module = await import(`./${name}.ts`);
  return module[`${name}Theme`] || module.default;
}

// In your component
const theme = await loadTheme('light-professional');
```

---

These examples provide a solid foundation. Mix and match to create your perfect theme!
