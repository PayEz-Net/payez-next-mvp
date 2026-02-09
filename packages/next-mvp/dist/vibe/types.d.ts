/**
 * =============================================================================
 * VIBE APP TYPES
 * =============================================================================
 *
 * Type definitions for the Vibe App tables.
 * Includes both plain interfaces and serializable classes.
 *
 * Usage (plain objects - default):
 *   const user = await vibe.users.findUnique({ where: { id: 1 } })
 *   console.log(user.email) // Typed!
 *
 * Usage (class instances - optional):
 *   const user = VibeUser.fromJSON(await vibe.users.findUnique({ where: { id: 1 } }))
 *   const json = user.toJSON()
 *
 * =============================================================================
 */
/** Standard audit fields present on all Vibe documents */
export interface VibeAuditFields {
    id: number;
    created_at: string;
    updated_at: string | null;
}
/** Pagination metadata returned from list queries */
export interface VibeMeta {
    total: number;
    limit: number;
    offset: number;
}
/** Standard API response wrapper */
export interface VibeResponse<T> {
    success: true;
    data: T;
    meta?: VibeMeta;
}
/** Error response wrapper */
export interface VibeErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
export interface IVibeUser extends VibeAuditFields {
    idp_user_id: number;
    email: string;
    name: string | null;
    type: 'human' | 'service' | 'admin';
    oauth_provider: string | null;
    last_login: string | null;
    login_count: number;
}
export declare class VibeUser implements IVibeUser {
    id: number;
    idp_user_id: number;
    email: string;
    name: string | null;
    type: 'human' | 'service' | 'admin';
    oauth_provider: string | null;
    last_login: string | null;
    login_count: number;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeUser);
    static fromJSON(json: IVibeUser): VibeUser;
    toJSON(): IVibeUser;
    get displayName(): string;
}
export type SessionStatus = 'active' | 'revoked' | 'expired';
export interface IVibeLoginSession extends VibeAuditFields {
    idp_user_id: number;
    email: string;
    name: string | null;
    ip_address: string;
    city: string | null;
    region: string | null;
    country: string | null;
    country_code: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    user_agent: string;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    browser: string;
    browser_version: string | null;
    os: string;
    os_version: string | null;
    oauth_provider: string | null;
    session_token_hash: string | null;
    status: SessionStatus;
    revoked_by: string | null;
    revoked_at: string | null;
    revoke_reason: string | null;
    last_activity: string | null;
    expires_at: string;
}
export declare class VibeLoginSession implements IVibeLoginSession {
    id: number;
    idp_user_id: number;
    email: string;
    name: string | null;
    ip_address: string;
    city: string | null;
    region: string | null;
    country: string | null;
    country_code: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    user_agent: string;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    browser: string;
    browser_version: string | null;
    os: string;
    os_version: string | null;
    oauth_provider: string | null;
    session_token_hash: string | null;
    status: SessionStatus;
    revoked_by: string | null;
    revoked_at: string | null;
    revoke_reason: string | null;
    last_activity: string | null;
    expires_at: string;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeLoginSession);
    static fromJSON(json: IVibeLoginSession): VibeLoginSession;
    toJSON(): IVibeLoginSession;
    get isActive(): boolean;
    get location(): string;
    get deviceInfo(): string;
}
export interface IVibeProfile extends VibeAuditFields {
    user_id: number;
    bio: string | null;
    avatar_url: string | null;
    website: string | null;
    location: string | null;
    timezone: string | null;
    language: string;
    metadata: Record<string, unknown> | null;
}
export declare class VibeProfile implements IVibeProfile {
    id: number;
    user_id: number;
    bio: string | null;
    avatar_url: string | null;
    website: string | null;
    location: string | null;
    timezone: string | null;
    language: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeProfile);
    static fromJSON(json: IVibeProfile): VibeProfile;
    toJSON(): IVibeProfile;
}
export interface IVibeSetting extends VibeAuditFields {
    user_id: number | null;
    key: string;
    value: string | number | boolean | Record<string, unknown>;
    type: 'string' | 'number' | 'boolean' | 'json';
    description: string | null;
    is_public: boolean;
}
export declare class VibeSetting implements IVibeSetting {
    id: number;
    user_id: number | null;
    key: string;
    value: string | number | boolean | Record<string, unknown>;
    type: 'string' | 'number' | 'boolean' | 'json';
    description: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeSetting);
    static fromJSON(json: IVibeSetting): VibeSetting;
    toJSON(): IVibeSetting;
}
export interface IVibeFile extends VibeAuditFields {
    user_id: number;
    filename: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    public_url: string | null;
    is_public: boolean;
    metadata: Record<string, unknown> | null;
}
export declare class VibeFile implements IVibeFile {
    id: number;
    user_id: number;
    filename: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    public_url: string | null;
    is_public: boolean;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeFile);
    static fromJSON(json: IVibeFile): VibeFile;
    toJSON(): IVibeFile;
    get sizeFormatted(): string;
}
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export interface IVibeNotification extends VibeAuditFields {
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    dismissed_at: string | null;
    metadata: Record<string, unknown> | null;
}
export declare class VibeNotification implements IVibeNotification {
    id: number;
    user_id: number;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    read_at: string | null;
    dismissed_at: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeNotification);
    static fromJSON(json: IVibeNotification): VibeNotification;
    toJSON(): IVibeNotification;
    get isRead(): boolean;
    get isDismissed(): boolean;
}
export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'import' | 'other';
export interface IVibeActivityLog extends VibeAuditFields {
    user_id: number | null;
    action: ActivityAction;
    entity_type: string;
    entity_id: number | null;
    description: string;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
}
export declare class VibeActivityLog implements IVibeActivityLog {
    id: number;
    user_id: number | null;
    action: ActivityAction;
    entity_type: string;
    entity_id: number | null;
    description: string;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeActivityLog);
    static fromJSON(json: IVibeActivityLog): VibeActivityLog;
    toJSON(): IVibeActivityLog;
}
export interface IVibeTag extends VibeAuditFields {
    name: string;
    slug: string;
    color: string | null;
    description: string | null;
}
export declare class VibeTag implements IVibeTag {
    id: number;
    name: string;
    slug: string;
    color: string | null;
    description: string | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeTag);
    static fromJSON(json: IVibeTag): VibeTag;
    toJSON(): IVibeTag;
}
export interface IVibeComment extends VibeAuditFields {
    user_id: number;
    entity_type: string;
    entity_id: number;
    parent_id: number | null;
    content: string;
    is_edited: boolean;
    edited_at: string | null;
}
export declare class VibeComment implements IVibeComment {
    id: number;
    user_id: number;
    entity_type: string;
    entity_id: number;
    parent_id: number | null;
    content: string;
    is_edited: boolean;
    edited_at: string | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeComment);
    static fromJSON(json: IVibeComment): VibeComment;
    toJSON(): IVibeComment;
    get isReply(): boolean;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export interface IVibeSiteLog extends VibeAuditFields {
    level: LogLevel;
    message: string;
    source: string;
    user_id: number | null;
    request_id: string | null;
    stack_trace: string | null;
    metadata: Record<string, unknown> | null;
}
export declare class VibeSiteLog implements IVibeSiteLog {
    id: number;
    level: LogLevel;
    message: string;
    source: string;
    user_id: number | null;
    request_id: string | null;
    stack_trace: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string | null;
    constructor(data: IVibeSiteLog);
    static fromJSON(json: IVibeSiteLog): VibeSiteLog;
    toJSON(): IVibeSiteLog;
    get isError(): boolean;
}
/** Map of table names to their types */
export interface VibeTableTypes {
    users: IVibeUser;
    login_sessions: IVibeLoginSession;
    profiles: IVibeProfile;
    settings: IVibeSetting;
    files: IVibeFile;
    notifications: IVibeNotification;
    activity_log: IVibeActivityLog;
    tags: IVibeTag;
    comments: IVibeComment;
    site_logs: IVibeSiteLog;
}
/** Valid table names */
export type VibeTableName = keyof VibeTableTypes;
/** Get the type for a specific table */
export type VibeTableType<T extends VibeTableName> = VibeTableTypes[T];
