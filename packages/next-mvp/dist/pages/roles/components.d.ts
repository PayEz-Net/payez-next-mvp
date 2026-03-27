/**
 * Shared Role Components for @payez/next-mvp
 *
 * Components for displaying roles and permissions:
 * - RoleBadge: Small badge showing role name and source
 * - RoleCard: Expandable card showing role details and permissions
 * - PermissionsList: Grouped list of permissions
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
export interface Permission {
    type: 'page' | 'feature';
    pattern?: string;
    name?: string;
    display: string;
}
export interface Role {
    role_name: string;
    display_name?: string;
    description?: string;
    assigned_at?: string;
    status?: 'active' | 'pending' | 'expired';
    permissions?: Permission[];
    user_count?: number;
    permission_count?: number;
    is_system_role?: boolean;
}
export type RoleSource = 'idp' | 'app';
/**
 * RoleBadge - Small badge showing role name and source
 */
export declare function RoleBadge({ roleName, source, size, isDark, }: {
    roleName: string;
    source: RoleSource;
    size?: 'sm' | 'md';
    isDark?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * PermissionsList - Grouped list of permissions
 */
export declare function PermissionsList({ permissions, grouped, isDark, }: {
    permissions: Permission[];
    grouped?: boolean;
    isDark?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * RoleCard - Expandable card showing role details and permissions
 */
export declare function RoleCard({ role, source, showPermissions, defaultExpanded, isDark, }: {
    role: Role;
    source: RoleSource;
    showPermissions?: boolean;
    defaultExpanded?: boolean;
    isDark?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * RoleSourceHeader - Section header for role groups
 */
export declare function RoleSourceHeader({ source, count, isDark, }: {
    source: RoleSource;
    count?: number;
    isDark?: boolean;
}): import("react/jsx-runtime").JSX.Element;
