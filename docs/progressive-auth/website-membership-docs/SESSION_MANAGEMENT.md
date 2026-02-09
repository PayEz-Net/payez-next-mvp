# Session Management System

See also: SESSION_2FA_COMPLETION_ONE_PAGER.md for the canonical 2FA completion flow using transitionTo2FASession.

This document describes the standardized session management system that provides a consistent interface for all session operations across the application.

## Overview

The session management system is centralized in `src/lib/session.ts` and provides:

- **Standardized types** for session data
- **Service class** for session operations
- **React hooks** for easy integration
- **Role-based access control** utilities
- **2FA status management**

## Quick Start

### Basic Usage

```typescript
import { useSessionHelper } from '@/hooks/useSessionHelper';

function MyComponent() {
  const { session, status, isLoading, render } = useSessionHelper();

  return render({
    loading: <div>Loading...</div>,
    unauthenticated: <div>Not authenticated</div>,
    authenticated: (session) => (
      <div>
        <p>Welcome, {session.user.email}!</p>
        <p>Roles: {session.user.roles.join(', ')}</p>
        <p>2FA Complete: {session.user.twoFactorSessionVerified ? 'Yes' : 'No'}</p>
        {session.user.roles.includes('admin') && <p>You have admin access</p>}
      </div>
    )
  });
}
```

### Role-Based Access Control

```typescript
import { withRoleGuard } from '@/lib/session';

// Protect a component with role requirements
const AdminOnlyComponent = withRoleGuard(MyComponent, {
  allowedRoles: ['admin', 'payez_admin'],
  redirectTo: '/dashboards',
  fallback: () => <div>Access denied</div>
});

// Or use the hook for more control
function ProtectedComponent() {
  const { isValid, redirectUrl, shouldRedirect } = useSessionGuard({
    requireAuth: true,
    requireTwoFactor: true,
    allowedRoles: ['admin']
  });

  if (shouldRedirect) {
    window.location.href = redirectUrl!;
    return null;
  }

  return <div>Protected content</div>;
}
```

## API Reference

### SessionService

Static service class for session operations.

#### Methods

- `getCurrentSession()`: Get current session
- `hasRole(session, role)`: Check if user has specific role
- `hasAnyRole(session, roles)`: Check if user has any of the roles
- `hasAllRoles(session, roles)`: Check if user has all roles
- `isTwoFactorComplete(session)`: Check if 2FA is complete (now based on `twoFactorSessionVerified`)
- `isFullyAuthenticated(session)`: Check if user is fully authenticated
- `getPrimaryRole(session)`: Get user's primary role
- `signOut(redirectUrl?)`: Sign out and redirect
- `refreshSession()`: Refresh the session
- `updateTwoFactorStatus(twoFactorSessionVerified, method?)`: Client-side helper to trigger a session refresh UX; it does not persist server-side state. 2FA completion is recorded on the server when verification endpoints store the fresh token pair in Redis via `transitionTo2FASession(...)`. The session callback then maps Redis `twoFactorComplete` to `user.twoFactorSessionVerified`.
- `getDashboardUrl(session)`: Get appropriate dashboard URL
- `validateSession(session, status, options)`: Validate session and get redirect URL

### useSessionHelper Hook

React hook that provides session state and a render helper for common UI patterns.

#### Returns

```typescript
{
  session: AppSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  render: (options: {
    loading: ReactNode;
    unauthenticated: ReactNode;
    authenticated: (session: AppSession) => ReactNode;
  }) => ReactNode;
}
```

### useAppSession Hook

React hook that provides session state and utilities (used internally by useSessionHelper).

#### Returns

```typescript
{
  session: AppSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
  isTwoFactorComplete: boolean; // true if session.user.twoFactorSessionVerified is true
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
}
```

### useSessionGuard Hook

Hook for automatic session validation and redirects.

#### Options

```typescript
{
  requireAuth?: boolean;        // Default: true
  requireTwoFactor?: boolean;   // Default: true
  redirectTo?: string;         // Custom redirect URL
  allowedRoles?: string[];     // Required roles
}
```

#### Returns

```typescript
{
  isValid: boolean;
  redirectUrl?: string;
  session: AppSession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  shouldRedirect: boolean;
}
```

### withRoleGuard HOC

Higher-order component for role-based access control.

```typescript
const ProtectedComponent = withRoleGuard(Component, {
  allowedRoles: ['admin', 'user'],
  redirectTo: '/login',
  fallback: () => <div>Access denied</div>
});
```

## 2FA Completion and Session Synchronization

- Source of truth: Redis session field `twoFactorComplete`. The session callback projects this into `session.user.twoFactorSessionVerified`.
- After successful 2FA verification (email or SMS), the server must decode and store the fresh access/refresh token pair in Redis using `transitionTo2FASession(sessionToken, newAccessToken, refreshToken, accessTokenExpires, refreshTokenExpires, method)`. This also updates 2FA flags and AMR/ACR claims.
- Do not rely on `/api/auth/update-session` to mark 2FA complete. As implemented, it does not persist to Redis and cannot flip server-side state by itself.
- Optional: Immediately trigger a session refresh (`GET /api/auth/session`) so the client receives the updated session cookie without waiting for natural refresh.

## Migration Guide

### Replace useSession

**Before:**
```typescript
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
const roles = session?.user?.roles || [];
```

**After:**
```typescript
import { useSessionHelper } from '@/hooks/useSessionHelper';

const { session, status, render } = useSessionHelper();
```

### Replace Role Checks

**Before:**
```typescript
const isAdmin = session?.user?.roles?.includes('admin');
const hasAnyRole = ['admin', 'user'].some(role => 
  session?.user?.roles?.includes(role)
);
```

**After:**
```typescript
const isAdmin = session?.user?.roles?.includes('admin');
const hasAnyRole = ['admin', 'user'].some(role => 
  session?.user?.roles?.includes(role)
);
```

### Replace 2FA Checks

**Before:**
```typescript
const is2FAComplete = session?.user?.twoFactorComplete;
```

**After:**
```typescript
const is2FAComplete = session?.user?.twoFactorSessionVerified;
```

## Best Practices

1. **Use `useSessionHelper` for UI components** - provides clean render patterns
2. **Use `useAppSession` for complex logic** - provides detailed session utilities
3. **Use role-based guards** for protected components
4. **Validate sessions** before rendering sensitive content
5. **Handle loading states** properly
6. **Use the service methods** for programmatic session operations

## Error Handling

The session system includes built-in error handling:

- Automatic redirects on authentication failures
- Graceful fallbacks for missing roles
- Session refresh on token expiration
- Proper loading states during transitions

## Type Safety

All session operations are fully typed with TypeScript:

- `AppSession` interface for session data
- `SessionState` interface for hook returns
- Proper typing for all service methods
- Type-safe role checking functions 

## Concurrency Controls and Single-Session Policy

The session system uses Redis-backed primitives to guarantee safe, consistent updates and prevent duplicate sessions:

- Single session per user
  - When a session is created, the server enforces a single active session per user/email.
  - Existing sessions for that identity are deleted under a short user-scoped lock key: user_session_lock:<userId>.
  - Development: enabled by default. Production: enable with ENFORCE_SINGLE_SESSION=true.

- Versioned writes (optimistic concurrency)
  - Every session key sess:<id> has a companion version key sessver:<id>.
  - On write, the JSON is updated and the version is incremented atomically; both keys share the same TTL.
  - Readers can detect staleness by comparing versions and avoid overwriting newer data.

- Refresh coordination locks
  - During token refresh, a process acquires refresh_lock:<sessionToken> (short TTL) to prevent concurrent refresh attempts.
  - Test flows may fall back to a per-token lock refresh_token_lock:<sha256(refreshToken)> when no session context is available.

Operational notes
- The locks and version keys are internal implementation details; they are automatically managed by the API routes and session-store utilities.
- Do not manually manipulate these keys outside of controlled admin/debug tooling.
