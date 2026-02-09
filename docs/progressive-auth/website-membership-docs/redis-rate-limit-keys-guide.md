# Redis Rate Limit Keys - Identification Guide

## Current Rate Limit Key Patterns

### 1. **IDP (PayEz.External.Id.Api) Rate Limits**
```
rate_limit:::ffff:10.0.0.101:failed_auth        # IDP failed auth attempts by IP
rate_limit:::ffff:10.0.0.10:failed_auth         # IDP failed auth attempts by IP  
rate_limit:::ffff:10.0.0.100:failed_auth        # IDP failed auth attempts by IP
```

**Pattern**: `rate_limit::{IP}:failed_auth`
- **System**: IDP (C# .NET API)
- **Purpose**: Track failed authentication attempts per IP
- **TTL**: 1 hour
- **Location**: PayEz.External.Id.Api.Middleware.RateLimitingMiddleware.cs

### 2. **Next.js Website Rate Limits**
```
rl:nextjs:{IP}:{endpoint}                        # Next.js standard rate limits
rl:nextjs:{IP}:failed_auth                       # Next.js failed auth tracking
rl:nextjs:{IP}:progressive_auth:{action}         # Next.js progressive auth limits
```

**Pattern**: `rl:nextjs:{IP}:{context}`
- **System**: Next.js Website 
- **Purpose**: Client-side rate limiting
- **TTL**: Varies (1 min - 1 hour)
- **Location**: src/lib/api-middleware.ts

## Proposed Standardized Naming Convention

### **Format**: `rl:{service}:{type}:{identifier}:{context}`

#### **Service Identifiers**:
- `idp` - PayEz Identity Provider API
- `nextjs` - Next.js Website
- `cryptaply` - CryptAply API
- `payez-core` - PayEz Core API

#### **Type Identifiers**:
- `failed_auth` - Failed authentication attempts
- `request` - General request rate limiting  
- `progressive` - Progressive auth workflows
- `sms` - SMS code sending/verification
- `totp` - TOTP verification attempts

#### **Identifier**:
- IP address (for IP-based limiting)
- User ID (for user-based limiting)
- Email address (for email-based limiting)

#### **Context** (optional):
- Endpoint path (e.g., `/api/auth/login`)
- Action type (e.g., `start`, `verify`, `setup`)

## Examples of Standardized Keys

```bash
# IDP Rate Limits
rl:idp:failed_auth:10.0.0.101:login              # IDP login failures by IP
rl:idp:request:10.0.0.101:/api/account/masked-info  # IDP request rate limit
rl:idp:progressive:user123:totp_setup             # IDP progressive auth by user

# Next.js Rate Limits  
rl:nextjs:failed_auth:192.168.1.100:login        # Next.js login failures by IP
rl:nextjs:request:192.168.1.100:/api/auth/verify # Next.js API rate limit
rl:nextjs:sms:user456:send                        # Next.js SMS sending by user

# CryptAply Rate Limits
rl:cryptaply:request:10.0.0.101:/api/encrypt     # CryptAply API rate limit
rl:cryptaply:failed_auth:service_account:token   # CryptAply service auth failures
```

## Redis Commands for Rate Limit Management

### **Find All Rate Limit Keys**
```bash
# Current pattern (mixed)
redis-cli KEYS "rate_limit:*"
redis-cli KEYS "rl:*"

# After standardization
redis-cli KEYS "rl:*"
```

### **Find Keys by Service**
```bash
# IDP rate limits
redis-cli KEYS "rl:idp:*"

# Next.js rate limits  
redis-cli KEYS "rl:nextjs:*"

# CryptAply rate limits
redis-cli KEYS "rl:cryptaply:*"
```

### **Find Keys by Type**
```bash
# All failed auth rate limits
redis-cli --scan --pattern "rl:*:failed_auth:*"

# All request rate limits
redis-cli --scan --pattern "rl:*:request:*"

# All progressive auth limits
redis-cli --scan --pattern "rl:*:progressive:*"
```

### **Find Keys by IP/User**
```bash
# All limits for specific IP
redis-cli KEYS "rl:*:*:10.0.0.101:*"

# All limits for specific user
redis-cli KEYS "rl:*:*:user123:*"
```

### **Clear Rate Limits by Service**
```bash
# Clear all IDP rate limits
redis-cli --scan --pattern "rl:idp:*" | xargs redis-cli DEL

# Clear all Next.js rate limits
redis-cli --scan --pattern "rl:nextjs:*" | xargs redis-cli DEL

# Clear specific IP from all services
redis-cli --scan --pattern "rl:*:*:10.0.0.101:*" | xargs redis-cli DEL
```

### **Inspect Rate Limit Values**
```bash
# Check remaining count and TTL
redis-cli GET "rl:idp:failed_auth:10.0.0.101:login"
redis-cli TTL "rl:idp:failed_auth:10.0.0.101:login"

# Get all info about a key
redis-cli HGETALL "rl:idp:failed_auth:10.0.0.101:login"  # if using hash
```

## Emergency Rate Limit Management

### **Clear All Rate Limits (Nuclear Option)**
```bash
# Clear all rate limit keys across all services
redis-cli --scan --pattern "rl:*" | xargs redis-cli DEL
redis-cli --scan --pattern "rate_limit:*" | xargs redis-cli DEL  # Legacy pattern
```

### **Clear Specific Problem IP**
```bash
# Clear all rate limits for problematic IP
redis-cli --scan --pattern "rl:*:*:PROBLEM_IP:*" | xargs redis-cli DEL
```

### **Clear Failed Auth Only (Keep Other Limits)**
```bash
# Clear only failed auth limits, keep request rate limits
redis-cli --scan --pattern "rl:*:failed_auth:*" | xargs redis-cli DEL
```

## Monitoring and Diagnostics

### **Check Current Rate Limit Status**
```bash
#!/bin/bash
echo "=== IDP Rate Limits ==="
redis-cli --scan --pattern "rl:idp:*" | while read key; do
  ttl=$(redis-cli TTL "$key")
  val=$(redis-cli GET "$key")
  echo "$key: $val (TTL: ${ttl}s)"
done

echo "=== Next.js Rate Limits ==="
redis-cli --scan --pattern "rl:nextjs:*" | while read key; do
  ttl=$(redis-cli TTL "$key")
  val=$(redis-cli GET "$key")
  echo "$key: $val (TTL: ${ttl}s)"
done
```

### **Find Heavy Rate Limited IPs**
```bash
# Find IPs with many failed auth attempts
redis-cli --scan --pattern "rl:*:failed_auth:*" | while read key; do
  val=$(redis-cli GET "$key")
  if [ "$val" -gt 3 ]; then
    echo "High failed auth count: $key = $val"
  fi
done
```

## Implementation TODOs

### **IDP Updates Needed**:
1. Update `PayEz.External.Id.Api.Middleware.RateLimitingMiddleware.cs`
2. Change key pattern from `rate_limit::{IP}:failed_auth` to `rl:idp:failed_auth:{IP}:login`
3. Add service identifier to all cache keys

### **Next.js Updates Needed**:
1. Update `src/lib/rate-limit-service.ts` (when found)
2. Standardize key pattern to `rl:nextjs:{type}:{identifier}:{context}`
3. Add proper service identification

### **Monitoring Integration**:
1. Add Grafana dashboard for rate limit metrics
2. Set up alerts for high rate limit violations
3. Create automated cleanup scripts for expired limits

## Rate Limit Key Lifespan

| Service | Type | TTL | Purpose |
|---------|------|-----|---------|
| IDP | failed_auth | 1 hour | Failed login attempts |
| IDP | request | 1 minute | Standard API rate limiting |
| Next.js | failed_auth | 1 hour | Client-side auth failures |
| Next.js | request | 1 minute | API endpoint rate limiting |
| Next.js | progressive | 1 hour | Registration/verification flows |

This standardization will make debugging rate limit issues much easier by clearly identifying:
- **Which service** created the rate limit
- **What type** of rate limiting it represents  
- **Which user/IP** is being limited
- **What action** triggered the limit