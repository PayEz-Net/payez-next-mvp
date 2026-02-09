# Centralized Auth & API Pattern in @payez/next-mvp

## Executive Summary

The `@payez/next-mvp` package provides a production-ready, centralized API client (`standardizedApi`) that handles authentication, token refresh, retry logic, and standardized response formatting for all client-side API calls. This pattern eliminates the common pitfalls of scattered `fetch()` calls and provides enterprise-grade resilience.

## Why This Pattern Exists

### The Anti-Pattern (What NOT to Do)

```javascript
// ❌ BAD: Direct fetch usage with manual token management
const response = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}` // Where did this token come from?
  }
});
const data = await response.json();
// What if token expired? What if network failed? What if response format changed?
```

### The Production Pattern (What We Do)

```javascript
// ✅ GOOD: Centralized standardizedApi with automatic everything
const result = await standardizedApi.get('/api/users');
if (isApiSuccess(result)) {
  setUsers(result.data); // Direct access, no nesting
} else {
  // Error already logged, retried, and formatted consistently
  setError(result.message);
}
```

## Core Components

### 1. standardizedApi Service

**Location**: `@payez/next-mvp/lib/standardized-client-api`

The singleton service that handles all HTTP communication with automatic:
- **Token Management**: Automatic injection from NextAuth session
- **Token Refresh**: Coordinate client-side refresh to avoid race conditions
- **Retry Logic**: Intelligent retries for 401, 503, and network errors
- **Response Validation**: Enforces standardized response format
- **Error Handling**: Consistent error formatting and user messaging

### 2. Result Types

All API calls return a discriminated union type `ApiResult<TData>`:

```typescript
// Success with data
type ApiSuccessResult<TData> = {
  success: true;
  data: TData;           // Direct access - no nesting!
  message: string;
  operation_code: string;
  timestamp?: string;
}

// Success with pagination
type ApiPagedResult<TData> = {
  success: true;
  items: TData[];        // Direct array access
  message: string;
  operation_code: string;
  pagination: {
    current_page: number;
    total_pages: number;
    // ... more pagination info
  };
  timestamp?: string;
}

// Error response
type ApiErrorResult = {
  success: false;
  error_code: string;
  message: string;
  operation: string;
  details?: unknown;
  validation_errors?: Record<string, string[]>;
  request_id?: string;
}
```

### 3. Type Guards

Type-safe helpers for checking result types:

```typescript
import { isApiSuccess, isApiError, isApiPagedSuccess } from '@payez/next-mvp/lib/standardized-client-api';

const result = await standardizedApi.get('/api/users');

if (isApiSuccess(result)) {
  // TypeScript knows result.data exists
  console.log(result.data);
}

if (isApiError(result)) {
  // TypeScript knows result.error_code and result.message exist
  console.error(result.error_code, result.message);
}
```

## How It Works: The Flow

### Basic API Call Flow

```
1. Component calls standardizedApi.get('/api/users')
   ↓
2. standardizedApi checks NextAuth session for access token
   ↓
3. Preflight check: Is token expiring soon? (< 60s)
   ↓ YES
4. Coordinate token refresh (single flight, no duplicates)
   ↓
5. Make HTTP request with Bearer token
   ↓
6. Response validation and formatting
   ↓
7. Return typed ApiResult to component
```

### Token Refresh Coordination

The system prevents duplicate refresh requests using a singleton promise:

```typescript
// Global state prevents race conditions
let refreshInFlight: Promise<boolean> | null = null;

// When refresh needed, coordinate single flight
if (!refreshInFlight) {
  refreshInFlight = (async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    // ... handle response
    return response.ok;
  })().finally(() => {
    refreshInFlight = null; // Reset when done
  });
}
await refreshInFlight; // All callers wait for same promise
```

**Benefits**:
- Multiple simultaneous API calls share one refresh
- No duplicate refresh requests to IDP
- Prevents token refresh thundering herd
- Works across multiple browser tabs (via server-side middleware)

### 401 Retry Logic

When a 401 (Unauthorized) occurs:

```
1. Receive 401 response
   ↓
2. Check if session exists
   ↓ NO → Redirect to login immediately
   ↓ YES
3. Check if refresh is possible (not pre-2FA, has refresh token)
   ↓ NO → Redirect to login immediately
   ↓ YES
4. Coordinate token refresh (single flight)
   ↓
5. Get new access token from session
   ↓
6. Retry original request with new token
   ↓
7. If still 401 → Schedule login redirect
   ↓ SUCCESS
8. Reset auth failure counter
   ↓
9. Return successful result
```

**Grace Period**: System allows 2 consecutive auth failures before redirecting, with a 2-second grace period to prevent premature redirects during token refresh.

### 503 Retry Logic

When a 503 (Service Unavailable) occurs:

```
1. Receive 503 response
   ↓
2. Check for Retry-After header
   ↓
3. Retry up to 3 times with exponential backoff
   ↓
4. Each retry:
   - Wait: base_delay * (1.5 ^ attempt) ± 150ms jitter
   - Make request
   - If 200 → Success
   - If 503 → Continue retry loop
   - If other error → Stop retrying
   ↓
5. All retries failed → Return error to caller
```

**Jitter**: Random ±150ms added to prevent thundering herd when multiple clients retry simultaneously.

### Pre-2FA Session Handling

Special handling for sessions that require 2FA but haven't completed verification:

```typescript
function isPreTwoFactorSession(session: any): boolean {
  return !!(
    session?.user?.requiresTwoFactor &&
    !session?.user?.twoFactorSessionVerified
  );
}

// Skip token refresh during pre-2FA state
if (isPreTwoFactorSession(currentSession)) {
  console.log('⏭️ Skipping refresh: 2FA not complete');
  // ... continue without refresh
}
```

**Why**: Pre-2FA sessions don't have refresh tokens yet, so attempting refresh would fail. System gracefully skips refresh until 2FA is completed.

### Compatibility Mode

The system supports both old envelope format and new raw format:

```typescript
// Old format (standardized envelope)
{
  success: true,
  data: { users: [...] },
  message: "Success",
  operation_code: "USER_LIST"
}

// New format (raw data)
{
  users: [...]
}

// standardizedApi automatically detects and wraps raw format
if ('success' in rawData) {
  // Old format - validate
} else {
  // New format - wrap in envelope
  return {
    success: true,
    data: rawData,
    message: 'Success',
    operation_code: 'RAW_RESPONSE'
  };
}
```

## Usage Patterns

### In React Components (with hooks)

```typescript
import { useAuth } from '@/hooks/useAuth'; // Local hook
import { isApiSuccess } from '@payez/next-mvp/lib/standardized-client-api';

function MyComponent() {
  const { apiCall } = useAuth(); // Provides authenticated apiCall

  const fetchData = async () => {
    const result = await apiCall('/api/users', 'GET');
    if (isApiSuccess(result)) {
      setUsers(result.data);
    } else {
      setError(result.message);
    }
  };
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { isApiSuccess } from '@payez/next-mvp/lib/standardized-client-api';

export function useUsers() {
  const { isAuthenticated, apiCall } = useAuth();

  return useQuery({
    queryKey: ['users'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const result = await apiCall('/api/users', 'GET');
      if (isApiSuccess(result)) {
        return result.data;
      }
      throw new Error(result.message);
    }
  });
}
```

### Direct standardizedApi Usage

```typescript
import { standardizedApi, isApiSuccess } from '@payez/next-mvp/lib/standardized-client-api';

// GET request
const result = await standardizedApi.get('/api/users');

// POST request
const result = await standardizedApi.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const result = await standardizedApi.put('/api/users/123', userData);

// DELETE request
const result = await standardizedApi.delete('/api/users/123');
```

## Error Handling

### Custom Error Types

```typescript
// Format validation failed
ApiResponseFormatError
- endpoint: string
- rawResponse: unknown

// API returned business logic error
ApiBusinessLogicError
- errorCode: string
- operation: string
- details?: unknown

// Validation failed
ApiValidationError
- operation: string
- validationErrors: Record<string, string[]>
- invalidValue?: unknown
- primaryField?: string

// Network/HTTP error
ApiNetworkError
- status: number
- endpoint: string
```

### Handling Errors in Components

```typescript
try {
  const result = await standardizedApi.get('/api/users');
  if (isApiSuccess(result)) {
    // Success path
  } else {
    // Standardized error (already formatted)
    showNotification('error', result.message);

    // Check for validation errors
    if (result.validation_errors) {
      Object.entries(result.validation_errors).forEach(([field, errors]) => {
        setFieldError(field, errors[0]);
      });
    }
  }
} catch (error) {
  // Network error or format error (rare)
  if (error instanceof ApiNetworkError) {
    showNotification('error', 'Network error. Please check your connection.');
  } else if (error instanceof ApiResponseFormatError) {
    // API not following standardized format - report to backend team
    console.error('API format error:', error.endpoint, error.rawResponse);
    showNotification('error', 'Server error. Please try again later.');
  }
}
```

## Architecture Decisions

### Why Local Hooks for Auth?

**Problem**: React Context (SessionProvider) cannot cross package boundaries in file:// linked packages.

**Solution**: Hooks that use NextAuth (`useSession`) must be local to the consuming application, not in the shared package.

```
Package Structure:
├── @payez/next-mvp (shared package)
│   ├── lib/standardized-client-api.ts  ✅ Shared (no React context)
│   └── hooks/useAuth.ts                ❌ Cannot be shared (uses SessionProvider)
│
└── Consuming App (e.g., Nexus.CryptAply)
    ├── app/providers.tsx               → Provides SessionProvider
    └── hooks/useAuth.ts                ✅ Local hook (can access SessionProvider)
        └── imports standardizedApi from package
```

### Why Singleton Pattern?

Using a singleton `standardizedApi` instance provides:
- **Shared State**: Token refresh coordination across all API calls
- **Consistent Config**: Single point to configure base URL, headers, etc.
- **Easy Testing**: Mock once, applies to all API calls
- **No Props Drilling**: Import directly where needed

### Why Discriminated Unions?

```typescript
type ApiResult<T> =
  | ApiSuccessResult<T>
  | ApiPagedResult<T>
  | ApiErrorResult;
```

**Benefits**:
- **Type Safety**: TypeScript knows exact shape after checking `success` field
- **Exhaustive Checking**: Compiler ensures all cases handled
- **No Runtime Checking**: `success` boolean is sufficient discriminator
- **IntelliSense**: IDE autocomplete knows available fields

## Comparison to Documentation

The original `clientApi-pattern.md` was written early in development. Here's what's evolved:

| Document | Current Implementation |
|----------|----------------------|
| Called `clientApi` | Called `standardizedApi` |
| Basic retry logic mentioned | Advanced 401/503 retry with exponential backoff |
| Token refresh mentioned | Coordinated refresh with in-flight promise |
| Simple error handling | Custom error classes with detailed typing |
| Single format | Compatibility mode (old envelope + new raw) |
| Basic auth | Pre-2FA session handling, grace periods |
| Mentioned request IDs | Full request ID tracking with headers |
| Simple type checking | Discriminated unions with type guards |

**Key Additions**:
- Preflight token expiry checking (< 60s triggers refresh)
- Auth failure grace period (2 failures before redirect)
- 503 retry with jitter to prevent thundering herd
- Compatibility layer for response format migration
- Request ID propagation for distributed tracing

## Best Practices

### ✅ DO

```typescript
// Use standardizedApi for all business logic API calls
const result = await standardizedApi.get('/api/users');

// Check success with type guards
if (isApiSuccess(result)) {
  // TypeScript knows result.data exists
}

// Use with React Query for caching
useQuery({
  queryFn: async () => {
    const result = await apiCall('/api/users', 'GET');
    if (isApiSuccess(result)) return result.data;
    throw new Error(result.message);
  }
});

// Handle errors consistently
if (isApiError(result)) {
  showNotification('error', result.message);
}
```

### ❌ DON'T

```typescript
// DON'T use direct fetch for business logic
const response = await fetch('/api/users');

// DON'T assume data structure without checking
const users = result.data.users.items; // ❌ No nesting!

// DON'T ignore error cases
const result = await standardizedApi.get('/api/users');
setUsers(result.data); // ❌ What if error?

// DON'T use standardizedApi for authentication flows
// (those use direct fetch intentionally)
```

### ⚠️ EXCEPTION: Core Authentication Flows

```typescript
// Authentication flows intentionally use direct fetch
// for security and session management reasons
const response = await fetch('/api/account/verify-email', {
  method: 'POST',
  body: JSON.stringify({ code }),
  credentials: 'include'
});

// This is INTENTIONAL - do not refactor to standardizedApi
// Auth flows must use fetch directly to avoid circular dependencies
```

## Troubleshooting

### "useSession must be wrapped in SessionProvider"

**Cause**: Trying to use hooks from package that access SessionProvider context.

**Solution**: Create local hooks that import standardizedApi:

```typescript
// ❌ BAD: Importing hook from package
import { useAuth } from '@payez/next-mvp/hooks/useAuth';

// ✅ GOOD: Local hook that imports standardizedApi
import { useAuth } from '@/hooks/useAuth'; // Your local hook
import { standardizedApi } from '@payez/next-mvp/lib/standardized-client-api';
```

### Token Refresh Loop

**Cause**: Multiple tabs or requests triggering simultaneous refresh.

**Solution**: Already handled by `refreshInFlight` coordination. If still occurring, check:
- Server-side refresh endpoint returns 409 for in-progress refreshes
- Client waits for 409 responses before retrying

### "API_FORMAT_ERROR" Exceptions

**Cause**: API endpoint not returning standardized format.

**Solution**: Check endpoint response. Should be either:
1. Old envelope format with `{ success, data, message, operation_code }`
2. New raw format (automatically wrapped)

If neither, fix the API endpoint to return standardized format.

## Future Enhancements

### Potential Additions

1. **Request Deduplication**: Prevent duplicate simultaneous requests to same endpoint
2. **Offline Queue**: Queue requests when offline, replay when back online
3. **Request Batching**: Combine multiple requests into single HTTP call
4. **APM Integration**: Built-in hooks for analytics and error tracking
5. **Cache Strategies**: Sophisticated caching beyond React Query
6. **WebSocket Support**: Extend pattern to WebSocket connections

## Conclusion

The `standardizedApi` pattern in `@payez/next-mvp` provides production-grade API communication with:

✅ Automatic token management and refresh
✅ Intelligent retry logic with exponential backoff
✅ Consistent error handling and messaging
✅ Type-safe responses with discriminated unions
✅ Zero configuration for consuming applications
✅ Battle-tested in production environments

By centralizing all HTTP communication through `standardizedApi`, we eliminate entire classes of bugs related to token management, error handling, and response parsing.

---

**Document Version**: 2.0
**Last Updated**: 2025-10-31
**Package**: @payez/next-mvp v2.0.2
**Status**: ✅ Production Ready
