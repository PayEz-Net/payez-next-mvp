export type MinimalSession = {
    user?: {
        id?: string | null;
        email?: string | null;
    } | null;
    accessToken?: string | null;
    expires?: string;
    [k: string]: any;
};
export type AppSession = MinimalSession;
/**
 * Strict session validation for client-side guards.
 * A session is considered valid when:
 * - a user object exists with non-empty id and email
 * - an accessToken string exists
 */
export declare function isValidSession(session: MinimalSession | null | undefined): boolean;
/**
 * Sanitize session data - returns null if session is invalid
 */
export declare function sanitizeSession(session: MinimalSession | null | undefined): MinimalSession | null;
