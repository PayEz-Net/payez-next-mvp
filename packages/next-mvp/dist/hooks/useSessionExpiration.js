"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionExpiration = useSessionExpiration;
const react_1 = require("react");
const react_2 = require("next-auth/react");
/**
 * Detects stale sessions and redirects to login
 *
 * Returns:
 * - `true` if session is valid (has accessToken)
 * - `false` if session is loading (no session yet)
 * - `null` if session is stale (will trigger redirect)
 */
function useSessionExpiration({ session, router, callbackUrl = '/dashboard', onExpired, redirectDelay = 1500, loginUrl = '/account-auth/login' }) {
    (0, react_1.useEffect)(() => {
        // If session exists but no accessToken, the token is stale/expired
        if (session && !session.accessToken) {
            const message = 'Your session has expired. Redirecting to login...';
            if (onExpired) {
                onExpired(message);
            }
            setTimeout(async () => {
                // Clear the session before redirecting
                await (0, react_2.signOut)({ redirect: false });
                const params = new URLSearchParams({
                    callbackUrl,
                    error: 'SessionExpired'
                });
                router.push(`${loginUrl}?${params.toString()}`);
            }, redirectDelay);
        }
    }, [session, router, callbackUrl, onExpired, redirectDelay, loginUrl]);
    // Return session validity state
    if (session && !session.accessToken) {
        return null; // Stale session - will redirect
    }
    if (session?.accessToken) {
        return true; // Valid session
    }
    return false; // No session yet - loading
}
