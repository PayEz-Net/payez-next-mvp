# Vibe API Routing Quick-Start Guide

> **Audience:** Developers building Vibe-integrated apps (Web.IdealVibe, etc.)

---

## 1. Why This Matters

**The Problem:** Web.IdealVibe sent an expired JWT to Vibe API.

```
Client → API Route → Vibe API
                     ↳ 401 Unauthorized (token expired 3 minutes ago)
```

This happens when you grab the access token from session and send it blindly without checking freshness. Tokens expire. If you don't check before sending, you'll get 401s that confuse users and break flows.

**The Solution:** Always check token freshness BEFORE proxying to external APIs. Refresh if needed. Never send expired tokens.

---

## 2. Token Lifecycle Basics

### Access Token vs Refresh Token

| Token | Lifetime | Purpose |
|-------|----------|---------|
| **Access Token** | 15-60 minutes | Bearer token sent to APIs |
| **Refresh Token** | Days/weeks | Used to get new access token |

### The 5-Minute Threshold

Don't wait until a token is expired to refresh. Use a **5-minute buffer**:

```typescript
const FRESHNESS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function needsRefresh(expiresAt: number): boolean {
  return (expiresAt - Date.now()) <= FRESHNESS_THRESHOLD_MS;
}
```

**Why 5 minutes?**
- Network latency can add seconds
- Clock skew between servers
- Prevents race conditions on concurrent requests

---

## 3. Server-Side Pattern

### The Right Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js API Route                       │
│                                                             │
│  1. Get session from Redis                                  │
│  2. Check: Is access token fresh? (> 5 min remaining)       │
│  3. If stale → Acquire lock → Refresh → Release lock        │
│  4. Forward FRESH token to Vibe API                         │
│  5. Return response to client                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

**SessionTokenManager** - Token state utilities:
```typescript
class SessionTokenManager {
  needsRefresh(bufferMs = 60000): boolean;  // Check if refresh needed
  isAccessTokenExpired(): boolean;           // Already expired?
  getTimeUntilExpiration(): number;          // Ms until expiry
  withRefreshedTokens(...): SessionModel;    // Immutable update
}
```

**Redis Session Store** - Distributed coordination:
```typescript
// Get session with version (for optimistic locking)
getSessionWithVersion(sessionToken): { session, version }

// Update tokens atomically
updateTokens(sessionToken, accessToken, refreshToken, expires)

// Distributed locking for refresh coordination
acquireRefreshLock(sessionToken, requestId, ttlMs): { acquired, lockInfo }
releaseRefreshLock(sessionToken, requestId, lockVersion)
checkRefreshLock(sessionToken): RefreshLockInfo | null
```

---

## 4. The Wrong Way

**What Web.IdealVibe did (DON'T DO THIS):**

```typescript
// BAD: Grab token blindly and send
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // WRONG: No freshness check!
  const response = await fetch('https://vibe.payez.net/v1/profiles', {
    headers: {
      'Authorization': `Bearer ${session.accessToken}`,  // Could be expired!
      'X-Vibe-Client-Id': VIBE_CLIENT_ID,
      'X-Vibe-Client-Secret': VIBE_CLIENT_SECRET
    }
  });

  return response;  // 401 if token was expired
}
```

**Problems:**
- No expiration check
- No refresh logic
- No coordination for concurrent requests
- Users see 401 errors randomly

---

## 5. The Right Way

### Pattern A: Using SimpleApiHandler (Recommended)

The `SimpleApiHandler` from `website-membership` handles all this automatically:

```typescript
import { createSimpleHandler } from '@/lib/simple-api-handler';

const handler = createSimpleHandler({ requireAuth: true });

export const GET = handler.handle(async (req, context, auth, responseBuilder) => {
  // auth.accessToken is GUARANTEED fresh (> 5 min remaining)
  // If it wasn't fresh, handler already refreshed it

  const response = await fetch('https://vibe.payez.net/v1/profiles', {
    headers: {
      'Authorization': `Bearer ${auth.accessToken}`,
      'X-Vibe-Client-Id': VIBE_CLIENT_ID,
      'X-Vibe-Client-Secret': VIBE_CLIENT_SECRET
    }
  });

  return response.json();
});
```

### Pattern B: Manual Implementation

If you can't use SimpleApiHandler, implement the pattern manually:

```typescript
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: NEXTAUTH_SECRET });
  if (!token?.sessionToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 1. Get session with version
  const { session, version } = await getSessionWithVersion(token.sessionToken);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  let accessToken = session.accessToken;

  // 2. Check freshness (5-minute threshold)
  const THRESHOLD_MS = 5 * 60 * 1000;
  const needsRefresh = !accessToken ||
    (session.accessTokenExpires - Date.now()) <= THRESHOLD_MS;

  if (needsRefresh) {
    // 3. Acquire lock (prevents concurrent refreshes)
    const lockResult = await acquireRefreshLock(token.sessionToken, nanoid(), 5000);

    if (lockResult.acquired) {
      try {
        // Double-check after acquiring lock
        const latest = await getSession(token.sessionToken);
        const stillNeeds = !latest?.accessToken ||
          (latest.accessTokenExpires - Date.now()) <= THRESHOLD_MS;

        if (stillNeeds) {
          // 4. Perform refresh
          const refreshed = await refreshTokens(session.refreshToken);
          await updateTokens(
            token.sessionToken,
            refreshed.accessToken,
            refreshed.refreshToken,
            refreshed.expiresAt
          );
          accessToken = refreshed.accessToken;
        } else {
          accessToken = latest.accessToken;
        }
      } finally {
        // 5. Always release lock
        await releaseRefreshLock(
          token.sessionToken,
          lockResult.lockInfo.requestId,
          lockResult.lockInfo.lockVersion
        );
      }
    } else {
      // Another request is refreshing - wait for it
      await waitForRefresh(token.sessionToken, 10000);
      const refreshed = await getSession(token.sessionToken);
      accessToken = refreshed?.accessToken;
    }
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Unable to obtain fresh token' }, { status: 401 });
  }

  // 6. NOW send the request with fresh token
  const response = await fetch('https://vibe.payez.net/v1/profiles', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Vibe-Client-Id': VIBE_CLIENT_ID,
      'X-Vibe-Client-Secret': VIBE_CLIENT_SECRET
    }
  });

  return NextResponse.json(await response.json());
}
```

---

## 6. Error Handling

### When Refresh Fails

If token refresh fails (refresh token expired, IDP down, etc.):

```typescript
// Return 401 with clear message - don't send expired token
return NextResponse.json({
  success: false,
  error: {
    code: 'TOKEN_REFRESH_FAILED',
    message: 'Session expired. Please log in again.'
  }
}, { status: 401 });
```

**DO NOT:**
- Send the expired token anyway (will fail at Vibe API)
- Return 500 (this is an auth issue, not server error)
- Silently fail (user needs to know to re-login)

### Coordination Blocking

When another request is already refreshing:

```typescript
// Return 503 with Retry-After header
return NextResponse.json({
  success: false,
  error: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Token refresh in progress'
  }
}, {
  status: 503,
  headers: { 'Retry-After': '1' }
});
```

The client should retry after the specified delay.

---

## Quick Reference

### Checklist for Every Vibe API Call

- [ ] Get session from Redis (not just JWT)
- [ ] Check token freshness (5-minute threshold)
- [ ] If stale: acquire lock → refresh → release lock
- [ ] Handle concurrent refresh (wait pattern)
- [ ] Only send FRESH tokens to Vibe API
- [ ] Handle refresh failures gracefully (401, not 500)

### Constants

```typescript
const FRESHNESS_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes
const REFRESH_LOCK_TTL_MS = 5000;               // 5 seconds
const REFRESH_WAIT_TIMEOUT_MS = 10000;          // 10 seconds
```

---

## Reference Files

| File | Location | Purpose |
|------|----------|---------|
| `session-token-manager.ts` | `website-membership/src/lib/` | Token state utilities |
| `session-store.ts` | `website-membership/src/lib/` | Redis session operations |
| `simple-api-handler.ts` | `website-membership/src/lib/` | Full implementation |

---

*Guide written by QAPert | 2025-12-11*
