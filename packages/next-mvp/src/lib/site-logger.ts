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

import { getRedis } from './redis';

// Redis key for site logs (separate from data_logs)
const REDIS_SITE_LOG_KEY = 'vibe:site-logs:pending';
const REDIS_LOG_TTL = 7 * 24 * 60 * 60; // 1 week

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

let _config: SiteLoggerConfig = {};

/**
 * Configure the site logger with app-specific settings
 */
export function configureSiteLogger(config: SiteLoggerConfig): void {
  _config = { ..._config, ...config };
}

/**
 * Log a site event to the site_logs table
 * Fire-and-forget - never awaited in critical path
 */
export async function logSiteEvent(entry: SiteLogEntry): Promise<void> {
  try {
    const redis = getRedis();

    const logRecord = JSON.stringify({
      log_level: entry.level,
      category: entry.category,
      message: entry.message,
      context: entry.context || {},
      user_id: entry.user_id ? (typeof entry.user_id === 'number' ? entry.user_id : null) : null,
      session_id: entry.session_id || null,
      url: entry.url || null,
      user_agent: entry.user_agent || null,
      ip_address: entry.ip_address || null,
      created_at: new Date().toISOString(),
      app_slug: _config.app_slug || process.env.APP_SLUG || process.env.CLIENT_ID || 'unknown',
      vibe_client_id: _config.vibe_client_id || process.env.VIBE_CLIENT_ID || '',
    });

    // Fire and forget - use .then().catch() to not block
    console.log('[site-logger] Pushing to Redis:', REDIS_SITE_LOG_KEY, entry.category, entry.message);
    redis.lpush(REDIS_SITE_LOG_KEY, logRecord).then((result) => {
      console.log('[site-logger] Redis push success, queue length:', result);
      redis.expire(REDIS_SITE_LOG_KEY, REDIS_LOG_TTL).catch(() => {});
    }).catch(err => {
      console.error('[site-logger] Redis push failed:', err.message);
    });
  } catch (error) {
    // Fail silently - logging should never break the app
    console.error('[site-logger] Failed to log event:', error);
  }
}

/**
 * Helper to extract client IP from request headers
 */
export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string | null {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers) {
      return headers.get(name);
    }
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value || null;
  };

  return (
    getHeader('x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader('x-real-ip') ||
    getHeader('cf-connecting-ip') ||
    null
  );
}

/**
 * Pre-built event loggers for common auth events
 */
export const siteEvents = {
  loginSuccess: (opts: { user_id: string | number; session_id?: string; method?: string; provider?: string; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'auth',
      message: 'User logged in',
      context: { method: opts.method || 'password', provider: opts.provider },
      user_id: opts.user_id,
      session_id: opts.session_id,
      url: opts.url || '/auth/login',
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  loginFailed: (opts: { reason: string; email?: string; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'warn',
      category: 'auth',
      message: 'Login failed',
      context: { reason: opts.reason, email: opts.email },
      url: opts.url || '/auth/login',
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  logout: (opts: { user_id: string | number; session_id?: string; trigger?: 'user' | 'session_timeout' | 'admin'; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'auth',
      message: 'User logged out',
      context: { trigger: opts.trigger || 'user' },
      user_id: opts.user_id,
      session_id: opts.session_id,
      url: opts.url || '/auth/logout',
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  twoFactorSuccess: (opts: { user_id: string | number; session_id?: string; method: 'totp' | 'sms' | 'email'; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'auth',
      message: '2FA verified',
      context: { method: opts.method },
      user_id: opts.user_id,
      session_id: opts.session_id,
      url: opts.url || '/auth/2fa',
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  twoFactorFailed: (opts: { user_id?: string | number; method: 'totp' | 'sms' | 'email'; attempts?: number; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'warn',
      category: 'auth',
      message: '2FA verification failed',
      context: { method: opts.method, attempts: opts.attempts },
      user_id: opts.user_id,
      url: opts.url || '/auth/2fa',
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  sessionCreated: (opts: { user_id: string | number; session_id: string; device_type?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'session',
      message: 'Session created',
      context: { device_type: opts.device_type },
      user_id: opts.user_id,
      session_id: opts.session_id,
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  adminAccess: (opts: { user_id: string | number; page: string; session_id?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'navigation',
      message: 'Admin panel accessed',
      context: { page: opts.page },
      user_id: opts.user_id,
      session_id: opts.session_id,
      url: opts.page,
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  pageView: (opts: { url: string; user_id?: string | number; session_id?: string; referrer?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'page_view',
      message: 'Page viewed',
      context: { referrer: opts.referrer },
      user_id: opts.user_id,
      session_id: opts.session_id,
      url: opts.url,
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  error: (opts: { message: string; error?: string; stack?: string; user_id?: string | number; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'error',
      category: 'error',
      message: opts.message,
      context: { error: opts.error, stack: opts.stack },
      user_id: opts.user_id,
      url: opts.url,
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },

  userAction: (opts: { action: string; target?: string; user_id?: string | number; session_id?: string; url?: string; user_agent?: string; ip_address?: string }) => {
    logSiteEvent({
      level: 'info',
      category: 'user_action',
      message: opts.action,
      context: { target: opts.target },
      user_id: opts.user_id,
      session_id: opts.session_id,
      url: opts.url,
      user_agent: opts.user_agent,
      ip_address: opts.ip_address,
    });
  },
};

export default { logSiteEvent, getClientIp, siteEvents, configureSiteLogger };
