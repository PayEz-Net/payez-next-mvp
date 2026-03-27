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
export { vibe, createVibeClient, VibeClient, VibeTableDelegate } from './client';
export type { VibeClientConfig, FindManyOptions, FindUniqueOptions, CreateOptions, UpdateOptions, DeleteOptions, CountOptions, FindManyResult, WhereClause, OrderByClause, FilterOperator, FilterValue, OrderDirection, } from './client';
export type { VibeAuditFields, VibeMeta, VibeResponse, VibeErrorResponse, VibeTableTypes, VibeTableName, VibeTableType, IVibeUser, IVibeLoginSession, SessionStatus, IVibeProfile, IVibeSetting, IVibeFile, IVibeNotification, NotificationType, IVibeActivityLog, ActivityAction, IVibeTag, IVibeComment, IVibeSiteLog, LogLevel, } from './types';
export { VibeUser, VibeLoginSession, VibeProfile, VibeSetting, VibeFile, VibeNotification, VibeActivityLog, VibeTag, VibeComment, VibeSiteLog, } from './types';
export { VibeError, VibeNotFoundError, VibeValidationError, VibeAuthError, VibeRateLimitError, VibeConflictError, VibeServiceError, } from './errors';
export { createLoginSession, getUserSessions, getAllSessions, getSessionById, revokeSession, revokeAllUserSessions, updateSessionActivity, isSessionValid, checkSessionRevocation, getSessionStats, } from './sessions';
export type { CreateSessionInput, SessionQueryOptions } from './sessions';
export { vibeCollection, vibeTable, vibeTablePath, vibeQueryPath, vibeGridPath, unwrapVibeDocument, extractVibeDocuments, GenericCollection, GenericTableDelegate, } from './generic';
export type { VibeDocumentWrapper } from './generic';
export { validateEnterpriseAuth, hasEnterpriseAuthHeaders, generateBackendHmacSignature, } from './enterprise-auth';
export type { EnterpriseClientsConfig, EnterpriseAuthResult, } from './enterprise-auth';
