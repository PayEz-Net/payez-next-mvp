/**
 * useViabilitySession - Redis-backed session state hook
 *
 * This hook provides the REAL session state by consulting Redis via /api/session/viability
 * instead of relying on the potentially stale NextAuth JWT cookie.
 *
 * Redis is the single source of truth. This hook:
 * 1. Polls /api/session/viability to get actual session state from Redis
 * 2. Returns consistent auth state across all components
 * 3. Triggers callback when session state changes unexpectedly
 *
 * Usage:
 * ```tsx
 * const { isAuthenticated, isLoading } = useViabilitySession();
 * ```
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { authClient } from '../client/better-auth-client';

export interface ViabilityState {
  /** Whether the user is authenticated according to Redis */
  isAuthenticated: boolean;
  /** Whether the viability check is in progress */
  isLoading: boolean;
  /** Whether 2FA is required for this client */
  requires2FA: boolean;
  /** Whether 2FA has been completed for this session */
  twoFactorComplete: boolean;
  /** Whether the access token has expired (refresh may be needed) */
  accessTokenExpired: boolean;
  /** Whether a refresh token is available */
  hasRefreshToken: boolean;
  /** Error message if viability check failed */
  error: string | null;
  /** Timestamp of last successful viability check */
  lastChecked: number | null;
  /** Force a viability check now */
  refresh: () => void;
}

interface ViabilityResponse {
  authenticated: boolean;
  sessionToken?: string;
  requires2FA?: boolean;
  twoFactorComplete?: boolean;
  accessTokenExpired?: boolean;
  hasRefreshToken?: boolean;
}

export interface UseViabilitySessionOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollInterval?: number;
  /** Whether to poll automatically (default: true) */
  enablePolling?: boolean;
  /** Callback when session becomes invalid */
  onSessionInvalid?: () => void;
}

// Use window to persist state across HMR in development
declare global {
  interface Window {
    __viabilitySessionState?: {
      isAuthenticated: boolean;
      isLoading: boolean;
      requires2FA: boolean;
      twoFactorComplete: boolean;
      accessTokenExpired: boolean;
      hasRefreshToken: boolean;
      error: string | null;
      lastChecked: number | null;
      checkInProgress: boolean;
      prevAuth: boolean | null;
      intervalId: ReturnType<typeof setInterval> | null;
      listeners: Set<() => void>;
      onSessionInvalidCallbacks: Set<() => void>;
    };
  }
}

function getGlobalState() {
  if (typeof window === 'undefined') {
    // SSR - return default state
    return {
      isAuthenticated: false,
      isLoading: true,
      requires2FA: false,
      twoFactorComplete: false,
      accessTokenExpired: false,
      hasRefreshToken: false,
      error: null,
      lastChecked: null,
      checkInProgress: false,
      prevAuth: null,
      intervalId: null,
      listeners: new Set<() => void>(),
      onSessionInvalidCallbacks: new Set<() => void>()
    };
  }

  // Initialize global state on window if not present
  if (!window.__viabilitySessionState) {
    window.__viabilitySessionState = {
      isAuthenticated: false,
      isLoading: true,
      requires2FA: false,
      twoFactorComplete: false,
      accessTokenExpired: false,
      hasRefreshToken: false,
      error: null,
      lastChecked: null,
      checkInProgress: false,
      prevAuth: null,
      intervalId: null,
      listeners: new Set<() => void>(),
      onSessionInvalidCallbacks: new Set<() => void>()
    };
  }

  return window.__viabilitySessionState;
}

async function doViabilityCheck(): Promise<void> {
  const state = getGlobalState();

  // Prevent concurrent checks
  if (state.checkInProgress) return;
  state.checkInProgress = true;

  try {
    const response = await fetch('/api/session/viability', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      state.isLoading = false;
      state.error = `Viability check failed: ${response.status}`;
      state.lastChecked = Date.now();
      notifyListeners();
      return;
    }

    const data: ViabilityResponse = await response.json();

    // Detect auth state change
    if (state.prevAuth !== null && state.prevAuth !== data.authenticated) {
      console.log('[useViabilitySession] Auth state changed:', {
        was: state.prevAuth,
        now: data.authenticated
      });

      if (!data.authenticated) {
        // Notify all callbacks
        state.onSessionInvalidCallbacks.forEach(cb => {
          try { cb(); } catch (e) { console.error('[useViabilitySession] onSessionInvalid error:', e); }
        });
      }
    }

    state.prevAuth = data.authenticated;
    state.isAuthenticated = data.authenticated;
    state.isLoading = false;
    state.requires2FA = data.requires2FA ?? false;
    state.twoFactorComplete = data.twoFactorComplete ?? false;
    state.accessTokenExpired = data.accessTokenExpired ?? false;
    state.hasRefreshToken = data.hasRefreshToken ?? false;
    state.error = null;
    state.lastChecked = Date.now();

    notifyListeners();

  } catch (error) {
    console.error('[useViabilitySession] Error checking viability:', error);
    const state = getGlobalState();
    state.isLoading = false;
    state.error = error instanceof Error ? error.message : 'Unknown error';
    state.lastChecked = Date.now();
    notifyListeners();
  } finally {
    getGlobalState().checkInProgress = false;
  }
}

function notifyListeners() {
  const state = getGlobalState();
  state.listeners.forEach(listener => {
    try { listener(); } catch (e) { /* ignore */ }
  });
}

function startPolling(interval: number) {
  const state = getGlobalState();
  if (state.intervalId !== null) return; // Already polling

  state.intervalId = setInterval(() => {
    doViabilityCheck();
  }, interval);
}

function stopPolling() {
  const state = getGlobalState();
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

/**
 * Hook that provides Redis-backed session state
 */
export function useViabilitySession(options: UseViabilitySessionOptions = {}): ViabilityState {
  const {
    pollInterval = 30000,
    enablePolling = true,
    onSessionInvalid
  } = options;

  const { data: _sessionData, isPending } = authClient.useSession();
  const nextAuthStatus = isPending ? 'loading' : _sessionData ? 'authenticated' : 'unauthenticated';
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  // Register this component's onSessionInvalid callback
  useEffect(() => {
    if (onSessionInvalid) {
      const state = getGlobalState();
      state.onSessionInvalidCallbacks.add(onSessionInvalid);
      return () => {
        state.onSessionInvalidCallbacks.delete(onSessionInvalid);
      };
    }
  }, [onSessionInvalid]);

  // Subscribe to global state changes
  useEffect(() => {
    mountedRef.current = true;
    const listener = () => {
      if (mountedRef.current) {
        forceUpdate(n => n + 1);
      }
    };
    const state = getGlobalState();
    state.listeners.add(listener);

    return () => {
      mountedRef.current = false;
      state.listeners.delete(listener);
    };
  }, []);

  // Initial check when NextAuth status is determined - only once!
  useEffect(() => {
    if (nextAuthStatus === 'loading') {
      return;
    }

    const state = getGlobalState();

    // Only do initial check once globally
    if (!initializedRef.current && state.lastChecked === null) {
      initializedRef.current = true;
      doViabilityCheck();
    }
  }, [nextAuthStatus]);

  // Manage polling - only one interval for all hook instances
  useEffect(() => {
    if (!enablePolling || nextAuthStatus === 'loading') {
      return;
    }

    // Start polling if not already started
    startPolling(pollInterval);

    // Cleanup: only stop if this is the last listener
    return () => {
      const state = getGlobalState();
      // Small delay to allow other components to register
      setTimeout(() => {
        if (state.listeners.size === 0) {
          stopPolling();
        }
      }, 100);
    };
  }, [enablePolling, pollInterval, nextAuthStatus]);

  // Check viability on focus (user returns to tab) - with debounce
  useEffect(() => {
    const handleFocus = () => {
      const state = getGlobalState();
      // Debounce: only check if last check was > 10 seconds ago
      if (state.lastChecked !== null &&
          Date.now() - state.lastChecked > 10000) {
        doViabilityCheck();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Return current state
  const state = getGlobalState();
  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    requires2FA: state.requires2FA,
    twoFactorComplete: state.twoFactorComplete,
    accessTokenExpired: state.accessTokenExpired,
    hasRefreshToken: state.hasRefreshToken,
    error: state.error,
    lastChecked: state.lastChecked,
    refresh: doViabilityCheck
  };
}

/**
 * Simplified hook that just returns authentication status
 * Use this in components that only need to know if user is logged in
 */
export function useIsAuthenticated(): { isAuthenticated: boolean; isLoading: boolean } {
  const { isAuthenticated, isLoading } = useViabilitySession({
    pollInterval: 60000, // Less frequent polling for simple status
    enablePolling: true
  });

  return { isAuthenticated, isLoading };
}
