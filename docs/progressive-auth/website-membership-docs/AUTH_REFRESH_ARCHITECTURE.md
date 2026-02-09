# Auth Refresh Architecture

Summary
- Single source of truth for token refresh is the server endpoint at /api/auth/refresh.
- Distributed coordination is implemented with session-based Redis locks keyed by sessionToken.
- Middleware and API code should rely on this endpoint; no client-side refresh flows or duplicate locking.

Single source of truth
- Endpoint: /api/auth/refresh
- Purpose: Exchanges a refresh token for a new access/refresh token pair and updates the Redis session.
- Ownership: This endpoint is the only place that acquires/releases the refresh lock unless the caller already holds it (see Locking semantics below).

Locking semantics (session-store)
- Key: refresh_lock:{sessionToken}
- TTL: 60 seconds (enough for any reasonable refresh)
- Functions:
  - acquireRefreshLock(sessionToken, requestId, maxWaitMs)
  - releaseRefreshLock(sessionToken, requestId, lockVersion?)
  - checkRefreshLock(sessionToken)
- Behavior in /api/auth/refresh:
  - The endpoint attempts to acquire the lock using the provided requestId (X-Request-Id header or a generated fallback).
  - If acquire fails, it checks the existing lock via checkRefreshLock.
    - If the existing lock is owned by the same requestId (caller-held lock), the endpoint proceeds without re-acquiring and will NOT release the lock on exit (caller is responsible for releasing it).
    - If held by another requestId, the endpoint returns HTTP 409 (Refresh already in progress).
  - Only releases the lock in finally when the endpoint actually acquired it.

Middleware viability check
- Endpoint: /api/session/refresh-viability
- Implementation: src/lib/refresh-token-validator.ts
- Design:
  - No access-token decoding is performed here.
  - Access-token status is derived from accessTokenExpires in the session (milliseconds timestamp).
  - Refresh-token is decoded exactly once to determine viability and expiry; no additional fields are stored in the session.
  - Consistent reasons returned: valid_refresh_token | no_refresh_token | refresh_token_expired | session_missing.

Session model and expiration math
- accessTokenExpires and refreshTokenExpires are stored in milliseconds.
- When decoding JWT exp (seconds), always multiply by 1000 once:
  - accessTokenExpires = decodedAccessToken.exp * 1000
  - refreshTokenExpires = decodedRefreshToken.exp * 1000
- Do NOT re-add Date.now() to a millisecond timestamp.
- Session TTL is dynamically derived from refreshTokenExpires with a small buffer, bounded by a max TTL (7 days). If refreshTokenExpires is missing, a default TTL (24 hours) is used.

Deprecated components (do not use)
- src/lib/token-manager.ts — deprecated and removed (stubbed with no exports). All coordination must go through /api/auth/refresh.
- src/utils/tokenRefresh.ts — deprecated; exported functions throw. Use the server refresh endpoint and session-store locks instead.

Integration guidelines
- Triggering refresh (server-to-server or middleware):
  - Prefer calling /api/auth/refresh with:
    - JWT cookie (standard NextAuth flow), or
    - X-Session-Token header for internal server calls.
  - Always include a unique X-Request-Id to coordinate locking across services.

Example (server-side fetch):
```ts path=null start=null
const response = await fetch(`${origin}/api/auth/refresh`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-Token': sessionToken,
    'X-Request-Id': requestId
  },
  credentials: 'include'
});
if (response.status === 409) {
  // Another request is refreshing; caller may wait briefly and re-check session
}
```

- Handling HTTP 409 (refresh in progress):
  - Treat as a signal that another in-flight refresh is underway. Either block briefly and re-check the session or return a “try again shortly” response, depending on the caller’s contract.

Do / Don’t
- Do: Use /api/auth/refresh for all token refresh operations.
- Do: Pass X-Request-Id to coordinate lock ownership.
- Do: Use refresh-viability endpoint for middleware decisioning.
- Don’t: Implement client-side refresh or duplicate locks.
- Don’t: Decode the access token in middleware viability checks.
- Don’t: Store extra refresh-token-derived JSON in the session.

Monitoring and logging
- Logging is standardized via the application logger; emojis and non-ASCII characters are removed.
- Sensitive tokens are redacted in logs. Only non-sensitive metadata (lengths, previews) may be logged when necessary.

Testing notes
- TypeScript build must pass (no emit checks recommended in CI for PRs touching auth code).
- E2E flow should verify:
  - Expired access token -> refresh attempt -> new tokens stored in session -> subsequent requests succeed.
  - Concurrent refresh attempts result in one winner and 409 conflict for other callers.
  - Middleware correctly routes expired sessions with valid refresh tokens to the refresh endpoint and returns to normal flow afterward.
