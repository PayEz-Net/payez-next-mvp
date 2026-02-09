# Auth-Ready v2 Usage Examples

## Before vs After Comparison

### Before (v1.x - Painful Manual Setup)

Previously, you had to create multiple files and handle token refresh manually:

```typescript
// 1. app/api/auth/refresh/route.ts (100+ lines)
import { createRefreshHandler } from '@payez/next-mvp/api-handlers/auth/refresh';

export const POST = createRefreshHandler({
  idpBaseUrl: process.env.IDP_BASE_URL!,
  clientId: process.env.CLIENT_ID!,
  nextAuthSecret: process.env.NEXTAUTH_SECRET!,
});

// 2. app/lib/api-handler.ts (Manual token checking)
export function createApiHandler() {
  return async (req) => {
    const token = await getToken({ req });

    // Manual expiry checking
    if (token.exp < Date.now() / 1000) {
      // Manual refresh logic
      const refreshed = await refreshToken(token.refreshToken);
      // Update session manually
    }

    // ... lots more code
  };
}

// 3. app/api/protected/route.ts
const handler = createApiHandler();
export const GET = handler(async (req) => {
  // Have to manually handle 401s and retries
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (response.status === 401) {
    // Manual retry logic
  }

  return response;
});
```

### After (v2.0 - Simple Auth-Ready)

Now with auth-ready v2, it's incredibly simple:

## 1. One-Line Route Setup

```typescript
// app/api/auth/refresh/route.ts
export { POST } from '@payez/next-mvp/routes/auth/refresh';

// app/api/auth/session/route.ts
export { GET, POST } from '@payez/next-mvp/routes/auth/session';

// app/api/auth/logout/route.ts
export { POST } from '@payez/next-mvp/routes/auth/logout';

// app/api/auth/[...nextauth]/route.ts
export { GET, POST } from '@payez/next-mvp/routes/auth/nextauth';

// app/api/session/viability/route.ts
export { GET } from '@payez/next-mvp/routes/auth/viability';
```

That's it! All auth routes configured in 5 lines.

## 2. Auto-Refreshing API Routes

```typescript
// app/api/protected/route.ts
import { createAuthHandler } from '@payez/next-mvp/api';

const handler = createAuthHandler({ requireAuth: true });

export const GET = handler.handle(async (req, context, auth) => {
  // auth.accessToken is ALWAYS fresh - auto-refreshed if needed!

  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${auth.accessToken}`
    }
  });

  // If API returns 401, it automatically refreshes and retries!
  return NextResponse.json(await response.json());
});
```

## 3. Configuration Options

```typescript
// Customize behavior as needed
const handler = createAuthHandler({
  requireAuth: true,      // Require authentication (default: true)
  autoRefresh: true,       // Auto-refresh expired tokens (default: true)
  refreshBuffer: 300,      // Refresh 5 min before expiry (default: 300)
  retryOn401: true,        // Retry on 401 after refresh (default: true)
  maxRetries: 1            // Number of retries (default: 1)
});
```

## 4. Optional Authentication

```typescript
// Routes that work with or without auth
const handler = createAuthHandler({
  requireAuth: false,
  autoRefresh: true  // Still refresh if token exists
});

export const GET = handler.handle(async (req, context, auth) => {
  if (auth) {
    // User is authenticated
    return { data: 'private', userId: auth.userId };
  } else {
    // User is not authenticated
    return { data: 'public' };
  }
});
```

## 5. Complete App Example

```typescript
// app/api/teams/route.ts
import { createAuthHandler } from '@payez/next-mvp/api';

const handler = createAuthHandler({ requireAuth: true });

export const GET = handler.handle(async (req, context, auth) => {
  // No more manual token management!
  return await fetch(`${process.env.API_URL}/teams`, {
    headers: { 'Authorization': `Bearer ${auth.accessToken}` }
  });
});

export const POST = handler.handle(async (req, context, auth) => {
  const body = await req.json();

  return await fetch(`${process.env.API_URL}/teams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
});
```

## Benefits Summary

### Time Saved
- **Setup time**: From hours to < 5 minutes
- **Lines of code**: 90% reduction in auth boilerplate
- **Bug reduction**: Centralized refresh logic = fewer bugs

### Developer Experience
- ✅ Zero token management code
- ✅ Automatic token refresh before expiry
- ✅ Automatic retry on 401 responses
- ✅ Clean, simple API
- ✅ TypeScript types included
- ✅ Works with existing NextAuth setup

### What You Don't Have to Do Anymore
- ❌ NO manual token expiry checking
- ❌ NO manual refresh implementation
- ❌ NO session update logic
- ❌ NO retry-on-401 logic
- ❌ NO complex error handling

## Environment Variables

Set these in your `.env.local`:

```env
# Required
CLIENT_ID=your-client-id
IDP_URL=http://localhost:32785
AUTH_TRUST_HOST=true

# Optional
REDIS_URL=redis://localhost:6379
```

## Migration from v1.x

If you're using the old pattern, migration is simple:

1. Replace manual route files with one-line exports
2. Replace custom API handlers with `createAuthHandler`
3. Remove all manual token refresh code
4. Enjoy cleaner, more maintainable code!

## Next Steps

1. Install the updated package:
   ```bash
   npm install @payez/next-mvp@2.1.0
   ```

2. Use the CLI to scaffold routes (coming in Week 3):
   ```bash
   npx @payez/next-mvp init
   ```

3. Start building protected APIs with confidence!

---

**That's the power of auth-ready v2** - Authentication that just works, so you can focus on building features instead of fighting with tokens! 🚀