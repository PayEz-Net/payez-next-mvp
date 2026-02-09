# Theme Harness Specification for @payez/next-mvp

**Version**: 1.0
**Status**: Proposal
**Author**: Claude Code
**Date**: 2025-11-01

---

## Executive Summary

This specification defines a theme harness system that allows MVP package consumers (like Nexus.CryptAply, website-membership) to apply custom branding and theming while maintaining the ability to receive functional updates from the MVP package. This bridges the gap between generic, reusable components and branded, consumer-specific implementations.

## Problem Statement

### Current Challenge
When consumers customize MVP pages (logos, colors, layouts), they break the 1-to-1-1 sync pattern:
- **website-membership** → **PayEz-Next-MVP** → **Nexus.CryptAply**

Once Nexus adds its logo and brand colors to login/profile pages, it can't easily pull updates from MVP without merge conflicts.

### Goals
1. ✅ Allow consumers to apply custom branding (logos, colors, fonts)
2. ✅ Maintain ability to sync functional updates from MVP
3. ✅ Keep MVP package generic and unopinionated
4. ✅ Minimize duplication between MVP and consumer code
5. ✅ Support TypeScript with full type safety
6. ✅ Work with Next.js 14+ App Router

---

## Architecture Overview

### Three-Layer System

```
┌─────────────────────────────────────────┐
│  Consumer App (Nexus.CryptAply)        │
│  - Defines theme config                 │
│  - Wraps MVP components                 │
│  - Applies brand-specific overrides     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Theme Bridge (@payez/next-mvp/theme)  │
│  - Theme context provider               │
│  - Theme hooks                          │
│  - Default theme values                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  MVP Components                         │
│  - Consume theme from context           │
│  - Apply theme values                   │
│  - Remain generic/unopinionated         │
└─────────────────────────────────────────┘
```

---

## Technical Design

### 1. Theme Configuration Schema

```typescript
// packages/next-mvp/src/theme/types.ts

export interface ThemeConfig {
  // Branding
  branding: {
    logo: {
      light: string;        // Path to logo for light backgrounds
      dark: string;         // Path to logo for dark backgrounds
      alt: string;          // Alt text
      height?: string;      // Default: "h-10"
      width?: string;       // Default: "w-auto"
    };
    appName: string;        // "Nexus", "CryptAply", etc.
    tagline?: string;       // Optional tagline
  };

  // Colors (Tailwind classes or hex)
  colors: {
    primary: string;        // Primary brand color
    secondary?: string;     // Secondary brand color
    accent?: string;        // Accent color
    background: string;     // Page background
    card: string;          // Card background
    muted: string;         // Muted text/elements
    border: string;        // Border color
  };

  // Typography
  typography?: {
    fontFamily?: string;   // Font family
    headingWeight?: string; // "font-bold", etc.
    bodyWeight?: string;   // "font-normal", etc.
  };

  // Layout
  layout?: {
    maxWidth?: string;     // "max-w-4xl", etc.
    padding?: string;      // "p-6", etc.
    spacing?: string;      // "space-y-6", etc.
  };

  // Component-specific overrides
  components?: {
    loginPage?: Partial<LoginPageTheme>;
    profilePage?: Partial<ProfilePageTheme>;
    securityPage?: Partial<SecurityPageTheme>;
  };
}

export interface LoginPageTheme {
  cardBackground: string;
  gradient: string;
  buttonColor: string;
  showLogo: boolean;
}

export interface ProfilePageTheme {
  layout: "centered" | "full-width";
  showAvatar: boolean;
}

export interface SecurityPageTheme {
  layout: "centered" | "full-width";
}
```

### 2. Default Theme

```typescript
// packages/next-mvp/src/theme/default.ts

export const defaultTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
      alt: "Logo",
      height: "h-10",
      width: "w-auto",
    },
    appName: "App",
  },
  colors: {
    primary: "#3b82f6",      // blue-500
    background: "bg-gray-50",
    card: "bg-white",
    muted: "text-gray-600",
    border: "border-gray-200",
  },
  layout: {
    maxWidth: "max-w-4xl",
    padding: "p-6",
    spacing: "space-y-6",
  },
};
```

### 3. Theme Context Provider

```typescript
// packages/next-mvp/src/theme/ThemeProvider.tsx

'use client';

import React, { createContext, useContext } from 'react';
import { ThemeConfig, defaultTheme } from './default';
import { mergeDeep } from '../utils/merge';

const ThemeContext = createContext<ThemeConfig>(defaultTheme);

export function ThemeProvider({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme?: Partial<ThemeConfig>;
}) {
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
```

### 4. Theme Hook

```typescript
// packages/next-mvp/src/theme/useTheme.ts

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export function useTheme() {
  return useContext(ThemeContext);
}

// Convenience hooks for specific theme sections
export function useBranding() {
  const theme = useTheme();
  return theme.branding;
}

export function useColors() {
  const theme = useTheme();
  return theme.colors;
}

export function useLayout() {
  const theme = useTheme();
  return theme.layout;
}
```

### 5. Themed Components

```typescript
// packages/next-mvp/src/pages/profile/page.tsx

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../hooks/useProfile';
import { useBranding, useLayout } from '../../theme/useTheme';

export default function ProfilePage() {
  const router = useRouter();
  const { data: profileData, isLoading, error } = useProfile();
  const branding = useBranding();
  const layout = useLayout();

  // Loading state
  if (isLoading || !profileData) {
    return (
      <div className={`bg-gray-50 min-h-screen`}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen`}>
      <div className={`${layout.spacing} ${layout.maxWidth} mx-auto ${layout.padding}`}>
        {/* Header with themed logo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={branding.logo.light}
              alt={branding.logo.alt}
              className={`${branding.logo.height} ${branding.logo.width}`}
            />
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className={`${layout.card} rounded-lg shadow-sm border ${layout.border} ${layout.padding}`}>
          {/* ... rest of component ... */}
        </div>
      </div>
    </div>
  );
}
```

---

## Consumer Implementation

### Example: Nexus.CryptAply Theme

```typescript
// nexus/src/config/theme.ts

import { ThemeConfig } from '@payez/next-mvp/theme';

export const nexusTheme: Partial<ThemeConfig> = {
  branding: {
    logo: {
      light: "/nexus-logo.svg",
      dark: "/nexus-logo-dark.svg",
      alt: "Nexus",
      height: "h-10",
      width: "w-auto",
    },
    appName: "Nexus",
    tagline: "Secure Key Management",
  },
  colors: {
    primary: "#246cac",
    background: "bg-gray-50",
    card: "bg-white",
    muted: "text-gray-600",
    border: "border-gray-200",
  },
  layout: {
    maxWidth: "max-w-4xl",
    padding: "p-6",
    spacing: "space-y-6",
  },
};
```

### Root Layout Integration

```typescript
// nexus/src/app/layout.tsx

import { ThemeProvider } from '@payez/next-mvp/theme';
import { nexusTheme } from '@/config/theme';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={nexusTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Using MVP Components

```typescript
// nexus/src/app/account/profile/page.tsx

// Option 1: Direct import (gets theme from context)
export { default } from '@payez/next-mvp/pages/profile';

// Option 2: Wrap and extend
import { ProfilePage } from '@payez/next-mvp/pages/profile';

export default function NexusProfilePage() {
  return (
    <>
      <NexusBanner />
      <ProfilePage />
      <NexusFooter />
    </>
  );
}
```

---

## Migration Path

### Phase 1: Add Theme Infrastructure to MVP
1. Create `src/theme/` directory in MVP package
2. Implement `ThemeProvider`, `useTheme` hooks
3. Define `ThemeConfig` TypeScript interfaces
4. Export from `@payez/next-mvp/theme`

**Estimated effort**: 4-6 hours

### Phase 2: Update MVP Components
1. Update login page to use theme hooks
2. Update profile page to use theme hooks
3. Update security page to use theme hooks
4. Test with default theme (no breaking changes)

**Estimated effort**: 6-8 hours

### Phase 3: Consumer Integration (Nexus)
1. Create `nexusTheme` configuration
2. Add `ThemeProvider` to root layout
3. Switch to importing MVP components directly
4. Remove duplicated code

**Estimated effort**: 2-3 hours

### Phase 4: Documentation & Examples
1. Write theme customization guide
2. Add example theme configs
3. Document all theme options
4. Create migration guide for consumers

**Estimated effort**: 3-4 hours

**Total estimated effort**: 15-21 hours

---

## Benefits

### For MVP Package
- ✅ Remains generic and unopinionated
- ✅ Single source of truth for component logic
- ✅ Easier to maintain and test
- ✅ Can push functional updates to consumers

### For Consumers (Nexus, etc.)
- ✅ Easy branding without forking code
- ✅ Receive functional updates from MVP
- ✅ Type-safe theme configuration
- ✅ Consistent branding across all pages
- ✅ Minimal code duplication

### For the Ecosystem
- ✅ Maintains 1-to-1-1 pattern
- ✅ Faster onboarding for new consumers
- ✅ Shared best practices
- ✅ Easier to build new consumer apps

---

## Advanced Features (Future)

### 1. Runtime Theme Switching
```typescript
const { setTheme } = useTheme();
setTheme({ colors: { primary: '#ff0000' } });
```

### 2. Dark Mode Support
```typescript
export const nexusTheme: ThemeConfig = {
  colors: {
    primary: {
      light: '#246cac',
      dark: '#4a9fe5',
    },
    // ...
  }
};
```

### 3. Component Slots
```typescript
// Allow consumers to replace entire sections
<ProfilePage
  header={<CustomHeader />}
  avatar={<CustomAvatar />}
/>
```

### 4. CSS-in-JS Integration
```typescript
// Support styled-components, emotion, etc.
export const nexusTheme = {
  styled: {
    primary: '#246cac',
    // ...
  }
};
```

---

## Testing Strategy

### Unit Tests
- Test `ThemeProvider` context propagation
- Test `useTheme` hook return values
- Test theme merging logic (deep merge)
- Test default theme values

### Integration Tests
- Test themed component rendering
- Test theme overrides work correctly
- Test missing theme values fall back to defaults

### Visual Regression Tests
- Screenshot tests with default theme
- Screenshot tests with custom theme
- Verify branding elements appear correctly

---

## Security Considerations

1. **Logo Paths**: Validate logo paths to prevent XSS
2. **Color Values**: Sanitize hex/CSS color values
3. **Content Security Policy**: Ensure inline styles work with CSP
4. **TypeScript**: Use strict typing to prevent invalid configs

---

## Package Exports

```json
// packages/next-mvp/package.json
{
  "exports": {
    "./theme": {
      "types": "./dist/theme/index.d.ts",
      "default": "./dist/theme/index.js"
    },
    "./theme/ThemeProvider": {
      "types": "./dist/theme/ThemeProvider.d.ts",
      "default": "./dist/theme/ThemeProvider.js"
    }
  }
}
```

---

## Open Questions

1. **CSS Variables vs Tailwind Classes**: Should we support both?
2. **Font Loading**: How do we handle custom fonts from consumers?
3. **Animation Preferences**: Should theme include motion settings?
4. **Accessibility**: Should theme include a11y overrides?
5. **i18n Integration**: How does theme interact with translations?

---

## Success Metrics

- [ ] All MVP pages use theme system
- [ ] Nexus successfully applies custom theme
- [ ] Zero duplicate component code between MVP and Nexus
- [ ] Nexus can pull MVP updates without merge conflicts
- [ ] Theme config has 100% TypeScript coverage
- [ ] Documentation is complete with examples
- [ ] At least 2 consumers using theme system

---

## References

- Next.js Theming: https://nextjs.org/docs/app/building-your-application/styling
- React Context: https://react.dev/reference/react/useContext
- Tailwind CSS: https://tailwindcss.com/docs/theme
- Design Tokens: https://www.w3.org/community/design-tokens/

---

## Appendix A: File Structure

```
packages/next-mvp/
├── src/
│   ├── theme/
│   │   ├── index.ts              # Main export
│   │   ├── types.ts              # ThemeConfig interface
│   │   ├── default.ts            # Default theme
│   │   ├── ThemeProvider.tsx     # Context provider
│   │   ├── useTheme.ts           # Theme hooks
│   │   └── utils.ts              # Merge/helper functions
│   ├── pages/
│   │   ├── profile/
│   │   │   └── page.tsx          # Uses theme hooks
│   │   └── ...
│   └── ...
└── docs/
    └── THEME_CUSTOMIZATION.md    # Consumer guide
```

---

## Appendix B: Example Themes

### Minimal Theme
```typescript
export const minimalTheme: Partial<ThemeConfig> = {
  branding: {
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
      alt: "My App",
    },
    appName: "My App",
  },
};
```

### Full Custom Theme
```typescript
export const customTheme: ThemeConfig = {
  branding: {
    logo: {
      light: "/brand-light.svg",
      dark: "/brand-dark.svg",
      alt: "Custom Brand",
      height: "h-12",
      width: "w-auto",
    },
    appName: "Custom App",
    tagline: "Your Secure Solution",
  },
  colors: {
    primary: "#8b5cf6",
    secondary: "#ec4899",
    accent: "#10b981",
    background: "bg-slate-900",
    card: "bg-slate-800",
    muted: "text-slate-400",
    border: "border-slate-700",
  },
  typography: {
    fontFamily: "font-inter",
    headingWeight: "font-extrabold",
    bodyWeight: "font-normal",
  },
  layout: {
    maxWidth: "max-w-7xl",
    padding: "p-8",
    spacing: "space-y-8",
  },
};
```

---

**End of Specification**

---

## Implementation Checklist

- [ ] Review and approve specification
- [ ] Create GitHub issue with spec link
- [ ] Implement Phase 1: Theme Infrastructure
- [ ] Implement Phase 2: Update MVP Components
- [ ] Implement Phase 3: Nexus Integration
- [ ] Implement Phase 4: Documentation
- [ ] Write tests
- [ ] Deploy to production
- [ ] Celebrate with martinis 🍸
