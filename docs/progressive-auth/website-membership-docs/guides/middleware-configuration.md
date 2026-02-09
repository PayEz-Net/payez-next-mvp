# Route-Specific Middleware Configuration

This document describes the enterprise-grade middleware configuration system that automatically applies the correct middleware to API routes based on their characteristics.

## Overview

The middleware configuration system provides:

- **Automatic middleware detection** based on route patterns and characteristics
- **Role-based access control** enforcement through API configurations
- **Rate limiting** for verification and authentication endpoints
- **Circuit breaker protection** for admin and high-traffic routes
- **Comprehensive logging and security** for all routes
- **Performance monitoring** across all endpoints

## Architecture

The system consists of several key components:

### Core Components

1. **`src/config/middleware-config.ts`** - Central configuration for route characteristics and middleware chains
2. **`src/lib/enhanced-api-handler.ts`** - Enhanced API handler with automatic middleware application
3. **`src/lib/api-middleware.ts`** - Individual middleware implementations
4. **`src/utils/middleware-inspector.ts`** - Validation and inspection utilities

### Route Characteristics

Routes are classified into the following types:

#### Verification Endpoints
- **Routes**: `/api/account/send-code`, `/api/account/verify-email`, `/api/account/verify-sms`, `/api/account/verify-code`
- **Middleware**: RequestLogging, Security, RateLimit, CircuitBreaker, Performance
- **Purpose**: Prevent abuse of verification processes with rate limiting

#### Admin Routes
- **Routes**: `/api/admin/users`, `/api/admin/clients`, `/api/admin/**`
- **Middleware**: RequestLogging, Security, CircuitBreaker, Performance
- **Purpose**: Ensure admin operations are reliable and monitored
- **Access Control**: Role-based access enforced through API configuration (`payez_admin` role required)

#### High-Traffic Routes
- **Routes**: `/api/auth/login`, `/api/auth/session`, `/api/account/masked-info`, etc.
- **Middleware**: RequestLogging, Security, CircuitBreaker, Performance
- **Purpose**: Maintain system stability under high load

#### Standard Routes
- **Routes**: All other API endpoints
- **Middleware**: RequestLogging, Security, Performance
- **Purpose**: Basic monitoring and security

## Middleware Components

### Required for All Routes

#### RequestLoggingMiddleware
- **Purpose**: Comprehensive request/response logging
- **Features**: Request ID tracking, performance metrics, user context

#### SecurityMiddleware
- **Purpose**: Security validation and headers
- **Features**: Security pattern detection, header validation

### Conditional Middleware

#### RateLimitMiddleware
- **Applied to**: Verification endpoints, authentication routes
- **Purpose**: Prevent abuse and DoS attacks
- **Configuration**: Configurable limits per endpoint type

#### CircuitBreakerMiddleware
- **Applied to**: Admin routes, high-traffic routes, verification endpoints
- **Purpose**: Prevent cascade failures and maintain system stability
- **Features**: Automatic failure detection and recovery

#### PerformanceMiddleware
- **Applied to**: All routes
- **Purpose**: Performance monitoring and alerting
- **Features**: Response time tracking, slow request detection

## Usage

### Automatic Configuration

The enhanced API handler automatically applies the correct middleware based on the endpoint:

```typescript
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';

// Automatically applies verification middleware (with rate limiting)
const handler = createHandlerWithMiddleware.verification('/api/account/send-code', {
  requireAuth: true,
  timeout: 15000
});
```

### Manual Configuration

For custom middleware requirements:

```typescript
import { createEnhancedApiHandler } from '@/lib/enhanced-api-handler';
import { CustomMiddleware } from '@/lib/custom-middleware';

const handler = createEnhancedApiHandler('/api/custom/endpoint', {
  skipAutoMiddleware: false,
  additionalMiddleware: [new CustomMiddleware()],
  overrideMiddleware: [/* custom chain */]
});
```

### Route-Specific Handlers

Specialized handlers for different route types:

```typescript
// Verification endpoints
const verificationHandler = createHandlerWithMiddleware.verification('/api/account/verify-email', config);

// Admin endpoints (automatically enforces admin role)
const adminHandler = createHandlerWithMiddleware.admin('/api/admin/users', config);

// High-traffic endpoints
const highTrafficHandler = createHandlerWithMiddleware.highTraffic('/api/auth/login', config);
```

## Configuration

### Route Characteristics

Add new route patterns in `src/config/middleware-config.ts`:

```typescript
export const ROUTE_CHARACTERISTICS: Record<string, RouteCharacteristics> = {
  '/api/new/endpoint': {
    isHighTrafficRoute: true,
    requiresCircuitBreaker: true
  },
  '/api/new/pattern/*': {
    isAdminRoute: true,
    requiresCircuitBreaker: true
  }
};
```

### Middleware Chains

Customize middleware chains for different route types:

```typescript
export const MIDDLEWARE_CHAINS = {
  CUSTOM_TYPE: [
    middlewareInstances.requestLogging,
    middlewareInstances.security,
    middlewareInstances.customMiddleware,
    middlewareInstances.performance
  ]
};
```

## Role-Based Access Control

Admin routes automatically enforce role-based access control:

### Configuration

Role requirements are defined in the API configuration:

```typescript
const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  requiredRoles: ['payez_admin'] // Automatically applied for admin handlers
});
```

### Role Mapping

User roles are validated against the required roles during authentication:

```typescript
// In src/config/routeRoles.ts
export const routeRoles: { [pattern: string]: string[] } = {
  '/dashboards/idp-admin': ['payez_admin'],
  '/api/admin/*': ['payez_admin']
};
```

## Validation and Testing

### Middleware Inspector

Use the middleware inspector to validate configurations:

```typescript
import { inspectAllMiddleware, checkMiddlewareCompliance } from '@/utils/middleware-inspector';

// Inspect all configured endpoints
const results = inspectAllMiddleware();

// Check compliance with requirements
const isCompliant = checkMiddlewareCompliance();
```

### Test Script

Run the comprehensive test suite:

```bash
npx ts-node src/scripts/test-middleware-config.ts
```

This will:
- Test endpoint configurations
- Validate wildcard pattern matching
- Check middleware requirements
- Generate compliance report

## Compliance Requirements

The system enforces the following requirements:

### Verification Endpoints
- ✅ Must include RateLimitMiddleware
- ✅ Must include CircuitBreakerMiddleware
- ✅ Must include RequestLoggingMiddleware and SecurityMiddleware

### Admin Routes
- ✅ Must enforce role-based access through configuration
- ✅ Must include CircuitBreakerMiddleware
- ✅ Must include RequestLoggingMiddleware and SecurityMiddleware

### High-Traffic Routes
- ✅ Must include CircuitBreakerMiddleware
- ✅ Must include RequestLoggingMiddleware and SecurityMiddleware

### All Routes
- ✅ Must include RequestLoggingMiddleware
- ✅ Must include SecurityMiddleware

## Migration Guide

### From Manual Middleware

Replace manual middleware application:

```typescript
// Before
const handler = createApiHandler(config);
MIDDLEWARE_CHAINS.HIGH_TRAFFIC.forEach(middleware => {
  handler.use(middleware);
});

// After
const handler = createHandlerWithMiddleware.auto('/api/endpoint', config);
```

### Adding New Routes

1. Define route characteristics in `middleware-config.ts`
2. Use appropriate handler creator
3. Validate with inspection tools

## Examples

### Verification Endpoint

```typescript
// src/app/api/account/send-code/route.ts
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';
import { API_CONFIGS } from '@/lib/api-handler';

const handler = createHandlerWithMiddleware.verification('/api/account/send-code', {
  ...API_CONFIGS.MERCHANT,
  timeout: 15000
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Implementation
});
```

### Admin Endpoint

```typescript
// src/app/api/admin/users/route.ts
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';
import { API_CONFIGS } from '@/lib/api-handler';

const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  ...API_CONFIGS.ADMIN, // Includes required roles
  timeout: 30000
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Implementation
});
```

### High-Traffic Endpoint

```typescript
// src/app/api/auth/login/route.ts
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';

const handler = createHandlerWithMiddleware.highTraffic('/api/auth/login', {
  requireAuth: false, // Login doesn't require existing auth
  timeout: 15000
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Implementation
});
```

## Monitoring and Debugging

### Request Logging

All requests are logged with:
- Request ID for tracing
- User context (when available)
- Middleware execution details
- Performance metrics

### Middleware Validation

Use the inspector utilities to validate configurations:

```typescript
import { validateMiddlewareConfig } from '@/lib/enhanced-api-handler';

const validation = validateMiddlewareConfig('/api/endpoint');
if (!validation.isValid) {
  console.log('Issues:', validation.issues);
  console.log('Recommendations:', validation.recommendations);
}
```

## Best Practices

1. **Use automatic handlers** when possible for consistency
2. **Validate configurations** during development
3. **Monitor compliance** in CI/CD pipeline
4. **Document custom middleware** requirements
5. **Test middleware chains** thoroughly

## Troubleshooting

### Common Issues

1. **Missing middleware**: Check route characteristics configuration
2. **Wrong middleware order**: Verify middleware chain definition
3. **Role access denied**: Ensure user has required roles
4. **Rate limiting issues**: Check rate limit configuration

### Debug Tools

1. Middleware inspector for validation
2. Request logging for runtime debugging
3. Test script for comprehensive testing
4. Performance monitoring for optimization
