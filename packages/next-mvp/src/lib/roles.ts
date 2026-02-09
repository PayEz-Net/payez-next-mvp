/**
 * Vibe Role Constants and Utilities
 *
 * Centralized role definitions for consistent authorization across the stack.
 *
 * @version 1.0
 */

// =============================================================================
// Role Constants
// =============================================================================

/**
 * Global platform roles (IDP-level)
 * These roles are managed at the IDP and grant cross-client access.
 */
export const GlobalRoles = {
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
} as const;

/**
 * Application-level roles (per-client)
 * These roles are scoped to a specific client/tenant.
 */
export const AppRoles = {
  /** Standard authenticated user */
  VIBE_APP_USER: 'vibe_app_user',
} as const;

/**
 * All Vibe roles combined
 */
export const VibeRoles = {
  ...GlobalRoles,
  ...AppRoles,
} as const;

// =============================================================================
// Role Groups
// =============================================================================

/**
 * Roles that grant admin access to the /admin section.
 * Any of these roles allows access to admin pages.
 */
export const ADMIN_ROLES: readonly string[] = [
  GlobalRoles.PAYEZ_ADMIN,
  GlobalRoles.VIBE_APP_ADMIN,
  GlobalRoles.VIBE_CLIENT_ADMIN,
  GlobalRoles.IDP_CLIENT_ADMIN,
] as const;

/**
 * Roles that grant platform-wide admin access (not client-scoped).
 * These can access/modify any client's data.
 */
export const PLATFORM_ADMIN_ROLES: readonly string[] = [
  GlobalRoles.PAYEZ_ADMIN,
  GlobalRoles.VIBE_APP_ADMIN,
] as const;

/**
 * Roles that grant client-scoped admin access.
 * These can only access their own client's data.
 */
export const CLIENT_ADMIN_ROLES: readonly string[] = [
  GlobalRoles.VIBE_CLIENT_ADMIN,
  GlobalRoles.IDP_CLIENT_ADMIN,
] as const;

// =============================================================================
// Role Checking Utilities
// =============================================================================

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: string[] | undefined, role: string): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[] | undefined, roles: readonly string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[] | undefined, roles: readonly string[]): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  return roles.every(role => userRoles.includes(role));
}

/**
 * Check if user has admin access (any admin role)
 */
export function isAdmin(userRoles: string[] | undefined): boolean {
  return hasAnyRole(userRoles, ADMIN_ROLES);
}

/**
 * Check if user has platform-wide admin access
 */
export function isPlatformAdmin(userRoles: string[] | undefined): boolean {
  return hasAnyRole(userRoles, PLATFORM_ADMIN_ROLES);
}

/**
 * Check if user is a client-scoped admin (not platform admin)
 */
export function isClientAdmin(userRoles: string[] | undefined): boolean {
  return hasAnyRole(userRoles, CLIENT_ADMIN_ROLES) && !isPlatformAdmin(userRoles);
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
export const ROLE_HIERARCHY: Record<string, number> = {
  [GlobalRoles.PAYEZ_ADMIN]: 4,
  [GlobalRoles.VIBE_APP_ADMIN]: 3,
  [GlobalRoles.VIBE_CLIENT_ADMIN]: 2,
  [GlobalRoles.IDP_CLIENT_ADMIN]: 2,
  [AppRoles.VIBE_APP_USER]: 1,
};

/**
 * Get the highest role level for a user
 */
export function getHighestRoleLevel(userRoles: string[] | undefined): number {
  if (!userRoles || !Array.isArray(userRoles)) return 0;
  return Math.max(0, ...userRoles.map(role => ROLE_HIERARCHY[role] || 0));
}

export default {
  VibeRoles,
  GlobalRoles,
  AppRoles,
  ADMIN_ROLES,
  PLATFORM_ADMIN_ROLES,
  CLIENT_ADMIN_ROLES,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  isAdmin,
  isPlatformAdmin,
  isClientAdmin,
  getHighestRoleLevel,
};
