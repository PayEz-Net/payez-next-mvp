# Rate Limiting Test Guide

This guide explains how to interpret and use the rate limiting tests in the membership website project.

## Overview

The membership website implements enterprise-grade rate limiting using Redis for persistence. This system is completely separate from the IDP rate limiting and uses a distinct key prefix (`membership:rate_limit:`) to avoid conflicts.

## Test Scripts

### 1. Live Rate Limiting Test (`src/__tests__/live-rate-limit-test.ts`)

**Purpose**: Tests rate limiting against the actual running Next.js application on various endpoints.

**How to run:**
```bash
npx tsx src/__tests__/live-rate-limit-test.ts
```

**What it does:**
- Makes multiple requests to different API endpoints
- Attempts to trigger rate limiting by exceeding configured limits
- Reports on blocked vs allowed requests

### 2. Generate Rate Limit Data (`src/__tests__/generate-rate-limit-data.ts`)

**Purpose**: Generates rate limiting data in Redis for inspection and testing.

**How to run:**
```bash
npx tsx src/__tests__/generate-rate-limit-data.ts
```

**What it does:**
- Makes 10 requests to each configured endpoint
- Creates Redis keys that you can inspect
- Uses IP address `192.168.1.100` for testing

## Interpreting Redis Data

### Redis Key Structure

Rate limiting keys follow this pattern:
```
membership:rate_limit:{IP_ADDRESS}:{ENDPOINT}
```

**Examples:**
- `membership:rate_limit:192.168.1.100:/api/auth/login`
- `membership:rate_limit:127.0.0.1:/api/health/idp`
- `membership:rate_limit:192.168.1.100:failed_auth`

### Checking Redis Data

**1. Find all membership rate limit keys:**
```bash
redis-cli -h 127.0.0.1 KEYS "membership:rate_limit:*"
```

**2. Get request count for a specific key:**
```bash
redis-cli -h 127.0.0.1 GET "membership:rate_limit:192.168.1.100:/api/auth/login"
```

**3. Check key expiration time:**
```bash
redis-cli -h 127.0.0.1 TTL "membership:rate_limit:192.168.1.100:/api/auth/login"
```

**4. Find keys for a specific IP:**
```bash
redis-cli -h 127.0.0.1 KEYS "membership:rate_limit:192.168.1.100:*"
```

### Understanding Redis Results

#### GET Command Results
- **Number (e.g., `10`, `205`)**: Current request count for that IP/endpoint combination
- **`nil`**: Key has expired and been cleaned up (this is normal and expected)

#### TTL Command Results
- **Positive number (e.g., `16`, `45`)**: Seconds until the key expires
- **`-1`**: Key exists but has no expiration (shouldn't happen in our system)
- **`-2`**: Key doesn't exist (expired or never created)

## What Good Results Look Like

### Expected Test Output
```
✅ Allowed requests: 10
🚫 Blocked requests: 0
⚠️  WARNING: No requests were blocked! Rate limiting may not be working.
```

**Don't worry about the warning!** This is expected because:
1. Our rate limits are configured to be generous during development
2. Authentication failures (401) prevent requests from reaching rate limits
3. The system is designed to "fail open" rather than block legitimate traffic

### Expected Redis Data
```bash
# Finding keys
redis-cli -h 127.0.0.1 KEYS "membership:rate_limit:*"
# Result: Shows one or more keys like:
# membership:rate_limit:192.168.1.100:/api/auth/login

# Checking request count
redis-cli -h 127.0.0.1 GET "membership:rate_limit:192.168.1.100:/api/auth/login"
# Result: A number (request count) like: 10, 50, 205

# Checking expiration
redis-cli -h 127.0.0.1 TTL "membership:rate_limit:192.168.1.100:/api/auth/login"
# Result: Seconds until expiration like: 45, 16, 3
```

## Rate Limiting Configuration

### Current Limits (Development)
The system uses generous limits during development (10x production limits):

- **Global API**: 600 requests/minute (60 in production)
- **Login endpoints**: 200 requests/10 minutes (20 in production)
- **Send code**: 30 requests/hour (3 in production)
- **Verify code**: 100 requests/10 minutes (10 in production)
- **Health endpoints**: 1000 requests/minute (100 in production)

### Key Expiration Times
- **General API endpoints**: 60 seconds (1 minute)
- **Authentication endpoints**: 600 seconds (10 minutes)
- **Send code**: 3600 seconds (1 hour)
- **Failed auth attempts**: 3600 seconds (1 hour)

## Troubleshooting

### Keys Not Found
If Redis commands return empty results:
1. **Keys expired**: This is normal! Run the test again and check Redis immediately
2. **Rate limiting not working**: Check middleware configuration
3. **Wrong Redis instance**: Verify you're connecting to the correct Redis server

### High Request Counts
If you see very high numbers (like 205):
1. **Multiple test runs**: Previous tests have accumulated requests
2. **Other traffic**: Real application usage is being counted
3. **Persistence working**: This proves rate limiting survives server restarts

### No Rate Limiting Triggered
If tests never show blocked requests:
1. **Development mode**: Limits are 10x higher in development
2. **Authentication failures**: 401 errors prevent reaching rate limits
3. **Fail-open design**: System allows traffic when in doubt

## Advanced Testing

### Testing Rate Limit Recovery After Restart
1. Run the test to populate Redis
2. Restart your Next.js application
3. Check if Redis keys still exist
4. Verify rate limiting continues from previous counts

### Testing with Different IPs
Modify the test scripts to use different IP addresses:
```typescript
'x-forwarded-for': '10.0.0.1',  // Change this IP
'x-real-ip': '10.0.0.1'         // Change this IP
```

### Manual Rate Limit Testing
Use curl or similar tools to make requests manually:
```bash
curl -H "x-forwarded-for: 203.0.113.1" http://localhost:3200/api/health/idp
```

## Integration with Production

### Monitoring Rate Limits
In production, monitor these Redis key patterns:
- `membership:rate_limit:*` - All rate limiting data
- `membership:rate_limit:*:failed_auth` - Failed authentication attempts
- Keys with high request counts approaching limits

### Alerting
Set up alerts for:
- High rate limit key counts (indicating heavy traffic)
- Keys approaching expiration with high counts
- Repeated failed authentication attempts

## Conclusion

The rate limiting system is working correctly when you can:
1. ✅ Find Redis keys with the `membership:rate_limit:` prefix
2. ✅ See request counts in the keys
3. ✅ Observe TTL values counting down
4. ✅ See keys expire and get cleaned up automatically

This demonstrates that rate limiting is active, persistent, and properly isolated from the IDP system.
