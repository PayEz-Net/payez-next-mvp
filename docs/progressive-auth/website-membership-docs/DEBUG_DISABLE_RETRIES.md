# DISABLE TOKEN REFRESH RETRIES FOR DEBUGGING

You're right - the aggressive retry logic is fighting against single-use refresh tokens. Here are the locations to temporarily disable retries:

## 1. Token Manager - MAIN CULPRIT
**File**: `src/lib/token-manager.ts`
**Line**: 55
```typescript
// TEMP DEBUG: Disable retries
private readonly maxRetries = 0; // Changed from 3 to 0
```

## 2. Session Store Updates
**File**: `src/lib/session-store.ts`
**Line**: 303
```typescript
// TEMP DEBUG: Disable session update retries  
const maxRetries = 1; // Changed from 3 to 1
```

## 3. Standardized API Client
**File**: `src/lib/standardized-client-api.ts`
**Lines**: 262-320
```typescript
// TEMP DEBUG: Comment out the entire 401 retry logic
if (response.status === 401) {
  // DISABLED FOR DEBUGGING - No automatic retry on 401
  scheduleLoginRedirect();
  throw new ApiNetworkError('Authentication failed - retries disabled for debug', response.status, endpoint);
}
```

## 4. Token Refresh Utils (if used)
**File**: `src/utils/tokenRefresh.ts`
Look for any retry loops and set to 1 attempt only.

## 5. Temporary Environment Variable
Add to your `.env.local`:
```
# TEMP DEBUG FLAG
DISABLE_TOKEN_RETRIES=true
```

Then check for this flag in code:
```typescript
const shouldRetry = process.env.DISABLE_TOKEN_RETRIES !== 'true';
if (!shouldRetry) {
  // Skip retry logic
}
```

## Quick Fix Script
Create a temp script to make these changes:

```bash
# Backup original files
cp src/lib/token-manager.ts src/lib/token-manager.ts.backup
cp src/lib/standardized-client-api.ts src/lib/standardized-client-api.ts.backup

# Apply debug changes
sed -i 's/maxRetries = 3/maxRetries = 0/g' src/lib/token-manager.ts
# ... etc
```

## The Root Problem
The system is making multiple concurrent refresh calls before waiting for the first one to complete:

1. Request 1 triggers refresh → Token becomes invalid
2. Request 2 (concurrent) tries same refresh token → FAILS 
3. Request 3 (retry) tries same refresh token → FAILS

**Solution**: Only one thread should attempt refresh, others should WAIT for that result.

## Proper Fix (After Debug)
Implement proper single-use token handling:
1. Use distributed locks (already partially implemented)
2. Add response waiting mechanism
3. Share refresh results between concurrent requests
4. Add exponential backoff for actual failures
