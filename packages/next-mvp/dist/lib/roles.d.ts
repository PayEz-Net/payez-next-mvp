/**
 * Vibe Role Constants and Utilities
 *
 * Centralized role definitions for consistent authorization across the stack.
 *
 * @version 1.0
 */
/**
 * Global platform roles (IDP-level)
 * These roles are managed at the IDP and grant cross-client access.
 */
export declare const GlobalRoles: {
    /** Platform super admin - full access to everything */
    readonly PAYEZ_ADMIN: "payez_admin";
    /** IDP client admin - manages IDP client configuration */
    readonly IDP_CLIENT_ADMIN: "idp_client_admin";
    /** Vibe platform admin - manages Vibe infrastructure globally */
    readonly VIBE_APP_ADMIN: "vibe_app_admin";
    /** Vibe client admin - manages Vibe for a specific tenant */
    readonly VIBE_CLIENT_ADMIN: "vibe_client_admin";
    /** Vibe agents user - AI agents operating via CLI/automation */
    readonly VIBE_AGENTS_USER: "vibe_agents_user";
};
/**
 * Application-level roles (per-client)
 * These roles are scoped to a specific client/tenant.
 */
export declare const AppRoles: {
    /** Standard authenticated user */
    readonly VIBE_APP_USER: "vibe_app_user";
};
/**
 * All Vibe roles combined
 */
export declare const VibeRoles: {
    /** Standard authenticated user */
    readonly VIBE_APP_USER: "vibe_app_user";
    /** Platform super admin - full access to everything */
    readonly PAYEZ_ADMIN: "payez_admin";
    /** IDP client admin - manages IDP client configuration */
    readonly IDP_CLIENT_ADMIN: "idp_client_admin";
    /** Vibe platform admin - manages Vibe infrastructure globally */
    readonly VIBE_APP_ADMIN: "vibe_app_admin";
    /** Vibe client admin - manages Vibe for a specific tenant */
    readonly VIBE_CLIENT_ADMIN: "vibe_client_admin";
    /** Vibe agents user - AI agents operating via CLI/automation */
    readonly VIBE_AGENTS_USER: "vibe_agents_user";
};
/**
 * Roles that grant admin access to the /admin section.
 * Any of these roles allows access to admin pages.
 */
export declare const ADMIN_ROLES: readonly string[];
/**
 * Roles that grant platform-wide admin access (not client-scoped).
 * These can access/modify any client's data.
 */
export declare const PLATFORM_ADMIN_ROLES: readonly string[];
/**
 * Roles that grant client-scoped admin access.
 * These can only access their own client's data.
 */
export declare const CLIENT_ADMIN_ROLES: readonly string[];
/**
 * Check if user has a specific role
 */
export declare function hasRole(userRoles: string[] | undefined, role: string): boolean;
/**
 * Check if user has any of the specified roles
 */
export declare function hasAnyRole(userRoles: string[] | undefined, roles: readonly string[]): boolean;
/**
 * Check if user has all of the specified roles
 */
export declare function hasAllRoles(userRoles: string[] | undefined, roles: readonly string[]): boolean;
/**
 * Check if user has admin access (any admin role)
 */
export declare function isAdmin(userRoles: string[] | undefined): boolean;
/**
 * Check if user has platform-wide admin access
 */
export declare function isPlatformAdmin(userRoles: string[] | undefined): boolean;
/**
 * Check if user is a client-scoped admin (not platform admin)
 */
export declare function isClientAdmin(userRoles: string[] | undefined): boolean;
/**
 * Role hierarchy (higher index = more access)
 *
 * payez_admin (4) - IDP super admin, can do anything
 * vibe_app_admin (3) - Platform admin, manages Vibe globally
 * vibe_client_admin (2) - Client admin, manages their own tenant
 * idp_client_admin (2) - IDP client admin, manages IDP config
 * vibe_app_user (1) - Regular authenticated user
 * (anonymous) (0) - No authentication
 */
export declare const ROLE_HIERARCHY: Record<string, number>;
/**
 * Get the highest role level for a user
 */
export declare function getHighestRoleLevel(userRoles: string[] | undefined): number;
declare const _default: {
    VibeRoles: {
        /** Standard authenticated user */
        readonly VIBE_APP_USER: "vibe_app_user";
        /** Platform super admin - full access to everything */
        readonly PAYEZ_ADMIN: "payez_admin";
        /** IDP client admin - manages IDP client configuration */
        readonly IDP_CLIENT_ADMIN: "idp_client_admin";
        /** Vibe platform admin - manages Vibe infrastructure globally */
        readonly VIBE_APP_ADMIN: "vibe_app_admin";
        /** Vibe client admin - manages Vibe for a specific tenant */
        readonly VIBE_CLIENT_ADMIN: "vibe_client_admin";
        /** Vibe agents user - AI agents operating via CLI/automation */
        readonly VIBE_AGENTS_USER: "vibe_agents_user";
    };
    GlobalRoles: {
        /** Platform super admin - full access to everything */
        readonly PAYEZ_ADMIN: "payez_admin";
        /** IDP client admin - manages IDP client configuration */
        readonly IDP_CLIENT_ADMIN: "idp_client_admin";
        /** Vibe platform admin - manages Vibe infrastructure globally */
        readonly VIBE_APP_ADMIN: "vibe_app_admin";
        /** Vibe client admin - manages Vibe for a specific tenant */
        readonly VIBE_CLIENT_ADMIN: "vibe_client_admin";
        /** Vibe agents user - AI agents operating via CLI/automation */
        readonly VIBE_AGENTS_USER: "vibe_agents_user";
    };
    AppRoles: {
        /** Standard authenticated user */
        readonly VIBE_APP_USER: "vibe_app_user";
    };
    ADMIN_ROLES: readonly string[];
    PLATFORM_ADMIN_ROLES: readonly string[];
    CLIENT_ADMIN_ROLES: readonly string[];
    hasRole: typeof hasRole;
    hasAnyRole: typeof hasAnyRole;
    hasAllRoles: typeof hasAllRoles;
    isAdmin: typeof isAdmin;
    isPlatformAdmin: typeof isPlatformAdmin;
    isClientAdmin: typeof isClientAdmin;
    getHighestRoleLevel: typeof getHighestRoleLevel;
};
export default _default;
