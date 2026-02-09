/**
 * Admin Role Modals for @payez/next-mvp
 *
 * - RoleEditorModal: Create/edit roles with permissions
 * - UserRoleAssignerModal: Assign roles to users
 *
 * Security Addendum implemented:
 * - Role name validation (3-50 chars, lowercase alphanumeric + underscore, no payez_ prefix)
 * - Last admin warning
 * - IDP roles read-only
 * - Self-assignment warning
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
interface PagePermission {
    page_permission_id: number;
    route_pattern: string;
    display_name: string;
    requires_2fa: boolean;
}
interface Role {
    role_id?: number;
    role_name: string;
    display_name?: string;
    description?: string;
    page_permissions?: string[];
    requires_2fa?: boolean;
    is_system_role?: boolean;
}
interface User {
    user_id: number;
    email: string;
    full_name?: string;
    roles: {
        idp: string[];
        app: string[];
    };
}
/**
 * RoleEditorModal - Create or edit a role
 */
export declare function RoleEditorModal({ role, pagePermissions, adminAccessiblePages, onSave, onClose, isDark, }: {
    role?: Role;
    pagePermissions: PagePermission[];
    adminAccessiblePages?: string[];
    onSave: (data: {
        role_name: string;
        display_name?: string;
        description?: string;
        page_permissions: string[];
        requires_2fa: boolean;
    }) => Promise<void>;
    onClose: () => void;
    isDark?: boolean;
}): import("react/jsx-runtime").JSX.Element;
/**
 * UserRoleAssignerModal - Assign roles to a user
 */
export declare function UserRoleAssignerModal({ user, availableRoles, isLastAdmin, currentUserId, onSave, onClose, isDark, }: {
    user: User;
    availableRoles: {
        role_name: string;
        display_name?: string;
        description?: string;
    }[];
    isLastAdmin?: boolean;
    currentUserId?: number;
    onSave: (userId: number, appRoles: string[]) => Promise<void>;
    onClose: () => void;
    isDark?: boolean;
}): import("react/jsx-runtime").JSX.Element;
export {};
