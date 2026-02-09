/**
 * =============================================================================
 * VIBE MODULE - MAIN EXPORTS
 * =============================================================================
 *
 * Typed Vibe App client for @payez/next-mvp
 *
 * Usage:
 *   import { vibe } from '@payez/next-mvp/vibe'
 *
 *   const users = await vibe.users.findMany({ where: { status: 'active' } })
 *
 * =============================================================================
 */

// Client exports
export { vibe, createVibeClient, VibeClient, VibeTableDelegate } from './client';
export type {
  VibeClientConfig,
  FindManyOptions,
  FindUniqueOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  CountOptions,
  FindManyResult,
  WhereClause,
  OrderByClause,
  FilterOperator,
  FilterValue,
  OrderDirection,
} from './client';

// Type exports
export type {
  VibeAuditFields,
  VibeMeta,
  VibeResponse,
  VibeErrorResponse,
  VibeTableTypes,
  VibeTableName,
  VibeTableType,
  // User types
  IVibeUser,
  // Session types
  IVibeLoginSession,
  SessionStatus,
  // Profile types
  IVibeProfile,
  // Setting types
  IVibeSetting,
  // File types
  IVibeFile,
  // Notification types
  IVibeNotification,
  NotificationType,
  // Activity log types
  IVibeActivityLog,
  ActivityAction,
  // Tag types
  IVibeTag,
  // Comment types
  IVibeComment,
  // Site log types
  IVibeSiteLog,
  LogLevel,
} from './types';

// Class exports (for serialization)
export {
  VibeUser,
  VibeLoginSession,
  VibeProfile,
  VibeSetting,
  VibeFile,
  VibeNotification,
  VibeActivityLog,
  VibeTag,
  VibeComment,
  VibeSiteLog,
} from './types';

// Error exports
export {
  VibeError,
  VibeNotFoundError,
  VibeValidationError,
  VibeAuthError,
  VibeRateLimitError,
  VibeConflictError,
  VibeServiceError,
} from './errors';

// Session management exports
export {
  createLoginSession,
  getUserSessions,
  getAllSessions,
  getSessionById,
  revokeSession,
  revokeAllUserSessions,
  updateSessionActivity,
  isSessionValid,
  checkSessionRevocation,
  getSessionStats,
} from './sessions';
export type { CreateSessionInput, SessionQueryOptions } from './sessions';

// Generic/dynamic collection exports
export {
  vibeCollection,
  vibeTable,
  vibeTablePath,
  vibeQueryPath,
  vibeGridPath,
  unwrapVibeDocument,
  extractVibeDocuments,
  GenericCollection,
  GenericTableDelegate,
} from './generic';
export type { VibeDocumentWrapper } from './generic';

// Enterprise authentication exports
export {
  validateEnterpriseAuth,
  hasEnterpriseAuthHeaders,
  generateBackendHmacSignature,
} from './enterprise-auth';
export type {
  EnterpriseClientsConfig,
  EnterpriseAuthResult,
} from './enterprise-auth';
