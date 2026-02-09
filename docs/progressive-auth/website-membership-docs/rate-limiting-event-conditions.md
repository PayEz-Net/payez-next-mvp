# Rate Limiting Event Conditions

This document outlines the specific conditions that trigger rate limiting "events" in the membership website's rate limiting middleware system.

## Overview

The rate limiting middleware tracks various conditions to protect the system from abuse and ensure service availability. When these conditions are met, the system triggers rate limiting events that restrict or delay subsequent requests.

## Event Trigger Conditions

### 1. Failed Authentication Attempts

**Condition**: Excessive failed authentication attempts from a single IP address.

- **Tracking Key**: `membership:rate_limit:{IP}:failed_auth`
- **Threshold**: `maxFailedAttemptsBeforeDelay` (default: 5 attempts)
- **Time Window**: 1 hour
- **Action**: Progressive delay with exponential backoff (max 5 minutes)
- **Method**: `checkFailedAuthDelay(ip)`

**Exponential Backoff Formula**:
```
delaySeconds = Math.min(Math.pow(2, failedAttempts - threshold), 300)
```

### 2. Progressive Authentication Rate Limits

**Condition**: Exceeding limits on specific authentication-related endpoints.

**Tracked Endpoints**:
- `/progressiveauth/*` - Progressive authentication flows
- `/twofa/*` - Two-factor authentication
- `/totp/*` - Time-based one-time passwords
- `/sms/*` - SMS-based authentication

**Specific Limits**:
- **Progressive Auth Start**: 10 attempts per hour
- **Progressive Auth Verify**: 20 attempts per hour  
- **TOTP Setup**: 5 attempts per hour
- **TOTP Verify**: 10 attempts per 10 minutes
- **SMS Send**: 3 attempts per hour
- **SMS Verify**: 10 attempts per 10 minutes

**Tracking Key**: `membership:rate_limit:{IP}:{ENDPOINT}`
**Method**: `checkProgressiveAuthRateLimit(ip, endpoint)`

### 3. Standard Rate Limiting

**Condition**: Exceeding general request limits per endpoint.

**Default Rules**:
- **Global Default**: 60 requests per minute (`*`)
- **Account Endpoints**: 60 requests per minute (`/api/account/*`)
- **Authentication**: 20 requests per minute (`/api/auth/*`)
- **Session Management**: 30 requests per minute (`/api/session/*`)
- **Health Endpoints**: 100 requests per minute (`/api/health/*`)

**Specific Endpoint Limits**:
- **Send Code**: 3 requests per hour (`/api/account/send-code`)
- **Verify Code**: 10 requests per 10 minutes (`/api/account/verify-code`)
- **Change Password**: 5 requests per hour (`/api/account/change-password`)
- **Account Info**: 30 requests per minute (`/api/account/masked-info`)

**Tracking Key**: `membership:rate_limit:{IP}:{ENDPOINT}`
**Method**: `checkRateLimit(ip, endpoint, clientId?)`

### 4. IP-Based Policy Variations

**Condition**: Different rate limits based on IP classification.

**Policy Types**:

#### Default Policy
- Global: 60 requests per minute
- Send Code: 3 requests per hour
- Verify Code: 10 requests per 10 minutes

#### Restricted Policy (Suspicious IPs)
- Global: 30 requests per minute
- Send Code: 1 request per hour
- Verify Code: 3 requests per 10 minutes

#### Trusted Policy (Known Good IPs)
- Global: 200 requests per minute
- Send Code: 10 requests per hour
- Verify Code: 30 requests per 10 minutes

## Middleware Application

### Route-Based Rate Limiting

Rate limiting is applied based on route characteristics defined in `src/config/middleware-config.ts`:

**Verification Endpoints** (Always Rate Limited):
- `/api/account/send-code`
- `/api/account/verify-email`
- `/api/account/verify-sms`
- `/api/account/verify-code`

**High-Traffic Endpoints** (Always Rate Limited):
- `/api/auth/login`
- `/api/auth/session`
- `/api/auth/verify-2fa`
- `/api/session/set`
- `/api/account/masked-info`

**Pattern-Based Rules**:
- `/api/auth/*` - All auth endpoints
- `/api/account/*` - All account endpoints
- `/api/health/*` - Health check endpoints

### Middleware Chain Integration

Rate limiting middleware is included in these predefined chains:

1. **VERIFICATION** - For verification endpoints
2. **HIGH_TRAFFIC** - For high-traffic routes
3. **PUBLIC** - For public endpoints that need protection

## Event Actions

### When Rate Limits Are Exceeded

1. **Logging**: Warning logged with details:
   ```
   Rate limit exceeded: {
     ip, clientId, endpoint, requestCount, limit, retryAfterSeconds
   }
   ```

2. **Error Response**: Middleware throws error with message:
   ```
   "Rate limit exceeded. Try again in {retryAfterSeconds} seconds."
   ```

3. **HTTP Response**: Returns 429 status with retry-after header

### Fail-Open Behavior

When Redis or rate limiting service fails:

1. **Redis Connection Issues**: Allow requests to proceed
2. **Service Errors**: Log error but don't block requests
3. **Configuration Errors**: Use fallback defaults

## Redis Key Patterns

All rate limiting data is stored in Redis with specific key patterns:

- **Standard Rate Limits**: `membership:rate_limit:{IP}:{ENDPOINT}`
- **Failed Authentication**: `membership:rate_limit:{IP}:failed_auth`
- **Global Rate Limits**: `membership:rate_limit:{IP}:global`

## Time-to-Live (TTL) Management

Keys automatically expire based on their time windows:
- **Per Minute**: 60 seconds TTL
- **Per 10 Minutes**: 600 seconds TTL  
- **Per Hour**: 3600 seconds TTL
- **Failed Auth**: 3600 seconds TTL (1 hour)

## Internal IP Exemptions

Private/internal IPs bypass rate limiting:
- `10.0.0.0/8` (Private Class A)
- `172.16.0.0/12` (Private Class B)  
- `192.168.0.0/16` (Private Class C)
- `127.0.0.1`, `::1` (Loopback)

## Environment-Specific Behavior

**Development Environment**:
- Rate limits multiplied by 10x for easier testing
- More permissive thresholds

**Test Environment**:
- Rate limiting completely disabled (`enableEndpointRateLimiting: false`)

**Production Environment**:
- Strict limits as defined in configuration
- Full enforcement of all policies

## Monitoring and Alerting

Rate limiting events can be monitored through:

1. **Application Logs**: All rate limit events are logged
2. **Redis Metrics**: Key counts and TTL values
3. **Performance Metrics**: Request processing times
4. **Circuit Breaker Integration**: Upstream service failures

---

**Note**: This system is designed to fail open - if rate limiting services are unavailable, requests are allowed to proceed to maintain service availability.
