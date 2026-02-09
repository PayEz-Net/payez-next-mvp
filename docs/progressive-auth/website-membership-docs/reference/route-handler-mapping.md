# API Route Handler Type Mapping

## Overview
This document provides a comprehensive mapping of all API routes to their appropriate handler types based on route purpose, traffic patterns, and security requirements.

## Available Handler Types

### 1. Verification Handler (`.verification()`)
- **Purpose**: Rate-limited verification endpoints
- **Middleware**: RequestLogging, Security, RateLimit, CircuitBreaker, Performance
- **Use Case**: 2FA codes, email verification, SMS verification

### 2. Admin Handler (`.admin()`)
- **Purpose**: Administrative operations requiring role-based access
- **Middleware**: RequestLogging, Security, CircuitBreaker, Performance  
- **Use Case**: User management, client management, system administration

### 3. High-Traffic Handler (`.highTraffic()`)
- **Purpose**: High-volume endpoints requiring circuit breaker protection
- **Middleware**: RequestLogging, Security, CircuitBreaker, Performance
- **Use Case**: Authentication, session management, frequently accessed data

### 4. Standard Handler (Manual middleware application)
- **Purpose**: General API endpoints with basic middleware
- **Middleware**: RequestLogging, Security, Performance
- **Use Case**: Standard business logic, utility functions

---

## Route Mapping by Category

### Account Routes (`/api/account/*`)

| Route | Handler Type | Rationale |
|-------|-------------|-----------|
| `/api/account/send-code` | **Verification** | Rate-limited SMS/Email code sending, critical for 2FA flow |
| `/api/account/verify-code` | **Verification** | Rate-limited code verification, prevents brute force attacks |
| `/api/account/verify-email` | **Verification** | Email verification with rate limiting, security-critical |
| `/api/account/verify-sms` | **Verification** | SMS verification with rate limiting, security-critical |
| `/api/account/change-password` | **High-Traffic** | High-security operation, needs circuit breaker protection |
| `/api/account/validate-password` | **Standard** | Password validation utility, moderate traffic |
| `/api/account/masked-info` | **High-Traffic** | Frequently accessed user info, requires circuit breaker |

### Admin Routes (`/api/admin/*`)

| Route | Handler Type | Rationale |
|-------|-------------|-----------|
| `/api/admin/users` | **Admin** | User management, requires admin role and audit logging |
| `/api/admin/users/[id]` | **Admin** | Individual user operations, admin-only access |
| `/api/admin/users/client-create` | **Admin** | User creation for clients, admin-only operation |
| `/api/admin/users/grid-state` | **Admin** | UI state management for admin panels |
| `/api/admin/clients` | **Admin** | Client management, admin-only access |
| `/api/admin/clients/[id]` | **Admin** | Individual client operations, admin-only access |
| `/api/admin/clients/[id]/permissions` | **Admin** | Permission management, critical admin operation |
| `/api/admin/clients/[id]/roles` | **Admin** | Role management, critical admin operation |

### Auth Routes (`/api/auth/*`)

| Route | Handler Type | Rationale |
|-------|-------------|-----------|
| `/api/auth/login` | **High-Traffic** | High-volume authentication, needs rate limiting and circuit breaker |
| `/api/auth/signout` | **High-Traffic** | Common operation, moderate traffic patterns |
| `/api/auth/verify-2fa` | **Verification** | 2FA verification, requires rate limiting to prevent brute force |
| `/api/auth/update-session` | **High-Traffic** | Session updates, high-frequency operation |
| `/api/auth/[...nextauth]` | **High-Traffic** | NextAuth callbacks, high-traffic authentication flow |

### Utility Routes

#### Health Routes (`/api/health/*`)
| Route | Handler Type | Rationale |
|-------|-------------|-----------|
| `/api/health/idp` | **Standard** | Health check endpoint, low traffic but requires basic monitoring |

#### Session Routes (`/api/session/*`)
| Route | Handler Type | Rationale |
|-------|-------------|-----------|
| `/api/session/set` | **High-Traffic** | Session management, high-frequency operation |

#### Test Routes (`/api/test/*`)
| Route | Handler Type | Rationale |
|-------|-------------|-----------|
| `/api/test/clear-session` | **Standard** | Test utility, low traffic and not production-critical |
| `/api/test/refresh-token` | **Standard** | Test utility, low traffic and not production-critical |

---

## Handler Type Distribution Summary

### Verification Handlers (4 routes)
- `/api/account/send-code`
- `/api/account/verify-code`
- `/api/account/verify-email`
- `/api/account/verify-sms`
- `/api/auth/verify-2fa`

### Admin Handlers (8 routes)
- `/api/admin/users`
- `/api/admin/users/[id]`
- `/api/admin/users/client-create`
- `/api/admin/users/grid-state`
- `/api/admin/clients`
- `/api/admin/clients/[id]`
- `/api/admin/clients/[id]/permissions`
- `/api/admin/clients/[id]/roles`

### High-Traffic Handlers (6 routes)
- `/api/account/change-password`
- `/api/account/masked-info`
- `/api/auth/login`
- `/api/auth/signout`
- `/api/auth/update-session`
- `/api/auth/[...nextauth]`
- `/api/session/set`

### Standard Handlers (4 routes)
- `/api/account/validate-password`
- `/api/health/idp`
- `/api/test/clear-session`
- `/api/test/refresh-token`

---

## Implementation Guidelines

### Current Implementation Status
Based on code analysis, most routes are already correctly configured:

**✅ Correctly Configured:**
- Most verification endpoints use `.verification()` handler
- Admin endpoints use `.admin()` handler or manual admin middleware
- High-traffic routes have appropriate circuit breaker protection

**⚠️ Needs Review:**
- Some routes use manual middleware configuration instead of helper methods
- Consistency could be improved by standardizing on helper methods

### Recommended Changes

1. **Standardize Handler Usage**: Convert manual middleware configurations to use the helper methods for consistency.

2. **Update Mixed Configurations**: Some routes like `/api/account/change-password` use manual middleware but should use `.highTraffic()` handler.

3. **Review Rate Limiting**: Ensure all verification endpoints have appropriate rate limiting configured.

### Security Considerations

1. **Verification Endpoints**: All verification endpoints must have rate limiting to prevent abuse
2. **Admin Endpoints**: All admin endpoints must require proper role-based access control
3. **High-Traffic Endpoints**: Must have circuit breaker protection for resilience
4. **Standard Endpoints**: Should have basic security and logging middleware

---

## Traffic Pattern Analysis

### High-Traffic Patterns
- **Authentication flows**: `/api/auth/login`, `/api/auth/[...nextauth]`
- **Session management**: `/api/session/set`, `/api/auth/update-session`
- **User info access**: `/api/account/masked-info`

### Rate-Limited Patterns
- **2FA operations**: All verification endpoints
- **Password changes**: `/api/account/change-password`
- **Code sending**: `/api/account/send-code`

### Admin-Only Patterns
- **User management**: All `/api/admin/users/*` endpoints
- **Client management**: All `/api/admin/clients/*` endpoints
- **Permission management**: Role and permission endpoints

This mapping ensures appropriate middleware is applied based on the specific security and performance requirements of each route type.
