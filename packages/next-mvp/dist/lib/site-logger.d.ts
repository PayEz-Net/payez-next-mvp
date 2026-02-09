/**
 * Site Logger Utility
 *
 * Logs user activity events to the site_logs table via Redis buffer.
 * Fire-and-forget - logging failures never break the app.
 *
 * Uses Redis queue (vibe:site-logs:pending) which is drained by
 * DotNetPert's SiteLogDrainBackgroundService to Vibe site_logs table.
 *
 * @version 1.0
 */
export type SiteLogLevel = 'debug' | 'info' | 'warn' | 'error';
export type SiteLogCategory = 'auth' | 'session' | 'navigation' | 'user_action' | 'page_view' | 'error' | 'api';
export interface SiteLogEntry {
    level: SiteLogLevel;
    category: SiteLogCategory;
    message: string;
    context?: Record<string, unknown>;
    user_id?: string | number;
    session_id?: string;
    url?: string;
    user_agent?: string;
    ip_address?: string;
}
export interface SiteLoggerConfig {
    app_slug?: string;
    vibe_client_id?: string;
}
/**
 * Configure the site logger with app-specific settings
 */
export declare function configureSiteLogger(config: SiteLoggerConfig): void;
/**
 * Log a site event to the site_logs table
 * Fire-and-forget - never awaited in critical path
 */
export declare function logSiteEvent(entry: SiteLogEntry): Promise<void>;
/**
 * Helper to extract client IP from request headers
 */
export declare function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string | null;
/**
 * Pre-built event loggers for common auth events
 */
export declare const siteEvents: {
    loginSuccess: (opts: {
        user_id: string | number;
        session_id?: string;
        method?: string;
        provider?: string;
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    loginFailed: (opts: {
        reason: string;
        email?: string;
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    logout: (opts: {
        user_id: string | number;
        session_id?: string;
        trigger?: "user" | "session_timeout" | "admin";
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    twoFactorSuccess: (opts: {
        user_id: string | number;
        session_id?: string;
        method: "totp" | "sms" | "email";
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    twoFactorFailed: (opts: {
        user_id?: string | number;
        method: "totp" | "sms" | "email";
        attempts?: number;
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    sessionCreated: (opts: {
        user_id: string | number;
        session_id: string;
        device_type?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    adminAccess: (opts: {
        user_id: string | number;
        page: string;
        session_id?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    pageView: (opts: {
        url: string;
        user_id?: string | number;
        session_id?: string;
        referrer?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    error: (opts: {
        message: string;
        error?: string;
        stack?: string;
        user_id?: string | number;
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
    userAction: (opts: {
        action: string;
        target?: string;
        user_id?: string | number;
        session_id?: string;
        url?: string;
        user_agent?: string;
        ip_address?: string;
    }) => void;
};
declare const _default: {
    logSiteEvent: typeof logSiteEvent;
    getClientIp: typeof getClientIp;
    siteEvents: {
        loginSuccess: (opts: {
            user_id: string | number;
            session_id?: string;
            method?: string;
            provider?: string;
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        loginFailed: (opts: {
            reason: string;
            email?: string;
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        logout: (opts: {
            user_id: string | number;
            session_id?: string;
            trigger?: "user" | "session_timeout" | "admin";
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        twoFactorSuccess: (opts: {
            user_id: string | number;
            session_id?: string;
            method: "totp" | "sms" | "email";
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        twoFactorFailed: (opts: {
            user_id?: string | number;
            method: "totp" | "sms" | "email";
            attempts?: number;
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        sessionCreated: (opts: {
            user_id: string | number;
            session_id: string;
            device_type?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        adminAccess: (opts: {
            user_id: string | number;
            page: string;
            session_id?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        pageView: (opts: {
            url: string;
            user_id?: string | number;
            session_id?: string;
            referrer?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        error: (opts: {
            message: string;
            error?: string;
            stack?: string;
            user_id?: string | number;
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
        userAction: (opts: {
            action: string;
            target?: string;
            user_id?: string | number;
            session_id?: string;
            url?: string;
            user_agent?: string;
            ip_address?: string;
        }) => void;
    };
    configureSiteLogger: typeof configureSiteLogger;
};
export default _default;
