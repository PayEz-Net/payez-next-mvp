# Middleware Reference

## Overview

This document provides a comprehensive reference for all middleware components in the enhanced API handler system, including their purposes, configurations, and usage patterns.

---

## Middleware Architecture

The middleware system is built on a modular architecture where individual middleware components can be combined into chains based on endpoint characteristics. Each middleware component serves a specific purpose and can be configured independently.

### Core Principles

1. **Composable**: Middleware components can be combined in different chains
2. **Configurable**: Each middleware accepts configuration options
3. **Automatic**: Middleware is applied automatically based on endpoint characteristics
4. **Consistent**: All middleware follows the same interface and patterns

---

## Available Middleware Components

### 1. RequestLoggingMiddleware

**Purpose**: Comprehensive request and response logging with correlation tracking

**Applied to**: All endpoints

**Features**:
- Request ID generation and propagation
- Request/response timing measurements
- User context logging when available
- Error tracking and correlation
- Performance metrics collection

**Configuration**:
```typescript
interface RequestLoggingConfig {
  includeHeaders?: boolean;      // Default: false
  includeBody?: boolean;         // Default: false (for security)
  logLevel?: 'info' | 'debug';   // Default: 'info'
  excludePaths?: string[];       // Paths to exclude from logging
}
```

**Usage Example**:
```typescript
const requestLoggingMiddleware = new RequestLoggingMiddleware({
  includeHeaders: false,
  includeBody: false,
  logLevel: 'info'
});
```

**Log Output Format**:
```json
{
  "level": "info",
  "message": "API Request",
  "requestId": "req_12345",
  "method": "POST",
  "path": "/api/admin/users",
  "userId": "user_123",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "duration": 234
}
```

---

### 2. SecurityMiddleware

**Purpose**: Security validation, headers, and threat detection

**Applied to**: All endpoints

**Features**:
- Security header injection
- Request validation and sanitization
- Suspicious pattern detection
- CORS header management
- Input size limits

**Configuration**:
```typescript
interface SecurityConfig {
  maxRequestSize?: number;       // Default: 1MB
  enableCSPHeaders?: boolean;    // Default: true
  corsOrigins?: string[];        // Allowed CORS origins
  rateWindowMs?: number;         // Rate limit window
}
```

**Security Headers Applied**:
```typescript
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}
```

**Usage Example**:
```typescript
const securityMiddleware = new SecurityMiddleware({
  maxRequestSize: 1024 * 1024, // 1MB
  enableCSPHeaders: true,
  corsOrigins: ['https://admin.payez.net']
});
```

---

### 3. RateLimitMiddleware

**Purpose**: Prevent abuse through request rate limiting

**Applied to**: Verification endpoints, authentication endpoints, selected high-traffic endpoints

**Features**:
- Redis-backed rate limiting
- Progressive authentication delays
- IP-based and user-based limiting
- Configurable limits per endpoint type
- PayEz standard response format

**Configuration**:
```typescript
interface RateLimitConfig {
  maxRequests: number;           // Max requests per window
  windowMs: number;              // Time window in milliseconds
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean;  // Skip counting failed requests
  keyGenerator?: (req: Request) => string; // Custom key generation
}
```

**Rate Limiting Policies**:

| Endpoint Type | Requests | Window | Key |
|---------------|----------|---------|-----|
| **Login** | 5 | 15 minutes | IP address |
| **2FA Verification** | 3 | 5 minutes | User ID |
| **Password Reset** | 3 | 1 hour | Email |
| **General API** | 100 | 1 minute | User ID |

**Usage Example**:
```typescript
const rateLimitMiddleware = new RateLimitMiddleware({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (req) => getClientIP(req)
});
```

**Rate Limit Response**:
```json
{
  "success": true,
  "data": {
    "type": "RateLimitExceeded",
    "title": "Rate Limit Exceeded",
    "status": 429,
    "detail": "Too many requests. Please try again in 60 seconds.",
    "errors": [{
      "code": "RateLimitExceeded",
      "resolution": "Try again in 60 seconds"
    }]
  },
  "meta": {
    "version": "1.0",
    "requestId": "req_12345"
  }
}
```

---

### 4. CircuitBreakerMiddleware

**Purpose**: Prevent cascade failures and maintain system stability

**Applied to**: Admin endpoints, high-traffic endpoints, verification endpoints

**Features**:
- Three-state circuit breaker (CLOSED/OPEN/HALF_OPEN)
- Configurable failure thresholds
- Progressive recovery with backoff
- Redis-backed state persistence
- Health check integration

**Configuration**:
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;      // Failures before opening (default: 5)
  recoveryTimeMs: number;        // Time before attempting recovery (default: 60000)
  monitoringWindowMs: number;    // Time window for failure counting (default: 60000)
  halfOpenMaxRequests: number;   // Max requests in half-open state (default: 3)
}
```

**Circuit Breaker States**:

| State | Behavior | Transition |
|-------|----------|------------|
| **CLOSED** | Normal operation, counting failures | → OPEN after threshold failures |
| **OPEN** | Failing fast, rejecting requests | → HALF_OPEN after recovery time |
| **HALF_OPEN** | Testing recovery, limited requests | → CLOSED on success, OPEN on failure |

**Usage Example**:
```typescript
const circuitBreakerMiddleware = new CircuitBreakerMiddleware({
  failureThreshold: 5,
  recoveryTimeMs: 60000,
  monitoringWindowMs: 60000
});
```

**Circuit Breaker Response**:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable",
    "details": {
      "circuitBreakerState": "OPEN",
      "retryAfter": 30
    }
  },
  "meta": {
    "version": "1.0",
    "requestId": "req_12345"
  }
}
```

---

### 5. PerformanceMiddleware

**Purpose**: Monitor response times and track performance metrics

**Applied to**: All endpoints

**Features**:
- Response time measurement
- Slow request detection and alerting
- Performance metrics collection
- Resource usage monitoring
- Performance trend analysis

**Configuration**:
```typescript
interface PerformanceConfig {
  slowRequestThresholdMs: number; // Threshold for slow request alerts (default: 1000)
  enableMetrics: boolean;         // Enable metrics collection (default: true)
  sampleRate: number;             // Sampling rate for metrics (default: 1.0)
}
```

**Performance Metrics Collected**:
- Request duration (ms)
- Memory usage
- CPU utilization (when available)
- Concurrent request count
- Error rates

**Usage Example**:
```typescript
const performanceMiddleware = new PerformanceMiddleware({
  slowRequestThresholdMs: 1000,
  enableMetrics: true,
  sampleRate: 1.0
});
```

**Performance Log Output**:
```json
{
  "level": "info",
  "message": "Performance Metric",
  "requestId": "req_12345",
  "duration": 234,
  "endpoint": "/api/admin/users",
  "method": "POST",
  "statusCode": 200,
  "memoryUsage": 45.2,
  "timestamp": "2024-12-01T10:30:00.000Z"
}
```

---

### 6. UpstreamErrorHandlerMiddleware

**Purpose**: Handle and standardize errors from upstream services

**Applied to**: Endpoints that interact with external services

**Features**:
- Error code mapping from upstream services
- Standardized error response format
- Error classification and handling
- Retry logic for transient errors
- Error correlation and tracking

**Configuration**:
```typescript
interface UpstreamErrorConfig {
  retryAttempts: number;         // Max retry attempts (default: 3)
  retryDelayMs: number;          // Delay between retries (default: 1000)
  timeoutMs: number;             // Request timeout (default: 30000)
  enableRetry: boolean;          // Enable automatic retries (default: true)
}
```

**Error Code Mapping**:

| Upstream Code | PayEz Code | HTTP Status | Description |
|---------------|------------|-------------|-------------|
| 400 | INVALID_REQUEST | 400 | Bad request from client |
| 401 | UNAUTHORIZED | 401 | Authentication required |
| 403 | FORBIDDEN | 403 | Insufficient permissions |
| 404 | NOT_FOUND | 404 | Resource not found |
| 429 | RATE_LIMITED | 429 | Rate limit exceeded |
| 500 | UPSTREAM_ERROR | 502 | Upstream service error |
| timeout | SERVICE_TIMEOUT | 504 | Service timeout |

**Usage Example**:
```typescript
const upstreamErrorHandler = new UpstreamErrorHandlerMiddleware({
  retryAttempts: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000
});
```

---

## Middleware Chains

### Predefined Middleware Chains

The system provides several predefined middleware chains optimized for different endpoint types:

#### PUBLIC Chain
**Applied to**: Public endpoints that don't require authentication

```typescript
MIDDLEWARE_CHAINS.PUBLIC = [
  RequestLoggingMiddleware,
  SecurityMiddleware,
  RateLimitMiddleware,
  PerformanceMiddleware
];
```

#### VERIFICATION Chain
**Applied to**: 2FA and verification endpoints

```typescript
MIDDLEWARE_CHAINS.VERIFICATION = [
  RequestLoggingMiddleware,
  SecurityMiddleware,
  RateLimitMiddleware,      // Strict limits
  CircuitBreakerMiddleware,
  PerformanceMiddleware
];
```

#### ADMIN Chain
**Applied to**: Administrative operations

```typescript
MIDDLEWARE_CHAINS.ADMIN = [
  RequestLoggingMiddleware,
  SecurityMiddleware,
  CircuitBreakerMiddleware, // For IDP reliability
  PerformanceMiddleware
];
```

#### HIGH_TRAFFIC Chain
**Applied to**: High-volume endpoints

```typescript
MIDDLEWARE_CHAINS.HIGH_TRAFFIC = [
  RequestLoggingMiddleware,
  SecurityMiddleware,
  CircuitBreakerMiddleware, // For resilience
  PerformanceMiddleware
];
```

#### STANDARD Chain
**Applied to**: Basic authenticated endpoints

```typescript
MIDDLEWARE_CHAINS.STANDARD = [
  RequestLoggingMiddleware,
  SecurityMiddleware,
  PerformanceMiddleware
];
```

### Custom Middleware Chains

You can create custom middleware chains for specific requirements:

```typescript
// Custom middleware chain for sensitive operations
const SENSITIVE_OPERATIONS = [
  RequestLoggingMiddleware,
  SecurityMiddleware,
  RateLimitMiddleware,
  CircuitBreakerMiddleware,
  PerformanceMiddleware,
  CustomAuditMiddleware
];
```

---

## Middleware Configuration Examples

### Verification Endpoint Configuration

```typescript
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';

const handler = createHandlerWithMiddleware.verification('/api/account/send-code', {
  requireAuth: true,
  requiredRoles: ['merchant', 'admin'],
  timeout: 15000,
  middlewareConfig: {
    rateLimit: {
      maxRequests: 3,
      windowMs: 5 * 60 * 1000 // 5 minutes
    },
    circuitBreaker: {
      failureThreshold: 2,
      recoveryTimeMs: 30000
    }
  }
});
```

### Admin Endpoint Configuration

```typescript
const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  timeout: 30000,
  middlewareConfig: {
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeMs: 60000
    },
    performance: {
      slowRequestThresholdMs: 2000 // Higher threshold for admin operations
    }
  }
});
```

### High-Traffic Endpoint Configuration

```typescript
const handler = createHandlerWithMiddleware.highTraffic('/api/auth/login', {
  requireAuth: false,
  timeout: 15000,
  middlewareConfig: {
    rateLimit: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000 // 15 minutes per IP
    },
    circuitBreaker: {
      failureThreshold: 10,
      recoveryTimeMs: 30000
    }
  }
});
```

---

## Middleware Execution Order

Middleware is executed in the order defined in the chain:

1. **Request Phase** (top to bottom):
   - RequestLoggingMiddleware (start logging)
   - SecurityMiddleware (validate security)
   - RateLimitMiddleware (check rate limits)
   - CircuitBreakerMiddleware (check circuit state)
   - PerformanceMiddleware (start timing)

2. **Handler Execution**: Your endpoint handler runs

3. **Response Phase** (bottom to top):
   - PerformanceMiddleware (record timing)
   - CircuitBreakerMiddleware (record success/failure)
   - RateLimitMiddleware (update counters)
   - SecurityMiddleware (add headers)
   - RequestLoggingMiddleware (log response)

---

## Error Handling in Middleware

### Error Propagation

Middleware errors are handled consistently:

```typescript
// Example middleware error handling
class CustomMiddleware {
  async execute(req: Request, context: Context, next: () => Promise<Response>): Promise<Response> {
    try {
      // Pre-processing
      await this.beforeRequest(req, context);
      
      // Continue to next middleware/handler
      const response = await next();
      
      // Post-processing
      await this.afterRequest(response, context);
      
      return response;
    } catch (error) {
      // Log error with context
      logger.error('Middleware error', {
        middleware: 'CustomMiddleware',
        requestId: context.requestId,
        error: error.message
      });
      
      // Return standardized error response
      return this.createErrorResponse(error, context);
    }
  }
}
```

### Error Response Format

All middleware follows the same error response format:

```json
{
  "success": false,
  "error": {
    "code": "MIDDLEWARE_ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "middleware": "MiddlewareName",
      "originalError": "Original error details"
    }
  },
  "meta": {
    "version": "1.0",
    "requestId": "req_12345",
    "timestamp": "2024-12-01T10:30:00.000Z"
  }
}
```

---

## Monitoring and Debugging

### Middleware Inspection

Use the middleware inspector to validate configurations:

```typescript
import { getEndpointMiddlewareInfo, validateMiddlewareConfig } from '@/lib/enhanced-api-handler';

// Inspect middleware for specific endpoint
const info = getEndpointMiddlewareInfo('/api/account/send-code');
console.log('Applied middleware:', info.middleware);

// Validate middleware configuration
const validation = validateMiddlewareConfig('/api/account/send-code');
if (!validation.isValid) {
  console.log('Issues:', validation.issues);
  console.log('Recommendations:', validation.recommendations);
}
```

### Middleware Metrics

Each middleware component provides metrics:

```typescript
// Example metrics from RateLimitMiddleware
{
  "middleware": "RateLimit",
  "endpoint": "/api/account/send-code",
  "requestsBlocked": 15,
  "requestsAllowed": 245,
  "currentWindowRequests": 3,
  "windowResetTime": "2024-12-01T10:35:00.000Z"
}
```

### Debug Logging

Enable debug logging for detailed middleware execution:

```typescript
// Enable debug logging in development
const handler = createHandlerWithMiddleware.verification('/api/endpoint', {
  debug: true, // Enables detailed middleware logging
  // ... other config
});
```

---

## Best Practices

### 1. Middleware Configuration
- Use appropriate middleware chains for each endpoint type
- Configure timeouts based on expected operation complexity
- Set reasonable rate limits to prevent abuse without blocking legitimate traffic

### 2. Error Handling
- Always handle middleware errors gracefully
- Provide meaningful error messages to clients
- Log detailed error information for debugging

### 3. Performance
- Monitor middleware execution times
- Use appropriate sampling rates for metrics
- Configure circuit breakers with realistic thresholds

### 4. Security
- Validate all input in SecurityMiddleware
- Use strict rate limiting for sensitive operations
- Monitor for suspicious patterns and attacks

### 5. Testing
- Test middleware configurations thoroughly
- Validate error handling scenarios
- Test circuit breaker state transitions

---

## Troubleshooting

### Common Issues

#### 1. Rate Limiting Not Working
```typescript
// Check if endpoint uses verification or public handler
const info = getEndpointMiddlewareInfo('/api/your-endpoint');
if (!info.middleware.includes('RateLimit')) {
  // Rate limiting not applied - check handler type
}
```

#### 2. Circuit Breaker Always Open
```typescript
// Check circuit breaker state and configuration
const state = await getCircuitBreakerState('/api/endpoint');
console.log('Circuit state:', state);

// Reset if needed
await resetCircuitBreaker('/api/endpoint');
```

#### 3. Missing Security Headers
```typescript
// Verify SecurityMiddleware is applied
const info = getEndpointMiddlewareInfo('/api/endpoint');
if (!info.middleware.includes('Security')) {
  // Security middleware not applied
}
```

#### 4. Performance Issues
```typescript
// Check middleware execution times
const metrics = await getMiddlewareMetrics('/api/endpoint');
console.log('Middleware timing:', metrics.executionTimes);
```

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: Quarterly
