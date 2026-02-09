# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

PayEz-Next-MVP is a monorepo containing `@payez/next-mvp`, a Next.js authentication foundation built on NextAuth with Redis-backed session management. This package provides production-ready authentication, token refresh, 2FA/MFA support, and edge middleware for Next.js 14+ App Router applications.

**Repository Structure:**
- `packages/next-mvp/` - Main authentication package
- `examples/minimal-app/` - Reference implementation
- `docs/` - Documentation (progressive auth patterns)

## Development Commands

This repository does not have a root package.json. Work is done directly in the package directories.

### Working with the main package

```pwsh
# Navigate to main package
cd packages\next-mvp

# Install dependencies
npm install

# Type checking
npx tsc --noEmit
```

**Note:** The package exports TypeScript files directly (no build step). Consumers are expected to transpile.

### Working with the example app

```pwsh
# Navigate to example
cd examples\minimal-app

# Install and run
npm install
npm run dev
```

## Architecture Overview

### Session Management (Redis-backed)

The core architecture uses Redis for server-side session storage with versioning and optimistic locking:

- **Session Store** (`lib/session-store.ts`): Manages session lifecycle with Redis keys prefixed `sess:` and `sessver:` for version tracking
- **Session Model** (`models/SessionModel.ts`): Strongly-typed session data with validation
- **Refresh Locking**: Prevents concurrent token refreshes using Redis locks (`refresh_lock:` prefix)
- **Single Session Enforcement**: Optionally enforces one active session per user (configurable via `ENFORCE_SINGLE_SESSION`)

**Key Session Operations:**
- `createSession()` - Creates new session with TTL based on refresh token expiry
- `getSession()` / `getSessionWithVersion()` - Retrieves session data
- `updateSession()` - Updates with retry logic (max 5 attempts) using versioned locking
- `transitionTo2FASession()` - Upgrades session after 2FA verification

### Authentication Flow

1. **Login** (`api-handlers/auth/login.ts`):
   - Proxies credentials to IDP (`/api/ExternalAuth/login`)
   - Decodes JWT tokens (access + refresh)
   - Creates Redis session with initial state (`twoFactorComplete: false`)
   - Returns session token to NextAuth

2. **Middleware** (`edge/middleware.ts`):
   - Runs on every request (Edge Runtime)
   - Checks session viability via `/api/session/refresh-viability`
   - Implements circuit breaker pattern for IDP failures
   - Auto-refreshes expired access tokens
   - Enforces 2FA requirements (redirects to `/account-auth/verify-code`)

3. **Token Refresh** (`api-handlers/auth/refresh.ts`):
   - Acquires distributed lock (`acquireRefreshLock`) to prevent concurrent refreshes
   - Temporarily removes refresh token from session during operation
   - Calls IDP `/api/ExternalAuth/refresh` with AMR/ACR claims
   - Updates session with new tokens and authentication state
   - Releases lock after completion

4. **2FA Verification** (`api-handlers/auth/verify-code.ts`):
   - Validates code against IDP
   - Calls `transitionTo2FASession()` to upgrade session
   - Updates AMR to include `mfa` and ACR to `3` (if lower)

### NextAuth Integration

The package provides `authOptions` (`lib/auth.ts`) configured with:
- **JWT callbacks**: Maintain session token reference, check expiry/MFA status
- **Session callbacks**: Hydrate session from Redis on each request
- **Credentials provider**: Proxies to internal login handler
- **Debouncing**: Prevents callback duplication with 50ms window

Consumer apps wire up routes by re-exporting from package:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@payez/next-mvp/lib/auth';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Auth Decision Engine

The `makeAuthDecision()` function (`middleware/auth-decision.ts`) centralizes routing logic:
- Public route bypass
- Circuit breaker handling (redirect to error page)
- Session validation (redirect to login)
- 2FA enforcement (redirect to verify-code)
- Authenticated root redirect (/ → /dashboards)

### Client-Side Utilities

**fetchWithSession** (`client/fetchWithSession.ts`):
- Wraps `fetch` with automatic token refresh on 401
- Retries on 409/503 with exponential backoff
- Always includes credentials

### Circuit Breaker Pattern

`utils/circuitBreaker.ts` protects against cascading IDP failures:
- **States**: CLOSED → OPEN (after failures) → HALF_OPEN (test recovery)
- **Thresholds**: 5 failures trigger open state, 30s timeout before half-open
- Used in middleware to prevent hammering failed IDP endpoints

### Configuration

**Required Environment Variables:**
- `AUTH_TRUST_HOST` - Must be `true` (NextAuth derives OAuth URLs from request headers)
- `NEXTAUTH_SECRET` - Auto-fetched from IDP at startup
- `REDIS_URL` - Redis connection string
- `IDP_URL` - Identity provider base URL

**Optional:**
- `ENFORCE_SINGLE_SESSION=true` - Force single active session per user
- `LOG_LEVEL` - Logging verbosity (default: info)
- `GRAYLOG_HOST` / `GRAYLOG_PORT` - External logging

### Exported Modules

The package uses granular exports (see `package.json` exports map):
- `@payez/next-mvp/edge/middleware` - Edge middleware + config
- `@payez/next-mvp/lib/auth` - NextAuth options
- `@payez/next-mvp/lib/session-store` - Session CRUD operations
- `@payez/next-mvp/api-handlers/auth/*` - Login, refresh, status, signout, JWKS handlers
- `@payez/next-mvp/client/fetchWithSession` - Authenticated fetch wrapper

## Key Implementation Details

### AMR (Authentication Methods Reference) Normalization

Session store includes `normalizeAMR()` to handle various IDP formats:
- Parses JSON strings, arrays, or comma-separated values
- Deduplicates and lowercases methods (`pwd`, `mfa`, `sms`, `totp`)
- Critical for progressive authentication tracking

### Token Expiry Calculation

TTL logic in `calculateSessionTTL()`:
- Uses refresh token expiry + 5min buffer
- Falls back to 15min for no-refresh-token sessions
- Max cap of 7 days
- Ensures Redis auto-expires stale sessions

### Demo Mode

`isDemoMode()` (`lib/demo-mode.ts`) - Bypasses all auth when enabled (check implementation for activation logic)

### Logging

Structured logging via `config/logger.ts`:
- Separate loggers for general (`logger`) and Redis (`redisLogger`)
- Supports Graylog integration
- Request ID tracking for distributed tracing

## Common Patterns

### Adding a New API Handler

1. Create handler in `src/api-handlers/[category]/[name].ts`
2. Use `createSimpleHandler()` for standard error handling
3. Add export to `src/index.ts`
4. Add export path to `package.json` exports
5. Consumer re-exports: `export { POST } from '@payez/next-mvp/api-handlers/[category]/[name]'`

### Session Updates

Always use `updateSession()` rather than direct `setSession()` to leverage versioned locking:
```typescript
await updateSession(sessionToken, {
  twoFactorComplete: true,
  authenticationLevel: '3'
});
```

### IDP Communication

All IDP calls should:
- Include `X-Client-Id` header (from `ENV_CONFIG.CLIENT_ID`)
- Forward client IP and User-Agent from original request
- Handle rate limits (429 responses)
- Implement proper error logging with request IDs
