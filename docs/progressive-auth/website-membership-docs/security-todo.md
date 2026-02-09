# Security Improvements TODO

## 1. ✅ Rate Limiting Implementation - COMPLETED

**Status**: ✅ **FULLY IMPLEMENTED** - Enterprise-grade rate limiting system in place

### ✅ Current Implementation (Superior to Original Plan)

The project now has a **comprehensive enterprise-grade rate limiting system** that exceeds the original TODO requirements:

#### **✅ Implemented Features:**

**1. Enterprise Rate Limiting Service** (`src/lib/rate-limit-service.ts`)
- Redis-backed rate limiting with atomic operations
- Progressive authentication limits with exponential backoff
- Failed authentication tracking and automatic delays
- IP-based policies (Default, Restricted, Trusted)
- PayEz-standard error responses matching .NET backend

**2. Comprehensive Rate Limit Rules** (`src/config/rate-limit-config.ts`)
```typescript
// Current production rules:
'/api/account/send-code': 3 per hour (SMS/Email codes)
'/api/account/verify-code': 10 per 10 minutes
'/api/account/change-password': 5 per hour
'/api/auth/*': 20 per minute
'/api/session/*': 30 per minute
'*': 60 per minute (default)
```

**3. Progressive Authentication Limits**
- Max failed attempts before delay: 5
- SMS code sends: 3 per hour
- SMS verifications: 10 per 10 minutes
- TOTP setup: 5 per hour
- TOTP verify: 10 per minute
- 2FA attempts: Endpoint-specific limits

**4. Automatic Middleware Application**
- Rate limiting automatically applied via enhanced handler system
- Verification endpoints: Strict rate limiting
- High-traffic endpoints: Performance-optimized rate limiting
- Admin endpoints: Circuit breaker protection

### ✅ Completed Tasks:
- [x] ✅ Set up Redis instance for rate limiting
- [x] ✅ Implement rate limiting middleware (`RateLimitMiddleware`)
- [x] ✅ Configure different limits by endpoint (comprehensive rules)
- [x] ✅ Add rate limit headers to responses (PayEz standard format)
- [x] ✅ Set up monitoring for rate limit breaches (built-in logging)
- [x] ✅ **BONUS**: Failed authentication tracking with exponential backoff
- [x] ✅ **BONUS**: IP-based policies (Default/Restricted/Trusted)
- [x] ✅ **BONUS**: Environment-specific overrides (dev/test/prod)
- [x] ✅ **BONUS**: PayEz-standard error responses
- [x] ✅ **BONUS**: Progressive authentication limits

### Current Architecture Benefits:
- **Enterprise-grade**: Matches PayEz .NET implementation
- **Redis-backed**: Distributed rate limiting with atomic operations
- **Endpoint-specific**: Granular control per route
- **Progressive limits**: Sophisticated 2FA and auth protection
- **IP-based policies**: Adaptive limits based on IP reputation
- **Automatic application**: Zero-configuration middleware via enhanced handlers
- **Environment-aware**: Different limits for dev/test/prod
- **Monitoring**: Built-in logging and metrics

**Implementation Files:**
- `src/lib/rate-limit-service.ts` - Enterprise rate limiting service
- `src/config/rate-limit-config.ts` - Comprehensive rate limit rules
- `src/lib/api-middleware.ts` - Rate limiting middleware
- `src/config/middleware-config.ts` - Automatic middleware application

**Note**: The current implementation is significantly more advanced than the original TODO plan and provides enterprise-grade protection suitable for production use.

## 2. Implement sliding session/refresh token with silent background refresh
- [ ] Refactor session handling to support sliding expiration using refresh tokens
- [ ] Implement a 'silent refresh in background' mechanism so the client automatically refreshes the access token before expiry
- [ ] Ensure refresh token is checked and used before redirecting to login (see middleware TODO)
- [ ] Update middleware and API routes to support this flow
- [ ] Add tests for session refresh and sliding expiration

## 3. CORS Configuration

### Next.js Config
```typescript
// next.config.js
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://nexusapi.cryptaply.com', 'https://api.cryptaply.com']
  : ['http://localhost:3000', 'http://localhost:3001']

module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: allowedOrigins.join(',')
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      }
    ]
  }
}
```

### Tasks:
- [ ] Configure allowed origins for each environment
- [ ] Set up CORS middleware
- [ ] Test CORS with different origins
- [ ] Add CORS error logging
- [ ] Document CORS policy

## 4. Security Monitoring

### Logging Setup
```typescript
// Install: npm install winston @sentry/nextjs
import winston from 'winston'
import * as Sentry from '@sentry/nextjs'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'nexus-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

// Log security events
const logSecurityEvent = (event: {
  type: string
  severity: 'low' | 'medium' | 'high'
  details: any
}) => {
  logger.log({
    level: event.severity === 'high' ? 'error' : 'warn',
    message: `Security Event: ${event.type}`,
    ...event
  })
  
  if (event.severity === 'high') {
    Sentry.captureEvent({
      message: `Security Event: ${event.type}`,
      level: 'error',
      extra: event.details
    })
  }
}
```

### Events to Monitor
- Failed login attempts
- Password reset requests
- Token validation failures
- Rate limit breaches
- Suspicious header patterns
- API errors
- Session anomalies

### Tasks:
- [ ] Set up logging infrastructure
- [ ] Configure Sentry integration
- [ ] Implement security event logging
- [ ] Create monitoring dashboard
- [ ] Set up log rotation

## 5. Security Alerts

### Alert Configuration
```typescript
// Install: npm install @slack/webhook
import { IncomingWebhook } from '@slack/webhook'

const slack = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL!)

const alertLevels = {
  low: { threshold: 10, window: '1h' },
  medium: { threshold: 5, window: '15m' },
  high: { threshold: 3, window: '5m' }
}

const sendAlert = async (alert: {
  level: 'low' | 'medium' | 'high'
  type: string
  message: string
  details: any
}) => {
  await slack.send({
    text: `🚨 Security Alert (${alert.level.toUpperCase()})`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Type:* ${alert.type}\n*Message:* ${alert.message}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '```' + JSON.stringify(alert.details, null, 2) + '```'
        }
      }
    ]
  })
}
```

### Alert Triggers
1. High Priority:
   - Multiple failed login attempts from same IP
   - Token validation failures
   - Rate limit breaches

2. Medium Priority:
   - New IP addresses accessing admin endpoints
   - Password reset requests
   - Session anomalies
   - CORS violations

3. Low Priority:
   - New user registrations
   - API usage patterns
   - Performance degradation

### Tasks:
- [ ] Set up Slack webhook integration
- [ ] Configure alert thresholds
- [ ] Implement alert triggers
- [ ] Create alert dashboard
- [ ] Document alert responses

## 6. Standardizing Token Response Codes

### Why Standardize?
Consistent and meaningful response codes for token endpoints (access/refresh) improve security, debuggability, and user experience. They allow clients to distinguish between different failure scenarios and respond appropriately.

### Recommended HTTP Status Codes
| Scenario                                 | Status | Description                                 |
|------------------------------------------|--------|---------------------------------------------|
| Success (new token issued)               | 200    | Token refresh/access succeeded              |
| Malformed request                        | 400    | Missing/invalid parameters                  |
| Invalid, expired, or already-used token  | 401    | Token is invalid, expired, or used          |
| Token revoked/blacklisted                | 403    | Token is valid but revoked/blacklisted      |
| Too many requests (rate limit)           | 429    | Client exceeded allowed refresh attempts    |
| Server error                             | 500    | Unexpected backend/server error             |

### Standard JSON Error Payload
All error responses should include a clear error code and message:
```json
{
  "success": false,
  "error": "RefreshTokenExpired", // or other code
  "message": "The refresh token has expired. Please log in again.",
  "resolution": "Please log in again.",
  "errors": [
    {
      "code": "RefreshTokenExpired",
      "message": "The refresh token has expired.",
      "resolution": "Please log in again."
    }
  ]
}
```

#### Example Error Codes
- `RefreshTokenExpired`
- `RefreshTokenUsed`
- `RefreshTokenRevoked`
- `AccessTokenInvalid`
- `MalformedRequest`
- `RateLimitExceeded`
- `UnexpectedError`

### Notes
- Always use the correct HTTP status code for the error type.
- Never return a 200 status for failed token refreshes.
- Include a top-level `error` and `message` for quick parsing, and an `errors` array for detailed info.
- Optionally, include a `resolution` field to guide the client/user.

## 7. Logging Configuration Technical Debt (POST-MVP)

### Current Issue
The logging configuration system was implemented with a quick fix to resolve Edge Runtime compatibility issues. The following technical debt needs to be addressed post-MVP:

### Problems with Current Implementation
```typescript
// Current quick fix in src/config/logging-config.ts
this.configPath = process.cwd() + '/config/logging.json';
```

**Issues:**
- **Cross-platform compatibility**: Uses hardcoded forward slashes
- **Edge Runtime limitations**: May not work properly in all Edge Runtime contexts
- **Path resolution**: Manual concatenation vs. proper path joining
- **Deployment concerns**: Assumes working directory structure

### Proper Solution Needed
```typescript
// Recommended approach for post-MVP:
const isEdgeRuntime = typeof EdgeRuntime !== 'undefined';

if (isEdgeRuntime) {
  // Use static configuration in Edge Runtime
  this.config = getDefaultConfig();
} else {
  // Use dynamic configuration in Node.js runtime
  const path = require('path');
  this.configPath = path.resolve(process.cwd(), 'config', 'logging.json');
  this.setupFileWatching();
}
```

### Tasks for Post-MVP
- [ ] **Implement runtime detection**: Properly detect Edge vs Node.js runtime
- [ ] **Separate config loading**: Different strategies for different runtimes
- [ ] **Add proper path handling**: Use Node.js path module where available
- [ ] **Test deployment scenarios**: Verify works in Docker, serverless, etc.
- [ ] **Add configuration validation**: Ensure config files are valid
- [ ] **Document runtime differences**: Clear docs on what works where

### Why This Was Deferred
- **MVP Priority**: Core functionality working was more important
- **Low Risk**: Current fix works for most deployment scenarios
- **Graylog Integration**: Needed to maintain structured logging to Graylog
- **Time Constraints**: Proper solution would require significant refactoring

### Impact Assessment
- **Risk Level**: Low-Medium
- **Affects**: Runtime log level changes, external configuration
- **Workaround**: Environment variables can be used for log level control
- **Timeline**: Address within 2-3 weeks post-MVP

---

## Implementation Priority

1. ✅ **Rate Limiting (HIGH) - COMPLETED**
   - ✅ Critical for preventing abuse - **DONE**
   - ✅ Protects against brute force - **DONE**
   - ✅ Required for API stability - **DONE**
   - **Status**: Enterprise-grade rate limiting system implemented

2. Security Monitoring (HIGH) - **PARTIALLY COMPLETE**
   - ✅ Basic logging infrastructure - **DONE** (Graylog integration)
   - ✅ Request/response audit trails - **DONE**
   - ✅ Security event logging - **DONE** (rate limits, auth failures)
   - [ ] Enhanced monitoring dashboard
   - [ ] Sentry integration

3. Security Alerts (MEDIUM)
   - ✅ Rate limit breach alerting - **DONE** (built into logging)
   - ✅ Authentication failure tracking - **DONE**
   - [ ] Slack webhook integration
   - [ ] Alert thresholds configuration
   - [ ] Incident response automation

4. CORS Configuration (MEDIUM)
   - [ ] Configure allowed origins for each environment
   - [ ] Set up CORS middleware
   - [ ] Test CORS with different origins
   - [ ] Add CORS error logging
   - [ ] Document CORS policy

5. Session Management Enhancement (MEDIUM)
   - ✅ Server-side token storage - **DONE**
   - ✅ Session security architecture - **DONE**
   - [ ] Silent background refresh
   - [ ] Sliding session expiration

## Updated Timeline

### ✅ **COMPLETED** (December 2024):
- ✅ **Rate limiting implementation** - Enterprise-grade system
- ✅ **Basic monitoring setup** - Graylog integration
- ✅ **Security middleware** - Comprehensive middleware chains
- ✅ **Authentication security** - Server-side token storage

### **CURRENT PRIORITIES**:

**Week 1-2** (January 2025):
- CORS configuration and testing
- Enhanced monitoring dashboard
- Sentry integration setup

**Week 3-4** (February 2025):
- Alert system automation
- Slack webhook integration
- Session management enhancements

**Week 5-6** (March 2025):
- Silent background refresh implementation
- Logging configuration cleanup
- Documentation updates
