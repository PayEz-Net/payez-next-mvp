"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VibeSiteLog = exports.VibeComment = exports.VibeTag = exports.VibeActivityLog = exports.VibeNotification = exports.VibeFile = exports.VibeSetting = exports.VibeProfile = exports.VibeLoginSession = exports.VibeUser = void 0;
class VibeUser {
    id;
    idp_user_id;
    email;
    name;
    type;
    oauth_provider;
    last_login;
    login_count;
    created_at;
    updated_at;
    constructor(data) {
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
    static fromJSON(json) {
        return new VibeUser(json);
    }
    toJSON() {
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
    get displayName() {
        return this.name || this.email;
    }
}
exports.VibeUser = VibeUser;
class VibeLoginSession {
    id;
    idp_user_id;
    email;
    name;
    ip_address;
    city;
    region;
    country;
    country_code;
    latitude;
    longitude;
    timezone;
    user_agent;
    device_type;
    browser;
    browser_version;
    os;
    os_version;
    oauth_provider;
    session_token_hash;
    status;
    revoked_by;
    revoked_at;
    revoke_reason;
    last_activity;
    expires_at;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeLoginSession(json);
    }
    toJSON() {
        return { ...this };
    }
    get isActive() {
        return this.status === 'active' && new Date(this.expires_at) > new Date();
    }
    get location() {
        const parts = [this.city, this.region, this.country].filter(Boolean);
        return parts.join(', ') || 'Unknown';
    }
    get deviceInfo() {
        return `${this.browser} on ${this.os}`;
    }
}
exports.VibeLoginSession = VibeLoginSession;
class VibeProfile {
    id;
    user_id;
    bio;
    avatar_url;
    website;
    location;
    timezone;
    language;
    metadata;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeProfile(json);
    }
    toJSON() {
        return { ...this };
    }
}
exports.VibeProfile = VibeProfile;
class VibeSetting {
    id;
    user_id;
    key;
    value;
    type;
    description;
    is_public;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeSetting(json);
    }
    toJSON() {
        return { ...this };
    }
}
exports.VibeSetting = VibeSetting;
class VibeFile {
    id;
    user_id;
    filename;
    original_name;
    mime_type;
    size_bytes;
    storage_path;
    public_url;
    is_public;
    metadata;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeFile(json);
    }
    toJSON() {
        return { ...this };
    }
    get sizeFormatted() {
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
exports.VibeFile = VibeFile;
class VibeNotification {
    id;
    user_id;
    type;
    title;
    message;
    link;
    read_at;
    dismissed_at;
    metadata;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeNotification(json);
    }
    toJSON() {
        return { ...this };
    }
    get isRead() {
        return this.read_at !== null;
    }
    get isDismissed() {
        return this.dismissed_at !== null;
    }
}
exports.VibeNotification = VibeNotification;
class VibeActivityLog {
    id;
    user_id;
    action;
    entity_type;
    entity_id;
    description;
    ip_address;
    user_agent;
    metadata;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeActivityLog(json);
    }
    toJSON() {
        return { ...this };
    }
}
exports.VibeActivityLog = VibeActivityLog;
class VibeTag {
    id;
    name;
    slug;
    color;
    description;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeTag(json);
    }
    toJSON() {
        return { ...this };
    }
}
exports.VibeTag = VibeTag;
class VibeComment {
    id;
    user_id;
    entity_type;
    entity_id;
    parent_id;
    content;
    is_edited;
    edited_at;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeComment(json);
    }
    toJSON() {
        return { ...this };
    }
    get isReply() {
        return this.parent_id !== null;
    }
}
exports.VibeComment = VibeComment;
class VibeSiteLog {
    id;
    level;
    message;
    source;
    user_id;
    request_id;
    stack_trace;
    metadata;
    created_at;
    updated_at;
    constructor(data) {
        Object.assign(this, data);
    }
    static fromJSON(json) {
        return new VibeSiteLog(json);
    }
    toJSON() {
        return { ...this };
    }
    get isError() {
        return this.level === 'error' || this.level === 'fatal';
    }
}
exports.VibeSiteLog = VibeSiteLog;
