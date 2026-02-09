# NEXTPERT ASSIGNMENT: UserAvatarMenu Component for MVP

## Overview

Add a reusable `UserAvatarMenu` component to the `@payez/next-mvp` package. This is a dropdown menu triggered by clicking a user avatar that shows profile options and sign out.

**Priority:** High
**Repo:** `E:\Repos\PayEz-Next-MVP`

## Reference Implementations

Two existing implementations to reference:

1. **nexus.cryptaply** (Tailwind + Radix UI): `E:\Repos\nexus.cryptaply\src\components\account\UserAvatarMenu.tsx`
2. **website-membership** (MUI): `E:\Repos\website-membership\src\components\nav\UserAvatarMenu.tsx`

Use the **nexus.cryptaply version** as the base - it uses Tailwind and Radix UI which aligns with MVP patterns.

## Requirements

### Component: `UserAvatarMenu`

**Location:** `packages/next-mvp/src/components/account/UserAvatarMenu.tsx`

**Props:**
```typescript
interface UserAvatarMenuProps {
  // Base path for navigation (e.g., '/dashboard', '/account')
  basePath?: string;

  // Menu items to show (defaults to all)
  showProfile?: boolean;    // default: true
  showSettings?: boolean;   // default: true
  showSecurity?: boolean;   // default: true

  // Custom menu items (optional)
  customItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
  }>;

  // Callbacks
  onSignOut?: () => void;  // Override default signOut behavior
}
```

**Features:**
1. Shows user initial in circular avatar (first letter of email)
2. Dropdown menu with:
   - User email (disabled/label)
   - Divider
   - Profile link
   - Settings link
   - Security link
   - Divider
   - Sign Out (red text)
3. Theme-aware styling (dark/light mode support)
4. Loading state (skeleton/pulse)
5. Returns null if not authenticated

### Styling Requirements

Must be **theme-aware** - support both dark and light modes. Use CSS variables or conditional classes based on theme context.

**Dark mode (default):**
- Background: `bg-slate-900` / `#0a1a2e`
- Border: `border-slate-700` / `#1e3a5f`
- Text: white
- Hover: `bg-slate-800` / `#1e3a5f`

**Light mode:**
- Background: `bg-white`
- Border: `border-gray-200`
- Text: `text-gray-800`
- Hover: `bg-gray-100`

### Dependencies

The MVP already has these available:
- `next-auth/react` for `useSession` and `signOut`
- `lucide-react` for icons (User, Settings, Shield, LogOut)

You'll need to add a simple dropdown component or use Radix UI primitives. Check what's already in the MVP.

## Export Location

Export from: `packages/next-mvp/src/components/account/index.ts`

Add to main exports in `packages/next-mvp/src/index.ts`:
```typescript
export { UserAvatarMenu } from './components/account';
```

## Usage Example

```tsx
// In a Navigation component
import { UserAvatarMenu } from '@payez/next-mvp';

export function Navigation() {
  return (
    <nav className="...">
      <Logo />
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <UserAvatarMenu basePath="/account" />
      </div>
    </nav>
  );
}
```

## Testing

After implementation:
1. Verify it shows loading state while session loads
2. Verify it shows avatar with correct initial when logged in
3. Verify dropdown opens/closes correctly
4. Verify navigation works for Profile/Settings/Security
5. Verify Sign Out works
6. Verify it returns null when not authenticated
7. Test in both dark and light themes

## Version Bump

After completing, bump MVP version to `2.6.15`:
```bash
cd packages/next-mvp
npm version patch
npm pack
```

Then update consuming apps (idealresume.online, website-membership, nexus.cryptaply).

## Files to Create/Modify

1. **CREATE:** `packages/next-mvp/src/components/account/UserAvatarMenu.tsx`
2. **CREATE:** `packages/next-mvp/src/components/account/index.ts`
3. **MODIFY:** `packages/next-mvp/src/index.ts` - add export
4. **MODIFY:** `packages/next-mvp/package.json` - version bump

## Questions?

Reach out to BAPert if unclear on any requirements.
