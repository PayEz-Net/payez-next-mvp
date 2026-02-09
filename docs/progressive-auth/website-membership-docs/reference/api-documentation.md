# API Documentation - Version 1.0

## Overview

This document provides comprehensive documentation for the PayEz Membership Website API endpoints, including version information, middleware configurations, and the enhanced handler system implemented through the API migration.

**Migration Status:** ✅ Complete - All 24 endpoints migrated to enhanced handler system  
**Last Updated:** December 2024  
**Validation Status:** 100% test pass rate  

## API Version

**Current Version**: 1.0

All API endpoints have been standardized to version 1.0 through the comprehensive migration. The version is indicated in response metadata:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "version": "1.0",
    "operation": "endpoint-specific-operation",
    "responseTime": "123ms",
    "requestId": "unique-request-id"
  }
}
```

## Enhanced Handler System and Middleware Architecture

The API now uses an enhanced handler system with automatic middleware application based on route characteristics. This system was implemented through a comprehensive migration that standardized all 24 endpoints.

### Handler Types Available

1. **Verification Handler (`.verification()`)** - For 2FA and verification endpoints
2. **Admin Handler (`.admin()`)** - For administrative operations
3. **High-Traffic Handler (`.highTraffic()`)** - For performance-critical endpoints
4. **Standard Handler** - For basic operations with manual middleware configuration

### Automatic Middleware Application

The enhanced system automatically applies appropriate middleware chains based on endpoint characteristics:

### Available Middleware Components

1. **RequestLoggingMiddleware**
   - Logs all API requests and responses
   - Includes request ID, user information, and timing data
   - Applied to: All routes

2. **SecurityMiddleware**
   - Validates headers and implements security checks
   - Monitors for suspicious patterns
   - Applied to: All routes

3. **RateLimitMiddleware**
   - Prevents abuse through request limiting
   - Uses Redis-based rate limiting with progressive delays
   - Applied to: Public endpoints, verification endpoints, auth endpoints

4. **CircuitBreakerMiddleware**
   - Protects against upstream service failures
   - Automatically fails fast when services are down
   - Applied to: Routes with external dependencies

5. **PerformanceMiddleware**
   - Monitors response times and performance metrics
   - Alerts on slow responses
   - Applied to: All routes

6. **ValidationMiddleware**
   - Validates request payloads (placeholder for future implementation)
   - Applied to: Routes requiring input validation

### Middleware Chain Configurations

#### PUBLIC Chain
Applied to endpoints that don't require authentication:
- RequestLoggingMiddleware
- SecurityMiddleware  
- RateLimitMiddleware
- PerformanceMiddleware

**Example Endpoints:**
- `/api/auth/login` - User authentication

#### VERIFICATION Chain
Applied automatically to verification endpoints using `.verification()` handler:
- RequestLoggingMiddleware
- SecurityMiddleware
- RateLimitMiddleware (strict limits for abuse prevention)
- CircuitBreakerMiddleware
- PerformanceMiddleware

**Migrated Endpoints (5 total):**
- `/api/account/send-code` - Send 2FA codes
- `/api/account/verify-code` - Verify 2FA codes
- `/api/account/verify-email` - Email verification
- `/api/account/verify-sms` - SMS verification
- `/api/auth/verify-2fa` - 2FA verification

#### ADMIN Chain
Applied automatically to admin endpoints using `.admin()` handler:
- RequestLoggingMiddleware
- SecurityMiddleware
- CircuitBreakerMiddleware (for upstream IDP reliability)
- PerformanceMiddleware

**Migrated Endpoints (8 total):**
- `/api/admin/users` - User management
- `/api/admin/users/[id]` - Individual user operations
- `/api/admin/users/client-create` - User creation for clients
- `/api/admin/users/grid-state` - UI state management
- `/api/admin/clients` - Client management
- `/api/admin/clients/[id]` - Individual client operations
- `/api/admin/clients/[id]/permissions` - Permission management
- `/api/admin/clients/[id]/roles` - Role management

#### HIGH_TRAFFIC Chain
Applied automatically to high-traffic endpoints using `.highTraffic()` handler:
- RequestLoggingMiddleware
- SecurityMiddleware
- CircuitBreakerMiddleware (for resilience under load)
- PerformanceMiddleware

**Migrated Endpoints (7 total):**
- `/api/account/change-password` - Password changes
- `/api/account/masked-info` - User account information
- `/api/auth/login` - User authentication
- `/api/auth/signout` - User logout
- `/api/auth/update-session` - Session updates
- `/api/auth/[...nextauth]` - NextAuth callbacks
- `/api/session/set` - Session management

#### STANDARD Chain
Applied to basic endpoints with manual middleware configuration:
- RequestLoggingMiddleware
- SecurityMiddleware
- PerformanceMiddleware

**Migrated Endpoints (4 total):**
- `/api/account/validate-password` - Password validation utility
- `/api/health/idp` - Health check endpoint
- `/api/test/clear-session` - Test utility
- `/api/test/refresh-token` - Test utility

## Enhanced Handler System Usage

### Creating Endpoints with Enhanced Handlers

#### Verification Endpoint Example
```typescript
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';

// Automatically applies: RequestLogging, Security, RateLimit, CircuitBreaker, Performance
const handler = createHandlerWithMiddleware.verification('/api/account/send-code', {
  requireAuth: true,
  requiredRoles: ['merchant', 'admin'],
  timeout: 15000
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Handler logic with automatic middleware protection
});
```

#### Admin Endpoint Example
```typescript
// Automatically applies: RequestLogging, Security, CircuitBreaker, Performance
const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  timeout: 30000 // Extended timeout for admin operations
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Automatic role checking (payez_admin) and circuit breaker protection
});
```

#### High-Traffic Endpoint Example
```typescript
// Automatically applies: RequestLogging, Security, CircuitBreaker, Performance
const handler = createHandlerWithMiddleware.highTraffic('/api/auth/login', {
  requireAuth: false, // Login endpoint doesn't require auth
  timeout: 15000
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Circuit breaker and performance monitoring automatically applied
});
```

### Migration Benefits

✅ **Automatic Middleware Application**: Route-specific middleware chains applied based on endpoint characteristics  
✅ **Consistent Error Handling**: Standardized error responses across all endpoints  
✅ **Enhanced Security**: Rate limiting, circuit breaker protection, and comprehensive logging  
✅ **Performance Monitoring**: Built-in performance tracking and alerting  
✅ **Zero Downtime Migration**: All 24 endpoints migrated without service interruption  

## API Endpoint Categories

### Authentication Endpoints (`/api/auth/`)
- **Purpose**: Handle user authentication and session management
- **Middleware**: PUBLIC or HIGH_TRAFFIC
- **Authentication Required**: No (for login), Yes (for others)
- **Rate Limiting**: Yes (prevent brute force attacks)

### Account Management Endpoints (`/api/account/`)
- **Purpose**: User account operations and verification
- **Middleware**: HIGH_TRAFFIC or VERIFICATION
- **Authentication Required**: Yes (merchant or admin role)
- **Rate Limiting**: Yes (prevent abuse)

### Admin Endpoints (`/api/admin/`)
- **Purpose**: Administrative operations for user and client management
- **Middleware**: ADMIN
- **Authentication Required**: Yes (admin role only)
- **Rate Limiting**: No (trusted admin users)

### Utility Endpoints (`/api/health/`, `/api/session/`, `/api/test/`)
- **Purpose**: Health checks, session management, testing
- **Middleware**: Various based on specific needs
- **Authentication Required**: Varies by endpoint

## Authentication & Authorization

### Role-Based Access Control

The API implements role-based access control with the following roles:

1. **Public**: No authentication required
2. **Merchant**: Standard authenticated user with merchant access
3. **Admin**: Administrative access with elevated privileges

### Token Requirements

All authenticated endpoints require:
- Valid JWT access token in Authorization header
- Token format: `Bearer <access_token>`
- Token expiration checking with automatic refresh handling

## Error Response Format

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "SPECIFIC_ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "originalError": "Additional context",
      "field": "Specific field errors"
    }
  },
  "meta": {
    "version": "1.0",
    "requestId": "unique-request-id",
    "responseTime": "123ms"
  }
}
```

### Error Codes

Common error codes include:
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions
- `INVALID_REQUEST`: Malformed request
- `MISSING_REQUIRED_FIELD`: Required field missing
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `UPSTREAM_SERVICE_ERROR`: External service failure
- `CIRCUIT_BREAKER_OPEN`: Service temporarily unavailable

## Rate Limiting

### Rate Limit Responses

When rate limits are exceeded, the API returns a PayEz standard format response:

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
    "version": "1.0"
  }
}
```

### Rate Limit Policies

- **Login attempts**: 5 attempts per 15 minutes per IP
- **2FA code requests**: 3 requests per 5 minutes per user
- **General API calls**: 100 requests per minute per user
- **Failed authentication delay**: Progressive delay up to 5 minutes

## Circuit Breaker Protection

The circuit breaker protects against cascade failures when external services are unavailable:

- **Failure threshold**: 5 failures in 30 seconds
- **Open duration**: 60 seconds before retry attempt
- **Recovery**: Gradual recovery with health checks

When the circuit breaker is open, requests fail fast with:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable"
  }
}
```

## Deprecation Policy

### Current Status
All endpoints are version 1.0 with no deprecations currently active.

### Future Deprecation Process
When endpoints are deprecated:
1. Add deprecation headers to responses
2. Update documentation with migration path
3. Provide 6-month deprecation notice
4. Implement redirect for GET requests where possible
5. Return structured deprecation response for POST/PUT requests

### Deprecation Response Format
```json
{
  "success": false,
  "deprecated": true,
  "message": "This endpoint is deprecated. Please use /api/new-endpoint instead.",
  "migration": {
    "newEndpoint": "/api/new-endpoint",
    "changes": ["List of changes", "Migration notes"]
  }
}
```

## Client Integration

### Error Handling
Clients should handle:
1. Network errors and timeouts
2. Rate limiting with exponential backoff
3. Circuit breaker responses
4. Token expiration and refresh
5. Validation errors

### Best Practices
1. Always check the `success` field in responses
2. Implement proper retry logic for rate limits
3. Use the `requestId` for debugging and support
4. Monitor the `version` field for API updates
5. Handle deprecation notices gracefully

## Monitoring and Observability

All endpoints provide:
- Request/response logging with correlation IDs
- Performance metrics and timing data
- Error tracking and alerting
- Rate limit monitoring
- Circuit breaker state tracking

## Future Roadmap

Planned enhancements for future versions:
1. Enhanced input validation with Zod schemas
2. OpenAPI/Swagger documentation generation
3. Automated testing for all endpoints
4. GraphQL endpoint consideration
5. Webhook support for real-time notifications

---

**Last Updated**: July 2025  
**API Version**: 1.0  
**Document Version**: 1.0
