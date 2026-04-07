import 'server-only';
/**
 * Resolve the Better Auth signing secret (server-only).
 *
 * Priority:
 * 1) Use process.env.BETTER_AUTH_SECRET (preferred) or NEXTAUTH_SECRET (legacy)
 *    if present — allows overrides/production via env.
 * 2) Fetch from IDP broker endpoint — IDP handles all Key Vault/signing.
 * 3) Cache result in-memory and set process.env.BETTER_AUTH_SECRET for
 *    subsequent calls.
 *
 * NOTE on naming: this secret is the cryptographic key Better Auth uses to
 * sign session JWTs. The IDP backend still names the broker endpoint and
 * response field with the legacy "next-auth" / "nextAuthSecret" names; we
 * read both new and legacy on the wire during the migration window.
 */
export declare function resolveAuthSecret(): Promise<string>;
