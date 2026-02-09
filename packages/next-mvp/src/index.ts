// Type augmentation for NextAuth - included via ambient module declaration
// Note: Type declarations are picked up automatically via tsconfig.json, no explicit import needed

// NOTE: Server-only exports are NOT exported from the root to prevent bundling Node.js modules in client code.
// Server-side code should import from subpath exports:
// - Session management: import { sessionStore } from '@payez/next-mvp/lib/session-store'
// - Redis client: import { redis } from '@payez/next-mvp/lib/redis'
// - Token expiry: import { computeTokenExpiries } from '@payez/next-mvp/lib/token-expiry'
// - Refresh validation: import { validateRefreshToken } from '@payez/next-mvp/lib/refresh-token-validator'
// - Auth options: import { authOptions } from '@payez/next-mvp/auth/auth-options'
// - Auth handler: import { createAuthHandler } from '@payez/next-mvp/api/auth-handler'

// Client-safe exports only

// Client-side utilities
export { fetchWithAuth } from './client/fetch-with-auth';

// Anonymous session hook (for pre-login preferences like theme)
export { useAnonSession } from './client/useAnonSession';
export type { AnonPreferences, AnonMetrics, AnonSession, UseAnonSessionReturn } from './client/useAnonSession';

// Authentication Context and Hooks
export { AuthProvider, useAuthConfig, useAuthMode, useFederatedProviders, useFederatedAuthEnabled, useTraditionalAuthEnabled } from './client/AuthContext';
export type { AuthConfig } from './types/auth';

// Route configuration (client-safe)
export { makeAuthDecision } from './auth/auth-decision';
export { isUnauthenticatedRoute, configurePublicRoutes, getRouteConfig } from './auth/route-config';
export { createMvpMiddleware } from './middleware/create-middleware';

// Account Components
export { UserAvatarMenu } from './components/account';
export type { UserAvatarMenuProps } from './components/account';

// Admin Logging & Analytics (client-side components and hooks)
export {
  ErrorMetricsCard,
  HealthMetricsCard,
  AuditLogViewer,
  AdminAnalyticsLayout,
  useErrorMetrics,
  useHealthMetrics,
  useAuditLog,
  useAdminAnalytics,
  getErrorMetrics,
  getHealthMetrics,
  writeAuditLog,
  queryAuditLog,
} from './logging';
export type {
  ErrorMetrics,
  HealthMetrics,
  AuditLogEntry,
  AuditLogQuery,
  AuditLogResponse,
  TimeRange,
  RouteError,
  LevelCount,
  CategoryCount,
  ErrorDetail,
  EndpointHealth,
  SlowRequest,
} from './logging';
