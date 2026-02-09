# IDP Admin API Endpoints Reference

This document provides a comprehensive reference for all available IDP Admin API endpoints, their usage, and implementation details.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Client Management](#client-management)
- [Client Role Management](#client-role-management)
- [Client Permission Management](#client-permission-management)
- [Client Role-Permission Mapping](#client-role-permission-mapping)
- [Client User Management](#client-user-management)
- [Client Activity & Audit](#client-activity--audit)
- [User Management](#user-management)
- [Role Management](#role-management)
- [Permission Management](#permission-management)
- [Implementation Notes](#implementation-notes)

## 🔍 Overview

The IDP Admin API provides comprehensive management capabilities for:
- **Client Applications** - OAuth clients, security settings, configuration
- **User Management** - User accounts, contact information, roles
- **Access Control** - Roles, permissions, and role-permission mappings
- **Audit & Monitoring** - Activity logs, statistics, audit trails

## 🔐 Authentication

All endpoints require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```

**Required Role:** `payez_admin`

## 🏢 Client Management

### Get All Clients
```http
GET /api/Admin/clients
```

**Response:** `IDPClientModel[]`

### Get Client by ID
```http
GET /api/Admin/clients/{id}
```

**Response:** `IDPClientModel`

### Create Client
```http
POST /api/Admin/clients
Content-Type: application/json

{
  "name": "my-app",
  "display_name": "My Application",
  "logo_url": "https://example.com/logo.png",
  "support_contact_email": "support@example.com",
  "allow_public_registration": false,
  "require_2fa": true,
  "allowed_grant_types": ["authorization_code", "refresh_token"],
  "allowed_redirect_uris": ["https://myapp.com/callback"],
  "token_lifetime_minutes": 60,
  "refresh_token_lifetime_minutes": 1440,
  "is_active": true
}
```

### Update Client
```http
PUT /api/Admin/clients/{id}
Content-Type: application/json

{
  // Same structure as Create Client
}
```

### Delete Client
```http
DELETE /api/Admin/clients/{id}
```

## 👥 Client Role Management

### Get Client Roles
```http
GET /api/Admin/clients/{clientId}/roles
```

### Create Client Role
```http
POST /api/Admin/clients/{clientId}/roles
Content-Type: application/json

{
  "name": "admin",
  "description": "Administrator role for this client",
  "permissions": ["read", "write", "delete"]
}
```

### Update Client Role
```http
PUT /api/Admin/clients/{clientId}/roles/{roleId}
```

### Delete Client Role
```http
DELETE /api/Admin/clients/{clientId}/roles/{roleId}
```

## 🔑 Client Permission Management

### Get Client Permissions
```http
GET /api/Admin/clients/{clientId}/permissions
```

### Create Client Permission
```http
POST /api/Admin/clients/{clientId}/permissions
Content-Type: application/json

{
  "name": "read_users",
  "description": "Permission to read user data",
  "resource": "users",
  "action": "read"
}
```

### Update Client Permission
```http
PUT /api/Admin/clients/{clientId}/permissions/{permissionId}
```

### Delete Client Permission
```http
DELETE /api/Admin/clients/{clientId}/permissions/{permissionId}
```

## 🔗 Client Role-Permission Mapping

### Get Role Permissions
```http
GET /api/Admin/clients/{clientId}/roles/{roleId}/permissions
```

### Assign Permission to Role
```http
POST /api/Admin/clients/{clientId}/roles/{roleId}/permissions
Content-Type: application/json

{
  "permission_id": "permission-uuid"
}
```

### Remove Permission from Role
```http
DELETE /api/Admin/clients/{clientId}/roles/{roleId}/permissions/{permissionId}
```

### Bulk Assign Permissions
```http
POST /api/Admin/clients/{clientId}/roles/{roleId}/permissions/bulk
Content-Type: application/json

{
  "permission_ids": ["permission-uuid-1", "permission-uuid-2"]
}
```

## 👤 Client User Management

### Get Client Users
```http
GET /api/Admin/clients/{clientId}/users
```

### Add User to Client
```http
POST /api/Admin/clients/{clientId}/users
Content-Type: application/json

{
  "user_id": "user-uuid",
  "roles": ["admin", "user"]
}
```

### Remove User from Client
```http
DELETE /api/Admin/clients/{clientId}/users/{userId}
```

### Get User Roles in Client
```http
GET /api/Admin/clients/{clientId}/users/{userId}/roles
```

### Assign Role to User
```http
POST /api/Admin/clients/{clientId}/users/{userId}/roles
Content-Type: application/json

{
  "role_id": "role-uuid"
}
```

### Remove Role from User
```http
DELETE /api/Admin/clients/{clientId}/users/{userId}/roles/{roleId}
```

## 📊 Client Activity & Audit

### Get Client Activity Logs
```http
GET /api/Admin/clients/{clientId}/activity
```

**Query Parameters:**
- `start_date` - ISO date string
- `end_date` - ISO date string
- `event_type` - Filter by event type
- `user_id` - Filter by user ID
- `limit` - Number of records to return (default: 100)
- `offset` - Number of records to skip (default: 0)

### Get Client Audit Trail
```http
GET /api/Admin/clients/{clientId}/audit
```

### Get Client Statistics
```http
GET /api/Admin/clients/{clientId}/stats
```

**Response:**
```json
{
  "total_users": 1250,
  "active_sessions": 89,
  "total_logins_today": 45,
  "failed_login_attempts": 3,
  "new_registrations": 12,
  "password_resets": 2
}
```

## 👥 User Management

### Get All Users
```http
GET /api/Admin/users
```

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by role
- `status` - Filter by status (active, inactive, suspended)
- `limit` - Number of records to return
- `offset` - Number of records to skip

### Get User by ID
```http
GET /api/Admin/users/{id}
```

### Create User
```http
POST /api/Admin/users
Content-Type: application/json

{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "roles": ["user"],
  "is_active": true
}
```

### Update User
```http
PUT /api/Admin/users/{id}
```

### Delete User
```http
DELETE /api/Admin/users/{id}
```

### Get User Contact Info
```http
GET /api/Admin/users/{id}/contact-info
```

### Update User Contact Info
```http
PUT /api/Admin/users/{id}/contact-info
Content-Type: application/json

{
  "email": "newemail@example.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "12345",
    "country": "US"
  }
}
```

## 🎭 Role Management

### Get All Roles
```http
GET /api/Admin/roles
```

### Get Role by ID
```http
GET /api/Admin/roles/{id}
```

### Create Role
```http
POST /api/Admin/roles
Content-Type: application/json

{
  "name": "admin",
  "description": "Administrator role with full access",
  "permissions": ["read", "write", "delete", "admin"]
}
```

### Update Role
```http
PUT /api/Admin/roles/{id}
```

### Delete Role
```http
DELETE /api/Admin/roles/{id}
```

## 🔐 Permission Management

### Get All Permissions
```http
GET /api/Admin/permissions
```

### Get Permission by ID
```http
GET /api/Admin/permissions/{id}
```

### Create Permission
```http
POST /api/Admin/permissions
Content-Type: application/json

{
  "name": "read_users",
  "description": "Permission to read user data",
  "resource": "users",
  "action": "read"
}
```

### Update Permission
```http
PUT /api/Admin/permissions/{id}
```

### Delete Permission
```http
DELETE /api/Admin/permissions/{id}
```

## 📝 Data Models

### IDPClientModel
```typescript
interface IDPClientModel {
  idp_client_id: number;
  name: string;
  display_name: string;
  logo_url: string;
  support_contact_email: string;
  allow_public_registration: boolean;
  allow_onboarding: boolean;
  require_2fa: boolean;
  allowed_grant_types: string[];
  allowed_redirect_uris: string[];
  token_lifetime_minutes: number;
  refresh_token_lifetime_minutes: number;
  enable_password_reset: boolean;
  enable_profile_edit: boolean;
  enable_helpdesk_chat: boolean;
  allowed_roles: string[];
  allowed_scopes: string[];
  allowed_origins: string[];
  is_active: boolean;
  notes: string;
}
```

### UserModel
```typescript
interface UserModel {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  roles: string[];
}
```

## 🛠️ Implementation Notes

### Error Handling
All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

### Pagination
List endpoints support pagination via `limit` and `offset` query parameters.

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

### Caching
- GET requests are cached for 5 minutes
- POST/PUT/DELETE requests invalidate related caches

### Logging
All API calls are logged with:
- User ID
- Timestamp
- Endpoint
- Request/Response size
- Processing time

## 🔧 Development Setup

### Environment Variables
```bash
IDP_BASE_URL=http://localhost:5000
IDP_CLIENT_ID=your-client-id
IDP_CLIENT_SECRET=your-client-secret
```

### Testing
Use the provided test endpoints for development:
- `/api/test/clear-session` - Clear test session
- `/api/test/health` - Health check

### Monitoring
Monitor API usage via:
- Application logs
- Metrics dashboard
- Alert notifications

## 📚 Additional Resources

- [IDP Documentation](https://idp.example.com/docs)
- [API Changelog](https://idp.example.com/changelog)
- [Support](mailto:support@example.com) 