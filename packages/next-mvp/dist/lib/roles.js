"use strict";
/**
 * Vibe Role Constants and Utilities
 *
 * Centralized role definitions for consistent authorization across the stack.
 *
 * @version 1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.CLIENT_ADMIN_ROLES = exports.PLATFORM_ADMIN_ROLES = exports.ADMIN_ROLES = exports.VibeRoles = exports.AppRoles = exports.GlobalRoles = void 0;
exports.hasRole = hasRole;
exports.hasAnyRole = hasAnyRole;
exports.hasAllRoles = hasAllRoles;
exports.isAdmin = isAdmin;
exports.isPlatformAdmin = isPlatformAdmin;
exports.isClientAdmin = isClientAdmin;
exports.getHighestRoleLevel = getHighestRoleLevel;
// =============================================================================
// Role Constants
// =============================================================================
/**
 * Global platform roles (IDP-level)
 * These roles are managed at the IDP and grant cross-client access.
 */
exports.GlobalRoles = {
    /** Platform super admin - full access to everything */
    PAYEZ_ADMIN: 'payez_admin',
    /** IDP client admin - manages IDP client configuration */
    IDP_CLIENT_ADMIN: 'idp_client_admin',
    /** Vibe platform admin - manages Vibe infrastructure globally */
    VIBE_APP_ADMIN: 'vibe_app_admin',
    /** Vibe client admin - manages Vibe for a specific tenant */
    VIBE_CLIENT_ADMIN: 'vibe_client_admin',
    /** Vibe agents user - AI agents operating via CLI/automation */
    VIBE_AGENTS_USER: 'vibe_agents_user',
};
/**
 * Application-level roles (per-client)
 * These roles are scoped to a specific client/tenant.
 */
exports.AppRoles = {
    /** Standard authenticated user */
    VIBE_APP_USER: 'vibe_app_user',
};
/**
 * All Vibe roles combined
 */
exports.VibeRoles = {
    ...exports.GlobalRoles,
    ...exports.AppRoles,
};
// =============================================================================
// Role Groups
// =============================================================================
/**
 * Roles that grant admin access to the /admin section.
 * Any of these roles allows access to admin pages.
 */
exports.ADMIN_ROLES = [
    exports.GlobalRoles.PAYEZ_ADMIN,
    exports.GlobalRoles.VIBE_APP_ADMIN,
    exports.GlobalRoles.VIBE_CLIENT_ADMIN,
    exports.GlobalRoles.IDP_CLIENT_ADMIN,
];
/**
 * Roles that grant platform-wide admin access (not client-scoped).
 * These can access/modify any client's data.
 */
exports.PLATFORM_ADMIN_ROLES = [
    exports.GlobalRoles.PAYEZ_ADMIN,
    exports.GlobalRoles.VIBE_APP_ADMIN,
];
/**
 * Roles that grant client-scoped admin access.
 * These can only access their own client's data.
 */
exports.CLIENT_ADMIN_ROLES = [
    exports.GlobalRoles.VIBE_CLIENT_ADMIN,
    exports.GlobalRoles.IDP_CLIENT_ADMIN,
];
// =============================================================================
// Role Checking Utilities
// =============================================================================
/**
 * Check if user has a specific role
 */
function hasRole(userRoles, role) {
    if (!userRoles || !Array.isArray(userRoles))
        return false;
    return userRoles.includes(role);
}
/**
 * Check if user has any of the specified roles
 */
function hasAnyRole(userRoles, roles) {
    if (!userRoles || !Array.isArray(userRoles))
        return false;
    return roles.some(role => userRoles.includes(role));
}
/**
 * Check if user has all of the specified roles
 */
function hasAllRoles(userRoles, roles) {
    if (!userRoles || !Array.isArray(userRoles))
        return false;
    return roles.every(role => userRoles.includes(role));
}
/**
 * Check if user has admin access (any admin role)
 */
function isAdmin(userRoles) {
    return hasAnyRole(userRoles, exports.ADMIN_ROLES);
}
/**
 * Check if user has platform-wide admin access
 */
function isPlatformAdmin(userRoles) {
    return hasAnyRole(userRoles, exports.PLATFORM_ADMIN_ROLES);
}
/**
 * Check if user is a client-scoped admin (not platform admin)
 */
function isClientAdmin(userRoles) {
    return hasAnyRole(userRoles, exports.CLIENT_ADMIN_ROLES) && !isPlatformAdmin(userRoles);
}
// =============================================================================
// Role Hierarchy
// =============================================================================
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
exports.ROLE_HIERARCHY = {
    [exports.GlobalRoles.PAYEZ_ADMIN]: 4,
    [exports.GlobalRoles.VIBE_APP_ADMIN]: 3,
    [exports.GlobalRoles.VIBE_CLIENT_ADMIN]: 2,
    [exports.GlobalRoles.IDP_CLIENT_ADMIN]: 2,
    [exports.AppRoles.VIBE_APP_USER]: 1,
};
/**
 * Get the highest role level for a user
 */
function getHighestRoleLevel(userRoles) {
    if (!userRoles || !Array.isArray(userRoles))
        return 0;
    return Math.max(0, ...userRoles.map(role => exports.ROLE_HIERARCHY[role] || 0));
}
exports.default = {
    VibeRoles: exports.VibeRoles,
    GlobalRoles: exports.GlobalRoles,
    AppRoles: exports.AppRoles,
    ADMIN_ROLES: exports.ADMIN_ROLES,
    PLATFORM_ADMIN_ROLES: exports.PLATFORM_ADMIN_ROLES,
    CLIENT_ADMIN_ROLES: exports.CLIENT_ADMIN_ROLES,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isPlatformAdmin,
    isClientAdmin,
    getHighestRoleLevel,
};
