/**
 * Advanced Route Configuration for `@payez/next-mvp`
 *
 * This module provides a robust, pattern-based mechanism for defining
 * unauthenticated (public) routes, including wildcard support.
 * It is designed to be easily configurable by host applications.
 */

import { TwoFactorRequirements, TwoFactorPresets } from '../middleware/twofa-presets';

export interface UnauthenticatedRouteConfig {
  /** The route pattern (supports wildcards with *) */
  pattern: string;
  /** Description of what this route is for */
  description: string;
  /** Whether this route should be accessible during circuit breaker open state */
  allowDuringCircuitBreakerOpen?: boolean;
  /** Whether this route requires rate limiting even when unauthenticated */
  requiresRateLimit?: boolean;
}

/**
 * Protected route configuration with 2FA requirements
 */
export interface ProtectedRouteConfig {
  /** The route pattern (supports wildcards with *) */
  pattern: string;
  /** Description of what this route is for */
  description?: string;
  /** 2FA requirements for this route (default: requires 2FA if site requires it) */
  twoFactorRequirements: TwoFactorRequirements;
}

// Default public routes provided by the MVP package
const defaultUnauthenticatedRoutes: UnauthenticatedRouteConfig[] = [
  {
    pattern: '/',
    description: 'Homepage',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/login',
    description: 'Login page',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/register',
    description: 'Registration page',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/forgot-password',
    description: 'Forgot password page',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/account-auth/*',
    description: 'All authentication pages (login, register, forgot password, etc.)',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/api/auth/*',
    description: 'Authentication API endpoints',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: true
  },
  {
    pattern: '/api/session/viability',
    description: 'Session viability check endpoint',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/api/health/*',
    description: 'Health check endpoints',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: true
  },
  {
    pattern: '/service-unavailable',
    description: 'Service unavailable error page',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/_next/*',
    description: 'Next.js static assets',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/favicon.ico',
    description: 'Favicon',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
];

let configuredRoutes: UnauthenticatedRouteConfig[] = [...defaultUnauthenticatedRoutes];

// Default routes that require auth but NOT 2FA (for 2FA onboarding flow)
// NOTE: Only the bare minimum routes needed for 2FA completion - no welcome screens
const default2FABypassRoutes: ProtectedRouteConfig[] = [
  {
    pattern: '/api/auth/*',
    description: 'Auth API routes - must be accessible during 2FA flow for session management',
    twoFactorRequirements: TwoFactorPresets.NONE
  },
  {
    pattern: '/api/account/*',
    description: '2FA verification APIs (send-code, verify-email, verify-sms, update-phone, masked-info)',
    twoFactorRequirements: TwoFactorPresets.NONE
  },
  {
    pattern: '/api/session/*',
    description: 'Session management APIs (viability, refresh-viability)',
    twoFactorRequirements: TwoFactorPresets.NONE
  },
  {
    pattern: '/account-auth/verify-code',
    description: '2FA verification page',
    twoFactorRequirements: TwoFactorPresets.NONE
  },
  {
    pattern: '/test-env/*',
    description: 'Test/debug pages (emergency-logout, jwt-inspect, refresh-token) - must bypass 2FA',
    twoFactorRequirements: TwoFactorPresets.NONE
  },
  // NOTE: /onboarding/two-factor intentionally NOT included - go straight to 2FA, no welcome page
];

let configured2FABypassRoutes: ProtectedRouteConfig[] = [...default2FABypassRoutes];

/**
 * Configures additional public routes for the application.
 * This function should be called once during application initialization.
 * @param appRoutes An array of route patterns or UnauthenticatedRouteConfig objects.
 */
export function configurePublicRoutes(appRoutes: (string | UnauthenticatedRouteConfig)[] = []) {
  const newRoutes = appRoutes.map(route =>
    typeof route === 'string'
      ? { pattern: route, description: `Application-defined public route: ${route}` }
      : route
  );
  configuredRoutes = [...defaultUnauthenticatedRoutes, ...newRoutes];
}

/**
 * Configures routes that require authentication but bypass 2FA requirements.
 * Essential for 2FA onboarding flows where user is authenticated but hasn't completed 2FA yet.
 * @param routes An array of route patterns or ProtectedRouteConfig objects.
 */
export function configure2FABypassRoutes(routes: (string | ProtectedRouteConfig)[] = []) {
  const newRoutes = routes.map(route =>
    typeof route === 'string'
      ? { pattern: route, description: `2FA bypass route: ${route}`, twoFactorRequirements: TwoFactorPresets.NONE }
      : route
  );
  configured2FABypassRoutes = [...default2FABypassRoutes, ...newRoutes];
}

/**
 * Checks if a route should bypass 2FA requirements (but still requires auth).
 * @param pathname The URL pathname to check.
 * @returns The ProtectedRouteConfig if found, otherwise undefined.
 */
export function get2FABypassConfig(pathname: string): ProtectedRouteConfig | undefined {
  return configured2FABypassRoutes.find(route => {
    if (route.pattern.endsWith('*')) {
      const basePattern = route.pattern.slice(0, -1);
      return pathname.startsWith(basePattern);
    }
    return pathname === route.pattern;
  });
}

/**
 * Checks if a route should bypass 2FA requirements.
 * @param pathname The URL pathname to check.
 * @returns true if 2FA should be bypassed for this route.
 */
export function should2FABypass(pathname: string): boolean {
  return get2FABypassConfig(pathname) !== undefined;
}

/**
 * Checks if a given pathname matches any of the configured unauthenticated routes.
 * Supports wildcard matching (e.g., '/api/*').
 * @param pathname The URL pathname to check.
 * @returns `true` if the route is unauthenticated, `false` otherwise.
 */
export function isUnauthenticatedRoute(pathname: string): boolean {
  return configuredRoutes.some(route => {
    if (route.pattern.endsWith('*')) {
      const basePattern = route.pattern.slice(0, -1);
      return pathname.startsWith(basePattern);
    }
    return pathname === route.pattern;
  });
}

/**
 * Retrieves the configuration for a specific route.
 * @param pathname The URL pathname to get the configuration for.
 * @returns The `UnauthenticatedRouteConfig` object if found, otherwise `undefined`.
 */
export function getRouteConfig(pathname: string): UnauthenticatedRouteConfig | undefined {
  return configuredRoutes.find(route => {
    if (route.pattern.endsWith('*')) {
      const basePattern = route.pattern.slice(0, -1);
      return pathname.startsWith(basePattern);
    }
    return pathname === route.pattern;
  });
}