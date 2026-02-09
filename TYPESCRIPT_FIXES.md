# TypeScript Fixes Applied to @payez/next-mvp

## Date
2025-10-26

## Issues Fixed

### 1. Import Alias Resolution (`@/` imports)
**Problem:** The package code was using `@/` import aliases which don't resolve in a package context since the consuming app's tsconfig path aliases are not available to the package.

**Files Fixed:**
- `packages/next-mvp/src/lib/jwt-decode.ts`
  - Changed `import { ENV_CONFIG, API_ENDPOINTS } from '@/config/env'` to use relative path
  - Changed `import { log as logger } from '@/config/logger'` to use relative path

**Solution:**
```typescript
// Before
import { ENV_CONFIG, API_ENDPOINTS } from '@/config/env';
import { log as logger } from '@/config/logger';

// After
import { ENV_CONFIG, API_ENDPOINTS } from '../config/env';
import { log as logger } from '../config/logger';
```

### 2. Duplicate Export Conflicts
**Problem:** Multiple API handler files export `POST` and `GET` functions, causing conflicts when all re-exported via `export *` from the main index.

**Files Fixed:**
- `packages/next-mvp/src/index.ts`

**Solution:**
API handlers are NOT exported from the main index. They are consumed via package subpath exports:
```typescript
// Consumers use:
import { POST } from '@payez/next-mvp/api-handlers/auth/login';
// Instead of:
import { POST } from '@payez/next-mvp';
```

The `index.ts` now only exports core library functions and explicitly documents that API handlers are accessed via subpaths.

### 3. NextAuth Session Type Augmentation
**Problem:** The package code expects many custom fields on the NextAuth `Session`, `User`, and `JWT` types that weren't properly declared.

**Files Fixed:**
- `packages/next-mvp/src/types/next-auth.d.ts` - Added comprehensive type augmentation
- `packages/next-mvp/src/lib/auth.ts` - Removed redundant/incomplete type augmentation
- `packages/next-mvp/src/index.ts` - Added import to ensure type augmentation is loaded

**Solution:**
Created comprehensive TypeScript module augmentation in `types/next-auth.d.ts`:

```typescript
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      roles: string[];
      accessToken?: string;
      refreshToken?: string;
      requiresTwoFactor?: boolean;
      twoFactorSessionVerified?: boolean;
      twoFactorMethod?: string | null;
      authenticationMethods?: string[];
      authenticationLevel?: string;
      mfaExpiresAt?: number;
      mfaCompletedAt?: number;
      mfaValidityHours?: number;
      // ... and more
    };
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    sessionToken?: string;
    requiresTwoFactor?: boolean;
    twoFactorSessionVerified?: boolean;
    authenticationMethods?: string[];
    authenticationLevel?: string;
    mfaExpiresAt?: number;
    mfaCompletedAt?: number;
    mfaValidityHours?: number;
    error?: string;
  }

  interface User extends DefaultUser {
    // Similar comprehensive extensions
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    sub?: string;
    sessionToken?: string;
    error?: string;
    requiresTwoFactor?: boolean;
    twoFactorSessionVerified?: boolean;
    authenticationMethods?: string[];
    authenticationLevel?: string;
    mfaExpiresAt?: number;
  }
}
```

## Verification Steps

To verify these fixes work:

1. **Check for remaining `@/` imports:**
   ```bash
   grep -r "from '@/" packages/next-mvp/src
   ```
   Should return no results.

2. **Build a consuming app:**
   ```bash
   cd examples/minimal-app
   npm run build
   ```
   Should complete without TypeScript errors related to missing types or unresolved imports.

3. **Type check the package:**
   If the package had a `tsconfig.json`, run:
   ```bash
   npx tsc --noEmit
   ```

## Impact on Consumers

### ✅ No Breaking Changes
These fixes are internal to the package and don't change the public API.

### ℹ️ Type Safety Improvements
Consumers will now get:
- Better IntelliSense/autocomplete for NextAuth session objects
- Compile-time type checking for all session fields
- Proper type inference when using the package's authentication features

### 📝 Consumer Requirements
For consumers to benefit from the type augmentation:
1. Ensure `@payez/next-mvp` is installed
2. Import from the package in at least one file (TypeScript will pick up the ambient type declarations)
3. The session callbacks should populate the fields defined in the extended Session type

## Related Files

- `/CHANGELOG.md` - Package version history
- `/MIGRATION_GUIDE.md` - Guide for migrating between package versions
- `/packages/next-mvp/src/types/next-auth.d.ts` - Type augmentation source
- `/packages/next-mvp/src/index.ts` - Main package entry point

## Future Recommendations

1. **Add TypeScript to package.json devDependencies** to enable `npm run typecheck`
2. **Add a build script** that compiles TypeScript to catch errors earlier
3. **Configure tsconfig.json** for the package with proper module resolution
4. **Add CI/CD type checking** to catch these issues before merging
