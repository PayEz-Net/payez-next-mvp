"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAuthSecret = resolveAuthSecret;
require("server-only");
const secret_validation_1 = require("./secret-validation");
const crypto_1 = require("crypto");
let cachedSecret = null;
let lastFetchedAt = 0;
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
async function resolveAuthSecret() {
    // Check if already in environment (prefer new name, fall back to legacy)
    const envSecret = (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.trim() !== ''
        ? process.env.BETTER_AUTH_SECRET
        : undefined) ||
        (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.trim() !== ''
            ? process.env.NEXTAUTH_SECRET
            : undefined);
    if (envSecret) {
        // Silent - already configured
        return envSecret;
    }
    // Check if cached and fresh (within 5 minutes)
    if (cachedSecret && Date.now() - lastFetchedAt < 5 * 60 * 1000) {
        return cachedSecret;
    }
    // Broker mode: fetch from IDP (IDP handles all Key Vault/signing)
    const base = process.env.IDP_URL;
    if (!base)
        throw new Error('IDP_URL environment variable is required');
    const clientIdStr = process.env.CLIENT_ID;
    if (!clientIdStr || clientIdStr.trim() === '')
        throw new Error('CLIENT_ID is required (e.g., "ideal_resume_website")');
    // Step 1: Request IDP to sign a client assertion (IDP has the keys, not us)
    const signingUrl = new URL(`${base.replace(/\/$/, '')}/api/ExternalAuth/sign-client-assertion`);
    const signingPayload = {
        issuer: clientIdStr,
        subject: clientIdStr,
        audience: 'urn:payez:externalauth:nextauthsecret',
        expires_in: 60,
    };
    const signingResp = await fetch(signingUrl.toString(), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Client-Id': clientIdStr,
            'X-Correlation-Id': (0, crypto_1.randomUUID)().replace(/-/g, ''),
        },
        body: JSON.stringify(signingPayload),
        cache: 'no-store'
    });
    if (!signingResp.ok) {
        const txt = await signingResp.text().catch(() => 'Unknown error');
        throw new Error(`Failed to sign client assertion: ${signingResp.status} ${signingResp.statusText} - ${txt}`);
    }
    const signingBody = await signingResp.json().catch(() => ({}));
    const client_assertion = (signingBody?.data?.client_assertion ??
        signingBody?.data?.clientAssertion ??
        signingBody?.client_assertion ??
        signingBody?.clientAssertion ??
        signingBody?.data?.ClientAssertion ??
        signingBody?.ClientAssertion);
    if (!client_assertion || typeof client_assertion !== 'string') {
        throw new Error('IDP did not return a valid signed client assertion');
    }
    // Step 2: Use the signed assertion to fetch the auth secret
    // (Endpoint is still served at /next-auth/secret on the IDP — legacy path.)
    const proxyUrl = new URL(`${base.replace(/\/$/, '')}/api/ExternalAuth/next-auth/secret`);
    const proxyResp = await fetch(proxyUrl.toString(), {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Client-Id': clientIdStr,
            'X-Correlation-Id': (0, crypto_1.randomUUID)().replace(/-/g, ''),
        },
        body: JSON.stringify({ client_assertion }),
        cache: 'no-store'
    });
    if (!proxyResp.ok) {
        const txt = await proxyResp.text().catch(() => 'Unknown error');
        throw new Error(`Proxy error: ${proxyResp.status} ${proxyResp.statusText} - ${txt}`);
    }
    const proxyBody = await proxyResp.json().catch(() => ({}));
    const secret = (proxyBody?.data?.secret ?? proxyBody?.secret);
    // Configuration is available but we don't log it verbosely
    if (!secret || typeof secret !== 'string') {
        throw new Error('Proxy did not return a valid auth secret');
    }
    const validation = (0, secret_validation_1.validateAuthSecret)(secret);
    if (!validation.valid) {
        throw new Error(`Fetched auth secret failed validation: ${validation.reason}`);
    }
    cachedSecret = secret;
    lastFetchedAt = Date.now();
    process.env.BETTER_AUTH_SECRET = secret;
    // Also set legacy name during transition so any consumer still reading
    // process.env.NEXTAUTH_SECRET keeps working until they upgrade.
    process.env.NEXTAUTH_SECRET = secret;
    console.log('[AUTH-SECRET] Resolved from IDP (length:', secret.length + ')');
    return secret;
}
