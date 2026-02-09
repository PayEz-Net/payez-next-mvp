# Theme Harness Implementation Status

**Date**: 2025-11-02  
**Status**: Phase 1 Complete - Token System & Harness Built ✅

---

## ✅ Completed

### Token System
- **Base Tokens** (`src/theme/tokens/base.ts`)
  - Semantic color tokens (brand, backgrounds, text, feedback, borders)
  - Typography scale (font families, sizes, line heights, letter spacing)
  - Border radius scale  
  - Spacing scale (0-24 + container widths + gutters)
  - Elevation (shadows)
  - Transitions (durations + easing functions)
  - Z-index layers
  - Opacity levels

- **Dashboard Tokens** (`src/theme/tokens/dashboard.ts`)
  - Aligned to Nexus CryptAply dashboard at `http://localhost:3300/dashboard/`
  - Dark-first color palette matching `globals.css`
  - HSL values extracted from Tailwind config
  - Success/warning/danger feedback colors
  - Shadows and border radius from design system

- **Token Utilities** (`src/theme/tokens/utils.ts`)
  - `mergeTokens()` - Deep merge token sets
  - `tokensToCSSVars()` - Convert to CSS custom properties
  - `cssVar()` - Generate CSS variable reference strings
  - `toRGB()` - Color conversion for opacity manipulation
  - HSL to RGB conversion helpers

### ThemeHarness Component
- **ThemeHarness** (`src/theme/ThemeHarness.tsx`)
  - Injects tokens as CSS variables via inline styles
  - Provides theme context (`useThemeHarness()`, `useTokens()`)
  - Supports props: `brand`, `mode`, `density`, `radius`, `tokens`, `debug`, `className`
  - Data attributes for styling: `data-theme`, `data-mode`, `data-density`, `data-radius`

### Backward Compatibility
- **Existing `useColors()` hook updated** to:
  - Try new token system first (returns CSS variable references)
  - Fall back to legacy ThemeProvider if harness not present
  - Zero breaking changes for existing consumers

### Exports
- Updated `src/theme/index.ts` to export:
  - New harness: `ThemeHarness`, `useThemeHarness`, `useTokens`
  - Token system: `TokenSet`, `baseTokens`, `dashboardTokens`, `mergeTokens`, `tokensToCSSVars`, `cssVar`
  - Legacy: `ThemeProvider`, `useTheme`, `useBranding`, `useColors`, etc. (unchanged)

---

## 🚧 In Progress / Next Steps

### 1. Wire Harness in Nexus Root Layout
Update `E:\Repos\Nexus.CryptAply\src\app\layout.tsx`:
```tsx
import { ThemeHarness, dashboardTokens } from '@payez/next-mvp/theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <ThemeHarness brand="cryptaply" tokens={dashboardTokens} mode="dark">
            {children}
          </ThemeHarness>
        </Providers>
      </body>
    </html>
  );
}
```

### 2. Update Auth Pages to Use Token-Based Classes
Current auth pages at:
- `src/app/account-auth/login/page.tsx`
- `src/app/account-auth/recovery/page.tsx`
- `src/app/account-auth/verify-code/page.tsx`

Change hardcoded colors to CSS variables:
- `bg-gray-50` → `style={{ background: 'var(--bg-default)' }}`
- `bg-white` → `style={{ background: 'var(--bg-card)' }}`
- `text-gray-600` → `style={{ color: 'var(--text-muted)' }}`
- `border-gray-300` → `style={{ borderColor: 'var(--border-default)' }}`

Or simpler: create utility classes in `globals.css`:
```css
.bg-themed {
  background: var(--bg-default);
}
.bg-card-themed {
  background: var(--bg-card);
}
.text-themed {
  color: var(--text-primary);
}
.text-muted-themed {
  color: var(--text-muted);
}
.border-themed {
  border-color: var(--border-default);
}
```

### 3. Add Nexus Logo/Branding
Create or update branding config in `src/config/theme.ts`:
```ts
export const nexusBrandTokens = {
  // Override specific tokens for branding
  colors: {
    'brand-primary': '#your-brand-color',
  }
};
```

Add logo to auth pages by updating the MVP login/recovery/verify pages or creating wrapper components.

### 4. Build & Test
```bash
cd E:\Repos\PayEz-Next-MVP\packages\next-mvp
npm run build
```

Then in Nexus:
```bash
cd E:\Repos\Nexus.CryptAply
npm run dev
```

Visit:
- `http://localhost:3300/account-auth/login`
- `http://localhost:3300/account-auth/recovery`
- `http://localhost:3300/account-auth/verify-code`
- `http://localhost:3300/dashboard` (should match)

---

## 📁 File Structure

```
E:\Repos\PayEz-Next-MVP\packages\next-mvp\src\theme\
├── tokens/
│   ├── base.ts           # Base token definitions
│   ├── dashboard.ts      # Dashboard-aligned tokens
│   ├── utils.ts          # Token utilities
│   └── index.ts          # Barrel export
├── ThemeHarness.tsx      # Main harness component
├── ThemeProvider.tsx     # Legacy provider (unchanged)
├── useTheme.ts           # Hooks (updated for harness)
├── types.ts              # Legacy types
├── default.ts            # Legacy default theme
├── utils.ts              # Legacy utils
└── index.ts              # Main barrel export
```

---

## 🎯 Design Tokens Available

### Colors
- Brand: `--brand-primary`, `--brand-accent`, `--brand-on-brand`
- Backgrounds: `--bg-default`, `--bg-card`, `--bg-muted`, `--bg-overlay`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`
- Interactive: `--link-default`, `--link-hover`
- Feedback: `--success`, `--warning`, `--danger`, `--info` + foreground variants
- Borders: `--border-default`, `--border-muted`, `--border-focus`
- Ring: `--ring`

### Typography
- Families: `--font-family-sans`, `--font-family-mono`
- Sizes: `--font-size-xs` through `--font-size-4xl`
- Line heights: `--line-height-tight/normal/relaxed`
- Letter spacing: `--letter-spacing-tight/normal/wide`

### Layout
- Radius: `--radius-none/sm/md/lg/xl/pill`
- Spacing: `--spacing-0` through `--spacing-24`
- Containers: `--container-sm/md/lg/xl/2xl`
- Gutters: `--gutter-x`, `--gutter-y`

### Elevation
- Shadows: `--shadow-sm/md/lg/xl/2xl/card/premium`

### Transitions
- Durations: `--duration-fast/normal/slow`
- Easing: `--easing-smooth/bounce`

### Z-Index
- Layers: `--z-dropdown/sticky/fixed/modal/popover/toast`

### Opacity
- Levels: `--opacity-disabled/hover/muted`

---

## 🎨 Usage Examples

### In Components
```tsx
import { useTokens } from '@payez/next-mvp/theme';

export function MyComponent() {
  const tokens = useTokens();
  
  return (
    <div style={{ 
      background: tokens.colors['bg-card'],
      color: tokens.colors['text-primary'],
      borderRadius: tokens.radius['radius-lg']
    }}>
      Content
    </div>
  );
}
```

### With Tailwind (via CSS Variables)
```tsx
<div className="bg-[var(--bg-card)] text-[var(--text-primary)] rounded-[var(--radius-lg)]">
  Content
</div>
```

### With Utility Classes (after adding to globals.css)
```tsx
<div className="bg-card-themed text-themed rounded-lg">
  Content
</div>
```

---

## 🔄 Migration Path

1. ✅ Build token system in MVP package
2. ✅ Create ThemeHarness component
3. ✅ Update existing hooks for compatibility
4. 🚧 Wire harness into Nexus root layout
5. 🚧 Update auth pages to use tokens
6. 🚧 Add branding (logo, colors)
7. ⏳ Extend to non-auth pages (marketing, dashboard, 404/500)
8. ⏳ Document usage for team
9. ⏳ Add visual regression tests

---

## 📝 Notes

- **Zero Breaking Changes**: Existing code using `ThemeProvider` and `useColors()` continues to work
- **Progressive Enhancement**: Can adopt harness gradually, page by page
- **Future-Proof**: Visual tweaks happen via token overrides, not code changes
- **Tailwind Compatible**: CSS variables work with Tailwind's arbitrary value syntax
- **Dark Mode Ready**: Tokens already aligned to dark-first dashboard palette

---

**Ready for integration!** 🚀

Next: Wire into Nexus layout and see the magic happen.
