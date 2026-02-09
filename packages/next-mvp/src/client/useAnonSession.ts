/**
 * useAnonSession - React hook for anonymous session management
 *
 * Provides access to anonymous session preferences stored in Redis.
 * Works before user logs in, preferences persist across visits.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

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
export function useAnonSession(): UseAnonSessionReturn {
  const [session, setSession] = useState<AnonSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session on mount
  const fetchSession = useCallback(async () => {
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
    } catch (err) {
      console.error('[useAnonSession] Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences: Partial<AnonPreferences>) => {
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
    } catch (err) {
      console.error('[useAnonSession] Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  // Convenience method to set theme
  const setTheme = useCallback(async (theme: string) => {
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

export default useAnonSession;
