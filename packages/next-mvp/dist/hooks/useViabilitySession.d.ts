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
export interface UseViabilitySessionOptions {
    /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
    pollInterval?: number;
    /** Whether to poll automatically (default: true) */
    enablePolling?: boolean;
    /** Callback when session becomes invalid */
    onSessionInvalid?: () => void;
}
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
/**
 * Hook that provides Redis-backed session state
 */
export declare function useViabilitySession(options?: UseViabilitySessionOptions): ViabilityState;
/**
 * Simplified hook that just returns authentication status
 * Use this in components that only need to know if user is logged in
 */
export declare function useIsAuthenticated(): {
    isAuthenticated: boolean;
    isLoading: boolean;
};
