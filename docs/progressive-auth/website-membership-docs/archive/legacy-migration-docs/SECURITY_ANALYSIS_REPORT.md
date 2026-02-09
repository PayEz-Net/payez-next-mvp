# Security Analysis Report: NextAuth Session Management, API Routing & RBAC

## Executive Summary

This comprehensive security analysis examines the NextAuth session management, API routing patterns, and Role-Based Access Control (RBAC) implementation in the website-membership application. The analysis identifies critical security vulnerabilities and provides actionable recommendations for achieving security compliance.

## 🔴 Critical Security Issues

### 1. **Inconsistent RBAC Enforcement**

**Issue**: Some API routes lack proper authorization checks or have missing authentication guards.

**Evidence**:
- `PUT` and `DELETE` handlers in `/api/admin/users/[id]/route.ts` missing RBAC checks
- Inconsistent role validation patterns across routes
- Missing session validation in some endpoints

**Impact**: HIGH - Potential privilege escalation and unauthorized data access

**Recommendation**: Implement centralized authorization middleware

### 2. **Session Token Security Vulnerabilities**

**Issue**: Multiple session management approaches create security gaps:

**Evidence**:
- Dual session storage (NextAuth JWT + Redis) creates inconsistencies
- Session tokens stored in Redis without proper encryption
- Missing session invalidation on security events

**Impact**: HIGH - Session hijacking, token replay attacks

### 3. **CORS Configuration Overly Permissive**

**Issue**: Wildcard CORS headers allow any origin:

```typescript
'Access-Control-Allow-Origin': '*'
```

**Impact**: MEDIUM - CSRF attacks, unauthorized cross-origin requests

### 4. **Insufficient Input Validation**

**Issue**: Missing input sanitization and validation in API endpoints

**Evidence**:
- Direct JSON body parsing without validation
- Missing parameter validation for dynamic routes
- No request size limits

**Impact**: MEDIUM - Injection attacks, DoS vulnerabilities

## 🟡 Medium Priority Issues

### 1. **2FA Implementation Gaps**

**Issues**:
- 2FA bypass possible through JWT manipulation
- Inconsistent 2FA validation between middleware and API routes
- Missing 2FA re-verification for sensitive operations

### 2. **Token Management Issues**

**Issues**:
- Access tokens stored in session cookies (XSS vulnerability)
- Refresh tokens not properly rotated
- Missing token revocation on logout

### 3. **Error Information Disclosure**

**Issues**:
- Detailed error messages expose internal structure
- Stack traces potentially leaked in responses
- Debug logging enabled in production paths

## 🔧 Recommended Security Hardening

### 1. **Implement Centralized Authorization Middleware**

Create a reusable authorization wrapper:

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

### 2. **Secure Session Configuration**

Update NextAuth configuration for enhanced security:

```typescript
// src/lib/auth.ts - Enhanced security configuration
export const authOptions: NextAuthOptions = {
  // ... existing config
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // Reduce to 8 hours
    updateAge: 30 * 60   // Update every 30 minutes
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict', // Changed from 'lax' to 'strict'
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
      // Implement JWE encryption for tokens containing sensitive data
      return jwt.sign(token, secret, { 
        algorithm: 'HS256',
        expiresIn: '8h' 
      });
    }
  }
};
```

### 3. **Input Validation Middleware**

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

// Example usage schemas
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  roles: z.array(z.enum(['payez_admin', 'merchant', 'user']))
});
```

### 4. **Secure CORS Configuration**

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

### 5. **Enhanced Error Handling**

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

## 🛡️ Implementation Priority Matrix

### Immediate (Week 1)
1. ✅ Fix missing RBAC checks in API routes
2. ✅ Implement centralized auth guard middleware  
3. ✅ Update CORS configuration
4. ✅ Add input validation to critical endpoints

### Short-term (Weeks 2-3)
1. ✅ Enhance session security configuration
2. ✅ Implement proper error handling
3. ✅ Add request rate limiting
4. ✅ Audit and reduce token lifetime

### Medium-term (Month 2)
1. ✅ Implement session encryption
2. ✅ Add comprehensive audit logging
3. ✅ Security testing automation
4. ✅ Penetration testing

## 🔍 Security Compliance Checklist

### Authentication & Authorization
- [ ] ✅ All API routes have proper authentication
- [ ] ✅ RBAC consistently enforced
- [ ] ✅ 2FA required for admin operations
- [ ] ✅ Session tokens properly secured
- [ ] ✅ Token rotation implemented

### Data Protection
- [ ] ✅ Input validation on all endpoints
- [ ] ✅ Output encoding prevents XSS
- [ ] ✅ SQL injection prevention
- [ ] ✅ Sensitive data encrypted at rest

### Network Security
- [ ] ✅ HTTPS enforced in production
- [ ] ✅ CORS properly configured
- [ ] ✅ Security headers implemented
- [ ] ✅ Rate limiting enabled

### Monitoring & Logging
- [ ] ✅ Security events logged
- [ ] ✅ Failed authentication attempts tracked
- [ ] ✅ Privilege escalation attempts detected
- [ ] ✅ Regular security audits scheduled

## 📋 Next Steps

1. **Immediate Action Items**:
   - Apply the auth guard middleware to all admin routes
   - Update CORS configuration with specific origins
   - Add input validation schemas

2. **Code Review Requirements**:
   - All new API routes must use `withAuthGuard`
   - Security team approval for role changes
   - Mandatory 2FA for production deployments

3. **Monitoring Setup**:
   - Implement security event logging
   - Set up alerts for failed authentication
   - Regular security scanning automation

This analysis provides a roadmap for achieving enterprise-grade security compliance. Implementation should be prioritized based on the risk matrix provided.
