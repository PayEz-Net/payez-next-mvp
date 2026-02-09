# SessionTokenManager Usage Guide

The `SessionTokenManager` provides a clean API for working with cached decoded tokens in Redis-backed sessions. This utility class abstracts away the complexity of token management and provides type-safe access to token data.

## Key Features

- **Lazy Decoding**: Decodes tokens only when needed if not already cached
- **Type-Safe Access**: Provides typed access to token claims
- **Performance**: Uses cached decoded tokens to avoid repeated JWT decoding
- **Immutable Updates**: Returns new SessionModel instances for updates

## Basic Usage

```typescript
import { SessionTokenManager } from '@/lib/session-token-manager';
import { getSession } from '@/lib/session-store';

// In an API route or server component
const session = await getSession(sessionId);
const tokenManager = new SessionTokenManager(session);

// Check if token needs refresh
if (tokenManager.needsRefresh()) {
  // Trigger refresh logic
}

// Get user roles
const roles = tokenManager.getRoles();
if (tokenManager.hasRole('admin')) {
  // Admin-specific logic
}
```

## Common Operations

### 1. Checking Token Expiration

```typescript
// Check if expired
if (tokenManager.isAccessTokenExpired()) {
  // Token is expired, need to refresh
}

// Get time until expiration (in milliseconds)
const timeLeft = tokenManager.getTimeUntilExpiration();
console.log(`Token expires in ${timeLeft / 1000} seconds`);

// Check if needs refresh with custom buffer (5 minutes)
if (tokenManager.needsRefresh(5 * 60 * 1000)) {
  // Less than 5 minutes left, refresh now
}
```

### 2. Accessing User Information

```typescript
// Get user ID
const userId = tokenManager.getUserId();

// Get authentication level (ACR)
const authLevel = tokenManager.getAuthLevel();
if (authLevel === '2') {
  // User has completed 2FA
}

// Get authentication methods (AMR)
const authMethods = tokenManager.getAuthMethods();
const hasMFA = authMethods.includes('mfa');
```

### 3. Role-Based Access Control

```typescript
// Get all roles
const roles = tokenManager.getRoles();

// Check specific role
if (tokenManager.hasRole('editor')) {
  // Allow editing
}

// Check multiple roles
const requiredRoles = ['admin', 'moderator'];
const hasRequiredRole = requiredRoles.some(role => 
  tokenManager.hasRole(role)
);
```

### 4. Updating Tokens After Refresh

```typescript
import { refreshTokens } from '@/lib/auth-service';

// After successful token refresh
const { accessToken, refreshToken, expiresIn } = await refreshTokens(
  session.refreshToken
);

// Create updated session with new tokens and cached decoded data
const updatedSession = tokenManager.withRefreshedTokens(
  accessToken,
  refreshToken,
  Date.now() + (expiresIn * 1000)
);

// Save updated session
await saveSession(sessionId, updatedSession);
```

### 4a. 2FA Completion Path (Server-Side)

After a successful 2FA verification, if the IDP returns a fresh access/refresh token pair, update the Redis session atomically using `transitionTo2FASession(...)`. This both stores the new tokens and marks 2FA complete by updating `twoFactorComplete` (which the session callback maps to `user.twoFactorSessionVerified`). Do not rely on client-side helpers to flip server-side state.

```typescript
import { transitionTo2FASession } from '@/lib/session-store';

await transitionTo2FASession(
  sessionToken,
  newAccessToken,
  newRefreshToken,
  accessTokenExpires,
  refreshTokenExpires,
  'email' // or 'sms'
);
// Optionally trigger a session refresh so the updated state is immediately reflected to the client.
```

### 5. Debugging Token State

```typescript
// Get comprehensive debug information
const debugInfo = tokenManager.getDebugSummary();
console.log('Token state:', debugInfo);
/* Output:
{
  hasAccessToken: true,
  hasRefreshToken: true,
  hasDecodedCache: true,
  isExpired: false,
  timeUntilExpiry: 3542000,
  needsRefresh: false,
  roles: ['user', 'editor'],
  userId: 'user123',
  authLevel: '2',
  authMethods: ['pwd', 'mfa'],
  tokenExp: '2024-01-15T10:30:00.000Z',
  tokenIat: '2024-01-15T09:30:00.000Z',
  tokenJti: 'unique-token-id'
}
*/
```

## Integration Examples

### Middleware Integration

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { SessionTokenManager } from '@/lib/session-token-manager';

export async function middleware(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return redirectToLogin();
  }
  
  const tokenManager = new SessionTokenManager(session);
  
  // Check if token needs refresh (with 2 minute buffer)
  if (tokenManager.needsRefresh(2 * 60 * 1000)) {
    // Redirect to refresh endpoint
    return NextResponse.redirect('/api/auth/refresh');
  }
  
  // Check authorization for protected routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!tokenManager.hasRole('admin')) {
      return NextResponse.redirect('/unauthorized');
    }
  }
  
  return NextResponse.next();
}
```

### API Route Protection

```typescript
// app/api/protected/route.ts
import { SessionTokenManager } from '@/lib/session-token-manager';

export async function GET(request: Request) {
  const session = await getSessionFromCookie(request);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const tokenManager = new SessionTokenManager(session);
  
  // Ensure token is valid
  if (tokenManager.isAccessTokenExpired()) {
    return new Response('Token expired', { status: 401 });
  }
  
  // Check required role
  if (!tokenManager.hasRole('api_access')) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Check 2FA requirement
  if (tokenManager.getAuthLevel() !== '2') {
    return new Response('2FA required', { 
      status: 403,
      headers: { 'X-2FA-Required': 'true' }
    });
  }
  
  // Process protected request
  return new Response('Protected data', { status: 200 });
}
```

### Server Component Usage

```typescript
// app/dashboard/page.tsx
import { SessionTokenManager } from '@/lib/session-token-manager';
import { getServerSession } from '@/lib/session';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  
  const tokenManager = new SessionTokenManager(session);
  
  // Get user info from cached token
  const userId = tokenManager.getUserId();
  const roles = tokenManager.getRoles();
  
  // Check if needs refresh soon
  const needsRefreshSoon = tokenManager.needsRefresh(10 * 60 * 1000);
  
  return (
    <div>
      <h1>Welcome, {userId}</h1>
      <p>Roles: {roles.join(', ')}</p>
      {needsRefreshSoon && (
        <Alert>Your session will expire soon. Please refresh.</Alert>
      )}
    </div>
  );
}
```

## Performance Benefits

The SessionTokenManager provides significant performance improvements:

1. **Avoid Repeated Decoding**: JWT decoding is CPU-intensive. By caching decoded tokens, we decode once and reuse.

2. **Faster Authorization Checks**: Role and permission checks use cached data instead of decoding on every check.

3. **Efficient Expiration Checks**: Expiration timestamps are cached, making expiry checks instant.

## Best Practices

1. **Always Use for Token Operations**: Use SessionTokenManager instead of directly accessing session tokens.

2. **Cache Decoded Tokens**: When creating/updating sessions, always cache the decoded token.

3. **Immutable Updates**: Use the `withUpdates` methods to create new session instances.

4. **Buffer Time for Refresh**: Use appropriate buffer times when checking if refresh is needed.

5. **Debug in Development**: Use `getDebugSummary()` to troubleshoot token issues during development.

## Error Handling

The SessionTokenManager handles errors gracefully:

- Failed decoding returns `null` and logs warnings
- Missing tokens return appropriate defaults
- Invalid data is handled with fallbacks

```typescript
const tokenManager = new SessionTokenManager(session);

// Safe to call even if token is missing or invalid
const decoded = tokenManager.getDecodedAccessToken();
if (!decoded) {
  // Handle missing/invalid token
}

// Methods return safe defaults
const roles = tokenManager.getRoles(); // Returns [] if no roles
const userId = tokenManager.getUserId(); // Returns session.userId fallback
```