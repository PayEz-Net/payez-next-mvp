# API Response Conventions

This document outlines the standardized API response formats used throughout the PayEz website-membership application to ensure consistency and prevent common parsing issues.

## Standard Response Format

All API endpoints should return responses in the following flat structure:

### Successful Response

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
  request_id?: string;
  meta?: {
    timestamp?: string;
    requestId?: string;
    version?: string;
    operation?: string;
    performance?: {
      responseTimeMs?: number;
      resourcesUsed?: Record<string, any>;
    };
    warnings?: string[];
    extensions?: Record<string, any>;
  };
}
```

### Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  data: null;
  error_code?: string;
  message: string;
  timestamp?: string;
  request_id?: string;
  meta?: {
    timestamp?: string;
    requestId?: string;
    version?: string;
    operation?: string;
    errors?: ValidationError[];
    extensions?: Record<string, any>;
  };
}
```

## Data Payload Guidelines

### ✅ **DO**: Use Flat Data Structure

For user directory responses, return users directly in the `data` field:

```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "user_name": "john@example.com",
      "email": "john@example.com",
      "full_name": "John Doe",
      "created_date": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

### ✅ **DO**: Use Paginated Structure When Needed

For paginated responses, include pagination metadata alongside the data:

```json
{
  "success": true,
  "data": {
    "users": [...],
    "totalItems": 150,
    "pageNumber": 2,
    "pageSize": 25,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "message": "Paginated users retrieved successfully"
}
```

### ❌ **DON'T**: Use Nested data.data Structure

**DEPRECATED** - This pattern causes parsing issues and is forbidden:

```json
// ❌ WRONG - Don't do this
{
  "success": true,
  "data": {
    "data": [
      { "user_id": 1, "user_name": "john@example.com" }
    ],
    "totalItems": 1
  }
}
```

### ❌ **DON'T**: Use Deeply Nested Structures

**DEPRECATED** - Avoid complex nested structures:

```json
// ❌ WRONG - Don't do this
{
  "success": true,
  "data": {
    "response": {
      "data": {
        "users": [...]
      }
    }
  }
}
```

## Client-Side Parsing

### Using parseFlatApiResponse Utility

For user directory endpoints, use the `parseFlatApiResponse` utility:

```typescript
import { parseFlatApiResponse } from '@/lib/api/parseFlatApiResponse';

try {
  const response = await apiClient.post('/api/admin/users', payload);
  const { users, totalItems, pageNumber, pageSize } = parseFlatApiResponse(response);
  
  // Process users array...
} catch (error) {
  // Handle parsing errors (including deprecated structure detection)
}
```

### Manual Parsing Pattern

If not using the utility, follow this pattern:

```typescript
if (isApiSuccess(response)) {
  const data = response.data;
  
  let users: UserDto[];
  let totalItems: number;
  
  if (Array.isArray(data)) {
    // Direct array response
    users = data;
    totalItems = data.length;
  } else if (data && typeof data === 'object') {
    // Paginated response
    users = data.users || data.items || data.results || [];
    totalItems = data.totalItems || data.total_items || data.totalCount || users.length;
  } else {
    throw new Error('Invalid response format');
  }
}
```

## ESLint Rules

The following ESLint rules are enforced to prevent deprecated patterns:

```javascript
// eslint.config.mjs
{
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: "MemberExpression[object.name='data'][property.name='data']",
        message: "Avoid 'data.data' access patterns. Use flat API response structure instead."
      },
      {
        selector: "MemberExpression[object.type='MemberExpression'][object.property.name='data'][property.name='data']",
        message: "Avoid nested 'data.data.data' access patterns. Use parseFlatApiResponse utility instead."
      }
    ]
  }
}
```

## Migration from Legacy Patterns

### Step 1: Identify Legacy Code

Look for these patterns in your codebase:

```typescript
// ❌ Legacy patterns to replace
response.data.data
(response.data as any).data
data && 'data' in data && data.data
```

### Step 2: Replace with Standard Patterns

Update to use flat structure parsing:

```typescript
// ✅ Updated pattern
const { users, totalItems, pageNumber, pageSize } = parseFlatApiResponse(response);
```

### Step 3: Update Backend APIs

Ensure your backend APIs return flat structures:

```csharp
// ✅ C# Controller Example
public async Task<ApiResponse<UserDirectoryItem[]>> GetUsers()
{
    var users = await _userService.GetUsersAsync();
    return ApiResponse.Success(users, "Users retrieved successfully");
}

// For paginated responses:
public async Task<ApiResponse<PagedResult<UserDirectoryItem>>> GetUsersPaged()
{
    var pagedResult = await _userService.GetUsersPagedAsync();
    return ApiResponse.Success(pagedResult, "Paginated users retrieved successfully");
}
```

## Testing

Write tests to ensure your APIs return the correct format:

```typescript
describe('User API', () => {
  it('should return flat array structure', async () => {
    const response = await request(app)
      .post('/api/admin/users')
      .send(payload);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    
    // Should NOT have nested data.data structure
    if (typeof response.body.data === 'object' && !Array.isArray(response.body.data)) {
      expect(response.body.data).not.toHaveProperty('data');
    }
  });
});
```

## Error Handling

### Common Parsing Errors

The `parseFlatApiResponse` utility will throw descriptive errors for:

1. **Deprecated Structure**: "DEPRECATED RESPONSE FORMAT: This API endpoint is returning nested data.data structure"
2. **Invalid Format**: "Invalid response data format. Expected array or object, got: [type]"
3. **API Failure**: "[error_code]: [message]" or "API request failed"

### Error Recovery

```typescript
try {
  const parsed = parseFlatApiResponse(response);
  // Use parsed data...
} catch (error) {
  if (error.message.includes('DEPRECATED RESPONSE FORMAT')) {
    // Log warning and contact backend team to update API
    logger.warn('API returning deprecated format', { endpoint, error: error.message });
  }
  
  // Fallback to empty state
  setUsers([]);
  setError('Failed to load users');
}
```

## Best Practices

1. **Always validate response structure** before accessing data
2. **Use type guards** (`isApiSuccess`, `isApiError`) for response checking
3. **Prefer the parseFlatApiResponse utility** for user directory endpoints
4. **Log detailed errors** when encountering unexpected structures
5. **Test both array and paginated response formats** in your components
6. **Document any deviation** from these conventions with clear reasoning

## Related Documentation

- [API Communication Standards](../API_COMMUNICATION_STANDARDS.md)
- [Enhanced Models Migration](../ENHANCED_MODELS_MIGRATION.md)
- [Directory Client Pattern Deviations](../DIRECTORY_CLIENT_PATTERN_DEVIATIONS.md)

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Active
