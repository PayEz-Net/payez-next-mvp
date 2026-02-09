# Security and Error Logging Analysis for Production

## Current Production Log Level Configuration
- **Current Level**: `info` (level 2)
- **Levels Available**: error (0), warn (1), info (2), http (3), debug (4)
- **Production Visibility**: error, warn, info messages will appear in logs

## Analysis of Security Events and Error Logging

### ✅ GOOD: Currently Logged at Production Levels

#### Authentication & Authorization (auth.ts)
- **ERROR**: Login failures with detailed error information (line 98)
- **ERROR**: 401 Unauthorized - Invalid credentials (line 102)
- **ERROR**: 403 Forbidden - Account disabled (line 104)
- **ERROR**: 429 Too Many Requests - Rate limiting (line 106)
- **ERROR**: 5xx Server Error - IDP service issues (line 108)
- **ERROR**: Validation errors during login (line 113)
- **ERROR**: Token refresh failures (line 466)
- **ERROR**: Failed to decode refreshed token (line 379)
- **ERROR**: Token synchronization errors (line 432, 442)
- **ERROR**: Session cleanup failures (line 304, 337, 387, 480)
- **WARN**: Circuit breaker open preventing refresh (line 322)

#### Rate Limiting & Security (rate-limit-service.ts)
- **ERROR**: Failed to get request count (line 87)
- **ERROR**: Failed to increment request count (line 117)
- **ERROR**: Failed to get failed attempts count (line 135)
- **ERROR**: Failed to increment failed attempts (line 162)
- **ERROR**: Failed to reset failed attempts (line 179)
- **WARN**: Incremented failed attempts (line 156)
- **INFO**: Reset failed attempts (line 177)

#### Middleware Security Events (middleware.ts)
- **WARN**: No token or accessToken, redirecting to login (line 98)
- **WARN**: Access token expired (line 107)
- **WARN**: Cannot attempt refresh due to circuit breaker (line 110)
- **WARN**: Circuit breaker is open, service unavailable (line 68)
- **WARN**: SessionExpired error detected (line 191)
- **WARN**: Token expired with incomplete 2FA (line 283)
- **WARN**: User lacks required roles for route (line 321)
- **ERROR**: Session refresh failed (line 162, 244)
- **ERROR**: Error attempting token refresh (line 248)
- **INFO**: Public route detected (line 26)
- **INFO**: Session refresh result (line 154)
- **INFO**: 2FA required, redirecting (line 310)

#### Audit Events (audit-logger.ts)
- **INFO**: Audit action logged (line 83)
- **ERROR**: Failed to log audit action (line 85)
- **WARN**: Cannot log audit action: No authenticated user (line 121)

### ⚠️ AREAS OF CONCERN: Debug-Level Logging

#### Authentication Details (auth.ts)
- Many security-relevant events are logged at **DEBUG** level and won't appear in production:
  - Token expiry information (lines 145-147)
  - JWT callback details (lines 190-196)
  - Redis session operations (lines 201-204, 217-222)
  - Token refresh initiation (lines 353-361)
  - Token refresh success details (lines 365-375)
  - Circuit breaker state changes (lines 329, 471)

#### Rate Limiting Details (rate-limit-service.ts)
- **DEBUG**: Request count increments (line 110) - Should be INFO/WARN for security monitoring

### 🔍 RECOMMENDATIONS

#### 1. Promote Critical Security Events to Production Levels

**A. Authentication Events** - Change these from DEBUG to appropriate levels:
```typescript
// Token expiry warnings - change to WARN
authLogger.warn('Token expiry details', {
  exp: decoded.exp, 
  now, 
  delta: decoded.exp - now
});

// Session operations - change to INFO
authLogger.info('Redis session created/updated', {
  sessionToken: token.sessionToken,
  userId: token.sub
});

// Token refresh events - change to INFO
authLogger.info('Token refresh initiated', {
  userId: token.sub,
  timeExpired: Date.now() - token.accessTokenExpires
});
```

**B. Rate Limiting Events** - Change these from DEBUG to WARN:
```typescript
// Request count tracking - change to INFO for security monitoring
logger.info('Request count incremented', {
  ip,
  endpoint,
  newCount: count + 1,
  threshold: rule.limit
});
```

#### 2. Add Missing Security Event Logging

**A. Circuit Breaker Events** - Add INFO level logging:
```typescript
// Circuit breaker state changes
logger.info('Circuit breaker opened', {
  failures: state.failures,
  lastFailure: state.lastFailure,
  service: 'token-refresh'
});

logger.info('Circuit breaker closed', {
  successCount: state.successCount,
  service: 'token-refresh'
});
```

**B. Session Management** - Add INFO level logging:
```typescript
// Session creation/destruction
logger.info('User session created', {
  userId,
  sessionToken,
  source: 'login'
});

logger.info('User session destroyed', {
  userId,
  sessionToken,
  reason: 'logout|expired|security'
});
```

#### 3. Standardize Security Event Structure

Create a consistent security event format:
```typescript
interface SecurityEvent {
  eventType: 'auth_failure' | 'rate_limit' | 'session_expired' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
```

#### 4. Current Security Event Coverage Assessment

**✅ Well Covered:**
- Login failures and authentication errors
- Rate limiting violations
- Token refresh failures
- Session expiry events
- Role-based access control violations

**⚠️ Partially Covered:**
- Circuit breaker state changes (exists but at DEBUG level)
- Session lifecycle events (exists but at DEBUG level)
- Request count tracking (exists but at DEBUG level)

**❌ Missing:**
- Suspicious activity patterns
- Geolocation-based security events
- Device fingerprinting events
- Concurrent session detection
- Password policy violations
- Account lockout events

### 🎯 IMMEDIATE ACTIONS FOR PRODUCTION

1. **Update config/logging.json** to ensure security events are visible:
   ```json
   {
     "logLevel": "info",
     "securityEvents": {
       "minLevel": "warn",
       "includeMetadata": true
     }
   }
   ```

2. **Add security event aggregation** in Graylog:
   - Create dashboards for authentication failures
   - Set up alerts for rate limiting violations
   - Monitor circuit breaker state changes

3. **Implement security event correlation**:
   - Group events by IP address
   - Track failed login attempts over time
   - Monitor for distributed attacks

## Summary

The current logging configuration provides **good coverage** for critical security events at production log levels. However, **important security context** is currently logged at DEBUG level and won't be visible in production. The main areas needing attention are:

1. **Promote security-relevant DEBUG logs to INFO/WARN level**
2. **Add missing session lifecycle logging**
3. **Implement consistent security event structure**
4. **Set up proper alerting in Graylog**

The foundation is solid, but these adjustments will significantly improve security monitoring and incident response capabilities.
