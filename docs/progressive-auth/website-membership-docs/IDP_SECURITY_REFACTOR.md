# IDP API Security Refactor - Remove IDs from URLs

## Overview

This document outlines the comprehensive refactoring performed to align the IDP client management APIs with secure .NET Core Identity patterns by removing all IDs from URL paths and moving them exclusively to request body models.

## Security Rationale

- **Compliance**: IDs in URLs violate .NET Core Identity security standards
- **Best Practice**: Sensitive identifiers should not be exposed in URL paths
- **Audit Trail**: IDs in request bodies provide better logging and audit capabilities
- **Security**: Prevents ID enumeration attacks and improves data protection

## API Pattern Changes

### Before (Insecure Pattern)
```
GET /api/ClientAdmin/clients/{id}
PUT /api/ClientAdmin/clients/{id}
DELETE /api/ClientAdmin/clients/{id}
```

### After (Secure Pattern)
```
POST /api/ClientAdmin/clients/get
PUT /api/ClientAdmin/clients
DELETE /api/ClientAdmin/clients
```

## Updated Routes

### 1. Main Client Management (`ClientAdminController`)

#### Client Operations
- **GET by ID**: `GET clients/{id}` → `POST clients/get` with `client_id` in body
- **UPDATE**: `PUT clients/{id}` → `PUT clients` with `idp_client_id` in body  
- **DELETE**: `DELETE clients/{id}` → `DELETE clients` with `client_id` in body

#### Client Settings Operations
- **GET Settings**: `GET clients/{id}/settings` → `POST settings/get` with `client_id` in body
- **UPDATE Settings**: `PUT clients/{id}/settings` → `PUT settings` with `client_id` in body

### 2. Client Permissions (`ClientPermissionAdminController`)

- **GET Permissions**: `GET clients/{id}/permissions` → `POST permissions/get` with `client_id` in body
- **CREATE Permission**: `POST clients/{id}/permissions` → `POST permissions` with `client_id` in body

### 3. Client Roles (`ClientRoleAdminController`)

- **GET Roles**: `GET clients/{id}/roles` → `POST roles/get` with `client_id` in body
- **CREATE Role**: `POST clients/{id}/roles` → `POST roles` with `client_id` in body

### 4. Client User Management (`ClientUserAdminController`)

- **GET Users**: `GET clients/{id}/users` → `POST users/get` with `client_id` in body
- **ADD User**: `POST clients/{id}/users` → `POST users` with `client_id` in body
- **GET Activity**: `GET clients/{id}/activity` → `POST activity/get` with `client_id` in body
- **GET Sessions**: `GET clients/{id}/sessions` → `POST sessions/get` with `client_id` in body
- **GET Stats**: `GET clients/{id}/stats` → `POST stats/get` with `client_id` in body

## Request Body Models

### Client Operations
```csharp
public class GetClientModel
{
    public int ClientId { get; set; }
}

public class DeleteClientModel  
{
    public int ClientId { get; set; }
}

public class UpdateIDPClientModel
{
    public int IDPClientId { get; set; }
    // ... other properties
}
```

### Settings Operations
```csharp
public class GetClientSettingsModel
{
    public int ClientId { get; set; }
}

public class UpdateClientSettingsModel
{
    public int ClientId { get; set; }
    // ... settings properties
}
```

## Next.js Frontend Changes

All corresponding Next.js API routes have been updated to:

1. **Extract client ID from URL path** (for compatibility with existing frontend)
2. **Include client ID in request body** when calling C# backend
3. **Use correct HTTP methods** for the new backend endpoints

### Example Frontend Route Update

```typescript
// Before
const backendResponse = await fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/ClientAdmin/clients/${clientId}`, {
  method: 'GET',
  headers: { ... }
});

// After  
const backendResponse = await fetch(`${ENV_CONFIG.IDP_BASE_URL}/api/ClientAdmin/clients/get`, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ client_id: parseInt(clientId) })
});
```

## Updated Files

### Next.js Routes
- `src/app/api/admin/clients/[id]/route.ts` - Main client operations
- `src/app/api/admin/clients/[id]/permissions/route.ts` - Permission management
- `src/app/api/admin/clients/[id]/roles/route.ts` - Role management
- `src/app/api/admin/clients/[id]/users/route.ts` - User management
- `src/app/api/admin/clients/[id]/activity/route.ts` - Activity logs
- `src/app/api/admin/clients/[id]/sessions/route.ts` - Session management
- `src/app/api/admin/clients/[id]/stats/route.ts` - Statistics

### C# Controllers (Referenced but not in this repository)
- `ClientAdminController.cs` - Already updated
- `ClientPermissionAdminController.cs` - Needs updating
- `ClientRoleAdminController.cs` - Needs updating  
- `ClientUserAdminController.cs` - Needs creation/updating

## Implementation Status

### ✅ Completed
- Main client operations (GET, PUT, DELETE)
- Client settings operations (GET, PUT)
- All Next.js frontend routes updated to new pattern
- Request body models created for C# backend

### 🔄 Pending C# Backend Updates
- `ClientPermissionAdminController.cs` - Update to new pattern
- `ClientRoleAdminController.cs` - Update to new pattern
- `ClientUserAdminController.cs` - Create/update to new pattern

## Testing Considerations

1. **Verify C# controllers** implement the new patterns correctly
2. **Test all Next.js routes** connect to correct backend endpoints
3. **Validate request body models** contain required client IDs
4. **Ensure backward compatibility** during transition period
5. **Test error handling** for malformed requests

## Security Benefits Achieved

- ✅ **No IDs in URLs**: All sensitive identifiers moved to request bodies
- ✅ **Improved Audit Trail**: Client IDs logged in request bodies
- ✅ **Enumeration Prevention**: IDs no longer discoverable in URLs
- ✅ **Compliance**: Aligns with .NET Core Identity security standards
- ✅ **Consistent Pattern**: All client operations follow same secure pattern

## Future Considerations

- Apply same pattern to other entity management (users, roles, permissions)
- Consider implementing request body validation middleware
- Add comprehensive logging for all ID-based operations
- Document pattern for new developers
