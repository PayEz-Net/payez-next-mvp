# JWT & Redis Session System Audit

## Executive Summary

The JWT decoding and Redis session system has accumulated technical debt over a year of development. While functional, several architectural gaps and inconsistencies have emerged that impact security, maintainability, and debugging capabilities.

**Critical Issue Identified:** JWT header (`kid`) is never extracted - only the payload is decoded. This causes the system to lack knowledge of which cryptographic key was used to sign tokens.

---

## Architecture Overview

### Current Data Flow
```
1. User authenticates (credentials or OAuth)
2. IDP returns JWT access_token + refresh_token
3. decodeIdpAccessToken() decodes PAYLOAD ONLY
4. Session created in Redis with decoded payload
5. redisSessionId stored in NextAuth JWT cookie
6. Subsequent requests: cookie → redisSessionId → Redis → tokens
```

### Key Files
| File | Purpose |
|------|---------|
| `lib/jwt-decode.ts` | Thin wrapper around jwt-decode library |
| `auth/utils/token-utils.ts` | Token decoding and expiry utilities |
| `auth/callbacks/jwt.ts` | Creates session on login |
| `auth/callbacks/session.ts` | Returns session to client |
| `auth/providers/credentials.ts` | Handles email/password auth |
| `lib/session-store.ts` | Redis session CRUD |
| `models/SessionModel.ts` | Session data structure |
| `auth/types/auth-types.ts` | Type definitions |
| `stores/authStore.ts` | Zustand client-side state |

---

## Issues Identified

### 🔴 CRITICAL: JWT Header Never Extracted

**Location:** `lib/jwt-decode.ts`, `auth/utils/token-utils.ts`

**Problem:** The `jwt-decode` library only decodes the JWT payload (part 1). The JWT header (part 0) contains critical information:
- `kid` - Key ID (which key signed this token)
- `alg` - Algorithm used
- `typ` - Token type

**Impact:**
- System cannot determine which IDP signing key was used
- `client_id` (9) from payload being confused with `kid` (29) from header
- Key governance operations fail with "Governance verify rejected kid=29 for purpose=Bearer"

**Current Code:**
```typescript
// jwt-decode.ts - Only decodes payload
export function jwtDecode<T = JwtPayload>(token: string): T {
    return originalJwtDecode<T>(token);  // ← Only returns payload
}
```

**What's Missing:**
```typescript
// Need to add header decoding
export function decodeJwtHeader(token: string): JwtHeader | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  return JSON.parse(Buffer.from(parts[0], 'base64url').toString());
}
```

---

### 🟠 HIGH: No `bearerKeyId` Field in Session

**Location:** `models/SessionModel.ts`, `auth/types/auth-types.ts`

**Problem:** No field exists to store the JWT signing key ID. The session stores:
- `idpClientId` - Client ID from payload (confusingly named)
- `decodedAccessToken` - Payload only, no header

**Affected Types:**
- `SessionData` interface
- `SessionModel` class
- `RedisSessionData` interface
- `DecodedIdpAccessToken` interface

---

### 🟠 HIGH: `decodedAccessToken` is Typed as `any`

**Location:** `models/SessionModel.ts:61`, `SessionData:61`

```typescript
decodedAccessToken?: any;  // ← No type safety
```

**Impact:**
- No compile-time checking of access token claims
- Easy to introduce bugs by accessing non-existent properties
- Reduced IDE support and documentation

---

### 🟡 MEDIUM: Inconsistent Field Naming

**Problem:** Mix of naming conventions across codebase:

| Concept | Names Used |
|---------|------------|
| Session ID | `sessionToken`, `redisSessionId`, `token.redisSessionId` |
| Access Token | `accessToken`, `idpAccessToken`, `access_token` |
| Refresh Token | `refreshToken`, `idpRefreshToken`, `refresh_token` |
| MFA Status | `mfaVerified`, `twoFactorComplete`, `twoFactorSessionVerified` |
| Client ID | `idpClientId`, `client_id`, `clientId` |

**Evidence:**
- `jwt.ts:304`: Uses `idpClientId: decoded?.client_id`
- `session.ts:83`: Checks both `token?.sessionToken || token?.redisSessionId`
- `session-store.ts:198`: Checks both `idpRefreshToken || refreshToken`

---

### 🟡 MEDIUM: Open-Ended Type Definition

**Location:** `models/SessionModel.ts:119`

```typescript
export interface SessionData {
  // ... defined fields ...

  [key: string]: any;  // ← Allows anything
}
```

**Impact:** Defeats purpose of TypeScript - any field can be added without type checking.

---

### 🟡 MEDIUM: Dual Type Systems

**Location:** `auth/types/auth-types.ts` vs `models/SessionModel.ts`

Two parallel type definitions exist:
1. `RedisSessionData` in auth-types.ts (with branded types)
2. `SessionData` in SessionModel.ts (simpler interface)

**Problem:** Unclear which is authoritative. Code uses both.

---

### 🟢 LOW: Logging Inconsistency

**Various files**

Mix of logging approaches:
- `console.log('[TAG]', ...)`
- `console.warn('[TAG]', ...)`
- `authLogger.info('[TAG]', ...)`
- Elaborate ASCII box logging in refresh.ts

---

### 🟢 LOW: Magic Numbers

**Location:** `session-store.ts`, `token-lifecycle.ts`

```typescript
const REFRESH_LOCK_TTL = 60; // 60 seconds
const SESSION_TTL = 3 * 24 * 60 * 60; // 3 days
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
```

Should be centralized configuration.

---

## Data Flow Gaps

### Login Flow (credentials.ts)
```
1. ✅ idpLogin() returns tokens
2. ✅ decodeIdpAccessToken(access_token) - PAYLOAD ONLY
3. ❌ JWT header never decoded - kid lost
4. ✅ Session created with decoded payload
5. ❌ No bearerKeyId stored
```

### Login Flow (jwt.ts - OAuth)
```
1. ✅ idpOAuthCallback() returns tokens
2. ✅ decodeIdpAccessToken() called
3. ❌ JWT header never decoded - kid lost
4. ✅ idpClientId set from decoded.client_id
5. ❌ No bearerKeyId stored
```

### Session Retrieval (session.ts)
```
1. ✅ getSession(redisSessionId) fetches from Redis
2. ✅ buildSessionFromRedis() constructs AppSession
3. ✅ idpClientId passed through
4. ❌ No bearerKeyId available to pass
```

---

## Recommendations

### Immediate (Critical)

1. **Add JWT Header Decoding**
   - Create `decodeJwtHeader()` function
   - Add `JwtHeader` type with `kid`, `alg`, `typ`
   - Update all token decode call sites

2. **Add `bearerKeyId` Field**
   - Add to `SessionData` interface
   - Add to `SessionModel` class
   - Add to `RedisSessionData` interface
   - Populate in credentials.ts and jwt.ts

3. **Store Full JWT Info**
   - Create combined type: `{ header: JwtHeader, payload: DecodedIdpAccessToken }`
   - Or store `bearerKeyId` separately alongside `decodedAccessToken`

### Short-term (High)

4. **Type `decodedAccessToken` Properly**
   - Change from `any` to `DecodedIdpAccessToken`
   - Update all access sites

5. **Remove `[key: string]: any`**
   - Explicitly define all needed fields
   - Use strict TypeScript

6. **Consolidate Type Definitions**
   - Choose one source of truth (recommend auth-types.ts)
   - Deprecate duplicate definitions

### Medium-term

7. **Normalize Field Names**
   - Create migration plan for legacy field names
   - Use consistent prefixes (idp*, oauth*, mfa*)
   - Document naming conventions

8. **Centralize Configuration**
   - Move all TTLs and thresholds to config
   - Environment variable overrides

9. **Standardize Logging**
   - Use authLogger consistently
   - Remove ASCII box logging
   - Add structured logging for production

---

## Files Requiring Changes

| File | Changes Needed |
|------|---------------|
| `lib/jwt-decode.ts` | Add `decodeJwtHeader()` function |
| `auth/utils/token-utils.ts` | Add header extraction, export header decoder |
| `auth/types/auth-types.ts` | Add `JwtHeader` type, `bearerKeyId` to `RedisSessionData` |
| `models/SessionModel.ts` | Add `bearerKeyId` field, type `decodedAccessToken`, remove `[key: string]: any` |
| `auth/providers/credentials.ts` | Extract and store `bearerKeyId` |
| `auth/callbacks/jwt.ts` | Extract and store `bearerKeyId` for OAuth |
| `auth/callbacks/session.ts` | Pass through `bearerKeyId` |
| `stores/authStore.ts` | Add `bearerKeyId` to User/state if needed client-side |

---

## Testing Checklist

After implementing fixes:

- [ ] Login with credentials stores `bearerKeyId`
- [ ] Login with OAuth stores `bearerKeyId`
- [ ] JWT inspect page shows header with `kid`
- [ ] Redis session contains `bearerKeyId`
- [ ] Session callback returns `bearerKeyId`
- [ ] Token refresh preserves `bearerKeyId`
- [ ] Backend key governance operations succeed

---

*Audit performed: 2026-01-16*
*Package: @payez/next-mvp*
*Version: 2.9.103*
