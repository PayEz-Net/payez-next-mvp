# MVP Server-Side Session Management Enhancement

## Overview
Extract Redis-backed server-side session management from website-membership into @payez/next-mvp package. This enables all consumer sites to have proper token lifecycle management with coordinated refresh.

## Problem Statement
Current MVP consumer sites (Web.IdealVibe, idealresume.online, nexus.cryptaply) use `fetchWithAuth` which only injects tokens client-side without:
- Token expiration checking
- Coordinated refresh before calls
- Distributed locking for race conditions
- Server-side session state management

Result: Expired tokens get sent, causing 401 errors.

## Source Files (from website-membership)

### Core Files to Extract (~3,500 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/session-store.ts` | 1,239 | Redis session CRUD, locking, token updates |
| `src/lib/simple-api-handler.ts` | 1,114 | API route wrapper with token lifecycle |
| `src/models/SessionModel.ts` | 435 | Typed session data model |
| `src/lib/redis.ts` | 46 | Redis client singleton |

### Supporting Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/models/DecodedAccessToken.ts` | ~100 | JWT payload type |
| `src/lib/jwt-decode.ts` | ~50 | Safe JWT decoding |
| `src/lib/lock.ts` | ~150 | Distributed lock utilities |

### Auth Callbacks (partial extraction)
- Token refresh coordination logic from `auth.ts` JWT/session callbacks
- NOT the full auth.ts (too site-specific)

## Proposed MVP Package Structure

```
packages/next-mvp/src/
  session/
    session-store.ts      # Redis session CRUD
    session-model.ts      # SessionData type + SessionModel class
    redis-client.ts       # Configurable Redis singleton
    lock.ts               # Distributed locking
    index.ts              # Public exports

  api-handler/
    simple-api-handler.ts # Token-aware API route wrapper
    types.ts              # Handler types/interfaces
    index.ts              # Public exports

  auth/
    token-lifecycle.ts    # Token freshness, refresh coordination
    jwt-utils.ts          # Safe decode, expiry checking
    index.ts              # Public exports
```

## Configuration Requirements

Consumer sites must provide via environment:

```env
# Required
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=mysite:         # Multi-tenant isolation

# Optional
SESSION_TTL_HOURS=24             # Default session TTL
TOKEN_REFRESH_BUFFER_MS=300000   # 5 min refresh threshold
```

## API Design

### Session Store
```typescript
import { sessionStore } from '@payez/next-mvp/session';

// Create session (after login)
const sessionToken = await sessionStore.create(sessionData);

// Get session
const session = await sessionStore.get(sessionToken);

// Update tokens (after refresh)
await sessionStore.updateTokens(sessionToken, {
  accessToken,
  refreshToken,
  accessTokenExpires,
  refreshTokenExpires
});

// Delete session (logout)
await sessionStore.delete(sessionToken);
```

### API Handler
```typescript
import { createApiHandler } from '@payez/next-mvp/api-handler';

// In route.ts
export const GET = createApiHandler({
  requireAuth: true,
  requiredRoles: ['vibe_client_admin']
}).handle(async (req, context, auth) => {
  // auth.accessToken is guaranteed fresh
  // Token refresh handled automatically
  return { data: 'response' };
});
```

### Token Lifecycle
```typescript
import { isTokenFresh, coordinateRefresh } from '@payez/next-mvp/auth';

// Check if token needs refresh (within 5-min threshold)
const needsRefresh = !isTokenFresh(session.accessTokenExpires);

// Coordinated refresh with distributed locking
const result = await coordinateRefresh(sessionToken, async () => {
  // Call IDP refresh endpoint
  return newTokens;
});
```

## Migration Path

### Phase 1: Extract & Package
1. Create new source files in MVP package
2. Abstract site-specific dependencies (logger, config)
3. Add configuration options for flexibility
4. Write unit tests

### Phase 2: Integration
1. Add `ioredis` as peer dependency
2. Export from package index
3. Update package.json exports map
4. Document configuration requirements

### Phase 3: Consumer Migration
Each consumer site needs:
1. Add `REDIS_URL` and `REDIS_KEY_PREFIX` to env
2. Replace raw fetch with `createApiHandler` in API routes
3. Wire session store into NextAuth callbacks
4. Test token refresh flow

## Estimated Effort

| Phase | Tasks | Estimate |
|-------|-------|----------|
| Phase 1 | Extract, abstract, test | 2-3 days |
| Phase 2 | Package integration | 1 day |
| Phase 3 (per site) | Consumer migration | 0.5-1 day |

**Total: 4-5 days** for MVP enhancement + first consumer migration

## Dependencies

### New Peer Dependencies for MVP
```json
{
  "peerDependencies": {
    "ioredis": "^5.0.0"
  }
}
```

### Consumer Requirements
- Redis instance (local dev or cloud)
- Environment configuration
- NextAuth callback updates

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing consumers | Feature flag, opt-in usage |
| Redis availability | Graceful fallback for missing Redis |
| Lock contention | Configurable timeouts, health logging |
| Migration complexity | Clear docs, example migrations |

## Out of Scope
- Full NextAuth configuration extraction (too site-specific)
- 2FA session handling (site-specific flows)
- Degraded mode handling (complex edge cases)

## Success Criteria
1. Web.IdealVibe can make authenticated Vibe API calls without 401 from expired tokens
2. Token refresh happens automatically before token expires
3. No race conditions on concurrent refresh attempts
4. Configurable via environment, no code changes for basic usage

## Next Steps
1. Get approval on scope and approach
2. Create feature branch in PayEz-Next-MVP
3. Begin Phase 1 extraction
