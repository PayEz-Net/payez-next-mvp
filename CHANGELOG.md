# Changelog - PayEz-Next-MVP

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-10-26

### 🚨 BREAKING CHANGES
Complete rebuild from website-membership source. **MUST uninstall and reinstall package.**

### ✨ Added
- **SessionSync Component** - Proper NextAuth ↔ Zustand bridge with validation
  - Sign-out guard prevents duplicate calls
  - Unmount cleanup prevents memory leaks
  - PII redaction in all console logs
  - Strict session validation with `isValidSession()`

- **Runtime API Validation**
  - `parseClientListResponse()` - Validates client list payloads
  - `parseAuthorizationsResponse()` - Validates authorization payloads
  - Graceful fallbacks on unexpected API shapes
  - Warnings logged when payload structure doesn't match

- **NextAuth Module Augmentation**
  - Proper TypeScript types for all session fields
  - No more type assertions needed
  - `twoFactorSessionVerified`, `authenticationMethods`, `mfaExpiresAt`, etc.

- **API Utilities**
  - `accountApi.getMaskedInfo()` - Fetches masked contact info during 2FA
  - `standardizedApi` client with proper token handling
  - Type-safe response extraction with `extractApiData()`

- **Session Utilities**
  - `isValidSession()` - Type guard for session validation
  - `sanitizeSession()` - Cleans and validates session data
  - `SessionService` - Static methods for role checks, 2FA status, etc.

### 🔧 Fixed
- **2FA Token Flow** - Correctly handles intermediate tokens
  - After login, session EXISTS with `accessToken` (intermediate token)
  - `verify-code` page uses this token to fetch masked info
  - After 2FA verification, IDP issues new token with MFA claims
  - Session continues with updated tokens

- **Security Issues**
  - PII never exposed in production logs
  - User IDs redacted in development (first 8 chars only)
  - Emails always fully redacted (`***@***`)
  - Generic error codes in URLs instead of implementation details

- **Race Conditions**
  - Duplicate sign-out calls prevented with `useRef` guard
  - Proper cleanup on component unmount
  - Debounced session updates

- **Type Safety**
  - No more `as any` or `as AppSession` casts (except controlled error logging)
  - Proper NextAuth types throughout
  - Runtime validation complements TypeScript types

### 📚 Documentation
- `MIGRATION_GUIDE.md` - Step-by-step migration instructions
- `DOCS_2FA_TOKEN_FLOW.md` - Detailed 2FA flow explanation
- `CODE_REVIEW_221ff2e2.md` - Technical review of all changes

### 🗑️ Removed/Deprecated
- Old `SessionModel` class pattern (use `AppSession` interface)
- Type assertions in SessionSync
- Unsafe logging of PII

### 📦 Package Exports

```typescript
// Session management
export { AppSession, isValidSession, sanitizeSession, SessionService } from './lib/session';

// API clients
export { standardizedApi, isApiSuccess, extractApiData } from './lib/standardized-client-api';
export { accountApi } from './utils/api';

// Components
export { SessionSync } from './components/SessionSync';

// Stores
export { useAuthStore } from './stores/authStore';

// Types
export type { TwoFactorMethod } from './types/security';
```

---

## [1.0.0] - Previous Version

### Known Issues (FIXED in 2.0.0)
- ❌ Verify-code page called `getSession()` when session didn't exist
- ❌ Missing session validation caused empty user data bugs
- ❌ No runtime validation for API responses
- ❌ PII exposed in console logs
- ❌ Race conditions in sign-out flow
- ❌ Type assertions everywhere instead of proper types

---

## Migration from 1.x to 2.x

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions.

**Summary**:
1. Uninstall and reinstall package
2. Update `next-auth.d.ts` with new session fields
3. Fix `verify-code` page to use `useAuthStore()` instead of `getSession()`
4. Update `masked-info` API route to use POST
5. Replace plain fetch with `accountApi.getMaskedInfo()`

---

## Source of Truth

This package is extracted from `website-membership` repository:
- **Commit**: `b3f7438`
- **Branch**: `ten-seventeen-stage`
- **Date**: 2025-10-26

Keep package in sync with website-membership for all auth-related changes.
