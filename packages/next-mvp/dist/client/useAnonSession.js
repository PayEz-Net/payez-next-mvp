"use strict";
/**
 * useAnonSession - React hook for anonymous session management
 *
 * Provides access to anonymous session preferences stored in Redis.
 * Works before user logs in, preferences persist across visits.
 */
'use client';
/**
 * useAnonSession - React hook for anonymous session management
 *
 * Provides access to anonymous session preferences stored in Redis.
 * Works before user logs in, preferences persist across visits.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnonSession = useAnonSession;
const react_1 = require("react");
/**
 * Hook to manage anonymous session state
 */
function useAnonSession() {
    const [session, setSession] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    // Fetch session on mount
    const fetchSession = (0, react_1.useCallback)(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch('/api/anon/preferences', {
                method: 'GET',
                credentials: 'include', // Important for cookies
            });
            if (!response.ok) {
                throw new Error('Failed to fetch preferences');
            }
            const data = await response.json();
            if (data.success && data.data) {
                setSession({
                    id: data.data.id,
                    preferences: data.data.preferences || {},
                    metrics: data.data.metrics || {},
                });
            }
        }
        catch (err) {
            console.error('[useAnonSession] Error fetching session:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        fetchSession();
    }, [fetchSession]);
    // Update preferences
    const updatePreferences = (0, react_1.useCallback)(async (preferences) => {
        try {
            setError(null);
            const response = await fetch('/api/anon/preferences', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ preferences }),
            });
            if (!response.ok) {
                throw new Error('Failed to update preferences');
            }
            const data = await response.json();
            if (data.success && data.data) {
                setSession(prev => prev ? {
                    ...prev,
                    preferences: data.data.preferences,
                } : null);
            }
        }
        catch (err) {
            console.error('[useAnonSession] Error updating preferences:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            throw err;
        }
    }, []);
    // Convenience method to set theme
    const setTheme = (0, react_1.useCallback)(async (theme) => {
        await updatePreferences({ theme });
    }, [updatePreferences]);
    return {
        session,
        isLoading,
        error,
        updatePreferences,
        setTheme,
        refresh: fetchSession,
    };
}
exports.default = useAnonSession;
