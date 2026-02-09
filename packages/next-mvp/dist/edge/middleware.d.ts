/**
 * Edge Runtime Compatible Exports
 *
 * This module exports only Edge Runtime compatible code for use in Next.js middleware.
 * Client-side utilities that depend on browser APIs or server-only code are excluded.
 */
export { makeAuthDecision } from '../auth/auth-decision';
export { isUnauthenticatedRoute, configurePublicRoutes, getRouteConfig, configure2FABypassRoutes, should2FABypass, get2FABypassConfig } from '../auth/route-config';
export type { UnauthenticatedRouteConfig, ProtectedRouteConfig } from '../auth/route-config';
export { createMvpMiddleware } from '../middleware/create-middleware';
export type { MvpMiddlewareOptions, CircuitBreakerProvider, MiddlewareLogger, AuthContext, AuthAction, SessionPointer, SessionStatus } from '../middleware/create-middleware';
export { TwoFactorPresets, AMRValues, ACRLevels, validateAMR, validateACR, checkTwoFactorRequirements } from '../middleware/twofa-presets';
export type { TwoFactorRequirements, RouteConfig } from '../middleware/twofa-presets';
export { getInternalApiUrl } from './internal-api-url';
