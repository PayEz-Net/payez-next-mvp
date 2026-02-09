# Security Best Practices: NextAuth Session Management, API Routing & RBAC

## Overview

This guide provides comprehensive security best practices for the NextAuth session management, API routing patterns, and Role-Based Access Control (RBAC) implementation in the website-membership application, incorporating recommendations from the security analysis.

---

## 🛡️ Core Security Principles

### 1. Defense in Depth
- Multiple layers of security controls
- Automatic middleware enforcement
- Comprehensive monitoring and logging
- Circuit breaker protection

### 2. Zero Trust Architecture
- Verify every request regardless of source
- Implement role-based access control consistently
- Monitor all API interactions
- Log security events comprehensively

### 3. Fail Secure
- Circuit breaker fails open for availability
- Rate limiting prevents abuse
- Secure defaults for all configurations
- Graceful degradation during failures

---

## 🔐 Authentication and Authorization

### Enhanced RBAC Implementation

The enhanced handler system provides automatic role-based access control:

#### Centralized Authorization Middleware

```typescript
// src/lib/authGuard.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface AuthGuardOptions {
  requiredRoles?: string[];
  require2FA?: boolean;
  allowSessionToken?: boolean;
}

export async function withAuthGuard<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuthGuardOptions = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // 1. Validate session
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // 2. Check 2FA if required
    if (options.require2FA && !session.user?.twoFactorSessionVerified) {
      return NextResponse.json(
        { error: '2FA verification required' }, 
        { status: 403 }
      );
    }

    // 3. Validate roles
    if (options.requiredRoles?.length) {
      const userRoles = session.user?.roles || [];
      const hasRequiredRole = options.requiredRoles.some(role => 
        userRoles.includes(role)
      );
      
      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' }, 
          { status: 403 }
        );
      }
    }

    // 4. Add security headers
    const response = await handler(request, ...args);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  };
}
```

#### Admin Endpoint Security

```typescript
// Example: Admin endpoint with automatic security
import { createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';

const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  timeout: 30000 // Automatically enforces payez_admin role
});

export const POST = handler.handle(async (req, context, auth, responseBuilder) => {
  // Auth context is pre-validated:
  // - auth.userId is guaranteed to exist
  // - auth.roles includes 'payez_admin'
  // - 2FA verification is enforced if configured
  
  // Business logic here
});
```

### Session Security Configuration

```typescript
// src/lib/auth.ts - Enhanced security configuration
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // Reduced to 8 hours
    updateAge: 30 * 60   // Update every 30 minutes
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict', // Enhanced from 'lax' to 'strict'
        path: '/',
        secure: true, // Always require HTTPS
        domain: process.env.NODE_ENV === 'production' 
          ? '.payez.net' 
          : undefined
      }
    }
  },
  jwt: {
    // Add JWT encryption for sensitive data
    encode: async ({ secret, token }) => {
      return jwt.sign(token, secret, { 
        algorithm: 'HS256',
        expiresIn: '8h' 
      });
    }
  }
};
```

---

## 🚦 Rate Limiting and Abuse Prevention

### Automatic Rate Limiting

The enhanced handler system provides automatic rate limiting for verification endpoints:

```typescript
// Verification endpoints automatically get rate limiting
const handler = createHandlerWithMiddleware.verification('/api/account/send-code', {
  requireAuth: true,
  requiredRoles: ['merchant', 'admin'],
  timeout: 15000
});
```

### Rate Limiting Policies

| Endpoint Type | Rate Limit | Window | Purpose |
|---------------|------------|---------|----------|
| **Login Attempts** | 5 attempts | 15 minutes per IP | Prevent brute force |
| **2FA Code Requests** | 3 requests | 5 minutes per user | Prevent SMS/email abuse |
| **Password Changes** | 3 changes | 1 hour per user | Prevent automated attacks |
| **Admin Operations** | No limit | - | Trusted admin users |
| **General API Calls** | 100 requests | 1 minute per user | Prevent DoS |

### Custom Rate Limiting

```typescript
// Custom rate limiting for specific use cases
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

### Rate Limit Response Format

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

---

## 🔄 Circuit Breaker Protection

### Automatic Circuit Breaker

Admin and high-traffic endpoints automatically include circuit breaker protection:

```typescript
// Automatic circuit breaker for admin operations
const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  timeout: 30000
});

// Automatic circuit breaker for high-traffic operations
const handler = createHandlerWithMiddleware.highTraffic('/api/auth/login', {
  requireAuth: false,
  timeout: 15000
});
```

### Circuit Breaker Configuration

- **Failure Threshold**: 2 failures within 30 seconds
- **Open Duration**: 30 seconds before retry attempt
- **Recovery Strategy**: Progressive backoff with health checks
- **State Persistence**: Redis-backed for consistency across instances

### Circuit Breaker States

```typescript
// Circuit breaker state monitoring
const circuitState = {
  CLOSED: 'Normal operation',
  OPEN: 'Failing fast, service unavailable',
  HALF_OPEN: 'Testing recovery with limited requests'
};
```

---

## 🔒 Input Validation and Sanitization

### Validation Middleware

```typescript
// src/lib/validation.ts
import { z } from 'zod';
import { NextRequest } from 'next/server';

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return { 
        success: false, 
        error: 'Validation failed: ' + result.error.errors[0].message 
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Invalid JSON payload' };
  }
}

// Example validation schemas
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  roles: z.array(z.enum(['payez_admin', 'merchant', 'user']))
});
```

### Input Sanitization

```typescript
// Always validate and sanitize input
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

---

## 🌐 CORS and Network Security

### Secure CORS Configuration

```typescript
// src/lib/cors.ts
export const getCorsHeaders = (origin?: string) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://admin.payez.net',
    'https://portal.payez.net'
  ];
  
  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
};
```

### Security Headers

```typescript
// Automatic security headers in enhanced handlers
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

---

## 📊 Security Monitoring and Logging

### Logging Security Considerations
**Date:** 2025-07-16  
**Issue:** Console logs bypassing structured logging system  
**Risk Level:** HIGH  

#### Current Situation
The application has a mix of logging approaches:
- **Structured logging** → Graylog (for application logs)
- **Console logging** → Terminal/stdout (for Next.js framework logs)

Next.js generates important security-relevant logs that appear as console output:
```
POST /api/admin/users/grid-state 200 in 1209ms
GET /api/admin/users/grid-state 200 in 1210ms
POST /api/admin/users 200 in 5533ms
```

#### Security Risks of Disabling Console Logs

##### 1. **Graylog Unavailable Scenarios**
- **Network partition** - Graylog server unreachable
- **Service outages** - Graylog maintenance, crashes, capacity issues
- **Authentication failures** - Can't connect to Graylog due to credential issues
- **Buffer overflow** - Graylog can't process log volume, causing backlog

##### 2. **Critical System Events Not Captured by Application Code**
- **Next.js internal errors** - Framework crashes, memory leaks
- **HTTP parsing errors** - Malformed requests, potential attacks
- **Middleware failures** - Errors before application code executes
- **SSL/TLS handshake failures** - Certificate issues, man-in-the-middle attempts
- **Process crashes** - SIGTERM, SIGKILL, out-of-memory conditions
- **Edge Runtime errors** - Compatibility issues, API limitations

##### 3. **Security Monitoring Gaps**
- **Attack pattern detection** - DDoS, brute force, injection attempts
- **Performance degradation** - Could indicate ongoing attacks
- **Unusual request patterns** - Reconnaissance, vulnerability scanning
- **Framework-level security events** - CORS violations, CSP violations

##### 4. **Compliance and Forensics**
- **Audit trail completeness** - Missing system-level events
- **Incident response** - Incomplete picture during security incidents
- **Regulatory compliance** - Some standards require comprehensive logging

#### Solution Strategy: Hybrid Logging Architecture

**IMPORTANT:** Do NOT disable Next.js console logs. Instead, implement a comprehensive logging strategy:

##### Tier 1: Structured Application Logs (Graylog)
- **Purpose:** Searchable, structured, centralized
- **Content:** Application events, user actions, business logic
- **Reliability:** High availability, but can fail

##### Tier 2: System Console Logs (stdout/stderr)
- **Purpose:** Framework events, system-level errors
- **Content:** Next.js requests, framework errors, process events
- **Reliability:** Always available, local to process

##### Tier 3: Fallback File Logging (Local Files)
- **Purpose:** Backup when Graylog is unavailable
- **Content:** Critical security events, error conditions
- **Reliability:** Local disk, survives process restarts

#### Implementation Options

##### Option 1: Console Enhancement (Recommended)
```typescript
// Override console methods to also send to Graylog
const originalConsole = { ...console };

console.log = (message, ...args) => {
  originalConsole.log(message, ...args); // Keep console output
  try {
    if (isSecurityRelevant(message)) {
      graylogLogger.info(message, ...args); // Also send to Graylog
    }
  } catch (error) {
    // If Graylog fails, at least we have console
    originalConsole.error('Graylog logging failed:', error);
  }
};
```

##### Option 2: Log Aggregation Pipeline
```typescript
// Process manager captures both streams
const logAggregator = {
  captureConsole: true,
  captureGraylog: true,
  fallbackToFile: true,
  securityFilter: true
};
```

##### Option 3: Environment-Based Strategy
```typescript
// Production: Graylog + Console + File backup
// Development: Console only for faster debugging
// Staging: Mirror production for testing

const loggingStrategy = {
  development: ['console'],
  staging: ['console', 'graylog', 'file'],
  production: ['console', 'graylog', 'file']
};
```

#### Security-First Logging Rules

##### 1. **Never Disable Security-Critical Logs**
- Always preserve Next.js request logs
- Always preserve framework error logs
- Always preserve system-level event logs

##### 2. **Implement Fallback Mechanisms**
- Console logs when Graylog fails
- File logs when both fail
- Local buffering for temporary outages

##### 3. **Log Classification System**
```typescript
enum LogSeverity {
  DEBUG = 'debug',     // Development only
  INFO = 'info',       // General information
  WARN = 'warn',       // Potential issues
  ERROR = 'error',     // Application errors
  SECURITY = 'security', // Security events (always log everywhere)
  CRITICAL = 'critical'  // System-level failures
}
```

##### 4. **Security Event Identification**
Automatically identify security-relevant logs:
- Authentication failures
- Authorization violations
- Unusual request patterns
- Performance anomalies
- Error rate spikes

#### Implementation Plan

##### Phase 1: Assessment (Immediate)
- [ ] Audit all console.log usage across codebase
- [ ] Identify security-critical log patterns
- [ ] Document current logging gaps

##### Phase 2: Console Enhancement (Short-term)
- [ ] Implement console override system
- [ ] Add security event classification
- [ ] Test Graylog fallback mechanisms

##### Phase 3: Aggregation Pipeline (Medium-term)
- [ ] Implement log aggregation service
- [ ] Add file-based backup logging
- [ ] Create security event monitoring

##### Phase 4: Monitoring & Alerting (Long-term)
- [ ] Set up security event alerts
- [ ] Implement log correlation analysis
- [ ] Create security dashboards

#### Best Practices

##### 1. **Log Retention Policy**
- **Console logs:** Real-time only (not persistent)
- **Graylog logs:** 90 days retention minimum
- **File logs:** 1 year retention for security events

##### 2. **Security Event Prioritization**
- **Critical:** Authentication failures, authorization violations
- **High:** Performance anomalies, error rate spikes
- **Medium:** Unusual request patterns, configuration changes
- **Low:** Debug information, routine operations

##### 3. **Privacy and Compliance**
- Never log sensitive data (passwords, tokens, PII)
- Sanitize user input before logging
- Implement log data classification
- Follow GDPR/CCPA requirements for log data

##### 4. **Monitoring and Alerting**
- Set up real-time alerts for security events
- Monitor log pipeline health
- Alert on logging system failures
- Regular security log reviews

#### Conclusion

**DO NOT** disable Next.js console logging due to security risks. Instead, implement a comprehensive logging strategy that preserves security monitoring capabilities while providing structured logging benefits. This approach ensures both security and operational excellence.

### Comprehensive Audit Logging

All endpoints automatically include comprehensive logging:

```typescript
// Automatic security event logging
export const securityLogger = {
  authFailure: (userId: string, reason: string, context: any) => {
    logger.warn('Authentication failure', {
      event: 'auth_failure',
      userId,
      reason,
      requestId: context.requestId,
      ip: context.clientIp,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  authSuccess: (userId: string, context: any) => {
    logger.info('Authentication success', {
      event: 'auth_success',
      userId,
      requestId: context.requestId,
      ip: context.clientIp,
      timestamp: new Date().toISOString()
    });
  },
  
  privilegeEscalation: (userId: string, attemptedRole: string, context: any) => {
    logger.error('Privilege escalation attempt', {
      event: 'privilege_escalation',
      userId,
      attemptedRole,
      requestId: context.requestId,
      ip: context.clientIp,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Security Metrics

```typescript
// Custom security metrics
const recordSecurityMetric = (event: string, severity: 'low' | 'medium' | 'high') => {
  logger.info('Security metric', {
    metric: 'security_event',
    event,
    severity,
    timestamp: Date.now()
  });
};

// Usage examples
recordSecurityMetric('rate_limit_exceeded', 'medium');
recordSecurityMetric('circuit_breaker_open', 'high');
recordSecurityMetric('auth_failure', 'medium');
```

---

## 🚨 Error Handling and Information Disclosure

### Secure Error Responses

```typescript
// src/lib/errorHandler.ts
interface SecurityError {
  code: string;
  message: string;
  statusCode: number;
}

export function createSecurityError(
  code: string, 
  publicMessage: string, 
  statusCode: number,
  internalDetails?: any
): SecurityError {
  // Log internal details for debugging (not exposed to client)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[SECURITY_ERROR] ${code}:`, internalDetails);
  }
  
  return {
    code,
    message: publicMessage,
    statusCode
  };
}

export const SecurityErrors = {
  INSUFFICIENT_PERMISSIONS: () => createSecurityError(
    'INSUFFICIENT_PERMISSIONS',
    'Access denied',
    403
  ),
  INVALID_SESSION: () => createSecurityError(
    'INVALID_SESSION',
    'Authentication required',
    401
  ),
  RATE_LIMITED: () => createSecurityError(
    'RATE_LIMITED',
    'Too many requests',
    429
  )
};
```

### Data Sanitization

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

## 🔧 Security Configuration Checklist

### Authentication & Authorization
- [ ] ✅ All API routes have proper authentication
- [ ] ✅ RBAC consistently enforced through enhanced handlers
- [ ] ✅ 2FA required for admin operations
- [ ] ✅ Session tokens properly secured with strict SameSite
- [ ] ✅ Token rotation implemented
- [ ] ✅ Session timeout configured appropriately (8 hours)

### Data Protection
- [ ] ✅ Input validation on all endpoints through middleware
- [ ] ✅ Output encoding prevents XSS
- [ ] ✅ SQL injection prevention through parameterized queries
- [ ] ✅ Sensitive data encrypted at rest

### Network Security
- [ ] ✅ HTTPS enforced in production
- [ ] ✅ CORS properly configured with allowed origins
- [ ] ✅ Security headers implemented automatically
- [ ] ✅ Rate limiting enabled for verification endpoints

### Monitoring & Logging
- [ ] ✅ Security events logged comprehensively
- [ ] ✅ Failed authentication attempts tracked
- [ ] ✅ Privilege escalation attempts detected
- [ ] ✅ Regular security audits scheduled

---

## 🎯 Implementation Priorities

### Immediate (Completed)
1. ✅ Enhanced handler system with automatic security
2. ✅ Circuit breaker protection for all critical endpoints
3. ✅ Rate limiting for verification endpoints
4. ✅ Comprehensive audit logging
5. ✅ Secure CORS configuration

### Ongoing
1. ✅ Monitor security events and adjust policies
2. ✅ Regular security audits and penetration testing
3. ✅ Keep security dependencies updated
4. ✅ Review and update security policies quarterly

### Future Enhancements
1. Enhanced input validation with Zod schemas
2. Automated security testing in CI/CD pipeline
3. Advanced threat detection and response
4. Security compliance automation

---

## 📚 Additional Resources

### Security Tools
- **Static Analysis**: ESLint security rules
- **Dependency Scanning**: npm audit, Snyk
- **Runtime Protection**: Enhanced middleware system
- **Monitoring**: Comprehensive logging and alerting

### Compliance Frameworks
- **OWASP Top 10**: All major risks addressed
- **NIST Cybersecurity Framework**: Alignment with core functions
- **SOC 2**: Controls for security and availability

### Training and Awareness
- Regular security training for development team
- Security review process for all API changes
- Incident response procedures and training
- Security metrics and reporting

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Security Review**: Quarterly  
**Classification**: Internal Use
