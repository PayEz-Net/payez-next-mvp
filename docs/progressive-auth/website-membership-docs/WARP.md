# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## PayEz Project Structure (CRITICAL - DO NOT FORGET)

**PayEz-Core** (`E:\Repos\PayEz-Core`) = .NET Core Identity Provider/API
- This is the backend IDP service that handles authentication, user management, and admin APIs
- Uses C# PascalCase internally for properties and methods
- Communication models (DTOs) enforce **snake_case** JSON serialization (e.g., `"user_name"`, `"first_name"`, `"created_at"`)
- Build managed by user - DO NOT attempt to build .NET projects

**website-membership** (`E:\Repos\website-membership`) = Next.js Frontend Client
- This is the Next Auth client that connects to PayEz-Core
- Frontend React/TypeScript application that consumes APIs from PayEz-Core
- Uses TypeScript checking with `npx tsc --noEmit`
- Expects **snake_case** field names from API responses

### Key Relationship
- PayEz-Core serves as the Identity Provider (IDP)
- website-membership is a Next Auth client of PayEz-Core
- All API communication uses **snake_case** for compound words (`user_name`, `phone_number`, `created_at`)
- Single words remain unchanged (`email`, `password`, `city`, `phone`)

## Repository Structure

website-membership is a Next.js application with sophisticated API communication and enterprise-grade authentication:

- **src/pages/api/** - Next.js API routes
- **src/lib/** - Core libraries and utilities
  - `api-client.ts` - Centralized API client with token sync
  - `enhanced-api-handler.ts` - Enterprise API handler system
  - `serializers/` - API response serialization system
- **src/utils/** - Utility functions
  - `apiWithTokenSync.ts` - Token-synchronized API calls
  - `idp-api.ts` - IDP administrative operations
- **src/components/** - React components
- **src/__tests__/** - Comprehensive test suite

## Build and Run Commands

### Development
```bash
# Clean and start development server
npm run dev:clean

# Standard development (port 3200)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test suites
npm run test:session-core
npm run test:2fa-core
npm run test:rbac-core
npm run test:api-security
```

## Architecture Overview

### API Communication System
Multi-layered API architecture with comprehensive token management:

1. **Primary API Client** (`/src/lib/api-client.ts`)
   - Singleton-based centralized client
   - Automatic token synchronization
   - Built-in retry logic and comprehensive logging

2. **Token-Synchronized API Utility** (`/src/utils/apiWithTokenSync.ts`)
   - Enhanced token synchronization
   - Configurable refresh thresholds
   - Function-based API calls

3. **Enhanced API Handler** (`/src/lib/enhanced-api-handler.ts`)
   - Automatic middleware application
   - Route-based security configurations
   - Enterprise-grade error handling

### Authentication & Authorization
- **NextAuth Integration**: Secure session management
- **Token Synchronization**: Redis and NextAuth token consistency
- **Role-Based Access Control**: Admin, Merchant, User roles
- **2FA Support**: Two-factor authentication workflows

### Response Serialization
Universal response handling supporting multiple formats:
- Direct arrays: `[item1, item2, ...]`
- Nested pagination: `{ data: [...], totalCount: number }`
- Items pagination: `{ items: [...], total: number }`
- IDP pagination: `{ data: [...], totalItems: number, pageNumber: number }`

## API Communication Standards

### Standard API Client Usage
```typescript
import { apiClient } from '@/lib/api-client';

// Basic usage with automatic token management
const response = await apiClient.get<UserData>('/api/users');
const createResponse = await apiClient.post<User>('/api/users', userData);
```

### Token-Synchronized Calls
```typescript
import { getWithTokenSync, postWithTokenSync } from '@/utils/apiWithTokenSync';

// GET with enhanced token sync
const userData = await getWithTokenSync<UserResponse>('/api/users/profile');

// POST with custom options
const result = await postWithTokenSync<CreateResponse>('/api/users', data, {
  forceRefresh: true,
  refreshThreshold: 5 * 60 * 1000
});
```

### IDP Administrative Operations
```typescript
import { IdpApiClient } from '@/utils/idp-api';

const idpClient = new IdpApiClient(accessToken, request);

// User management operations
const users = await idpClient.getUsers();
await idpClient.updateUser(userId, updateData);
await idpClient.pauseUser(userId, { reason: 'Security review' });
await idpClient.resetUser2FA(userId);
```

## Communication Standards

Always expect **lower_snake_case** formatting in communication-related contexts (comms), API requests, and data transfer objects.

### Team Communication Style
- **PROBLEM-FIRST APPROACH**: Focus immediately on identifying and solving issues. No celebratory recaps when things work as expected.
- **NO VICTORY LAPS**: Do not emphasize or celebrate basic functionality ("the site ran", "compilation succeeded", etc.). These are baseline expectations.
- **DIRECT TECHNICAL COMMUNICATION**: Get straight to the problem, solution, and next steps. Save stories and elaboration for personal time.
- **ASSUME COMPETENCE**: The team knows when things work. Only mention successful operations if they're part of diagnosing or verifying a fix.

## Standard Response Structure
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  tokenRefreshed?: boolean;
}
```

## Error Handling Patterns

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

### Standard Error Handling
```typescript
try {
  setLoading(true);
  setError(null);
  
  const response = await apiClient.post('/api/endpoint', data);
  
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

## State Management Patterns

### Component State
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Debounced API calls (300ms standard)
useEffect(() => {
  const handler = setTimeout(() => {
    fetchData();
  }, 300);

  return () => clearTimeout(handler);
}, [dependencies]);
```

### Session Management
```typescript
const { session, accessToken } = useSessionHelper();
```

## Testing Architecture

### Comprehensive Test Suite
- **Session Management Tests**: Core session functionality
- **2FA Integration Tests**: Two-factor authentication flows  
- **RBAC Tests**: Role-based access control validation
- **API Security Tests**: Token refresh and authentication
- **Performance Tests**: Load and stress testing
- **Integration Tests**: End-to-end workflow validation

### Test Orchestration
```bash
# Run tests with different strategies
npm run test:critical-first    # Critical tests first
npm run test:sequential        # Sequential execution
npm run test:parallel         # Parallel execution
```

## Configuration and Environment

### Key Environment Variables
- **NEXTAUTH_SECRET**: NextAuth encryption key
- **NEXTAUTH_URL**: Application base URL
- **REDIS_URL**: Redis connection for session storage
- **IDP_API_URL**: Identity provider API endpoint
- **IDP_CLIENT_ID**: IDP client credentials
- **DATABASE_URL**: Database connection string

### Development Setup
1. Copy `.env.example` to `.env.local`
2. Configure IDP connection settings
3. Set up Redis for session management
4. Configure database connections

## Security Considerations

### Token Management
- **Automatic Token Refresh**: Proactive token renewal
- **Token Synchronization**: Consistent token state across services
- **Secure Storage**: HttpOnly cookies for sensitive tokens
- **CSRF Protection**: Built-in cross-site request forgery protection

### Authentication Security
- **Multi-Factor Authentication**: Optional 2FA implementation
- **Session Security**: Secure session management with Redis
- **Role-Based Authorization**: Granular permission control
- **API Security**: Comprehensive middleware protection

## Development Best Practices

1. **Use `apiClient` for new implementations** - Most comprehensive token management
2. **Implement proper error boundaries** with consistent error state management  
3. **Follow established response patterns** for consistency
4. **Use the serializer system** for complex data transformations
5. **Implement debouncing** for search operations (300ms standard)
6. **Maintain consistent loading states** and user feedback

## Common Operations

### User Management Workflow
1. **Authentication** via NextAuth
2. **Token Synchronization** between NextAuth and Redis
3. **Role Assignment** and permission validation
4. **IDP Integration** for administrative operations
5. **Session Management** with automatic refresh

### API Integration Patterns
- Use centralized `apiClient` for consistency
- Implement proper error handling with user feedback
- Apply debouncing for search and filter operations
- Maintain loading states throughout async operations
- Use type-safe models for all API interactions

## Migration Guidelines

For components not following established patterns:
1. Replace direct fetch calls with appropriate API clients
2. Standardize response handling using established patterns
3. Implement proper error handling with consistent error states
4. Add token synchronization for authenticated operations
5. Use serializer system for data transformation and validation

## Database Security Policy

**CRITICAL**: AI assistants should NEVER execute database commands directly. Instead:
- Display SQL commands in formatted code blocks for manual execution
- Include copy-friendly formatting with clear instructions
- Let humans review and execute all database modifications
- Provide both the command and rollback instructions when applicable

## Troubleshooting

### Common Issues
- **Token Sync Issues**: Check Redis connection and NextAuth configuration
- **API Timeouts**: Verify network connectivity and endpoint availability
- **Session Expiry**: Review token refresh thresholds and timing
- **Permission Errors**: Validate user roles and RBAC configuration

### Diagnostic Commands
```bash
# Check development server
curl http://localhost:3200/api/health

# View logs for debugging
npm run dev 2>&1 | grep ERROR

# Test specific functionality
npm run test:api-security
```
