/**
 * Hook to detect and handle stale/expired sessions during 2FA flow
 *
 * Use this in verify-code pages to automatically redirect to login
 * when the provisional bearer token has expired.
 *
 * @example
 * ```tsx
 * import { useSessionExpiration } from '@payez/next-mvp/hooks/useSessionExpiration';
 *
 * function VerifyCodePage() {
 *   const { data: session } = useSession();
 *   const router = useRouter();
 *   const searchParams = useSearchParams();
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
 *
 *   // Automatically handles session expiration
 *   const sessionValid = useSessionExpiration({
 *     session,
 *     router,
 *     callbackUrl,
 *     onExpired: (message) => setError(message)
 *   });
 *
 *   if (!sessionValid) return null; // Will redirect
 *   // ... rest of component
 * }
 * ```
 */
import type { Session } from 'next-auth';
export interface UseSessionExpirationOptions {
    /** NextAuth session object */
    session: Session | null | undefined;
    /** Next.js router for navigation */
    router: {
        push: (url: string) => void;
    };
    /** URL to redirect to after login */
    callbackUrl?: string;
    /** Callback when session expires - use to set error state */
    onExpired?: (message: string) => void;
    /** Delay before redirect in milliseconds (default: 1500) */
    redirectDelay?: number;
    /** Custom redirect URL (default: /account-auth/login) */
    loginUrl?: string;
}
/**
 * Detects stale sessions and redirects to login
 *
 * Returns:
 * - `true` if session is valid (has accessToken)
 * - `false` if session is loading (no session yet)
 * - `null` if session is stale (will trigger redirect)
 */
export declare function useSessionExpiration({ session, router, callbackUrl, onExpired, redirectDelay, loginUrl }: UseSessionExpirationOptions): boolean | null;
