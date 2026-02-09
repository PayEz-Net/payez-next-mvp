# 2FA Verification Endpoint Rate Limiting - Testing Guide

## Overview

This document provides comprehensive testing instructions for the 2FA verification endpoints that now include local rate limiting as defense-in-depth protection.

## Changes Implemented

### 1. SimpleApiHandler Middleware Support
- Added `.use()` method to `SimpleApiHandler` class
- Implemented middleware queue that executes before authentication
- Middleware chain now properly applies to handlers created with `createSimpleHandler`

### 2. Rate Limit Configuration
Added explicit rate limit rules for 2FA verification endpoints:

**Endpoint Rules (Default Policy):**
- `/api/account/send-code`: 3 requests per hour
- `/api/account/verify-email`: 10 requests per 10 minutes
- `/api/account/verify-sms`: 10 requests per 10 minutes
- `/api/account/verify-code`: 10 requests per 10 minutes

**IP-Specific Policies:**
- **Restricted IPs**: More restrictive limits (3 per 10m for verification)
- **Trusted IPs**: More permissive limits (30 per 10m for verification)
- **Default IPs**: Standard limits (10 per 10m for verification)

### 3. Middleware Chain Applied
All three 2FA endpoints now use the verification middleware chain:
1. **RequestLoggingMiddleware** - Logs all requests/responses
2. **SecurityMiddleware** - Security headers and validation
3. **RateLimitMiddleware** - Local rate limiting (NEW!)
4. **CircuitBreakerMiddleware** - Circuit breaker protection
5. **PerformanceMiddleware** - Performance monitoring

## Endpoints to Test

### 1. `/api/account/send-code` (POST)
- **Purpose**: Send 2FA verification code via SMS or email
- **Rate Limit**: 3 requests per hour
- **Auth**: Partial auth (access token required, no 2FA completion needed)

### 2. `/api/account/verify-email` (POST)
- **Purpose**: Verify email-based 2FA code
- **Rate Limit**: 10 requests per 10 minutes
- **Auth**: Partial auth (access token required, no 2FA completion needed)

### 3. `/api/account/verify-sms` (POST)
- **Purpose**: Verify SMS-based 2FA code
- **Rate Limit**: 10 requests per 10 minutes
- **Auth**: Partial auth (access token required, no 2FA completion needed)

## Test Cases

### Test 1: Verify Middleware Chain Execution

**Objective**: Confirm that middleware chain is properly applied and executed.

**Steps**:
1. Start the dev server with logging enabled
2. Make a single request to `/api/account/verify-email`
3. Check logs for middleware execution messages

**Expected Results**:
```
[INFO] API Request Started - endpoint: /api/account/verify-email
[DEBUG] RateLimitMiddleware - checking rate limit
[DEBUG] CircuitBreakerMiddleware - checking circuit state
[INFO] Request completed - responseTime: <ms>
```

### Test 2: Rate Limit Enforcement - Send Code

**Objective**: Verify that send-code endpoint enforces 3 requests per hour limit.

**Steps**:
1. Authenticate a test user (post-login, pre-2FA)
2. Call `/api/account/send-code` with SMS type 4 times within an hour
3. Verify the 4th request is rate limited

**Expected Results**:
- Requests 1-3: 200 OK with success response
- Request 4: 200 OK with rate limit envelope:
  ```json
  {
    "success": false,
    "message": "Rate limit exceeded",
    "operation_code": "account_send_code",
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Rate limit exceeded. Try again in X minutes.",
      "details": {
        "limit": 3,
        "window": "1h",
        "retryAfter": "<ISO timestamp>"
      }
    }
  }
  ```

### Test 3: Rate Limit Enforcement - Verify Email

**Objective**: Verify that verify-email endpoint enforces 10 requests per 10 minutes limit.

**Steps**:
1. Authenticate a test user (with access token in session)
2. Call `/api/account/verify-email` 11 times within 10 minutes
3. Verify the 11th request is rate limited

**Expected Results**:
- Requests 1-10: 200/400/401 depending on code validity
- Request 11: 200 OK with rate limit envelope (as shown in Test 2)

### Test 4: Rate Limit Enforcement - Verify SMS

**Objective**: Verify that verify-sms endpoint enforces 10 requests per 10 minutes limit.

**Steps**:
1. Authenticate a test user (with access token in session)
2. Call `/api/account/verify-sms` 11 times within 10 minutes
3. Verify the 11th request is rate limited

**Expected Results**:
- Requests 1-10: 200/400/401 depending on code validity
- Request 11: 200 OK with rate limit envelope

### Test 5: Partial Auth Behavior

**Objective**: Verify that partial auth is preserved (access token required, but 2FA not enforced).

**Steps**:
1. Make request to verify-email WITHOUT a session token
2. Make request WITH session token but WITHOUT access token
3. Make request WITH session token AND access token

**Expected Results**:
1. No session token: 401 UNAUTHORIZED
   ```json
   {
     "success": false,
     "message": "Authentication required - no session token",
     "error": {
       "code": "UNAUTHORIZED",
       "details": { "reason": "no_session_token" }
     }
   }
   ```

2. No access token: 401 UNAUTHORIZED
   ```json
   {
     "success": false,
     "message": "Authentication required - no access token available",
     "error": {
       "code": "UNAUTHORIZED",
       "details": { "reason": "no_access_token_in_session" }
     }
   }
   ```

3. Valid session + access token: 200/400 depending on request validity

### Test 6: Proxy Logging

**Objective**: Verify that `[PROXY_DEBUG]` logs are still emitted correctly.

**Steps**:
1. Make a valid request to any 2FA endpoint
2. Check console/logs for proxy debug messages

**Expected Results**:
```
[PROXY_DEBUG] About to fetch: POST https://idp.payez.com/api/ExternalAuth/twofa/email/verify
[PROXY_DEBUG] IDP response: 200
[PROXY_DEBUG] Compliance check: success=true
```

### Test 7: Rate Limit Doesn't Block IDP

**Objective**: Confirm rate limiting happens BEFORE proxying to IDP (defense-in-depth).

**Steps**:
1. Make 11 requests to verify-email within 10 minutes
2. Monitor IDP access logs or network requests

**Expected Results**:
- Only 10 requests reach the IDP
- 11th request is blocked locally and never proxies to IDP
- Logs show rate limit triggered BEFORE any IDP interaction

### Test 8: Rate Limit Reset

**Objective**: Verify that rate limits reset after the time window expires.

**Steps**:
1. Hit rate limit for verify-email (10 requests in 10 minutes)
2. Wait 10+ minutes
3. Make another request

**Expected Results**:
- Request succeeds after window expires
- New rate limit window begins

### Test 9: Different IP Addresses

**Objective**: Verify that rate limits are per-IP (or per-client) as configured.

**Steps**:
1. Make 10 requests from IP address A
2. Make 1 request from IP address B

**Expected Results**:
- IP A: 11th request blocked
- IP B: Request succeeds (separate rate limit bucket)

### Test 10: Development Environment Override

**Objective**: Verify that development environment has relaxed limits.

**Steps**:
1. Set `NODE_ENV=development`
2. Make more than 10 requests to verify-email

**Expected Results**:
- Development: 100 requests allowed (10x multiplier)
- Production: 10 requests allowed

## Manual Testing Script (PowerShell)

```powershell
# Test send-code rate limiting (3 per hour)
$session = "your-session-token-here"

for ($i=1; $i -le 4; $i++) {
    Write-Host "Request $i to send-code..."
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/account/send-code" `
        -Method POST `
        -Body '{"type":"sms"}' `
        -ContentType "application/json" `
        -Headers @{"Cookie"="next-auth.session-token=$session"}
    
    Write-Host "Response: $($response.StatusCode)"
    Write-Host $response.Content
    Write-Host "---"
}

# Test verify-email rate limiting (10 per 10 minutes)
for ($i=1; $i -le 11; $i++) {
    Write-Host "Request $i to verify-email..."
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/account/verify-email" `
        -Method POST `
        -Body '{"verification_code":"123456"}' `
        -ContentType "application/json" `
        -Headers @{"Cookie"="next-auth.session-token=$session"}
    
    Write-Host "Response: $($response.StatusCode)"
    $content = $response.Content | ConvertFrom-Json
    if ($content.error.code -eq "RATE_LIMIT_EXCEEDED") {
        Write-Host "RATE LIMIT HIT!" -ForegroundColor Red
        Write-Host $content.error.message
    }
    Write-Host "---"
}
```

## Automated Testing (Jest/Vitest)

```typescript
describe('2FA Rate Limiting', () => {
  it('should enforce rate limit on send-code after 3 requests', async () => {
    const session = await createTestSession();
    
    // Make 3 successful requests
    for (let i = 0; i < 3; i++) {
      const res = await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Cookie': `next-auth.session-token=${session}` },
        body: JSON.stringify({ type: 'sms' })
      });
      expect(res.ok).toBe(true);
    }
    
    // 4th request should be rate limited
    const res = await fetch('/api/account/send-code', {
      method: 'POST',
      headers: { 'Cookie': `next-auth.session-token=${session}` },
      body: JSON.stringify({ type: 'sms' })
    });
    
    expect(res.status).toBe(200); // PayEz standard: 200 with error
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
  
  it('should enforce rate limit on verify-email after 10 requests', async () => {
    const session = await createTestSession();
    
    // Make 10 requests
    for (let i = 0; i < 10; i++) {
      await fetch('/api/account/verify-email', {
        method: 'POST',
        headers: { 'Cookie': `next-auth.session-token=${session}` },
        body: JSON.stringify({ verification_code: '123456' })
      });
    }
    
    // 11th request should be rate limited
    const res = await fetch('/api/account/verify-email', {
      method: 'POST',
      headers: { 'Cookie': `next-auth.session-token=${session}` },
      body: JSON.stringify({ verification_code: '123456' })
    });
    
    const json = await res.json();
    expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
```

## Monitoring and Observability

### Logs to Monitor

1. **Rate Limit Hits**:
   ```
   [WARN] Rate limit exceeded - endpoint: /api/account/verify-email, requestId: <id>
   ```

2. **Middleware Execution**:
   ```
   [DEBUG] RateLimitMiddleware executing for /api/account/verify-email
   ```

3. **Proxy Logs**:
   ```
   [PROXY_DEBUG] About to fetch: POST <IDP_URL>
   ```

### Metrics to Track

- Rate limit hit rate per endpoint
- Average requests per user per time window
- 401 errors (missing access token)
- Response times with middleware chain

## Success Criteria

✅ All middleware execute in correct order  
✅ Rate limits enforced at correct thresholds  
✅ Rate limiting happens BEFORE proxy to IDP  
✅ 401 returned when no access token present  
✅ Partial auth preserved (no 2FA enforcement)  
✅ Proxy logs still emitted correctly  
✅ TypeScript compiles without errors  
✅ Development environment has relaxed limits  
✅ IP-specific policies work correctly  
✅ Rate limit resets after time window expires  

## Rollback Plan

If issues are discovered:

1. **Quick Fix**: Remove middleware chain application:
   ```typescript
   // Comment out this line in route files:
   // applyMiddlewareChain(handler, getMiddlewareChain('/api/account/...'));
   ```

2. **Full Rollback**: Revert to inline rate limit checks:
   - Remove `.use()` method from SimpleApiHandler
   - Add direct `rateLimitService.checkRateLimit()` calls at start of handlers
   - Return PayEz 200 envelope on limit exceeded

## Next Steps

1. ✅ Implement `.use()` method in SimpleApiHandler
2. ✅ Add explicit rate limit rules for verify-email/verify-sms
3. ✅ Verify TypeScript compilation
4. 🔲 Run manual testing with real sessions
5. 🔲 Add automated integration tests
6. 🔲 Monitor production logs for 24-48 hours
7. 🔲 Adjust rate limits based on real-world usage patterns

## Related Documentation

- `src/lib/simple-api-handler.ts` - Handler implementation with middleware support
- `src/config/rate-limit-config.ts` - Rate limit rules and policies
- `src/config/middleware-config.ts` - Route-specific middleware chains
- `src/lib/api-middleware.ts` - Middleware implementations
