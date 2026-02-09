# NextAuth Cookie Encryption Analysis

## Current Implementation

The application has a **TEST_MODE environment variable** that fundamentally changes how NextAuth handles session cookies:

### Normal Mode (Production/Staging)
- Uses NextAuth's default **JWE (JSON Web Encryption)** for session cookies
- Cookies are encrypted and signed, providing maximum security
- Requires `NEXTAUTH_SECRET` for both encryption and decryption
- Uses `useSecureCookies: process.env.NODE_ENV === 'production'`

### TEST_MODE (Development/Debugging)
- **DISABLES JWE encryption** in favor of simple **JWT signing**
- Session tokens are only signed, not encrypted
- Cookies are human-readable (base64 encoded JSON)
- Still requires `NEXTAUTH_SECRET` but only for signing

## Code Location
Located in `src/lib/auth.ts`:
- Lines 251-278: Custom JWT encode function
- Lines 297-338: Custom JWT decode function
- Lines 263, 308: TEST_MODE checks that bypass encryption

## Why This Was Added
The TEST_MODE bypass was likely implemented to:
1. **Simplify debugging** - encrypted JWE tokens are opaque
2. **Bypass CORS restrictions** - some debugging tools work better with readable tokens
3. **Enable testing scenarios** - easier to inspect and manipulate tokens during development

## Current Problem in Staging
The issue you're experiencing where "tokens not being recognized in production (staging)" suggests:

1. **Environment Variable Mismatch**: 
   - Development might have `TEST_MODE=true` (readable tokens)
   - Staging might have `TEST_MODE` undefined or false (encrypted tokens)
   - Tokens created in one mode cannot be read in the other

2. **NEXTAUTH_SECRET Issues**:
   - Different secrets between environments
   - Missing secret in staging
   - Secret rotation without session cleanup

3. **Cookie Domain/Security Differences**:
   - `useSecureCookies` behavior differs between environments
   - Domain settings affect cookie visibility

## Recommended Solutions

### Immediate Fix (Staging Issues)
1. **Ensure consistent `TEST_MODE` setting** across environments during debugging
2. **Verify `NEXTAUTH_SECRET` is properly set** in staging environment
3. **Clear all sessions** when switching between encrypted/unencrypted modes

### Long-term Architecture
1. **Remove TEST_MODE in production** - use proper debugging tools instead
2. **Use environment-specific secrets** but ensure they're consistently applied
3. **Implement proper session invalidation** when encryption mode changes

## Environment Configuration Matrix

| Environment | TEST_MODE | useSecureCookies | Cookie Security |
|-------------|-----------|------------------|-----------------|
| Development | `true` | `false` | JWT signed only |
| Staging | `false` | `true` | JWE encrypted |
| Production | `false` | `true` | JWE encrypted |

## Session TTL Implementation

The `calculateSessionTTL` function in `session-store.ts` is **already correctly implemented**:

```typescript
function calculateSessionTTL(sessionModel: SessionModel): number {
  // ✅ If refresh token expiration exists → use it (with buffer, capped at max TTL)
  if (sessionModel.refreshTokenExpires) {
    const remainingMs = sessionModel.refreshTokenExpires - Date.now();
    const remainingSeconds = Math.floor(remainingMs / 1000);
    const ttlWithBuffer = remainingSeconds + (5 * 60); // 5-minute buffer
    return Math.max(60, Math.min(ttlWithBuffer, MAX_SESSION_TTL));
  }
  
  // ✅ If no refresh token → return short TTL (15 minutes)
  if (!sessionModel.refreshToken) {
    return NO_REFRESH_TOKEN_TTL; // 900 seconds
  }
  
  // Fallback
  return DEFAULT_SESSION_TTL;
}
```

This ensures:
- **Sessions with refresh tokens** get longer TTL based on refresh token expiration
- **Sessions without refresh tokens** (pending 2FA) expire in 15 minutes
- **Prevents stale session conflicts** by cleaning up sessions without refresh tokens quickly

## Next Steps
1. Check staging environment variables
2. Create proper .env.example files
3. Consider removing TEST_MODE for production deployments
4. Document proper debugging workflow without encryption bypass