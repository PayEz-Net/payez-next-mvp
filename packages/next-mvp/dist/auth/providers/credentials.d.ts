/**
 * Credentials Provider
 *
 * Handles email/password authentication via PayEz IDP.
 * Creates Redis session and returns minimal user object to NextAuth.
 *
 * FLOW:
 * 1. User submits email/password
 * 2. We call IDP /api/ExternalAuth/login
 * 3. IDP returns tokens if credentials valid
 * 4. We create Redis session with tokens
 * 5. Return user object with redisSessionId to NextAuth
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
/**
 * Create the CredentialsProvider for NextAuth.
 *
 * This provider handles email/password login. The authorize function
 * is called when a user submits the login form.
 */
export declare function createCredentialsProvider(): import("next-auth/providers/credentials").CredentialsConfig<{
    email: {
        label: string;
        type: string;
    };
    password: {
        label: string;
        type: string;
    };
}>;
