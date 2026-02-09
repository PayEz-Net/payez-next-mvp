# Migration Guide - PayEz-Next-MVP Package Update
**Date**: 2025-10-26  
**Source**: website-membership commit `b3f7438`  
**Previous State**: Broken 2FA flow, missing session validation  
**Current State**: Production-ready auth with all code review fixes

---

## 🚨 BREAKING CHANGES - MUST REINSTALL PACKAGE

The package has been completely rebuilt from website-membership to fix critical authentication issues. You **MUST** uninstall and reinstall the package.

### Quick Reinstall
```bash
# 1. Remove old package
npm uninstall @payez/next-mvp

# 2. Clear node_modules and package-lock
rm -rf node_modules package-lock.json

# 3. Reinstall fresh
npm install @payez/next-mvp@latest

# 4. Update your code per migration steps below
```

---

## 🔥 What Was Fixed

### Critical Issues (Priority 1)
✅ **Sign-out race conditions** - Added `useRef` guard to prevent duplicate sign-out calls  
✅ **PII exposure in logs** - All user IDs and emails now redacted in production  
✅ **Memory leaks** - Added unmount cleanup in `SessionSync`  
✅ **Security** - Generic error codes instead of internal details in URLs

### Important Issues (Priority 2)
✅ **Type assertions removed** - Proper NextAuth module augmentation  
✅ **Runtime validation** - API responses validated at runtime, not just TypeScript  
✅ **Session validation** - Strict validation prevents empty user data bugs  
✅ **2FA token flow** - Correctly handles intermediate tokens during 2FA

---

## 📋 Migration Steps

### Step 1: Update Your `next-auth.d.ts` (if you have one)

The package now exports proper NextAuth types. **Remove** your local `next-auth.d.ts` if it conflicts, or update it to extend the package types:

```typescript
// types/next-auth.d.ts - UPDATED
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      roles: string[];
      twoFactorSessionVerified: boolean;  // ← REQUIRED
      requiresTwoFactor: boolean;         // ← REQUIRED
      twoFactorMethod?: string;
      authenticationMethods?: string[];
      authenticationLevel?: string;
      mfaCompletedAt?: number;
      mfaExpiresAt?: number;
      mfaValidityHours?: number;
    };
    sessionToken?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    expires: string;
    error?: string;
  }
}
```

### Step 2: Update `verify-code` Page

**❌ OLD (BROKEN):**
```typescript
// This is WRONG - tries to call getSession when there's no full session yet
useEffect(() => {
  const fetchMaskedInfo = async () => {
    const session = await getSession();  // ❌ WRONG
    if (!session?.user?.email || !session?.accessToken) {
      console.error('[2FA] No session available for masked info');
      return;
    }
    // ...
  };
  fetchMaskedInfo();
}, []);
```

**✅ NEW (CORRECT):**
```typescript
// Use the session from NextAuth - it EXISTS during 2FA with intermediate token
import { useAuthStore } from '@/stores/authStore';
import { accountApi } from '@payez/next-mvp';

const { session } = useAuthStore();

useEffect(() => {
  if (!session?.accessToken || !session?.user?.email) {
    console.log('[2FA] No access token or email available');
    return;
  }

  const fetchMasked = async () => {
    const response = await accountApi.getMaskedInfo(
      session.user.email,
      session.accessToken  // ← Use the intermediate token from login
    );
    setMaskedInfo(response);
  };

  fetchMasked();
}, [session]);
```

### Step 3: Update `masked-info` API Route

Ensure your masked-info route accepts **POST** (not GET) and uses the Authorization header:

```typescript
// app/api/account/masked-info/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Validate token and fetch masked info from IDP
  // ...
  
  return NextResponse.json({
    success: true,
    data: {
      masked_email: 'u***@example.com',
      masked_phone_number: '***-***-1234',
      has_authenticator: false,
      method: 'email'
    }
  });
}
```

### Step 4: Replace Plain Fetch with `accountApi`

**❌ OLD:**
```typescript
const response = await fetch('/api/account/masked-info');  // ❌ WRONG
```

**✅ NEW:**
```typescript
import { accountApi } from '@payez/next-mvp';

const response = await accountApi.getMaskedInfo(
  session.user.email,
  session.accessToken
);
```

### Step 5: Update Your App Layout

Ensure you're using `SessionSync` from the package:

```typescript
// app/layout.tsx
import { SessionProvider } from 'next-auth/react';
import { SessionSync } from '@payez/next-mvp/components';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SessionSync>
            {children}
          </SessionSync>
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## 🎯 Key Exports from Package

The package now exports these utilities:

```typescript
// Session management
import { 
  AppSession,
  isValidSession, 
  sanitizeSession, 
  SessionService 
} from '@payez/next-mvp/lib/session';

// API clients
import { 
  standardizedApi, 
  isApiSuccess, 
  extractApiData 
} from '@payez/next-mvp/lib/standardized-client-api';

import { accountApi } from '@payez/next-mvp/utils/api';

// Components
import { SessionSync } from '@payez/next-mvp/components';

// Auth store
import { useAuthStore } from '@payez/next-mvp/stores/authStore';
```

---

## 🧪 Testing Checklist

After migration, verify:

- [ ] Login redirects to verify-code page
- [ ] Verify-code page loads masked contact info
- [ ] No "405 Method Not Allowed" errors
- [ ] No console errors about missing session
- [ ] 2FA code submission works
- [ ] After 2FA, user reaches dashboard
- [ ] No PII visible in browser console logs
- [ ] Sign-out works without errors
- [ ] No redirect loops

---

## 🐛 Common Issues

### Issue 1: "No session available for masked info"
**Cause**: Using old pattern with `getSession()`  
**Fix**: Use `useAuthStore()` and access `session` directly (see Step 2)

### Issue 2: 405 Method Not Allowed on masked-info
**Cause**: Route only exports GET, but package expects POST  
**Fix**: Export POST handler (see Step 3)

### Issue 3: TypeScript errors on `session.user.twoFactorSessionVerified`
**Cause**: Old NextAuth type definitions  
**Fix**: Update your `next-auth.d.ts` (see Step 1)

### Issue 4: Redirect loop on login page
**Cause**: SessionSync running on public pages  
**Fix**: Exclude public routes or wrap conditionally

---

## 📞 Support

If you encounter issues:
1. Check the `DOCS_2FA_TOKEN_FLOW.md` for detailed flow explanation
2. Review `CODE_REVIEW_221ff2e2.md` for technical details
3. Ensure you're on the latest package version
4. Verify all migration steps completed

---

## 🎉 What You Get

After migration:
- ✅ Working 2FA flow out of the box
- ✅ Type-safe session handling
- ✅ PII protection in logs
- ✅ Runtime validation for API responses
- ✅ No race conditions or memory leaks
- ✅ Production-ready authentication

---

**Questions?** Contact the team or review the source: `website-membership` commit `b3f7438`
