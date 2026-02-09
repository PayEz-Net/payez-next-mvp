# API Development Guide - Enhanced Handler System

## Table of Contents
1. [Quick Start](#quick-start)
2. [Handler Types and Selection](#handler-types-and-selection)
3. [Development Patterns](#development-patterns)
4. [Common Use Cases](#common-use-cases)
5. [Testing Guidelines](#testing-guidelines)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Error Handling](#error-handling)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Basic Endpoint Setup

```typescript
// src/app/api/your-endpoint/route.ts
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';
import { UpstreamErrorHandlerMiddleware } from '@/lib/api-middleware';
import { ApiErrorCode } from '@/types/api';
import { recordSuccess } from '@/utils/circuitBreaker';

// Choose the appropriate handler type
const handler = createHandlerWithMiddleware.highTraffic('/api/your-endpoint', {
  requireAuth: true,
  requiredRoles: ['merchant'],
  timeout: 15000
});

interface YourRequest {
  // Define request structure
}

interface YourResponse {
  // Define response structure
}

export const POST = handler.handle<YourResponse>(async (req, context, auth, responseBuilder) => {
  try {
    // 1. Parse and validate request
    const requestData: YourRequest = await req.json();
    
    // 2. Business logic
    const result = await yourBusinessLogic(requestData);
    
    // 3. Record success for circuit breaker
    recordSuccess();
    
    // 4. Return response
    return responseBuilder.success(result, {
      version: '1.0',
      operation: 'your-operation'
    });
    
  } catch (error) {
    const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(error, context);
    return responseBuilder.error(errorInfo.code, errorInfo.message);
  }
});
```

### 2. Handler Type Decision Tree

```
What type of endpoint are you building?

├── 2FA, Email/SMS Verification, Code Sending
│   └── Use: .verification()
│       ├── Middleware: RequestLogging, Security, RateLimit, CircuitBreaker, Performance
│       └── Features: Rate limiting, abuse prevention
│
├── Admin/Management Operations
│   └── Use: .admin()
│       ├── Middleware: RequestLogging, Security, CircuitBreaker, Performance
│       └── Features: Role-based access, audit logging
│
├── High-Volume/Critical Operations
│   └── Use: .highTraffic()
│       ├── Middleware: RequestLogging, Security, CircuitBreaker, Performance
│       └── Features: Performance monitoring, resilience
│
└── Simple/Utility Operations
    └── Use: Manual Standard
        ├── Middleware: RequestLogging, Security, Performance
        └── Features: Basic monitoring
```

---

## Handler Types and Selection

### 1. Verification Handler (`.verification()`)

**When to use:**
- 2FA code sending/verification
- Email verification
- SMS verification
- Password reset codes
- Any endpoint requiring rate limiting to prevent abuse

**Automatic features:**
- Rate limiting with progressive delays
- Circuit breaker protection
- Enhanced security logging
- Abuse detection

**Example:**
```typescript
const handler = createHandlerWithMiddleware.verification('/api/account/verify-email', {
  requireAuth: true,
  requiredRoles: ['merchant', 'admin'],
  timeout: 15000
});
```

### 2. Admin Handler (`.admin()`)

**When to use:**
- User management operations
- Client management operations
- Permission/role management
- System configuration
- Any endpoint requiring admin privileges

**Automatic features:**
- Role-based access control (payez_admin)
- Circuit breaker protection
- Comprehensive audit logging
- Extended timeouts

**Example:**
```typescript
const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  timeout: 30000 // Extended timeout for admin operations
});
```

### 3. High-Traffic Handler (`.highTraffic()`)

**When to use:**
- Authentication endpoints
- Session management
- Frequently accessed user data
- Public API endpoints with high volume
- Performance-critical operations

**Automatic features:**
- Circuit breaker protection
- Performance monitoring
- Enhanced logging
- Resilience features

**Example:**
```typescript
const handler = createHandlerWithMiddleware.highTraffic('/api/auth/login', {
  requireAuth: false, // Login doesn't require auth
  timeout: 15000
});
```

### 4. Manual Standard Handler

**When to use:**
- Health checks
- Utility functions
- Test endpoints
- Simple operations with minimal middleware needs

**Manual setup:**
```typescript
import { createApiHandler } from '@/lib/api-handler';
import { MIDDLEWARE_CHAINS } from '@/lib/api-middleware';

const handler = createApiHandler({
  requireAuth: true,
  timeout: 10000
});

// Apply standard middleware chain
MIDDLEWARE_CHAINS.STANDARD.forEach(middleware => {
  handler.use(middleware);
});
```

---

## Development Patterns

### 1. Input Validation Pattern

```typescript
export const POST = handler.handle<ResponseType>(async (req, context, auth, responseBuilder) => {
  // Parse JSON safely
  let requestData: RequestType;
  try {
    requestData = await req.json();
  } catch (parseError) {
    return responseBuilder.error(
      ApiErrorCode.INVALID_FORMAT,
      'Invalid JSON format'
    );
  }

  // Validate required fields
  if (!requestData.email || typeof requestData.email !== 'string') {
    return responseBuilder.error(
      ApiErrorCode.MISSING_REQUIRED_FIELD,
      'Email is required'
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(requestData.email)) {
    return responseBuilder.error(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid email format'
    );
  }

  // Continue with business logic...
});
```

### 2. Upstream Service Integration Pattern

```typescript
// Make upstream service call
const upstreamResponse = await fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `${auth.tokenType} ${auth.accessToken}`,
    'Content-Type': 'application/json',
    'X-Request-ID': context.requestId,
    'X-Client-Id': ENV_CONFIG.CLIENT_ID
  },
  body: JSON.stringify(requestData)
});

// Handle upstream responses
if (!upstreamResponse.ok) {
  // Handle rate limiting specifically
  if (upstreamResponse.status === 429) {
    const retryAfter = upstreamResponse.headers.get('retry-after');
    const retryAfterSeconds = retryAfter ? parseInt(retryAfter) : 60;
    const payEzResponse = createPayEzRateLimitResponse(retryAfterSeconds);
    return responseBuilder.success(payEzResponse);
  }
  
  // Handle other errors
  const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(upstreamResponse, context);
  return responseBuilder.error(errorInfo.code, errorInfo.message);
}

// Parse response
const data = await upstreamResponse.json();
recordSuccess(); // Record success for circuit breaker
```

### 3. Error Handling Pattern

```typescript
export const POST = handler.handle<ResponseType>(async (req, context, auth, responseBuilder) => {
  try {
    // Business logic here
    const result = await performOperation();
    
    // Record success for circuit breaker
    recordSuccess();
    
    return responseBuilder.success(result, {
      version: '1.0',
      operation: 'operation-name'
    });
    
  } catch (error) {
    // Log the error for debugging
    logger.error('Operation failed', {
      requestId: context.requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      return responseBuilder.error(
        ApiErrorCode.VALIDATION_ERROR,
        error.message
      );
    }
    
    if (error instanceof AuthenticationError) {
      return responseBuilder.error(
        ApiErrorCode.UNAUTHORIZED,
        'Authentication failed'
      );
    }
    
    // Handle upstream errors
    const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(error, context);
    return responseBuilder.error(errorInfo.code, errorInfo.message, {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
});
```

### 4. Response Building Pattern

```typescript
// Success response
return responseBuilder.success(data, {
  version: '1.0',
  operation: 'operation-name',
  responseTime: `${Date.now() - context.startTime}ms`
});

// Error response
return responseBuilder.error(
  ApiErrorCode.BUSINESS_RULE_VIOLATION,
  'User already exists',
  {
    field: 'email',
    value: requestData.email,
    constraint: 'unique'
  }
);

// Paginated response
return responseBuilder.success({
  data: items,
  pagination: {
    page: currentPage,
    pageSize: pageSize,
    totalCount: totalItems,
    totalPages: Math.ceil(totalItems / pageSize)
  }
}, {
  version: '1.0',
  operation: 'list-items'
});
```

---

## Common Use Cases

### 1. User Registration Endpoint

```typescript
/**
 * User Registration API
 * Uses verification handler for rate limiting
 */
const handler = createHandlerWithMiddleware.verification('/api/auth/register', {
  requireAuth: false,
  timeout: 20000
});

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const POST = handler.handle<{ userId: string }>(async (req, context, auth, responseBuilder) => {
  try {
    const { email, password, firstName, lastName }: RegisterRequest = await req.json();
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return responseBuilder.error(
        ApiErrorCode.MISSING_REQUIRED_FIELD,
        'All fields are required'
      );
    }
    
    // Register user with upstream service
    const response = await fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': context.requestId
      },
      body: JSON.stringify({ email, password, firstName, lastName })
    });
    
    if (!response.ok) {
      const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(response, context);
      return responseBuilder.error(errorInfo.code, errorInfo.message);
    }
    
    const userData = await response.json();
    recordSuccess();
    
    return responseBuilder.success({
      userId: userData.id,
      message: 'User registered successfully'
    }, {
      version: '1.0',
      operation: 'register'
    });
    
  } catch (error) {
    const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(error, context);
    return responseBuilder.error(errorInfo.code, errorInfo.message);
  }
});
```

### 2. Admin Dashboard Data Endpoint

```typescript
/**
 * Admin Dashboard Data API
 * Uses admin handler with role-based access
 */
const handler = createHandlerWithMiddleware.admin('/api/admin/dashboard', {
  timeout: 30000
});

interface DashboardData {
  userCount: number;
  activeUsers: number;
  revenue: number;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
  }>;
}

export const GET = handler.handle<DashboardData>(async (req, context, auth, responseBuilder) => {
  try {
    // Parallel data fetching
    const [userStats, activity] = await Promise.all([
      fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/admin/user-stats`, {
        headers: {
          'Authorization': `${auth.tokenType} ${auth.accessToken}`,
          'X-Request-ID': context.requestId
        }
      }),
      fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/admin/recent-activity`, {
        headers: {
          'Authorization': `${auth.tokenType} ${auth.accessToken}`,
          'X-Request-ID': context.requestId
        }
      })
    ]);
    
    if (!userStats.ok || !activity.ok) {
      const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(
        !userStats.ok ? userStats : activity,
        context
      );
      return responseBuilder.error(errorInfo.code, errorInfo.message);
    }
    
    const [statsData, activityData] = await Promise.all([
      userStats.json(),
      activity.json()
    ]);
    
    recordSuccess();
    
    return responseBuilder.success({
      userCount: statsData.totalUsers,
      activeUsers: statsData.activeUsers,
      revenue: statsData.totalRevenue,
      recentActivity: activityData.activities
    }, {
      version: '1.0',
      operation: 'admin-dashboard'
    });
    
  } catch (error) {
    const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(error, context);
    return responseBuilder.error(errorInfo.code, errorInfo.message);
  }
});
```

### 3. High-Traffic Data Endpoint

```typescript
/**
 * User Profile Data API
 * Uses high-traffic handler for performance
 */
const handler = createHandlerWithMiddleware.highTraffic('/api/account/profile', {
  requireAuth: true,
  timeout: 10000
});

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: {
    notifications: boolean;
    theme: string;
  };
}

export const GET = handler.handle<ProfileData>(async (req, context, auth, responseBuilder) => {
  try {
    // Use cached data if available
    const cacheKey = `profile:${auth.userId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return responseBuilder.success(JSON.parse(cached), {
        version: '1.0',
        operation: 'profile-cached'
      });
    }
    
    // Fetch from upstream
    const response = await fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/Account/profile`, {
      headers: {
        'Authorization': `${auth.tokenType} ${auth.accessToken}`,
        'X-Request-ID': context.requestId
      }
    });
    
    if (!response.ok) {
      const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(response, context);
      return responseBuilder.error(errorInfo.code, errorInfo.message);
    }
    
    const profileData = await response.json();
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(profileData));
    
    recordSuccess();
    
    return responseBuilder.success(profileData, {
      version: '1.0',
      operation: 'profile'
    });
    
  } catch (error) {
    const errorInfo = UpstreamErrorHandlerMiddleware.handleUpstreamError(error, context);
    return responseBuilder.error(errorInfo.code, errorInfo.message);
  }
});
```

---

## Testing Guidelines

### 1. Unit Testing

```typescript
// tests/api/your-endpoint.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/your-endpoint/route';

describe('/api/your-endpoint', () => {
  it('should handle valid requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'validPassword123'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should validate required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com'
        // password missing
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('MISSING_REQUIRED_FIELD');
  });
});
```

### 2. Middleware Testing

```typescript
// Test middleware configuration
import { getEndpointMiddlewareInfo, validateMiddlewareConfig } from '@/lib/enhanced-api-handler';

describe('Middleware Configuration', () => {
  it('should apply correct middleware for verification endpoints', () => {
    const info = getEndpointMiddlewareInfo('/api/account/verify-email');
    
    expect(info.middleware).toContain('RequestLogging');
    expect(info.middleware).toContain('Security');
    expect(info.middleware).toContain('RateLimit');
    expect(info.middleware).toContain('CircuitBreaker');
    expect(info.middleware).toContain('Performance');
  });

  it('should validate middleware configuration', () => {
    const validation = validateMiddlewareConfig('/api/account/verify-email');
    
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
});
```

### 3. Integration Testing

```typescript
// tests/integration/auth-flow.test.ts
describe('Authentication Flow', () => {
  let testUser: any;
  
  beforeAll(async () => {
    // Setup test user
    testUser = await createTestUser();
  });

  it('should complete full authentication flow', async () => {
    // 1. Login
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    expect(loginResponse.status).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    
    // 2. Access protected endpoint
    const profileResponse = await fetch('/api/account/profile', {
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`
      }
    });
    
    expect(profileResponse.status).toBe(200);
    const profileData = await profileResponse.json();
    expect(profileData.success).toBe(true);
  });
});
```

---

## Security Best Practices

### 1. Input Validation

```typescript
// Always validate input types and formats
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Sanitize input data
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
```

### 2. Authentication Checks

```typescript
// Always verify authentication for protected endpoints
export const GET = handler.handle(async (req, context, auth, responseBuilder) => {
  // auth object is automatically populated by the handler
  if (!auth.userId) {
    return responseBuilder.error(
      ApiErrorCode.UNAUTHORIZED,
      'Authentication required'
    );
  }
  
  // Check specific roles if needed
  if (requiredRole && !auth.roles.includes(requiredRole)) {
    return responseBuilder.error(
      ApiErrorCode.FORBIDDEN,
      'Insufficient permissions'
    );
  }
  
  // Continue with business logic...
});
```

### 3. Rate Limiting

```typescript
// For verification endpoints, rate limiting is automatic
// For custom rate limiting:
const checkCustomRateLimit = async (userId: string, operation: string): Promise<boolean> => {
  const key = `rate_limit:${userId}:${operation}`;
  const current = await redis.get(key);
  
  if (current && parseInt(current) >= 5) {
    return false; // Rate limited
  }
  
  await redis.incr(key);
  await redis.expire(key, 300); // 5 minute window
  return true;
};
```

### 4. Data Sanitization

```typescript
// Always sanitize data before storing or returning
const sanitizeUserData = (userData: any) => {
  return {
    id: userData.id,
    email: userData.email,
    firstName: sanitizeInput(userData.firstName),
    lastName: sanitizeInput(userData.lastName),
    // Never return sensitive data like passwords
  };
};
```

---

## Performance Optimization

### 1. Caching Strategy

```typescript
// Cache frequently accessed data
const getCachedData = async (key: string, fetcher: () => Promise<any>, ttl: number = 300) => {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
};

// Usage
const userData = await getCachedData(
  `user:${userId}`,
  () => fetchUserFromUpstream(userId),
  600 // 10 minutes
);
```

### 2. Parallel Processing

```typescript
// Fetch multiple resources in parallel
const [userProfile, userPreferences, userStats] = await Promise.all([
  fetchUserProfile(userId),
  fetchUserPreferences(userId),
  fetchUserStats(userId)
]);
```

### 3. Response Compression

```typescript
// Large responses should be compressed
const handleLargeDataset = async (data: any[]) => {
  if (data.length > 1000) {
    // Paginate large datasets
    const pageSize = 100;
    const totalPages = Math.ceil(data.length / pageSize);
    
    return {
      data: data.slice(0, pageSize),
      pagination: {
        page: 1,
        pageSize,
        totalCount: data.length,
        totalPages
      }
    };
  }
  
  return { data };
};
```

### 4. Connection Pooling

```typescript
// Reuse connections for upstream services
const upstreamClient = new HttpClient({
  baseURL: ENV_CONFIG.IDP_BASE_URL,
  timeout: 15000,
  maxConnections: 10
});
```

---

## Error Handling

### 1. Error Classification

```typescript
// Define custom error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string, public rule?: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export class UpstreamError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'UpstreamError';
  }
}
```

### 2. Structured Error Responses

```typescript
// Consistent error response format
const createErrorResponse = (error: Error, context: ApiRequestContext) => {
  const baseError = {
    code: getErrorCode(error),
    message: error.message,
    requestId: context.requestId,
    timestamp: new Date().toISOString()
  };

  if (error instanceof ValidationError) {
    return {
      ...baseError,
      details: {
        field: error.field,
        type: 'validation'
      }
    };
  }

  if (error instanceof BusinessRuleError) {
    return {
      ...baseError,
      details: {
        rule: error.rule,
        type: 'business_rule'
      }
    };
  }

  return baseError;
};
```

### 3. Error Recovery

```typescript
// Implement retry logic for transient errors
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Only retry on transient errors
      if (isTransientError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
};
```

---

## Monitoring and Observability

### 1. Custom Metrics

```typescript
// Add custom metrics to your endpoints
const recordMetric = (name: string, value: number, tags?: Record<string, string>) => {
  logger.info('Custom metric', {
    metric: name,
    value,
    tags,
    timestamp: Date.now()
  });
};

// Usage
export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  const startTime = Date.now();
  
  try {
    // Business logic
    const result = await performOperation();
    
    // Record success metrics
    recordMetric('operation_success', 1, {
      operation: 'user_creation',
      userId: auth.userId
    });
    
    recordMetric('operation_duration', Date.now() - startTime, {
      operation: 'user_creation'
    });
    
    return responseBuilder.success(result);
    
  } catch (error) {
    // Record error metrics
    recordMetric('operation_error', 1, {
      operation: 'user_creation',
      error: error.name
    });
    
    throw error;
  }
});
```

### 2. Health Checks

```typescript
// Add health check endpoints
export const GET = handler.handle(async (req, context, auth, responseBuilder) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0',
    dependencies: {
      database: await checkDatabaseHealth(),
      upstream: await checkUpstreamHealth(),
      redis: await checkRedisHealth()
    }
  };
  
  const isHealthy = Object.values(health.dependencies).every(dep => dep === 'healthy');
  
  return responseBuilder.success(health, {
    version: '1.0',
    operation: 'health-check'
  });
});
```

### 3. Distributed Tracing

```typescript
// Add tracing context to upstream calls
const makeTracedRequest = async (url: string, options: RequestInit, context: ApiRequestContext) => {
  const tracingHeaders = {
    'X-Request-ID': context.requestId,
    'X-Trace-ID': context.traceId || context.requestId,
    'X-Span-ID': generateSpanId(),
    'X-Parent-Span-ID': context.spanId
  };
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...tracingHeaders
    }
  });
};
```

---

## Troubleshooting

### 1. Common Issues

#### Rate Limiting Not Working
```typescript
// Check if endpoint is configured correctly
const info = getEndpointMiddlewareInfo('/api/your-endpoint');
console.log('Middleware applied:', info.middleware);

// Verify rate limit configuration
const validation = validateMiddlewareConfig('/api/your-endpoint');
console.log('Configuration issues:', validation.issues);
```

#### Circuit Breaker Always Open
```typescript
// Check circuit breaker state
const circuitState = getCircuitBreakerState();
console.log('Circuit breaker state:', circuitState);

// Reset circuit breaker if needed
resetCircuitBreaker();
```

#### Authentication Failures
```typescript
// Verify token in handler
export const GET = handler.handle(async (req, context, auth, responseBuilder) => {
  console.log('Auth context:', {
    userId: auth.userId,
    roles: auth.roles,
    tokenType: auth.tokenType,
    isAuthenticated: !!auth.accessToken
  });
  
  // Continue with logic...
});
```

### 2. Debug Logging

```typescript
// Enable debug logging for specific endpoints
const debugHandler = createHandlerWithMiddleware.highTraffic('/api/debug-endpoint', {
  requireAuth: true,
  timeout: 15000,
  debug: true // Enable debug mode
});

export const POST = debugHandler.handle(async (req, context, auth, responseBuilder) => {
  logger.debug('Debug info', {
    requestId: context.requestId,
    headers: Object.fromEntries(req.headers.entries()),
    body: await req.text(),
    auth: {
      userId: auth.userId,
      roles: auth.roles
    }
  });
  
  // Continue with logic...
});
```

### 3. Performance Debugging

```typescript
// Add performance markers
const performanceMarker = (name: string, startTime: number) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance marker: ${name}`, {
    duration,
    timestamp: Date.now()
  });
  
  if (duration > 1000) {
    logger.warn(`Slow operation detected: ${name}`, { duration });
  }
};

// Usage
export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  let startTime = Date.now();
  
  const requestData = await req.json();
  performanceMarker('request_parsing', startTime);
  
  startTime = Date.now();
  const result = await performOperation(requestData);
  performanceMarker('business_logic', startTime);
  
  return responseBuilder.success(result);
});
```

---

## Summary

This development guide provides comprehensive patterns and best practices for building API endpoints using the enhanced handler system. Key takeaways:

1. **Choose the right handler type** based on your endpoint's characteristics
2. **Follow established patterns** for consistency and maintainability
3. **Implement proper error handling** with standardized responses
4. **Add appropriate monitoring** for observability
5. **Test thoroughly** including middleware configuration
6. **Optimize for performance** with caching and parallel processing
7. **Maintain security** with proper validation and sanitization

For additional help, refer to the complete migration documentation and existing endpoint implementations in the codebase.

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** Quarterly
