import 'server-only';
/**
 * Resolve the NextAuth secret (server-only).
 *
 * Priority:
 * 1) Use process.env.NEXTAUTH_SECRET if present (allows overrides/production)
 * 2) Fetch from IDP broker endpoint - IDP handles all Key Vault/signing
 * 3) Cache result in-memory and set process.env.NEXTAUTH_SECRET for subsequent calls
 */
export declare function resolveNextAuthSecret(): Promise<string>;
