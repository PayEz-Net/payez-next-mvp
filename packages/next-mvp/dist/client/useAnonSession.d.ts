/**
 * useAnonSession - React hook for anonymous session management
 *
 * Provides access to anonymous session preferences stored in Redis.
 * Works before user logs in, preferences persist across visits.
 */
export interface AnonPreferences {
    theme?: string;
    locale?: string;
    [key: string]: any;
}
export interface AnonMetrics {
    resumeGenerationCount?: number;
    firstVisit?: number;
    lastVisit?: number;
    visitCount?: number;
    [key: string]: any;
}
export interface AnonSession {
    id: string;
    preferences: AnonPreferences;
    metrics: AnonMetrics;
}
export interface UseAnonSessionReturn {
    session: AnonSession | null;
    isLoading: boolean;
    error: string | null;
    updatePreferences: (preferences: Partial<AnonPreferences>) => Promise<void>;
    setTheme: (theme: string) => Promise<void>;
    refresh: () => Promise<void>;
}
/**
 * Hook to manage anonymous session state
 */
export declare function useAnonSession(): UseAnonSessionReturn;
export default useAnonSession;
