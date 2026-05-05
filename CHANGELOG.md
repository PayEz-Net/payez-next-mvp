# Changelog - PayEz-Next-MVP

All notable changes to this project will be documented in this file.

## [4.1.3] - 2026-05-05

### Fixed
- **Viability route falls back to BA Redis when canonical session-store misses.** Two viability implementations had drifted: `api-handlers/session/viability.ts` already tried `getBetterAuthSession` after `getRedisSession`, but `routes/auth/viability.ts` (the one consumed via `export { GET } from '@payez/next-mvp/routes/auth/viability'`) only checked the canonical store. Any consumer that wrote a Better Auth session record without separately populating the canonical store — magic-link, OAuth callback before token exchange completes, dev-login impersonation flows — would get a `viable:false / Stale session` verdict and a forced redirect to login, even though `getBetterAuthSession` had just resolved the cookie cleanly. The routes/ version now mirrors the api-handlers/ version's two-step lookup.

## [4.1.2] - 2026-05-05

### Added
- **`ensureFreshAccessToken(sessionToken, config)`** in `@payez/next-mvp/lib/ensure-fresh-access-token` — preflight-refreshes the IDP access token if it is within the safety window of expiry, single-flight via the existing Redis refresh lock. Encapsulates the lock-and-refresh dance previously only available inside `createRefreshHandler`, so proxy auth helpers can call it directly instead of letting the backend reject expired tokens with 401.
- **`getFreshIdpToken(request, config)`** in `@payez/next-mvp/server/auth` — request-level convenience wrapper around `ensureFreshAccessToken`. Returns a token that is safe to forward to a downstream API without expecting a 401. Use in proxy routes; on failure, surface a 401/redirect to the user (no recoverable token).
- **`getSessionData(request)`** and **`getIdpToken(request)`** in `@payez/next-mvp/server/auth` — centralized helpers for routes that read session shape or need the currently-issued bearer without performing token lifecycle work. (Originally drafted as 4.0.49; rolled into this release.)
- **OAuth profile fields propagated end-to-end**: `image`, `idpClientId`, and `merchantId` now flow from Better Auth → Redis-backed `SessionData` → `getSessionData`/`getSession` consumers. Fixes avatars and tenant identity dropping at the session boundary.
- **Google OAuth provider params** (`prompt`, `accessType`, `hd`) accepted via `BetterAuthSocialProvider`, with `profile` scope auto-injected for Google so avatar URLs are returned by the userinfo endpoint.

### Fixed
- Prefer normalized Redis-backed session data in `server/auth.getSession` before falling back to Better Auth session fields. Resolves a split where Redis-stored IDP tokens were not visible on the request session object.

### Architecture note
`getIdpToken(request)` is **fail-closed by design** — it returns whatever bearer is currently in the session even if it has expired. This is the right shape for routes that just want to inspect identity. For proxy routes that forward the bearer to a downstream API, **use `getFreshIdpToken`**. A good token-authority client never sends credentials it already knows are invalid; the new helper makes that the easy path.

## [4.1.1] - 2026-04-17

### Added
- **`magicLinkClient()` wired into `authClient`** in `@payez/next-mvp/client/better-auth-client`. Consumers can now call `authClient.signIn.magicLink({ email, callbackURL })` idiomatically instead of POSTing directly to the catch-all route. Typed errors + autocomplete + matches Better Auth's canonical client usage. Server-side contract from 4.1.0 unchanged; 4.1.0 consumers remain wire-compatible.

## [4.1.0] - 2026-04-17

### Added
- **Better Auth `magic-link` plugin support** in `createBetterAuthInstance`. Opt-in via new `CreateBetterAuthInstanceOptions.magicLink` parameter, which accepts Better Auth's `MagicLinkOptions` verbatim — the host app supplies its own `sendMagicLink` callback (typically a fetch to its email service). Omit the `magicLink` option to skip the plugin entirely (backward-compatible; consumers who don't need magic-link see no behavior change).
- **`configureBetterAuth(opts)`** — new exported function that stores instance options for `getBetterAuthInstance()` to apply on first resolve. Call once at app startup (e.g., from Next.js `instrumentation.ts`). Throws if called after the instance has already been resolved.
- Magic-link-created sessions land in the same `ba:{appSlug}:{token}` Redis keyspace as OAuth sessions, so `getBetterAuthSession()`, `authClient.useSession()`, and existing middleware resolve both flows uniformly (fixes the keyspace split where custom magic-link flows wrote sessions outside Better Auth's lookup).

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
