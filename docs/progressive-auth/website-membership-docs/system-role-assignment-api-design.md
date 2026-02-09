# System Role to Client Assignment API Design

## Overview
New endpoints to assign existing system-wide roles (like `payez_admin`, `cryptaply_admin`) to specific clients (like `cryptaply_admin_web`).

## Endpoints

### 1. Assign System Role to Client
```http
POST /api/admin/clients/{clientId}/system-roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "role_id": "string"  // ID of the system role to assign
}
```

**Response:**
- `204 No Content` - Success
- `404 Not Found` - Client or role not found  
- `409 Conflict` - Role already assigned to client
- `400 Bad Request` - Invalid role_id format

### 2. Unassign System Role from Client
```http
DELETE /api/admin/clients/{clientId}/system-roles/{roleId}
Authorization: Bearer <token>
```

**Response:**
- `204 No Content` - Success
- `404 Not Found` - Client, role, or assignment not found

### 3. List Client System Role Assignments
```http
GET /api/admin/clients/{clientId}/system-roles
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "role_id": "1", 
      "role_name": "payez_admin",
      "assigned_at": "2025-01-05T14:30:00Z",
      "assigned_by": "admin@payez.net"
    }
  ],
  "operation": "get_client_system_roles"
}
```

## Implementation Notes
- Add to `AdminController` as new section: `#region CLIENT SYSTEM ROLE ASSIGNMENTS`
- Service method: `IIdentityExtensionsService.AssignSystemRoleToClientAsync()`
- Database: Link table between `IDPClient` and `ApplicationRole` 
- Audit logging for all assignments/removals
- Follows lower_snake_case for comms as per user rules
