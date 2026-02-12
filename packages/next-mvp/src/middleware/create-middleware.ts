/**
 * MVP Middleware - Authentication & Route Protection
 *
 * Creates a Next.js middleware handler that protects routes based on:
 * - Authentication status (session cookie → Redis viability check)
 * - 2FA completion status
 * - RBAC permissions (if enabled)
 *
 * Usage: Export the result from your app's middleware.ts:
 *   export default createMvpMiddleware();
 *
 * With custom options:
 *   export default createMvpMiddleware({
 *     circuitBreaker: myCircuitBreaker,
 *     logger: myLogger,
 *     viabilityEndpoint: '/api/session/refresh-viability',
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { isUnauthenticatedRoute, should2FABypass } from '../auth/route-config';
import { getInternalApiUrl } from '../edge/internal-api-url';
import { getSessionCookieName, getSecureSessionCookieName } from '../lib/app-slug';
import { checkPagePermission, isRBACEnabled } from './rbac-check';

// =============================================================================
// TYPES
// =============================================================================

export interface AuthContext {
  pathname: string;
  isPublicRoute: boolean;
  isLoginPage: boolean;
  searchParams: URLSearchParams;
  sessionPointer: SessionPointer;
  sessionStatus: SessionStatus;
  circuitBreakerOpen: boolean;
}

export interface SessionPointer {
  exists: boolean;
  sessionToken?: string;
  expired?: boolean;
  hasRefreshToken?: boolean;
  roles: string[];
  clientId: string;
}

export interface SessionStatus {
  exists: boolean | null;       // null = check failed/timeout
  forceInvalid: boolean | null; // null = check failed/timeout
  requires2FA: boolean;
  twoFactorComplete: boolean;
}

export type AuthAction =
  | { type: 'allow' }
  | { type: 'redirect'; location: string; reason: string; clearCookies?: boolean }
  | { type: 'service_error'; reason: string }
  | { type: 'refresh_needed' };

// =============================================================================
// CIRCUIT BREAKER INTERFACE
// =============================================================================

/**
 * Circuit breaker interface for middleware integration.
 * Implement this to provide custom circuit breaker behavior.
 */
export interface CircuitBreakerProvider {
  /** Check if circuit breaker is currently open */
  isOpen(): boolean;
  /** Check if a refresh attempt is allowed (for HALF_OPEN state) */
  canAttemptRefresh(): boolean;
  /** Record a successful operation (closes the breaker) */
  recordSuccess(): void;
  /** Record a failed operation (may open the breaker) */
  recordFailure(error?: Error): void;
  /** Check if an error is a network error (vs HTTP error) */
  isNetworkError(error: any): boolean;
}

/**
 * Logger interface for middleware.
 * Implement this to provide custom logging.
 */
export interface MiddlewareLogger {
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
}

/**
 * Configuration options for createMvpMiddleware
 */
export interface MvpMiddlewareOptions {
  /** Custom circuit breaker implementation */
  circuitBreaker?: CircuitBreakerProvider;
  /** Custom logger implementation */
  logger?: MiddlewareLogger;
  /** Custom viability check endpoint (default: /api/session/viability) */
  viabilityEndpoint?: string;
  /** Custom refresh endpoint (default: /api/auth/refresh) */
  refreshEndpoint?: string;
  /** Hook called on successful refresh */
  onRefreshSuccess?: () => void;
  /** Hook called on refresh failure */
  onRefreshFailure?: (status: number, isNetworkError: boolean) => void;
  /** Additional paths to bypass middleware (beyond /api/auth/ and /api/session/) */
  bypassPaths?: string[];
  /** Paths exempt from RBAC checks (auth still enforced, just no page-permission check) */
  rbacExemptPaths?: string[];
}

// =============================================================================
// DEFAULT IMPLEMENTATIONS
// =============================================================================

/** Default no-op circuit breaker (always closed) */
const defaultCircuitBreaker: CircuitBreakerProvider = {
  isOpen: () => false,
  canAttemptRefresh: () => true,
  recordSuccess: () => {},
  recordFailure: () => {},
  isNetworkError: (error: any) => {
    return error?.cause?.code === 'ECONNREFUSED' ||
           error?.code === 'ECONNREFUSED' ||
           error?.message?.includes('ECONNREFUSED') ||
           error?.message?.includes('fetch failed') ||
           error?.message?.includes('ENOTFOUND') ||
           error?.message?.includes('ETIMEDOUT') ||
           error?.message?.includes('ECONNRESET');
  }
};

/** Default console logger */
const defaultLogger: MiddlewareLogger = {
  info: (msg, data) => console.log(`[MIDDLEWARE] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[MIDDLEWARE] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[MIDDLEWARE] ${msg}`, data || ''),
};

// =============================================================================
// HELPERS
// =============================================================================

const LOGIN_PAGE = '/account-auth/login';
const VERIFY_CODE_PAGE = '/account-auth/verify-code';

function isLoginPage(pathname: string): boolean {
  return pathname === LOGIN_PAGE;
}

/** Ensures callback URLs never point to auth pages (prevents redirect loops) */
function getSafeCallbackUrl(pathname: string, searchParams?: URLSearchParams): string {
  if (pathname.startsWith('/account-auth/')) {
    return '/';
  }
  const existing = searchParams?.get('callbackUrl');
  if (existing && !existing.startsWith('/account-auth/')) {
    return existing;
  }
  return pathname;
}

/** Clear all session cookies on a response */
function clearSessionCookies(response: NextResponse, request: NextRequest): void {
  const sessionCookie = getSessionCookieName();
  const secureCookie = getSecureSessionCookieName();

  // Clear main cookies
  response.cookies.set(sessionCookie, '', { path: '/', expires: new Date(0), httpOnly: true, sameSite: 'lax' });
  response.cookies.set(secureCookie, '', { path: '/', expires: new Date(0), httpOnly: true, sameSite: 'lax', secure: true });

  // Clear any chunked cookies (NextAuth chunks large cookies)
  for (const [name] of request.cookies) {
    if (name.startsWith(`${sessionCookie}.`) || name.startsWith(`${secureCookie}.`)) {
      const isSecure = name.startsWith('__Secure-');
      response.cookies.set(name, '', {
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        ...(isSecure && { secure: true })
      });
    }
  }
}

/** Create redirect response, optionally clearing cookies */
function redirectTo(
  request: NextRequest,
  location: string,
  clearCookies = false
): NextResponse {
  const response = NextResponse.redirect(new URL(location, request.url));
  if (clearCookies) {
    clearSessionCookies(response, request);
  }
  return response;
}

// =============================================================================
// AUTH DECISION ENGINE
// =============================================================================

/**
 * Pure function that determines what action to take based on auth state.
 * No side effects - just examines context and returns a decision.
 */
function makeAuthDecision(ctx: AuthContext): AuthAction {
  const { pathname, isPublicRoute, isLoginPage: onLoginPage, searchParams, sessionPointer, sessionStatus, circuitBreakerOpen } = ctx;
  const safeCallback = getSafeCallbackUrl(pathname);

  // --- Public routes: Allow, but enforce 2FA for authenticated users ---
  if (isPublicRoute && !onLoginPage) {
    if (needsTwoFactorRedirect(pathname, sessionPointer, sessionStatus)) {
      return redirect2FA(safeCallback);
    }
    return { type: 'allow' };
  }

  // --- Circuit breaker open: Service degraded ---
  if (circuitBreakerOpen) {
    if (onLoginPage) return { type: 'allow' };
    return {
      type: 'redirect',
      location: `${LOGIN_PAGE}?error=ServiceUnavailable`,
      reason: 'circuit_breaker_open',
      clearCookies: true
    };
  }

  // --- No session cookie: Need to login ---
  if (!sessionPointer.exists) {
    if (onLoginPage) return { type: 'allow' };
    if (pathname === '/') {
      const unauthUrl = process.env.UNAUTHENTICATED_REDIRECT_URL || '/account-auth/login';
      return { type: 'redirect', location: unauthUrl, reason: 'unauthenticated_root' };
    }
    if (pathname.startsWith('/api/')) {
      return { type: 'allow' }; // Let API return proper 401 JSON
    }
    return {
      type: 'redirect',
      location: `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}`,
      reason: 'no_session'
    };
  }

  // --- Service error: Can't verify session ---
  if (sessionStatus.exists === null || sessionStatus.forceInvalid === null) {
    return { type: 'service_error', reason: 'viability_check_failed' };
  }

  // --- Session force-invalidated (admin action, password change, etc.) ---
  if (sessionStatus.forceInvalid) {
    if (onLoginPage) return { type: 'allow' };
    if (pathname.startsWith('/api/')) return { type: 'allow' };
    return {
      type: 'redirect',
      location: `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}&reason=invalidated`,
      reason: 'force_invalidated',
      clearCookies: true
    };
  }

  // --- Stale session (cookie exists but Redis entry gone) ---
  if (!sessionStatus.exists) {
    if (onLoginPage) return { type: 'allow' };
    if (pathname.startsWith('/api/')) return { type: 'allow' };
    return {
      type: 'redirect',
      location: `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}&reason=stale`,
      reason: 'stale_session',
      clearCookies: true
    };
  }

  // --- 2FA required but not completed ---
  if (needsTwoFactorRedirect(pathname, sessionPointer, sessionStatus)) {
    if (onLoginPage) {
      const cb = getSafeCallbackUrl(pathname, searchParams);
      return { type: 'redirect', location: `${VERIFY_CODE_PAGE}?callbackUrl=${encodeURIComponent(cb)}`, reason: '2fa_from_login' };
    }
    return redirect2FA(safeCallback);
  }

  // --- Token expired: Try refresh ---
  if (sessionPointer.expired) {
    if (onLoginPage) return { type: 'allow' };
    if (sessionPointer.hasRefreshToken) {
      return { type: 'refresh_needed' };
    }
    return {
      type: 'redirect',
      location: `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}&error=SessionExpired`,
      reason: 'token_expired_no_refresh'
    };
  }

  // --- Authenticated user on login page: Send to their destination ---
  if (onLoginPage) {
    const dest = getSafeCallbackUrl(pathname, searchParams);
    return { type: 'redirect', location: dest, reason: 'already_authenticated' };
  }

  // --- All checks passed ---
  return { type: 'allow' };
}

/** Check if user needs 2FA redirect */
function needsTwoFactorRedirect(pathname: string, session: SessionPointer, status: SessionStatus): boolean {
  if (!session.exists || !status.exists) return false;
  if (!status.requires2FA || status.twoFactorComplete) return false;
  if (pathname === VERIFY_CODE_PAGE) return false;
  if (should2FABypass(pathname)) return false;
  if (pathname.startsWith('/api/')) return false; // APIs return JSON errors
  return true;
}

function redirect2FA(callbackUrl: string): AuthAction {
  return {
    type: 'redirect',
    location: `${VERIFY_CODE_PAGE}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    reason: '2fa_required'
  };
}

// =============================================================================
// MIDDLEWARE FACTORY
// =============================================================================

export function createMvpMiddleware(options: MvpMiddlewareOptions = {}) {
  // Resolve options with defaults
  const cb = options.circuitBreaker || defaultCircuitBreaker;
  const log = options.logger || defaultLogger;
  const viabilityEndpoint = options.viabilityEndpoint || '/api/session/viability';
  const refreshEndpoint = options.refreshEndpoint || '/api/auth/refresh';
  const bypassPaths = options.bypassPaths || [];
  const rbacExemptPaths = options.rbacExemptPaths || [];

  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname, searchParams } = request.nextUrl;

    // =========================================================================
    // CRITICAL: Auth routes MUST bypass middleware
    // =========================================================================
    // These routes are called internally by middleware itself (viability check,
    // token refresh). Without this bypass, we get infinite loops or 403s.
    // This has caused production outages. DO NOT REMOVE.
    // =========================================================================
    if (pathname.startsWith('/api/auth/') || pathname.startsWith('/api/session/')) {
      return NextResponse.next();
    }

    // Check custom bypass paths
    for (const bypassPath of bypassPaths) {
      if (pathname.startsWith(bypassPath)) {
        return NextResponse.next();
      }
    }

    const isPublic = isUnauthenticatedRoute(pathname);
    const isLogin = isLoginPage(pathname);

    // --- Optimization: Skip viability check for unauthenticated public browsing ---
    if (isPublic && !isLogin) {
      const hasCookie = request.cookies.get(getSessionCookieName())?.value ||
                        request.cookies.get(getSecureSessionCookieName())?.value;
      if (!hasCookie) {
        return NextResponse.next();
      }
      // Has cookie - continue to viability check for 2FA enforcement
    }

    // --- Fetch session viability from internal API ---
    const { sessionStatus, sessionPointer } = await checkViability(request, viabilityEndpoint, log);

    // --- Handle stale session early (cookie exists but session doesn't) ---
    if (!isPublic && sessionStatus.exists === false && sessionPointer.sessionToken) {
      const safeCallback = getSafeCallbackUrl(pathname);
      log.warn('Stale session detected', {
        sessionToken: sessionPointer.sessionToken?.substring(0, 8) + '...',
        pathname
      });
      return redirectTo(request, `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}`, true);
    }

    // --- Run decision engine ---
    const decision = makeAuthDecision({
      pathname,
      isPublicRoute: isPublic,
      isLoginPage: isLogin,
      searchParams,
      sessionPointer,
      sessionStatus,
      circuitBreakerOpen: cb.isOpen(),
    });

    // --- Execute decision ---
    return executeDecision(request, decision, pathname, sessionPointer, sessionStatus, {
      circuitBreaker: cb,
      logger: log,
      refreshEndpoint,
      rbacExemptPaths,
      onRefreshSuccess: options.onRefreshSuccess,
      onRefreshFailure: options.onRefreshFailure,
    });
  };
}

/** Check session viability via internal API */
async function checkViability(
  request: NextRequest,
  endpoint: string,
  log: MiddlewareLogger
): Promise<{
  sessionStatus: SessionStatus;
  sessionPointer: SessionPointer;
}> {
  const sessionStatus: SessionStatus = {
    exists: false,
    forceInvalid: false,
    requires2FA: false,
    twoFactorComplete: false,
  };
  const sessionPointer: SessionPointer = {
    exists: false,
    sessionToken: undefined,
    expired: false,
    hasRefreshToken: false,
    roles: [],
    clientId: '',
  };

  try {
    const baseUrl = getInternalApiUrl(request);
    const response = await fetch(new URL(endpoint, baseUrl), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store',
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      // Support both response formats (viability and refresh-viability)
      sessionStatus.exists = data.authenticated ?? (data.sessionToken && data.reason !== 'session_not_found');
      sessionStatus.requires2FA = data.requires2FA || false;
      sessionStatus.twoFactorComplete = data.twoFactorComplete || false;
      sessionPointer.exists = sessionStatus.exists ?? false;
      sessionPointer.sessionToken = data.sessionToken;
      sessionPointer.expired = data.accessTokenExpired || false;
      sessionPointer.hasRefreshToken = data.hasRefreshToken ?? data.canRefresh ?? false;
      sessionPointer.roles = data.roles || [];
      sessionPointer.clientId = data.clientId || '';
    } else {
      log.error('Viability check failed', { status: response.status });
      sessionStatus.exists = null;
      sessionStatus.forceInvalid = null;
    }
  } catch (error) {
    log.error('Viability check error', { error: error instanceof Error ? error.message : String(error) });
    sessionStatus.exists = null;
    sessionStatus.forceInvalid = null;
  }

  return { sessionStatus, sessionPointer };
}

/** Options passed to executeDecision */
interface ExecuteOptions {
  circuitBreaker: CircuitBreakerProvider;
  logger: MiddlewareLogger;
  refreshEndpoint: string;
  rbacExemptPaths: string[];
  onRefreshSuccess?: () => void;
  onRefreshFailure?: (status: number, isNetworkError: boolean) => void;
}

/** Execute the auth decision */
async function executeDecision(
  request: NextRequest,
  decision: AuthAction,
  pathname: string,
  sessionPointer: SessionPointer,
  sessionStatus: SessionStatus,
  opts: ExecuteOptions
): Promise<NextResponse> {
  const safeCallback = getSafeCallbackUrl(pathname);

  switch (decision.type) {
    case 'allow':
      return handleAllow(request, pathname, sessionPointer, sessionStatus, opts.rbacExemptPaths);

    case 'redirect':
      return redirectTo(request, decision.location, decision.clearCookies);

    case 'service_error':
      return NextResponse.redirect(new URL('/service-unavailable', request.url));

    case 'refresh_needed':
      return handleRefresh(request, safeCallback, opts);
  }
}

/** Paths that must never be RBAC-checked (they are RBAC redirect targets) */
const RBAC_EXEMPT_PATHS = ['/error', '/unauthorized', '/service-unavailable'];

/** Handle 'allow' decision - run RBAC if enabled */
async function handleAllow(
  request: NextRequest,
  pathname: string,
  sessionPointer: SessionPointer,
  sessionStatus: SessionStatus,
  rbacExemptPaths: string[] = []
): Promise<NextResponse> {
  const isPublic = isUnauthenticatedRoute(pathname);

  if (isRBACEnabled() && !isPublic && sessionPointer.exists) {
    // Skip RBAC for error/fallback pages (prevent redirect loops) and app-configured exempt paths
    if (RBAC_EXEMPT_PATHS.some(p => pathname.startsWith(p)) ||
        rbacExemptPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    if (!sessionPointer.clientId) {
      console.error('[MIDDLEWARE] RBAC: No clientId — returning 401');
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized — missing clientId for RBAC' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    try {
      const result = await checkPagePermission(pathname, sessionPointer.roles, sessionPointer.clientId);

      if (!result.allowed) {
        console.log('[MIDDLEWARE] RBAC denied:', { pathname, reason: result.reason });

        // In development, fail open - RBAC API may not be fully configured
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[MIDDLEWARE] RBAC: Allowing in development despite denial:', result.reason);
          return NextResponse.next();
        }

        return NextResponse.redirect(new URL(result.redirect || '/unauthorized', request.url));
      }

      if (result.requires_2fa && !sessionStatus.twoFactorComplete) {
        return NextResponse.redirect(
          new URL(`${VERIFY_CODE_PAGE}?callbackUrl=${encodeURIComponent(pathname)}`, request.url)
        );
      }
    } catch (error) {
      console.error('[MIDDLEWARE] RBAC error:', error);

      // In development, fail open
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MIDDLEWARE] RBAC: Allowing in development despite error');
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL('/error?code=rbac_error', request.url));
    }
  }

  return NextResponse.next();
}

/** Handle token refresh */
async function handleRefresh(
  request: NextRequest,
  safeCallback: string,
  opts: ExecuteOptions
): Promise<NextResponse> {
  const { circuitBreaker: cb, logger: log, refreshEndpoint, onRefreshSuccess, onRefreshFailure } = opts;

  // Check if circuit breaker allows refresh attempt
  if (!cb.canAttemptRefresh()) {
    log.warn('Circuit breaker preventing refresh attempt');
    return redirectTo(
      request,
      `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}&error=ServiceUnavailable`,
      true
    );
  }

  try {
    const baseUrl = getInternalApiUrl(request);
    const response = await fetch(new URL(refreshEndpoint, baseUrl), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'x-session-token': request.cookies.get(getSessionCookieName())?.value ||
                           request.cookies.get(getSecureSessionCookieName())?.value || ''
      },
      credentials: 'include',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.refreshed || data.reason === 'already_fresh') {
        cb.recordSuccess();
        onRefreshSuccess?.();
        log.info('Token refresh successful');
        return NextResponse.next();
      }
    }

    // Refresh failed - check for permanent failures (401/403) vs transient (5xx)
    // CRITICAL: Always clear cookies on 401/403 to prevent redirect loops
    // CRITICAL: Only record circuit breaker failures for network errors, not HTTP errors
    // HTTP 500 means the server responded - it's reachable. Only network failures should trip the breaker.
    const isPermanentFailure = response.status === 401 || response.status === 403;
    const errorParam = isPermanentFailure ? 'SessionExpired' : 'RefreshError';

    log.warn('Refresh failed', {
      status: response.status,
      isPermanentFailure,
      clearingCookies: isPermanentFailure
    });

    onRefreshFailure?.(response.status, false);

    return redirectTo(
      request,
      `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}&error=${errorParam}`,
      isPermanentFailure
    );
  } catch (error: any) {
    const isNetwork = cb.isNetworkError(error);
    log.error('Refresh error', {
      error: error instanceof Error ? error.message : String(error),
      isNetworkError: isNetwork
    });

    // Only record circuit breaker failure for actual network errors
    if (isNetwork) {
      cb.recordFailure(error);
    }

    onRefreshFailure?.(0, isNetwork);

    // Network error - don't clear cookies, might be transient
    return redirectTo(
      request,
      `${LOGIN_PAGE}?callbackUrl=${encodeURIComponent(safeCallback)}&error=RefreshError`,
      false
    );
  }
}
