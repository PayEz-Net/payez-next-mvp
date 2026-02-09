# Next.CrytAply Handoff: What’s New in @payez/next-mvp and How to Use It

This document summarizes the new auth/session features added to @payez/next-mvp and how to wire them in a Next.js App Router host (next.cryptaply).

## What’s New

- Centralized IDP fetch
  - lib/idp-fetch.ts: `idpFetchJSON(req, url, init)` injects Bearer from Redis session, treats tokens “near expiry” as expired, triggers one refresh, retries once, returns `{ ok, status, json, attemptedRefresh }`.
- New API handlers (exports fixed/added)
  - api-handlers/auth/verify-code (export fixed): completes 2FA by replacing provisional tokens and marking `twoFactorComplete`.
  - api-handlers/auth/validate: calls IDP validate to sanity-check current bearer (used by strict expiry derivation).
  - api-handlers/account/masked-info (GET): reference endpoint to hit IDP masked-info via `idpFetchJSON` (proves provisional→masked-info works out-of-the-box).
- Strict expiry derivation (no made-up fallbacks)
  - lib/auth.ts (login): if JWT lacks `exp`, calls IDP validate to derive `exp`/`expires_in`; if absent → fail login.
  - api-handlers/auth/refresh.ts: if decode fails, calls IDP validate once to derive `exp`; if absent → fail refresh.
- Pre‑expiry buffer (refresh a few minutes early)
  - lib/idp-fetch.ts: considers access tokens expired when ≤ 5 minutes left (proactive refresh before calling IDP).
  - lib/refresh-token-validator.ts: `/api/session/refresh-viability` reports `accessTokenExpired` when remaining ≤ 300s (middleware refresh, not redirect).
- Updated exports in package.json
  - `./lib/idp-fetch`, `./lib/simple-api-handler` (exposed), `./api-handlers/account/masked-info`, `./api-handlers/auth/validate`, and `./api-handlers/auth/verify-code` (fixed).

## Wiring in a Host (Next.js App Router)

- NextAuth
```ts path=null start=null
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@payez/next-mvp/lib/auth';
export const { GET, POST } = { GET: NextAuth(authOptions), POST: NextAuth(authOptions) } as any;
```

- Core auth endpoints
```ts path=null start=null
// app/api/auth/login/route.ts
export { POST } from '@payez/next-mvp/api-handlers/auth/login';

// app/api/auth/refresh/route.ts
export { POST } from '@payez/next-mvp/api-handlers/auth/refresh';

// app/api/auth/status/route.ts
export { GET } from '@payez/next-mvp/api-handlers/auth/status';

// app/api/auth/signout/route.ts
export { POST } from '@payez/next-mvp/api-handlers/auth/signout';

// app/api/auth/jwks/route.ts
export { GET } from '@payez/next-mvp/api-handlers/auth/jwks';

// app/api/auth/verify-code/route.ts   (NEW export fixed)
export { POST } from '@payez/next-mvp/api-handlers/auth/verify-code';

// app/api/auth/validate/route.ts      (NEW)
export { GET } from '@payez/next-mvp/api-handlers/auth/validate';

// app/api/session/refresh-viability/route.ts (unchanged)
export { GET } from '@payez/next-mvp/api-handlers/session/refresh-viability';
```

- Account example endpoint (POST)
```ts path=null start=null
// app/api/account/masked-info/route.ts
export { POST } from '@payez/next-mvp/api-handlers/account/masked-info';
```

- Middleware
```ts path=null start=null
// src/middleware.ts
export { middleware, config } from '@payez/next-mvp/edge/middleware';
```

## Using the Centralized Fetch

Prefer `idpFetchJSON` for IDP calls inside host routes:
```ts path=null start=null
import { idpFetchJSON } from '@payez/next-mvp/lib/idp-fetch';
import { ENV_CONFIG } from '@payez/next-mvp/config/env';

export async function GET(req: Request) {
  const url = `${ENV_CONFIG.IDP_BASE_URL}/api/ExternalAuth/some-endpoint`;
  const r = await idpFetchJSON(req as any, url, { method: 'GET' });
  if (!r.ok) return new Response(JSON.stringify(r.json ?? {}), { status: r.status });
  return new Response(JSON.stringify(r.json ?? {}), { status: 200 });
}
```
Behavior baked-in: session pointer cookie → Redis session → if token ≤ few minutes remaining, POST `/api/auth/refresh` once → retry original IDP call.

## 2FA Flow (Out-of-the-Box)

- Login yields provisional tokens in Redis; UI can call masked-info safely.
- Send verification code: host owns “send-code” endpoints (intentionally not packaged).
- Verify code: use `@payez/next-mvp/api-handlers/auth/verify-code`; it transitions session to `twoFactorComplete` and writes new tokens with ACR/AMR.
- Session sync: middleware + refresh-viability + pre-expiry buffer prevents redirect loops post-2FA.

## Environment

- AUTH_TRUST_HOST, NEXTAUTH_SECRET (auto-fetched from IDP), REDIS_URL, IDP_URL, CLIENT_ID.

## Operational Notes

- Refresh is single-source-of-truth at `/api/auth/refresh` (Redis lock enforced; losers get 409).
- The “few minutes early” policy is consistent across host and package (currently 300s). To change the threshold:
  - MVP: adjust in `src/lib/idp-fetch.ts` and `src/lib/refresh-token-validator.ts`.
  - Host: adjust in `src/lib/refresh-token-validator.ts`.

## Smoke Test Checklist

- Login → masked-info → should not show “expired token” (refresh is proactive).
- Complete 2FA → protected pages accessible; `session.twoFactorComplete` true; middleware no longer redirects.
- Force-expire (dev scripts) → first request triggers refresh; subsequent requests use fresh tokens; no duplicate refresh storms (losers receive 409).
