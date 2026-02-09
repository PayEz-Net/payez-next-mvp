# Roles Management Specification

**Version:** 1.0
**Date:** 2026-01-09
**Status:** Draft
**Authors:** BAPert, NextPert (UX input)

---

## Overview

Dedicated roles management pages replacing the minimal RBAC card in ShowcasePage.

**Two Pages:**
1. `/account/roles` - User views their own roles (read-only)
2. `/admin/roles` - Admin manages roles, assignments, permissions

**Integrates with:**
- Vibe Page RBAC system (`vibe.page_permissions`, `vibe.page_role_requirements`)
- IDP roles (`core_identity.asp_net_user_roles`)
- Vibe app roles (`vibe_app.user_roles`)

---

## Page 1: My Roles (`/account/roles`)

### Purpose
Let users see what roles they have and what those roles grant access to.

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MY ROLES                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  You have 4 roles across 2 sources.                                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  IDENTITY ROLES (from PayEz IDP)                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [User Icon]  payez_user                              ● Active   │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Basic authenticated user access                                 │   │
│  │  Assigned: January 15, 2024                                     │   │
│  │                                                                  │   │
│  │  [v] View Permissions                                           │   │
│  │      ├─ Access to /profile                                      │   │
│  │      ├─ Access to /settings                                     │   │
│  │      └─ Access to /dashboard                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Shield Icon]  payez_admin                           ● Active   │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Platform administrator with full access                         │   │
│  │  Assigned: January 15, 2024                                     │   │
│  │                                                                  │   │
│  │  [>] View Permissions                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  APPLICATION ROLES (from IdealVibe)                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Star Icon]  vibe_app_admin                          ● Active   │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Site administrator for this application                         │   │
│  │  Assigned: March 10, 2024                                       │   │
│  │                                                                  │   │
│  │  [>] View Permissions                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  [Edit Icon]  content_editor                          ● Active   │   │
│  │  ─────────────────────────────────────────────────────────────  │   │
│  │  Can create and edit content                                     │   │
│  │  Assigned: June 5, 2025                                         │   │
│  │                                                                  │   │
│  │  [>] View Permissions                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────      │
│  Need additional access? Contact your administrator.                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### User Roles API

#### GET /api/Account/my-roles

Returns current user's roles from all sources.

**Response:**
```json
{
  "summary": {
    "total_roles": 4,
    "sources": ["idp", "vibe_app"]
  },
  "idp_roles": [
    {
      "role_name": "payez_user",
      "display_name": "PayEz User",
      "description": "Basic authenticated user access",
      "assigned_at": "2024-01-15T10:30:00Z",
      "status": "active",
      "permissions": [
        { "type": "page", "pattern": "/profile", "display": "Access to /profile" },
        { "type": "page", "pattern": "/settings", "display": "Access to /settings" },
        { "type": "page", "pattern": "/dashboard", "display": "Access to /dashboard" }
      ]
    },
    {
      "role_name": "payez_admin",
      "display_name": "PayEz Admin",
      "description": "Platform administrator with full access",
      "assigned_at": "2024-01-15T10:30:00Z",
      "status": "active",
      "permissions": [
        { "type": "page", "pattern": "/admin/*", "display": "Access to all admin pages" },
        { "type": "feature", "name": "user_management", "display": "Manage users" }
      ]
    }
  ],
  "app_roles": [
    {
      "role_name": "vibe_app_admin",
      "display_name": "Site Admin",
      "description": "Site administrator for this application",
      "assigned_at": "2024-03-10T14:00:00Z",
      "status": "active",
      "permissions": [
        { "type": "page", "pattern": "/admin/*", "display": "Access to admin section" }
      ]
    },
    {
      "role_name": "content_editor",
      "display_name": "Content Editor",
      "description": "Can create and edit content",
      "assigned_at": "2025-06-05T09:00:00Z",
      "status": "active",
      "permissions": [
        { "type": "page", "pattern": "/content/*", "display": "Access to content pages" },
        { "type": "feature", "name": "edit_content", "display": "Edit content" }
      ]
    }
  ]
}
```

---

## Page 2: Roles Admin (`/admin/roles`)

### Purpose
Admin interface for managing roles, user assignments, and page permissions.

### Access Control
- Requires `payez_admin` OR `vibe_app_admin` role
- Admin-only navigation item

### UI Layout - Three Tabs

#### Tab 1: Roles

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ROLES MANAGEMENT                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  [Roles]  [Users]  [Permissions Matrix]                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────┐                                │
│  │ [Search roles...]           [+ Add Role]                             │
│  └─────────────────────────────────────┘                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Role Name        │ Users │ Permissions │ Source    │ Actions    │   │
│  ├──────────────────┼───────┼─────────────┼───────────┼────────────┤   │
│  │ vibe_app_admin   │ 3     │ 12          │ App       │ [Edit][Del]│   │
│  │ content_editor   │ 8     │ 5           │ App       │ [Edit][Del]│   │
│  │ viewer           │ 45    │ 3           │ App       │ [Edit][Del]│   │
│  │ payez_user       │ 156   │ 8           │ IDP (RO)  │ [View]     │   │
│  │ payez_admin      │ 2     │ All         │ IDP (RO)  │ [View]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Showing 5 of 5 roles                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Tab 2: Users

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ROLES MANAGEMENT                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  [Roles]  [Users]  [Permissions Matrix]                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────┐                                │
│  │ [Search users...]          [Filter by Role v]                        │
│  └─────────────────────────────────────┘                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ User              │ Email                │ Roles        │ Actions│   │
│  ├───────────────────┼──────────────────────┼──────────────┼────────┤   │
│  │ John Doe          │ john@example.com     │ admin, editor│ [Edit] │   │
│  │ Jane Smith        │ jane@example.com     │ editor       │ [Edit] │   │
│  │ Bob Wilson        │ bob@example.com      │ viewer       │ [Edit] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [< Prev]  Page 1 of 12  [Next >]                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Tab 3: Permissions Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ROLES MANAGEMENT                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  [Roles]  [Users]  [Permissions Matrix]                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Page Permissions by Role                                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Route             │ admin │ editor │ viewer │ Required │        │   │
│  ├───────────────────┼───────┼────────┼────────┼──────────┼────────┤   │
│  │ /admin/*          │  [✓]  │  [ ]   │  [ ]   │ 2FA      │ [Edit] │   │
│  │ /admin/users      │  [✓]  │  [ ]   │  [ ]   │ 2FA      │ [Edit] │   │
│  │ /content/*        │  [✓]  │  [✓]   │  [ ]   │          │ [Edit] │   │
│  │ /content/edit     │  [✓]  │  [✓]   │  [ ]   │          │ [Edit] │   │
│  │ /reports/*        │  [✓]  │  [✓]   │  [✓]   │          │ [Edit] │   │
│  │ /dashboard        │  [✓]  │  [✓]   │  [✓]   │          │ [Edit] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Legend: [✓] = Access granted                                           │
│                                                                          │
│                                              [+ Add Page Permission]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Role Editor Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Edit Role: content_editor                                         [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Role Name *                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ content_editor                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Display Name                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Content Editor                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Description                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Can create and edit content across the site                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  PAGE PERMISSIONS                                                       │
│  ─────────────────────────────────────────────────────────────────      │
│  ☑ /content/*         - Content section                                │
│  ☑ /content/edit      - Edit content                                   │
│  ☐ /admin/*           - Admin section                                  │
│  ☐ /admin/users       - User management                                │
│  ☑ /reports/*         - Reports section                                │
│  ☑ /dashboard         - Dashboard                                      │
│                                                                          │
│  SECURITY OPTIONS                                                       │
│  ─────────────────────────────────────────────────────────────────      │
│  ☐ Requires 2FA for all pages                                          │
│  ☐ Is system role (cannot be deleted)                                  │
│                                                                          │
│                                              [Cancel]  [Save Changes]   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### User Role Assignment Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Edit Roles: John Doe (john@example.com)                           [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  IDP ROLES (read-only)                                                  │
│  ─────────────────────────────────────────────────────────────────      │
│  • payez_user (assigned by IDP)                                        │
│  • payez_admin (assigned by IDP)                                       │
│                                                                          │
│  APPLICATION ROLES                                                      │
│  ─────────────────────────────────────────────────────────────────      │
│  ☑ vibe_app_admin     - Site administrator                             │
│  ☑ content_editor     - Can create and edit content                    │
│  ☐ viewer             - Read-only access                               │
│  ☐ billing_admin      - Manage billing                                 │
│                                                                          │
│  ADD CUSTOM ROLE                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [Select or type role name...]                              [Add] │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                                              [Cancel]  [Save Changes]   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Roles CRUD (Vibe API)

#### GET /api/v1/admin/roles

List all roles for client.

**Response:**
```json
{
  "roles": [
    {
      "role_id": 1,
      "role_name": "vibe_app_admin",
      "display_name": "Site Admin",
      "description": "Site administrator",
      "source": "app",
      "user_count": 3,
      "permission_count": 12,
      "is_system_role": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "idp_roles": [
    {
      "role_name": "payez_admin",
      "display_name": "PayEz Admin",
      "source": "idp",
      "user_count": 2,
      "editable": false
    }
  ]
}
```

#### POST /api/v1/admin/roles

Create new app role.

**Request:**
```json
{
  "role_name": "content_editor",
  "display_name": "Content Editor",
  "description": "Can create and edit content",
  "page_permissions": ["/content/*", "/dashboard"],
  "requires_2fa": false
}
```

#### PUT /api/v1/admin/roles/{roleId}

Update app role.

#### DELETE /api/v1/admin/roles/{roleId}

Delete app role (fails if users assigned).

### User Role Assignments (Vibe API)

#### GET /api/v1/admin/users?search=&role=&page=&limit=

List users with role info.

**Response:**
```json
{
  "users": [
    {
      "user_id": 123,
      "email": "john@example.com",
      "full_name": "John Doe",
      "roles": {
        "idp": ["payez_user", "payez_admin"],
        "app": ["vibe_app_admin", "content_editor"]
      },
      "last_active": "2026-01-09T16:00:00Z"
    }
  ],
  "total_count": 156,
  "page": 1,
  "limit": 20
}
```

#### GET /api/v1/admin/users/{userId}/roles

Get user's roles.

#### PUT /api/v1/admin/users/{userId}/roles

Update user's app roles (bulk replace).

**Request:**
```json
{
  "app_roles": ["vibe_app_admin", "content_editor"]
}
```

#### POST /api/v1/admin/users/{userId}/roles/{roleName}

Add single role to user.

#### DELETE /api/v1/admin/users/{userId}/roles/{roleName}

Remove single role from user.

### Permissions Matrix (Vibe API)

#### GET /api/v1/admin/permissions-matrix

Get page permissions by role.

**Response:**
```json
{
  "roles": ["vibe_app_admin", "content_editor", "viewer"],
  "pages": [
    {
      "page_permission_id": 1,
      "route_pattern": "/admin/*",
      "display_name": "Admin Section",
      "requires_2fa": true,
      "role_access": {
        "vibe_app_admin": true,
        "content_editor": false,
        "viewer": false
      }
    },
    {
      "page_permission_id": 2,
      "route_pattern": "/content/*",
      "display_name": "Content Section",
      "requires_2fa": false,
      "role_access": {
        "vibe_app_admin": true,
        "content_editor": true,
        "viewer": false
      }
    }
  ]
}
```

#### PUT /api/v1/admin/permissions-matrix

Bulk update role-page assignments.

**Request:**
```json
{
  "updates": [
    { "page_permission_id": 1, "role_name": "content_editor", "has_access": true },
    { "page_permission_id": 2, "role_name": "viewer", "has_access": true }
  ]
}
```

---

## Frontend Components

### Shared Components

```typescript
// RoleCard - displays a single role with expandable permissions
interface RoleCardProps {
  role: Role;
  source: 'idp' | 'app';
  showPermissions?: boolean;
  onExpand?: () => void;
}

// RoleBadge - small badge showing role name
interface RoleBadgeProps {
  roleName: string;
  source: 'idp' | 'app';
  size?: 'sm' | 'md';
}

// PermissionsList - expandable list of permissions
interface PermissionsListProps {
  permissions: Permission[];
  grouped?: boolean;
}
```

### Admin Components

```typescript
// RolesTable - data table for roles list
interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

// UsersTable - data table for users with role filters
interface UsersTableProps {
  users: User[];
  roles: Role[];  // for filter dropdown
  onEditRoles: (user: User) => void;
}

// RoleEditorModal - create/edit role form
interface RoleEditorModalProps {
  role?: Role;  // undefined for create
  pagePermissions: PagePermission[];
  onSave: (role: RoleFormData) => void;
  onClose: () => void;
}

// UserRoleAssignerModal - assign roles to user
interface UserRoleAssignerModalProps {
  user: User;
  availableRoles: Role[];
  onSave: (userId: number, roles: string[]) => void;
  onClose: () => void;
}

// PermissionsMatrix - visual grid of roles vs pages
interface PermissionsMatrixProps {
  data: MatrixData;
  onToggle: (pageId: number, roleName: string, value: boolean) => void;
}
```

---

## Navigation Integration

### Account Navigation (add to existing)

```
/profile          - Profile page
/security         - Security settings
/settings         - Preferences
/account/roles    - My roles (NEW)
```

### Admin Navigation (new section)

```
/admin
  /admin/roles    - Role management (NEW)
  /admin/users    - User management (existing?)
  /admin/vibe     - Vibe data browser (existing)
```

### ShowcasePage Update

Remove or update the RBAC card:
```typescript
// Option A: Remove entirely
// Option B: Link to /account/roles
<FeatureCard
  title="My Roles"
  description="View your assigned roles and permissions"
  status="available"
  link="/account/roles"
>
  <div>Roles: {session.user.roles.join(', ')}</div>
</FeatureCard>
```

---

## Implementation Priority

### Phase 1: User View (High Priority)
1. GET /api/Account/my-roles endpoint (IDP)
2. MyRolesPage component
3. RoleCard, PermissionsList components
4. Navigation integration

### Phase 2: Admin Roles Tab
5. GET/POST/PUT/DELETE /api/v1/admin/roles (Vibe)
6. RolesTable component
7. RoleEditorModal component

### Phase 3: Admin Users Tab
8. GET /api/v1/admin/users with roles
9. PUT /api/v1/admin/users/{id}/roles
10. UsersTable component
11. UserRoleAssignerModal component

### Phase 4: Permissions Matrix
12. GET/PUT /api/v1/admin/permissions-matrix
13. PermissionsMatrix component

---

## Security Requirements

1. **Admin endpoints require admin role** (`payez_admin` OR `vibe_app_admin`)
2. **Client isolation** - admins only see/manage roles for their client
3. **IDP roles are read-only** - cannot modify via Vibe API
4. **Audit logging** - all role changes logged with who/when/what
5. **Cannot delete roles with assigned users** - must unassign first
6. **System roles cannot be deleted** - `vibe_app_admin` protected

---

## Acceptance Criteria

### User View
- [ ] User can see all their roles (IDP + app)
- [ ] Roles grouped by source
- [ ] Permissions expandable per role
- [ ] Shows assigned date
- [ ] Read-only (no self-assignment)

### Admin - Roles Tab
- [ ] Admin can list all roles
- [ ] Admin can create new app roles
- [ ] Admin can edit app role (name, description, permissions)
- [ ] Admin can delete app role (if no users)
- [ ] IDP roles shown but not editable
- [ ] User count shown per role

### Admin - Users Tab
- [ ] Admin can search users
- [ ] Admin can filter by role
- [ ] Admin can view user's roles
- [ ] Admin can add/remove app roles from user
- [ ] Cannot modify IDP roles

### Admin - Matrix Tab
- [ ] Visual grid of roles vs pages
- [ ] Can toggle access per cell
- [ ] Shows 2FA requirements
- [ ] Bulk save changes

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-09 | BAPert | Initial spec with NextPert UX input |
