# API Communication Standards - Website Membership Project

## Overview

The website-membership project implements a sophisticated, enterprise-grade API communication system with multiple layers of abstraction, token management, and response handling. This document outlines the standardized patterns that should be followed throughout the project.

## Core API Infrastructure

### 1. Primary API Client (`/src/lib/api-client.ts`)

**Usage Pattern**: Singleton-based centralized API client with automatic token synchronization.

```typescript
import { apiClient } from '@/lib/api-client';

// Basic usage
const response = await apiClient.get<UserData>('/api/users');
const createResponse = await apiClient.post<User>('/api/users', userData);
```

**Key Features**:
- **Automatic Token Management**: Integrates with centralized token-sync service
- **Token Consistency**: Ensures NextAuth and Redis token synchronization
- **Retry Logic**: Built-in request retry mechanism
- **Comprehensive Logging**: Detailed logging for token refresh events

**Standard Response Structure**:
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  tokenRefreshed?: boolean;
}
```

### 2. Token-Synchronized API Utility (`/src/utils/apiWithTokenSync.ts`)

**Usage Pattern**: Function-based API calls with enhanced token synchronization.

```typescript
import { apiWithTokenSync, getWithTokenSync, postWithTokenSync } from '@/utils/apiWithTokenSync';

// GET request with token sync
const userData = await getWithTokenSync<UserResponse>('/api/users/profile');

// POST request with token sync
const result = await postWithTokenSync<CreateResponse>('/api/users', newUserData, {
  forceRefresh: true,
  refreshThreshold: 5 * 60 * 1000
});
```

**Standard Options Interface**:
```typescript
interface ApiWithTokenSyncOptions extends ApiOptions {
  forceRefresh?: boolean;
  refreshThreshold?: number;
  maxRetries?: number;
  skipTokenValidation?: boolean;
}
```

### 3. Legacy API Utility (`/src/utils/api.ts`)

**Usage Pattern**: Traditional API utility with universal response normalization.

```typescript
import { apiFetch, apiFetchAuth } from '@/utils/api';

// Public API call
const response = await apiFetch<DataType>('/api/public/data');

// Authenticated API call
const authResponse = await apiFetchAuth<UserData>('/api/users', accessToken);
```

## Response Serialization System

### API Response Serializer (`/src/lib/serializers/api-response-serializer.ts`)

**Usage Pattern**: Universal response serialization with multiple format detection.

```typescript
import { ApiResponseSerializer } from '@/lib/serializers/api-response-serializer';

const serializer = new ApiResponseSerializer({
  enableValidation: true,
  enableCaching: true,
  cacheKeyPrefix: 'api:users',
  defaultTtl: 5 * 60 * 1000
});

// Deserialize API response into model instances
const users = await serializer.deserialize<UserModel>(
  response, 
  UserModel, 
  'users-list'
);
```

**Supported Response Formats**:
1. **Direct Array**: `[item1, item2, ...]`
2. **Nested Pagination**: `{ data: [...], totalCount: number, ... }`
3. **Items Pagination**: `{ items: [...], total: number, ... }`
4. **IDP Pagination**: `{ data: [...], totalItems: number, pageNumber: number, ... }`

## Enterprise API Handler System

### Enhanced API Handler (`/src/lib/enhanced-api-handler.ts`)

**Usage Pattern**: Automatic middleware application based on route characteristics.

```typescript
import { createEnhancedApiHandler, createHandlerWithMiddleware } from '@/lib/enhanced-api-handler';

// Auto-detected middleware
const handler = createEnhancedApiHandler('/api/admin/users', {
  requireAuth: true,
  requiredRoles: ['payez_admin']
});

// Pre-configured handlers
const verificationHandler = createHandlerWithMiddleware.verification('/api/verify-email');
const adminHandler = createHandlerWithMiddleware.admin('/api/admin/dashboard');
```

### Base API Handler (`/src/lib/api-handler.ts`)

**Usage Pattern**: Foundation for all API endpoints with comprehensive authentication.

```typescript
import { createApiHandler, API_CONFIGS } from '@/lib/api-handler';

const handler = createApiHandler(API_CONFIGS.AUTHENTICATED)
  .handle(async (req, context, auth, responseBuilder) => {
    // Handler implementation
    return responseBuilder.success(data);
  });
```

**Standard Configurations**:
- `API_CONFIGS.PUBLIC`: No authentication required
- `API_CONFIGS.AUTHENTICATED`: Basic authentication required
- `API_CONFIGS.ADMIN`: Admin role required
- `API_CONFIGS.MERCHANT`: Merchant or admin role required

## IDP Communication

### IDP API Client (`/src/utils/idp-api.ts`)

**Usage Pattern**: Type-safe client for IDP administrative operations.

```typescript
import { IdpApiClient } from '@/utils/idp-api';

const idpClient = new IdpApiClient(accessToken, request);

// User management
const users = await idpClient.getUsers();
const user = await idpClient.getUser(userId);
await idpClient.updateUser(userId, updateData);

// Advanced user controls
await idpClient.pauseUser(userId, { reason: 'Security review' });
await idpClient.resetUser2FA(userId);
await idpClient.toggleUserApproval(userId, true);
```

## Standard Error Handling

### API Error Class
```typescript
export class ApiError extends Error {
  type: string;
  title: string;
  status: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}
```

### Error Code Mapping
```typescript
enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  // ... more codes
}
```

## Implementation Guidelines for Directory Client

Based on the analysis of `directory-client.tsx`, here are the established patterns:

### 1. Session Management
```typescript
const { session, accessToken } = useSessionHelper();
```

### 2. API Client Usage
```typescript
// Prefer the centralized client API for consistency
import { clientApi } from '@/lib/client-api';

const response = await clientApi.post('/api/admin/users', gridRequest, accessToken);
```

### 3. Response Handling Pattern
```typescript
if (!response.success) {
  throw new Error(response.error || 'Failed to fetch users');
}

// Extract data from standardized structure
const users = response.data.data;
const totalItems = response.data.totalItems || 0;
const pageNumber = response.data.pageNumber || 1;
```

### 4. State Management
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Debounced API calls
useEffect(() => {
  const handler = setTimeout(() => {
    fetchData();
  }, 300); // 300ms debounce

  return () => clearTimeout(handler);
}, [dependencies]);
```

### 5. Error Handling
```typescript
try {
  setLoading(true);
  setError(null);
  
  const response = await clientApi.post('/api/endpoint', data, accessToken);
  
  if (!response.success) {
    throw new Error(response.error || 'Operation failed');
  }
  
  // Process successful response
  
} catch (error) {
  console.error('Operation failed:', error);
  setError(error instanceof Error ? error.message : 'An error occurred');
} finally {
  setLoading(false);
}
```

## Best Practices Summary

1. **Use `apiClient` for new implementations** - Provides the most comprehensive token management and error handling
2. **Leverage token-sync utilities** when you need fine-grained control over token refresh behavior
3. **Implement proper error boundaries** with consistent error state management
4. **Follow the established response patterns** for consistency across the application
5. **Use the serializer system** for complex data transformations and validation
6. **Implement debouncing** for search and filter operations to reduce server load
7. **Maintain consistent loading states** and user feedback patterns

## Migration Strategy

For components that don't follow these patterns:

1. **Replace direct fetch calls** with appropriate API clients
2. **Standardize response handling** using established patterns
3. **Implement proper error handling** with consistent error states
4. **Add token synchronization** where authentication is required
5. **Use the serializer** for data transformation and validation

This architecture ensures consistent, maintainable, and scalable API communication throughout the website-membership project.

---

**Note**: This document was last updated on 2025-08-27 to test file edit functionality in Warp terminal.
