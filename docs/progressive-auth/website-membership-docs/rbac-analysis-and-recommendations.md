# RBAC (Role-Based Access Control) Analysis & Recommendations

## Current RBAC Implementation Review

### ✅ **Strengths: Well-Structured Foundation**

#### 1. **Multi-Layer Security Architecture**
- **Middleware-Level**: Route protection in `middleware.ts` (lines 318-326)
- **API-Level**: Handler-based protection in `api-handler.ts` (lines 316-330)
- **Component-Level**: Frontend protection via `RoleBasedAccessControl.tsx`
- **Auth Guard**: Centralized API protection in `authGuard.ts`

#### 2. **Clear Role Definitions**
```typescript
// Current roles in use:
- 'payez_admin'     // System administrators
- 'merchant'        // Merchant users
- 'user'            // Basic users
```

#### 3. **Consistent API Protection**
```typescript
// API_CONFIGS in api-handler.ts provides pre-configured security levels:
API_CONFIGS = {
  PUBLIC: { requireAuth: false },
  AUTHENTICATED: { requireAuth: true },
  ADMIN: { requireAuth: true, requiredRoles: ['payez_admin'] },
  MERCHANT: { requireAuth: true, requiredRoles: ['merchant', 'payez_admin'] }
}
```

#### 4. **Automatic Middleware Application**
- `createHandlerWithMiddleware.admin()` automatically applies admin protection
- Route-based middleware detection in `enhanced-api-handler.ts`
- Comprehensive security headers and circuit breaker integration

#### 5. **Type Safety**
- Strong TypeScript interfaces in `types/security.ts` and `types/auth.d.ts`
- Proper type guards and validation functions

### ⚠️ **Areas for Improvement**

#### 1. **Limited Role Granularity**
**Current State**: Simple role strings
```typescript
// Current: Basic role checking
roles: ['payez_admin', 'merchant', 'user']
```

**Recommendation**: Implement hierarchical roles with permissions
```typescript
// Proposed: Permission-based system
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  inherits?: string[]; // Role inheritance
}

interface Permission {
  resource: string;    // 'users', 'clients', 'reports'
  actions: string[];   // 'create', 'read', 'update', 'delete'
  conditions?: object; // Field-level or record-level conditions
}
```

#### 2. **Static Route-to-Role Mapping**
**Current State**: Hard-coded in `routeRoles.ts`
```typescript
export const routeRoles: { [pattern: string]: string[] } = {
  '/dashboards/idp-admin': ['payez_admin'],
  '/dashboards/merchant': ['merchant'],
}
```

**Issues**:
- Difficult to maintain as routes grow
- No support for dynamic permissions
- Limited to route-level protection

#### 3. **No Resource-Level Permissions**
**Current Gap**: Cannot restrict access to specific resources
```typescript
// Cannot handle: "User can manage only their own merchant's data"
// Cannot handle: "Admin can view but not modify system settings"
```

#### 4. **Missing Audit Trail for Permission Changes**
**Current State**: Basic audit logging exists but lacks RBAC-specific tracking
**Missing**: Who changed what permissions when, and why

#### 5. **No Dynamic Role Assignment**
**Current State**: Roles are assigned at login and remain static
**Missing**: Runtime role updates, temporary permissions, delegation

## 🎯 **Recommendations for Future Development**

### 1. **Implement Permission-Based RBAC**

#### A. Create Permission System
```typescript
// src/types/rbac.ts
export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: {
    field?: string;
    operator?: 'eq' | 'in' | 'contains';
    value?: any;
  }[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[];
  isSystemRole: boolean;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  conditions?: object;
}
```

#### B. Update Role Checking Logic
```typescript
// src/lib/rbac.ts
export class RBACManager {
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: object
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const permissions = await this.getPermissionsForRoles(userRoles);
    
    return permissions.some(permission =>
      permission.resource === resource &&
      permission.action === action &&
      this.checkConditions(permission.conditions, context)
    );
  }
}
```

### 2. **Implement Resource-Level Protection**

#### A. Enhanced API Handler
```typescript
// src/lib/enhanced-auth-guard.ts
export function withResourceGuard<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    resource: string;
    action: string;
    getResourceId?: (req: NextRequest) => string;
  }
) {
  return async (request: NextRequest, ...args: T) => {
    const session = await getServerSession(authOptions);
    const resourceId = options.getResourceId?.(request);
    
    const hasPermission = await rbacManager.checkPermission(
      session.user.id,
      options.resource,
      options.action,
      { resourceId }
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    return handler(request, ...args);
  };
}
```

#### B. Usage Example
```typescript
// src/app/api/admin/users/[id]/route.ts
export const GET = withResourceGuard(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    // Handler logic
  },
  {
    resource: 'users',
    action: 'read',
    getResourceId: (req) => req.nextUrl.pathname.split('/')[4]
  }
);
```

### 3. **Dynamic Role Management System**

#### A. Role Assignment API
```typescript
// src/app/api/admin/roles/assign/route.ts
export const POST = withAdminGuard(async (req: NextRequest) => {
  const { userId, roleId, expiresAt, reason } = await req.json();
  
  await rbacManager.assignRole(userId, roleId, {
    assignedBy: session.user.id,
    expiresAt,
    reason
  });
  
  // Audit logging
  await auditLogger.logRoleAssignment(userId, roleId, session.user.id, reason);
});
```

#### B. Role Hierarchy Support
```typescript
// src/config/roles.ts
export const ROLE_HIERARCHY = {
  super_admin: {
    inherits: ['admin', 'merchant', 'user'],
    permissions: ['*']
  },
  admin: {
    inherits: ['merchant', 'user'],
    permissions: ['users:*', 'clients:*', 'reports:read']
  },
  merchant: {
    inherits: ['user'],
    permissions: ['merchant:*', 'transactions:read']
  },
  user: {
    permissions: ['profile:read', 'profile:update']
  }
};
```

### 4. **Enhanced Frontend Components**

#### A. Permission-Aware Components
```typescript
// src/components/rbac/PermissionGate.tsx
interface PermissionGateProps {
  resource: string;
  action: string;
  resourceId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  resourceId,
  fallback = null,
  children
}) => {
  const { checkPermission } = useRBAC();
  const hasPermission = checkPermission(resource, action, resourceId);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
```

#### B. Usage Example
```typescript
// Usage in components
<PermissionGate resource="users" action="delete">
  <Button onClick={handleDelete}>Delete User</Button>
</PermissionGate>

<PermissionGate resource="reports" action="export">
  <ExportButton />
</PermissionGate>
```

### 5. **Comprehensive Audit System**

#### A. RBAC Audit Events
```typescript
// src/types/audit.ts
export enum RBACEventType {
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CREATED = 'role_created',
  ROLE_UPDATED = 'role_updated',
  ROLE_DELETED = 'role_deleted'
}

export interface RBACEvent {
  eventType: RBACEventType;
  userId: string;
  adminId: string;
  roleId?: string;
  resource?: string;
  action?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}
```

### 6. **Configuration Management**

#### A. Role Configuration Files
```typescript
// config/rbac/roles.json
{
  "roles": [
    {
      "id": "super_admin",
      "name": "Super Administrator",
      "description": "Full system access",
      "permissions": ["*:*"],
      "isSystemRole": true
    },
    {
      "id": "merchant_admin",
      "name": "Merchant Administrator",
      "description": "Manage merchant-specific resources",
      "permissions": [
        "merchant:read",
        "merchant:update",
        "transactions:read",
        "users:read:merchant"
      ],
      "conditions": {
        "merchantId": "{{user.merchantId}}"
      }
    }
  ]
}
```

#### B. Permission Registry
```typescript
// src/config/permissions.ts
export const PERMISSIONS = {
  USERS: {
    CREATE: 'users:create',
    READ: 'users:read',
    UPDATE: 'users:update',
    DELETE: 'users:delete'
  },
  CLIENTS: {
    CREATE: 'clients:create',
    READ: 'clients:read',
    UPDATE: 'clients:update',
    DELETE: 'clients:delete'
  },
  REPORTS: {
    READ: 'reports:read',
    EXPORT: 'reports:export'
  }
} as const;
```

## 🚀 **Implementation Roadmap**

### Phase 1: Foundation (2-3 weeks)
1. ✅ **Current**: Basic role checking is working
2. 🔄 **Next**: Create permission-based types and interfaces
3. 🔄 **Next**: Implement RBACManager class with permission checking
4. 🔄 **Next**: Add resource-level protection to critical endpoints

### Phase 2: Dynamic Management (2-3 weeks)
1. Create role management API endpoints
2. Implement role assignment/revocation system
3. Add audit logging for RBAC events
4. Create admin UI for role management

### Phase 3: Advanced Features (3-4 weeks)
1. Implement role hierarchy and inheritance
2. Add conditional permissions
3. Create permission-aware frontend components
4. Implement temporary permissions and delegation

### Phase 4: Optimization (1-2 weeks)
1. Add caching for permission checks
2. Implement permission preloading
3. Add monitoring and metrics
4. Performance optimization

## 🎯 **Immediate Actions**

1. **Keep Current System**: It's working well for basic needs
2. **Add Permission Constants**: Create `src/config/permissions.ts`
3. **Enhance Audit Logging**: Add RBAC-specific events
4. **Create Resource Guards**: Implement `withResourceGuard` for critical APIs
5. **Add Permission Components**: Create `PermissionGate` component

## Summary

The current RBAC implementation is **solid for current needs** but **needs enhancement for scalability**. The foundation is well-structured with good type safety and multi-layer protection. The main areas for improvement are:

1. **Granular permissions** instead of just roles
2. **Resource-level protection** for fine-grained access control
3. **Dynamic role management** for operational flexibility
4. **Comprehensive audit trails** for compliance

The recommended approach is **evolutionary enhancement** rather than replacement, building on the strong foundation already in place.
