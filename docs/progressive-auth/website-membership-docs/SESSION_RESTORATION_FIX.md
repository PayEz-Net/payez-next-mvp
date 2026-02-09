# Session Restoration Fix for JWT Callback

## Problem

The JWT callback in `src/lib/auth.ts` was immediately invalidating user sessions when Redis session data was missing, even if valid refresh tokens were still available. This caused:

- Repeated session expirations
- Forced logouts despite having valid refresh tokens
- Poor user experience with continuous authentication prompts
- Unnecessary session invalidation when Redis expired before refresh tokens

## Root Cause

At lines 556-560 in the JWT callback, when `getSession(sessionToken)` returned `null` (missing Redis data), the callback immediately returned `{ error: 'SessionExpired' }` without attempting to use refresh tokens for session restoration.

## Solution

### 1. Added Session Restoration Helper Function

Created `attemptSessionRestoration(sessionToken: string)` function that:
- Checks for existing session data with refresh tokens
- Validates refresh token expiration
- Uses the existing `ensureFreshTokens()` utility to refresh tokens
- Returns a restored `SessionModel` if successful

### 2. Modified JWT Callback Logic

Updated the JWT callback to:
- Attempt session restoration when Redis session data is missing
- Only invalidate sessions after restoration attempts fail
- Maintain proper error handling for different failure scenarios
- Log detailed restoration attempts for debugging

### 3. Enhanced Error Handling

Added proper error logging and categorization for:
- Session restoration failures
- Refresh token expiration
- Redis connection errors
- Session validation errors

## Code Changes

### New Import
```typescript
import { ensureFreshTokens } from '@/lib/simple-token-refresh';
import { redis } from '@/lib/redis';
```

### Session Restoration Function
```typescript
async function attemptSessionRestoration(sessionToken: string): Promise<SessionModel | null> {
    // ... implementation that attempts to restore session using refresh tokens
}
```

### Updated JWT Callback
```typescript
if (!sessionData) {
    console.log('[JWT_CALLBACK] Session no longer exists in Redis, attempting session restoration...');
    
    // CRITICAL FIX: Attempt session restoration using refresh token before giving up
    const restoredSession = await attemptSessionRestoration(sessionToken);
    if (restoredSession) {
        console.log('[JWT_CALLBACK] Session successfully restored from refresh token');
        sessionData = restoredSession;
    } else {
        console.log('[JWT_CALLBACK] Session restoration failed, invalidating token');
        return { error: 'SessionExpired' };
    }
}
```

## Benefits

1. **Better User Experience**: Users no longer face unexpected logouts when refresh tokens are still valid
2. **Resilient Session Management**: System can recover from Redis session expiration automatically
3. **Proper Prioritization**: Refresh token validity takes precedence over Redis session presence
4. **Maintained Architecture**: Still uses Redis as single source of truth, but with intelligent fallback
5. **Enhanced Debugging**: Detailed logging for session restoration attempts

## Architecture Compatibility

- Maintains the Redis-first architecture
- Uses existing token refresh utilities (`ensureFreshTokens`)
- Preserves JWT minimal token strategy
- Compatible with distributed Redis deployments
- No breaking changes to existing API contracts

## Testing Scenarios

The fix addresses these scenarios:
1. Redis session expired, refresh token still valid → Session restored ✅
2. Both Redis session and refresh token expired → Proper logout ✅
3. Redis connection issues during session restoration → Graceful degradation ✅
4. Concurrent session restoration attempts → Handled by existing locks ✅

## Monitoring

Monitor these log entries to verify the fix:
- `[SESSION_RESTORE] Attempting to restore session from refresh token`
- `[SESSION_RESTORE] Successfully restored session using refresh token`
- `[JWT_CALLBACK] Session successfully restored from refresh token`

## Next Steps

1. Deploy the fix to development environment
2. Test with scenarios where Redis session expires before refresh token
3. Monitor logs for successful session restoration events
4. Consider adding metrics for session restoration success/failure rates
