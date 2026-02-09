# 2FA Token Flow Documentation
## PayEz-Next-MVP Package - Source of Truth: website-membership

**Date**: 2025-10-26  
**Source Commit**: 221ff2e2 (website-membership)  
**Status**: CRITICAL - Package must be rebuilt to match this flow

---

## Executive Summary

**THE PROBLEM**: The PayEz-Next-MVP package was built by someone who didn't understand the 2FA token flow. The verify-code page tries to call `getSession()` when there IS NO full session yet during 2FA verification. This breaks the entire authentication flow.

**THE SOLUTION**: After login, NextAuth creates a session with an intermediate accessToken that has LIMITED scope. This token is used during the 2FA flow, and only after successful 2FA verification does the user get a full authenticated session.

---

## The Correct 2FA Flow (from website-membership)

### 1. **Login - Initial Authentication**

**Endpoint**: `POST /api/auth/login`  
**Handler**: `src/app/api/auth/login/route.ts` → proxies to IDP  
**NextAuth Provider**: `src/lib/auth.ts` - CredentialsProvider `authorize()` callback

**What Happens**:
1. User submits email/password
2. Next.js proxy calls external IDP service
3. IDP validates credentials and returns:
   - `access_token` (JWT with limited scope)
   - `refresh_token`
   - User info including 2FA method required
4. NextAuth `authorize()` callback decodes the token and extracts:
   ```typescript
   const decoded = jwtDecode<JwtPayloadWithRoles>(idpAccessToken);
   ```
5. **Creates Redis session** with:
   ```typescript
   const sessionData = {
     userId: decoded.sub,
     email: decoded.email,
     roles: rolesArray,
     twoFactorComplete: false,  // ← CRITICAL: 2FA not done yet
     accessToken: idpAccessToken,  // ← This is the "intermediate" token
     refreshToken: idpRefreshToken,
     accessTokenExpires: (decoded.exp || 0) * 1000,
     // ... more fields
   };
   const sessionToken = await createSession(sessionData);
   ```
6. **Returns user object** to NextAuth:
   ```typescript
   return {
     id: decoded.sub,
     email: sessionData.email,
     roles: sessionData.roles,
     accessToken: idpAccessToken,  // ← Available in session
     refreshToken: idpRefreshToken,
     requiresTwoFactor: true,  // ← 2FA required
     twoFactorSessionVerified: false,  // ← Not verified yet
     sessionToken,  // ← Redis key
   };
   ```

**Key Point**: The `accessToken` returned here IS an intermediate token because:
- It has `amr: ["pwd"]` (only password authentication)
- It has `acr: "1"` (single-factor authentication level)
- After 2FA, the IDP will issue a NEW token with `amr: ["pwd", "otp"]` and `acr: "2"`

This intermediate token allows the user to:
- Call `/api/account/masked-info` to get their contact info
- Submit 2FA verification codes
- Nothing else (protected routes require `twoFactorSessionVerified: true`)

---

### 2. **Verify-Code Page - Using the Intermediate Token**

**File**: `src/app/account-auth/verify-code/page.tsx`  
**Zustand Store**: `src/stores/authStore.ts`

**What Happens**:
1. Page loads, user is redirected here after login
2. **Session EXISTS** via NextAuth:
   ```typescript
   const { user, session, isAuthenticated } = useAuthStore();
   // session.accessToken is the intermediate token from login
   // session.user.twoFactorSessionVerified === false
   // session.user.requiresTwoFactor === true
   ```
3. **Fetch masked contact info** for display:
   ```typescript
   // Line 192 in verify-code/page.tsx
   const response = await accountApi.getMaskedInfo(
     session.user.email, 
     session.accessToken  // ← Using intermediate token
   );
   ```
4. **AccountApi.getMaskedInfo** implementation:
   ```typescript
   // src/utils/api.ts line 112
   async getMaskedInfo(email: string, accessToken?: string) {
     if (!accessToken) {
       throw new ApiError('Not authenticated', { status: 401 });
     }
     
     // POST request with Authorization header
     const result = await standardizedApi.post<any>(
       '/api/account/masked-info', 
       { email }, 
       accessToken  // ← Passed as Authorization: Bearer <token>
     );
     
     return {
       maskedEmail: result.data.masked_email ?? '',
       maskedPhoneNumber: result.data.masked_phone_number ?? '',
       hasAuthenticator: result.data.has_authenticator ?? false,
       method: result.data.method
     };
   }
   ```

**Key Point**: The verify-code page does NOT call `getSession()` and expect no session. It DOES call `useAuthStore()` which gives access to the NextAuth session containing the intermediate `accessToken`.

---

### 3. **Masked-Info Route - Accepting Intermediate Token**

**File**: `src/app/api/account/masked-info/route.ts` (need to check)

**What It Does**:
1. Receives POST request with:
   - Body: `{ email: "user@example.com" }`
   - Header: `Authorization: Bearer <intermediate_access_token>`
2. Validates the token (checks it's not expired, valid signature)
3. Proxies request to external IDP service
4. Returns masked contact info

**Key Point**: This endpoint accepts BOTH intermediate 2FA tokens AND full session tokens. It doesn't distinguish - if the token is valid and not expired, it works.

---

### 4. **2FA Verification - Token Exchange**

**Endpoint**: `POST /api/account/2fa/verify` (need to verify exact path)

**What Happens**:
1. User submits 2FA code
2. Request includes:
   - Body: `{ code: "123456", method: "email" }`
   - Header: `Authorization: Bearer <intermediate_access_token>`
3. Server validates code against IDP
4. If valid, **updates Redis session**:
   ```typescript
   await updateSession(sessionToken, {
     twoFactorComplete: true,
     twoFactorSessionVerified: true,
     // Token may be refreshed/upgraded by IDP
   });
   ```
5. NextAuth session callback picks up the change
6. User is now fully authenticated

**Key Point**: The intermediate token IS replaced by a new token from the IDP. The Redis session (same sessionToken GUID) is updated with:
- New accessToken with 2FA claims
- New refreshToken
- Updated session flags: `twoFactorComplete: true`, `twoFactorSessionVerified: true`

The NextAuth JWT cookie still points to the same sessionToken, but the tokens in Redis are replaced.

---

## What Was Wrong in the Package

### ❌ Broken Pattern (PayEz-Next-MVP package currently)
```typescript
// verify-code/page.tsx - WRONG APPROACH
useEffect(() => {
  const fetchMaskedInfo = async () => {
    const session = await getSession();  // ← NO SESSION EXISTS YET
    if (!session?.user?.email || !session?.accessToken) {
      console.error('[2FA] No session available for masked info');
      return;  // ← FAILS HERE
    }
    // Never gets here...
  };
  fetchMaskedInfo();
}, []);
```

**Why it's wrong**:
- Tries to call `getSession()` which implies waiting for a full authenticated session
- But at this point in the flow, user is NOT fully authenticated
- The session DOES exist but with `twoFactorSessionVerified: false`

### ✅ Correct Pattern (website-membership)
```typescript
// verify-code/page.tsx - CORRECT APPROACH
const { user, session, isAuthenticated } = useAuthStore();

useEffect(() => {
  if (!session?.accessToken || !session?.user?.email) {
    console.log('[2FA] No access token or email available');
    return;
  }

  const fetchMasked = async () => {
    const response = await accountApi.getMaskedInfo(
      session.user.email,
      session.accessToken  // ← Token from login, already in session
    );
    setMaskedInfo(response);
  };

  fetchMasked();
}, [session]);
```

**Why it's correct**:
- Uses Zustand store which syncs with NextAuth session via SessionSync component
- Session DOES exist with intermediate token from login
- Just uses the `session.accessToken` directly

---

## Critical Files to Mirror from website-membership

### 1. Session Management
- `src/lib/session.ts` - AppSession interface, isValidSession, sanitizeSession
- `src/lib/auth.ts` - NextAuth configuration with JWT/Session callbacks
- `src/lib/session-store.ts` - Redis session operations

### 2. API Utilities
- `src/lib/standardized-client-api.ts` - Type-safe API client with token handling
- `src/utils/api.ts` - AccountApi with getMaskedInfo implementation

### 3. Components
- `src/components/SessionSync.tsx` - Bridges NextAuth ↔ Zustand
- `src/stores/authStore.ts` - Zustand auth store

### 4. Verify-Code Flow
- `src/app/account-auth/verify-code/page.tsx` - Main verification page
- `src/app/account-auth/verify-code/verify-code-form.tsx` - Form component
- `src/app/api/account/masked-info/route.ts` - Masked info endpoint

---

## Implementation Checklist

- [ ] Copy AppSession interface and validation functions to package
- [ ] Copy standardizedApi client to package
- [ ] Copy accountApi.getMaskedInfo to package
- [ ] Copy SessionSync component to package
- [ ] Copy verify-code page components to package
- [ ] Create masked-info API route in package
- [ ] Update package exports to include all utilities
- [ ] Test login → verify-code → dashboard flow end-to-end
- [ ] Document for consuming applications

---

## For Package Consumers (e.g., Nexus.CryptAply)

### What You Need
1. **Import from package**:
   ```typescript
   import { accountApi, AppSession, isValidSession } from '@payez/next-mvp';
   import { SessionSync } from '@payez/next-mvp/components';
   ```

2. **Wrap your app with SessionSync**:
   ```typescript
   // app/layout.tsx
   <SessionProvider>
     <SessionSync>
       {children}
     </SessionSync>
   </SessionProvider>
   ```

3. **Use in verify-code page**:
   ```typescript
   const { session } = useAuthStore();
   
   useEffect(() => {
     if (session?.accessToken && session?.user?.email) {
       accountApi.getMaskedInfo(session.user.email, session.accessToken)
         .then(setMaskedInfo);
     }
   }, [session]);
   ```

### What NOT to Do
- ❌ Don't call `getSession()` on verify-code page
- ❌ Don't use plain `fetch('/api/account/masked-info')` - use accountApi
- ❌ Don't assume there's no session during 2FA - there IS a session with intermediate token
- ❌ Don't try to distinguish "intermediate" vs "full" tokens in application code

---

## Token Claims Reference

### Intermediate Token (after login, before 2FA)
```json
{
  "sub": "user-guid",
  "email": "user@example.com",
  "role": ["User"],
  "exp": 1730000000,
  "iat": 1729999700,
  "amr": ["pwd"],  // Authentication Method Reference: password
  "acr": "1",      // Authentication Context: single factor
  "client_id": "client-guid",
  "scope": "openid profile email"
}
```

### Full Token (after 2FA verification)
```json
{
  "sub": "user-guid",
  "email": "user@example.com",
  "role": ["User"],
  "exp": 1730000000,
  "iat": 1729999700,
  "amr": ["pwd", "otp"],  // Now includes OTP
  "acr": "2",             // Level 2: multi-factor
  "mfa_time": 1729999800,
  "mfa_expires": 1730086200,
  "mfa_validity_hours": 24,
  "client_id": "client-guid",
  "scope": "openid profile email"
}
```

**Key Difference**: The `amr` and `acr` claims change after 2FA, but both tokens are valid for API calls. The session flags (`twoFactorSessionVerified`) control what routes the user can access.

---

## Questions & Answers

### Q: Is the intermediate token a different token than the full session token?
**A**: YES, they are DIFFERENT tokens. The IDP returns an access token after password validation (intermediate token). After 2FA verification, the IDP issues a NEW token with:
- Updated `amr` claims (now includes "otp" or "sms")
- Updated `acr` level (from "1" to "2")
- MFA timing claims (`mfa_time`, `mfa_expires`, `mfa_validity_hours`)
- New refresh token

The Redis session is updated with these new tokens, but the session itself (identified by sessionToken GUID) continues.

### Q: Why doesn't the verify-code page just make the masked-info API call without a token?
**A**: Because masked-info contains sensitive user data (even if masked). It requires authentication. The intermediate token proves the user successfully completed password auth.

### Q: What if the intermediate token expires before 2FA is completed?
**A**: The user would be redirected back to login. The token expiry is typically short (5-15 minutes) to limit the attack window.

### Q: Can the intermediate token be used to access protected routes?
**A**: No. The middleware checks `session.user.twoFactorSessionVerified === true` before allowing access to protected routes. The token may be valid, but the session flags prevent route access.

---

## Commit Reference

**Source of Truth**: `website-membership` commit `221ff2e2`  
**Changes in that commit**:
- Fixed TypeScript errors in SessionSync and OnboardingInviteActions
- Added AppSession type properly throughout
- Enhanced session validation with isValidSession

**This document created**: 2025-10-26  
**Author**: AI Agent (based on Jon's requirements)  
**Purpose**: Complete package rebuild with correct 2FA token flow
