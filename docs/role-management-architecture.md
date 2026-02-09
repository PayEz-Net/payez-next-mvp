# Role Management Architecture

## Overview

The PayEz system uses a **dual-role architecture** where roles come from two separate sources that are NOT automatically merged:

1. **IDP Roles** (core_identity) - Global authentication roles from the Identity Provider
2. **vibe_app Roles** - Client-specific application roles stored in the vibe_app schema

## Role Systems

### 1. IDP Roles (Identity Provider)

**Storage:** `core_identity.asp_net_roles` + `core_identity.asp_net_user_roles`

**Purpose:** Authentication-level permissions that travel with the user across all PayEz applications.

**Common IDP Roles:**
| Role | Purpose |
|------|---------|
| `payez_user` | Basic authenticated user |
| `payez_admin` | PayEz platform administrator |
| `merchant` | Merchant account holder |

**How they flow:**
```
User Login
    ↓
IDP validates credentials
    ↓
IDP fetches roles: UserManager.GetRolesAsync(user)
    ↓
Roles serialized into JWT: { "roles": ["payez_user", "payez_admin"] }
    ↓
NextAuth decodes JWT in callback
    ↓
Roles stored in Redis session: sessionData.roles
    ↓
Available in frontend: session.user.roles
```

### 2. vibe_app Roles (Application-Specific)

**Storage:** `vibe_app.roles` and `vibe_app.user_roles` (VibeDocument JSONB)

**Purpose:** Client-specific roles for fine-grained application permissions.

**Schema:**
```sql
-- Roles defined per client
vibe_app.roles (VibeDocument)
  - document_id
  - client_id
  - data: { name, description, permissions[], is_system_role }

-- User-role assignments
vibe_app.user_roles (VibeDocument)
  - document_id
  - client_id
  - user_id
  - data: { role_id, assigned_at }
```

**Example vibe_app Roles:**
| Role | Purpose |
|------|---------|
| `vibe_app_admin` | Site-specific administrator |
| `resume_editor` | Can edit resumes (IdealResume-specific) |
| `template_manager` | Can manage templates |

## Current Integration Status

### What IS Integrated

1. **IDP roles flow to frontend session:**
   ```typescript
   // In auth-options.ts callback
   const rolesArray = decoded.roles || decoded.role || [];
   sessionData.roles = rolesArray;
   ```

2. **JWT token roles merged with session roles:**
   ```typescript
   // In api-handler.ts lines 269-277
   let userRoles = sessionData.roles || [];
   const tokenRoles = token.roles || [];
   userRoles = Array.from(new Set([...userRoles, ...tokenRoles]));
   ```

3. **API endpoint protection:**
   ```typescript
   // Handlers can require specific roles
   createApiHandler({ requiredRoles: ['payez_admin'] })
   ```

### What IS NOT Integrated

**vibe_app roles are NOT merged into the session.** They exist as a separate data store.

- `session.user.roles` only contains IDP roles
- vibe_app roles must be fetched separately via `/api/admin/roles`
- No automatic role sync between IDP and vibe_app

## RBAC Enforcement

### Page-Level Protection

**Current State:** No role-based page protection exists.

The middleware (`create-middleware.ts`) only checks:
- Is the route public/protected?
- Is the user authenticated?
- Is 2FA complete?

**It does NOT check roles for page access.** Any authenticated user can access any page.

```typescript
// What middleware checks (simplified)
if (!isAuthenticated) redirect('/login');
if (requires2FA && !twoFactorComplete) redirect('/verify-code');
// NO role check here
return allow();
```

### API-Level Protection

**Current State:** Role checking exists for API endpoints.

```typescript
// api-handler.ts - Role check at line 194-199
if (this.config.requiredRoles.length > 0 && auth) {
  const hasRequiredRole = this.config.requiredRoles.some(
    role => auth.roles.includes(role)
  );
  if (!hasRequiredRole) {
    return 403 Forbidden;
  }
}
```

**Pre-configured Presets:**
```typescript
API_PRESETS.PUBLIC      // No auth required
API_PRESETS.AUTHENTICATED  // Any logged-in user
API_PRESETS.USER        // Requires payez_user or payez_admin
API_PRESETS.ADMIN       // Requires payez_admin
```

**Admin API Handlers** (in `api-handlers/admin/*`) check:
```typescript
const ADMIN_ROLES = ['vibe_app_admin', 'payez_admin'];
// Both IDP admin (payez_admin) and vibe_app admin work
```

## Default Role Assignment

### IDP Default Roles

Assigned during user registration in the IDP:

```csharp
// When user registers
await _userManager.AddToRoleAsync(user, "payez_user");
```

### vibe_app Default Roles

**Not automatically assigned.** Must be explicitly granted via:
- Admin UI role assignment
- API call to `/api/admin/users/assign-role`

## Role Utility Functions

### Frontend (authStore.ts)

```typescript
// Check single role
authStore.hasRole('payez_admin')  // boolean

// Check any of multiple roles
authStore.hasAnyRole(['payez_admin', 'vibe_app_admin'])  // boolean

// Check all roles required
authStore.hasAllRoles(['payez_user', 'verified'])  // boolean
```

### API Handler Context

```typescript
export const GET = createApiHandler({ requireAuth: true })
  .handle(async (req, ctx, auth) => {
    // auth.roles contains merged IDP + token roles
    if (auth.roles.includes('payez_admin')) {
      // admin-only logic
    }
  });
```

## Testing Role Integration

### In IdealResume

1. **View your IDP roles:**
   - Navigate to `/test-env/jwt-inspect`
   - Check "Session Information" > Roles
   - Expand "Custom Claims" to see raw JWT `role` claim

2. **Verify roles in session:**
   - Navigate to `/showcase`
   - RBAC card shows: `Roles: [your roles]`

3. **Test admin API access:**
   - Try accessing `/api/admin/users`
   - Without `payez_admin` or `vibe_app_admin`: 403 Forbidden
   - With admin role: 200 OK

## Known Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No page-level RBAC | Any authenticated user can view any page | Add role config to route-config.ts |
| vibe_app roles not in session | Can't use vibe_app roles in middleware | Fetch and merge during session creation |
| No role sync | Changing vibe_app roles requires re-login | Implement role refresh mechanism |

## Future Enhancements

### Proposed: Unified Role Model

```typescript
// Proposed session structure
session.user.roles = {
  idp: ['payez_user', 'payez_admin'],      // From JWT
  app: ['vibe_app_admin', 'resume_editor'], // From vibe_app
  combined: ['payez_user', 'payez_admin', 'vibe_app_admin', 'resume_editor']
};
```

### Proposed: Page-Level RBAC

```typescript
// In route-config.ts
const protectedRoutes = [
  { pattern: '/admin/*', requiredRoles: ['payez_admin', 'vibe_app_admin'] },
  { pattern: '/settings/billing', requiredRoles: ['billing_admin'] },
];
```

## Related Files

| File | Purpose |
|------|---------|
| `PayEz-Core/.../IdentityBearerTokenService.cs` | JWT generation with roles |
| `next-mvp/src/auth/auth-options.ts` | Session creation, role extraction |
| `next-mvp/src/lib/api-handler.ts` | API role enforcement |
| `next-mvp/src/middleware/create-middleware.ts` | Page protection (no roles) |
| `next-mvp/src/stores/authStore.ts` | Frontend role utilities |
| `next-mvp/src/api-handlers/admin/*` | Admin role checks |
