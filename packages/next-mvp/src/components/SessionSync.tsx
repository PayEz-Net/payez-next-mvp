'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useAuthStore } from '../stores/authStore';
import { isValidSession } from '../lib/session';
import {
  getSecureSessionCookieName,
  getSecureCsrfCookieName,
  getCallbackUrlCookieName
} from '../lib/app-slug';

/**
 * Sanitize sensitive data for logging
 * Never log full user IDs or emails in any environment
 */
function sanitizeForLog(value: string | undefined, type: 'email' | 'userId'): string {
  if (!value) return '(empty)';
  
  if (type === 'email') {
    return '***@***'; // Never log emails
  }
  
  if (type === 'userId') {
    // Only show first 8 chars in development
    if (process.env.NODE_ENV === 'development') {
      return value.substring(0, 8) + '...';
    }
    return '***'; // Fully redact in production
  }
  
  return '***';
}

/**
 * SessionSync - Bridges NextAuth session with Zustand auth store
 * 
 * CRITICAL: This component enforces strict session validation. If NextAuth
 * reports an authenticated status but the session data is invalid (empty user ID,
 * empty email, or missing access token), it forces a sign-out to prevent
 * contradictory state like "hasSession: true, userId: ''"
 * 
 * This ensures the app NEVER shows authenticated UI with empty/invalid session data.
 */
export function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setSession, clearSession } = useAuthStore();
  
  // Guard against duplicate sign-out calls
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    // Only process when NextAuth has finished loading
    if (status === 'loading') {
      return;
    }

    // Strict validation: Check if session is actually valid
    const isValid = isValidSession(session);

    // CRITICAL FIX: If NextAuth says "authenticated" but session is invalid,
    // this is a broken state that must be fixed immediately
    if (status === 'authenticated' && !isValid) {
      // GUARD: Prevent duplicate sign-out
      if (isSigningOutRef.current) {
        console.warn('[SessionSync] Sign-out already in progress, skipping');
        return;
      }
      isSigningOutRef.current = true;
      
      console.error('[SessionSync] CRITICAL: Invalid session detected despite authenticated status!');
      console.error('[SessionSync] This indicates a session with empty user data - forcing sign-out');
      
      // Log diagnostic info with PII redaction
      // Note: session is typed as Session | null from NextAuth, but may have invalid/partial data
      const sessionData = session as any; // Explicit cast needed for error logging
      console.error('[SessionSync] Session data:', {
        hasSessionObject: !!sessionData,
        hasUser: !!sessionData?.user,
        userId: sanitizeForLog(sessionData?.user?.id, 'userId'),
        userEmail: sanitizeForLog(sessionData?.user?.email, 'email'),
        hasAccessToken: !!sessionData?.accessToken,
      });
      
      // Clear the auth store immediately
      clearSession();

      // FIX: Force clear all auth cookies including stale provisional tokens (app-slug prefixed)
      // This prevents infinite loop when provisional token exists but session is invalid
      // Root cause: OAuth creates provisional token before Redis session exists
      try {
        const secureSession = getSecureSessionCookieName();
        const secureCsrf = getSecureCsrfCookieName();
        const callbackUrl = getCallbackUrlCookieName();
        document.cookie = `${secureSession}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Lax`;
        document.cookie = `${secureCsrf}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
        document.cookie = `__Secure-${callbackUrl}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; SameSite=Lax`;
      } catch (e) {
        // Cookie clearing failed - non-critical, continue with signout
      }

      // Force NextAuth to sign out (this will clear cookies and trigger redirect)
      signOut({ redirect: false })
        .then(() => {
          if (isMounted) {
            // Use generic error code instead of implementation details
            window.location.href = '/account-auth/login?error=SessionExpired&code=1001';
          }
        })
        .catch((err) => {
          console.error('[SessionSync] Error during forced signout:', err);
          if (isMounted) {
            window.location.href = '/account-auth/login?error=SessionExpired&code=1001';
          }
        });
      
      return;
    }

    // Normal flow: Update store based on valid session status
    if (status === 'authenticated' && isValid) {
      setSession(session);
    } else if (status === 'unauthenticated') {
      clearSession();
    }
    
    // Cleanup function to prevent post-unmount updates
    return () => {
      isMounted = false;
    };
  }, [session, status, setSession, clearSession]);

  return <>{children}</>;
}
