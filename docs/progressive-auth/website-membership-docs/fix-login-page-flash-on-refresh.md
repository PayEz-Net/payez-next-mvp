# Fix: Login Page Flash During Token Refresh

## Problem

When a user's access token expired and an automatic refresh was triggered, concurrent middleware requests would cause the login page to briefly flash before the user was redirected back to their original page. This created a confusing and jarring user experience.

### Root Cause

1. User's access token expired at 16:35:00
2. Multiple concurrent requests hit the middleware simultaneously
3. **First request** starts the refresh process and acquires a Redis lock
4. **First request** removes the refresh token from session (security measure during refresh)
5. **Subsequent requests** check viability and find `no_refresh_token`
6. **Subsequent requests** redirect to login page
7. Refresh completes successfully, user is now authenticated
8. Login page detects user is authenticated and redirects back
9. Result: **Brief flash of login page** despite valid session

### Timeline from Logs

```
[16:35:00] Access token expired detected
[16:35:02] First request clears refresh token, starts refresh
[16:35:02] Concurrent requests see no_refresh_token → redirect to login
[16:35:04] Login page renders briefly
[16:35:06] Refresh completes, new tokens issued
[16:35:06] User redirected back to original page
```

## Solution

### 1. Add Refresh-In-Progress Detection

**File:** `src/lib/session-store.ts`

Added a simple helper to check if a refresh lock exists:

```typescript
/**
 * Simple check if a refresh is currently in progress for a session
 * Used by middleware to prevent concurrent refresh attempts
 */
export async function isRefreshInProgress(sessionToken: string): Promise<boolean> {
  const lock = await checkRefreshLock(sessionToken);
  return lock !== null;
}
```

### 2. Update Viability Check API

**File:** `src/app/api/session/refresh-viability/route.ts`

Added early check for in-progress refresh:

```typescript
// CRITICAL: Check if a refresh is already in progress
// This prevents concurrent middleware requests from all redirecting to login
// when one request has already started the refresh process
const refreshInProgress = await isRefreshInProgress(finalSessionToken);
if (refreshInProgress) {
  logger.info('[REFRESH-VIABILITY] Refresh already in progress, telling middleware to wait', {
    sessionToken: finalSessionToken.substring(0, 8) + '...'
  });
  return NextResponse.json({
    canRefresh: true, // Tell middleware refresh is viable
    reason: 'refresh_in_progress', // Special reason code
    refreshInProgress: true,
    sessionToken: finalSessionToken
  }, { status: 200 });
}
```

### 3. Update Middleware to Handle In-Progress Refresh

**File:** `src/middleware.ts`

Added logic to allow concurrent requests to proceed when refresh is in progress:

```typescript
// CRITICAL: If refresh is in progress, don't redirect - allow the page to continue
// The refresh will complete soon and the user will get fresh tokens
if (viabilityData.refreshInProgress) {
  logger.info('Refresh in progress detected, allowing page to proceed', {
    sessionToken: sessionPointer.sessionToken.substring(0, 8) + '...',
    pathname
  });
  // Override the expired flag so middleware doesn't attempt another refresh
  sessionPointer.expired = false;
  canRefreshSession = false; // Prevent this request from also starting a refresh
}
```

## How It Works Now

### New Flow with Fix

1. User's access token expires
2. Multiple concurrent requests hit middleware
3. **First request:**
   - Checks viability → refresh token exists → starts refresh
   - Acquires Redis lock
   - Clears refresh token from session
4. **Subsequent requests:**
   - Check viability → **detects refresh lock exists**
   - Viability returns `refreshInProgress: true`
   - Middleware allows request to proceed (no redirect)
   - Page loads normally
5. Refresh completes in background
6. Next API call automatically gets new tokens
7. **No login page flash!**

## Benefits

✅ **No more login page flashing**
✅ **Smooth user experience during token expiry**
✅ **Prevents race conditions in refresh logic**
✅ **Leverages existing Redis lock infrastructure**
✅ **No changes needed to refresh endpoint itself**

## Testing

To test the fix:

1. Set access token lifetime to a short duration (e.g., 5 minutes) in IDP config
2. Log in to the membership site
3. Wait for access token to expire
4. Navigate to any page or refresh current page
5. **Expected:** Smooth navigation, no login page flash
6. **Previous:** Brief flash of login page before redirecting back

## Related Code

- **Session Store:** `src/lib/session-store.ts` (refresh lock functions)
- **Viability Check:** `src/app/api/session/refresh-viability/route.ts`
- **Middleware:** `src/middleware.ts`
- **Refresh Endpoint:** `src/app/api/auth/refresh/route.ts` (unchanged)

## Notes

- The refresh lock has a 60-second TTL to prevent stuck locks
- If a refresh takes longer than 60 seconds, the lock auto-expires
- Orphaned locks older than 2 minutes are cleaned up by `cleanupRefreshLocks()`
- The fix is transparent to the user - they never see authentication complexity

## Impact

- **User Experience:** Dramatically improved - no jarring redirects
- **Performance:** Minimal - one extra Redis check per middleware request during token expiry
- **Reliability:** Increased - prevents concurrent refresh attempts
- **Complexity:** Low - leverages existing lock infrastructure

## Future Enhancements

Optional improvements that could be considered later:

1. **Client-side coordination:** Add browser-level coordination using Broadcast Channel API
2. **Predictive refresh:** Refresh tokens proactively before expiry (already implemented via access token time remaining checks)
3. **Loading indicators:** Show subtle "refreshing session" indicator during refresh
4. **Metrics:** Track refresh lock contention and timing

## Related Issues

- Original issue: "Login page flash during token refresh"
- Priority: Critical (blocks proper UX)
- Status: ✅ Fixed
