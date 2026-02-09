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

// -----------------------------------------------------------------------------
// COMMON TYPES
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// USERS TABLE
// -----------------------------------------------------------------------------

export interface IVibeUser extends VibeAuditFields {
  idp_user_id: number;
  email: string;
  name: string | null;
  type: 'human' | 'service' | 'admin';
  oauth_provider: string | null;
  last_login: string | null;
  login_count: number;
}

export class VibeUser implements IVibeUser {
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

  constructor(data: IVibeUser) {
    this.id = data.id;
    this.idp_user_id = data.idp_user_id;
    this.email = data.email;
    this.name = data.name;
    this.type = data.type;
    this.oauth_provider = data.oauth_provider;
    this.last_login = data.last_login;
    this.login_count = data.login_count;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static fromJSON(json: IVibeUser): VibeUser {
    return new VibeUser(json);
  }

  toJSON(): IVibeUser {
    return {
      id: this.id,
      idp_user_id: this.idp_user_id,
      email: this.email,
      name: this.name,
      type: this.type,
      oauth_provider: this.oauth_provider,
      last_login: this.last_login,
      login_count: this.login_count,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  get displayName(): string {
    return this.name || this.email;
  }
}

// -----------------------------------------------------------------------------
// LOGIN SESSIONS TABLE
// -----------------------------------------------------------------------------

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

export class VibeLoginSession implements IVibeLoginSession {
  id!: number;
  idp_user_id!: number;
  email!: string;
  name!: string | null;
  ip_address!: string;
  city!: string | null;
  region!: string | null;
  country!: string | null;
  country_code!: string | null;
  latitude!: number | null;
  longitude!: number | null;
  timezone!: string | null;
  user_agent!: string;
  device_type!: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser!: string;
  browser_version!: string | null;
  os!: string;
  os_version!: string | null;
  oauth_provider!: string | null;
  session_token_hash!: string | null;
  status!: SessionStatus;
  revoked_by!: string | null;
  revoked_at!: string | null;
  revoke_reason!: string | null;
  last_activity!: string | null;
  expires_at!: string;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeLoginSession) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeLoginSession): VibeLoginSession {
    return new VibeLoginSession(json);
  }

  toJSON(): IVibeLoginSession {
    return { ...this };
  }

  get isActive(): boolean {
    return this.status === 'active' && new Date(this.expires_at) > new Date();
  }

  get location(): string {
    const parts = [this.city, this.region, this.country].filter(Boolean);
    return parts.join(', ') || 'Unknown';
  }

  get deviceInfo(): string {
    return `${this.browser} on ${this.os}`;
  }
}

// -----------------------------------------------------------------------------
// PROFILES TABLE
// -----------------------------------------------------------------------------

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

export class VibeProfile implements IVibeProfile {
  id!: number;
  user_id!: number;
  bio!: string | null;
  avatar_url!: string | null;
  website!: string | null;
  location!: string | null;
  timezone!: string | null;
  language!: string;
  metadata!: Record<string, unknown> | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeProfile) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeProfile): VibeProfile {
    return new VibeProfile(json);
  }

  toJSON(): IVibeProfile {
    return { ...this };
  }
}

// -----------------------------------------------------------------------------
// SETTINGS TABLE
// -----------------------------------------------------------------------------

export interface IVibeSetting extends VibeAuditFields {
  user_id: number | null;
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  is_public: boolean;
}

export class VibeSetting implements IVibeSetting {
  id!: number;
  user_id!: number | null;
  key!: string;
  value!: string | number | boolean | Record<string, unknown>;
  type!: 'string' | 'number' | 'boolean' | 'json';
  description!: string | null;
  is_public!: boolean;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeSetting) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeSetting): VibeSetting {
    return new VibeSetting(json);
  }

  toJSON(): IVibeSetting {
    return { ...this };
  }
}

// -----------------------------------------------------------------------------
// FILES TABLE
// -----------------------------------------------------------------------------

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

export class VibeFile implements IVibeFile {
  id!: number;
  user_id!: number;
  filename!: string;
  original_name!: string;
  mime_type!: string;
  size_bytes!: number;
  storage_path!: string;
  public_url!: string | null;
  is_public!: boolean;
  metadata!: Record<string, unknown> | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeFile) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeFile): VibeFile {
    return new VibeFile(json);
  }

  toJSON(): IVibeFile {
    return { ...this };
  }

  get sizeFormatted(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size_bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS TABLE
// -----------------------------------------------------------------------------

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

export class VibeNotification implements IVibeNotification {
  id!: number;
  user_id!: number;
  type!: NotificationType;
  title!: string;
  message!: string;
  link!: string | null;
  read_at!: string | null;
  dismissed_at!: string | null;
  metadata!: Record<string, unknown> | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeNotification) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeNotification): VibeNotification {
    return new VibeNotification(json);
  }

  toJSON(): IVibeNotification {
    return { ...this };
  }

  get isRead(): boolean {
    return this.read_at !== null;
  }

  get isDismissed(): boolean {
    return this.dismissed_at !== null;
  }
}

// -----------------------------------------------------------------------------
// ACTIVITY LOG TABLE
// -----------------------------------------------------------------------------

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

export class VibeActivityLog implements IVibeActivityLog {
  id!: number;
  user_id!: number | null;
  action!: ActivityAction;
  entity_type!: string;
  entity_id!: number | null;
  description!: string;
  ip_address!: string | null;
  user_agent!: string | null;
  metadata!: Record<string, unknown> | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeActivityLog) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeActivityLog): VibeActivityLog {
    return new VibeActivityLog(json);
  }

  toJSON(): IVibeActivityLog {
    return { ...this };
  }
}

// -----------------------------------------------------------------------------
// TAGS TABLE
// -----------------------------------------------------------------------------

export interface IVibeTag extends VibeAuditFields {
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
}

export class VibeTag implements IVibeTag {
  id!: number;
  name!: string;
  slug!: string;
  color!: string | null;
  description!: string | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeTag) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeTag): VibeTag {
    return new VibeTag(json);
  }

  toJSON(): IVibeTag {
    return { ...this };
  }
}

// -----------------------------------------------------------------------------
// COMMENTS TABLE
// -----------------------------------------------------------------------------

export interface IVibeComment extends VibeAuditFields {
  user_id: number;
  entity_type: string;
  entity_id: number;
  parent_id: number | null;
  content: string;
  is_edited: boolean;
  edited_at: string | null;
}

export class VibeComment implements IVibeComment {
  id!: number;
  user_id!: number;
  entity_type!: string;
  entity_id!: number;
  parent_id!: number | null;
  content!: string;
  is_edited!: boolean;
  edited_at!: string | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeComment) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeComment): VibeComment {
    return new VibeComment(json);
  }

  toJSON(): IVibeComment {
    return { ...this };
  }

  get isReply(): boolean {
    return this.parent_id !== null;
  }
}

// -----------------------------------------------------------------------------
// SITE LOGS TABLE
// -----------------------------------------------------------------------------

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

export class VibeSiteLog implements IVibeSiteLog {
  id!: number;
  level!: LogLevel;
  message!: string;
  source!: string;
  user_id!: number | null;
  request_id!: string | null;
  stack_trace!: string | null;
  metadata!: Record<string, unknown> | null;
  created_at!: string;
  updated_at!: string | null;

  constructor(data: IVibeSiteLog) {
    Object.assign(this, data);
  }

  static fromJSON(json: IVibeSiteLog): VibeSiteLog {
    return new VibeSiteLog(json);
  }

  toJSON(): IVibeSiteLog {
    return { ...this };
  }

  get isError(): boolean {
    return this.level === 'error' || this.level === 'fatal';
  }
}

// -----------------------------------------------------------------------------
// TABLE TYPE MAPPING
// -----------------------------------------------------------------------------

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
