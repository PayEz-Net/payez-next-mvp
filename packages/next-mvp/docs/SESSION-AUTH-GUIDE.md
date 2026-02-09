# PayEz MVP Session & 2FA Architecture Guide

Authoritative guide for package users integrating @payez/next-mvp into a Next.js App Router site with full authentication wired to idp.payez.net.

Scope:
- End-to-end auth flow (provisional → 2FA-complete)
- Session model (Redis-centered), cookies, TTLs, locks, and versioning
- How to wire API routes in a consuming Next.js app
- Practical examples (server and client)
- Testing and troubleshooting

---

## Big picture

- NextAuth keeps a signed JWT cookie. That cookie contains a sessionToken (UUID). The cookie is only a pointer.
- The source of truth for user state and tokens is Redis, keyed by that sessionToken.
- Initial login yields a provisional access token (ACR≈1, AMR may include 'pwd') that allows masked info and 2FA initiation.
- After user verifies a code (email/sms/TOTP), IDP returns new tokens (ACR=3, AMR includes 'mfa'). We update Redis and mark 2FA complete.
- The browser continues to use the same NextAuth cookie; the server resolves real auth from Redis using the pointer.

---

## Data model (Redis)

Key space (server-only):
- sess:{sessionToken} → JSON payload (see SessionData below)
- sessver:{sessionToken} → integer version counter (optimistic concurrency + freshness)
- user_session_lock:{userId} → short lock to enforce single-session policy (optional)
- refresh_lock:{sessionToken} → short lock to serialize refresh flows

Session payload (stored as JSON):
```ts path=null start=null
interface SessionData {
  userId: string;
  email: string;
  roles: string[] | string;
  twoFactorComplete: boolean;
  accessToken?: string;           // server-side only
  refreshToken?: string;          // server-side only
  accessTokenExpires?: number;    // ms epoch
  refreshTokenExpires?: number;   // ms epoch
  decodedAccessToken?: any;       // cached claims (iss, sub, exp, roles, amr, acr, ...)
  authenticationMethods?: string[]; // AMR
  authenticationLevel?: string;     // ACR ("1" before 2FA, typically "3" after)
  mfaCompletedAt?: number; mfaExpiresAt?: number; mfaValidityHours?: number;
  isDegradedMode?: boolean; degradedReason?: string;
  twoFactorSessionVerified?: boolean; // projection helper
  requiresTwoFactor?: boolean;        // projection helper
  twoFactorMethod?: string;           // 'email' | 'sms' | 'totp' | 'authenticator'
  sessionToken?: string;              // optional cached pointer
}
```

TTL strategy:
- If refreshTokenExpires is set, TTL ≈ (refreshTokenExpires - now) + buffer, clamped to [60s, 7d]
- If no refreshToken present → short TTL (15m) to avoid stale sessions lingering
- Version key (sessver:*) mirrors TTL and increments on every write

Single-session policy:
- On createSession, we optionally delete any existing sessions for same user/email (guarded by user_session_lock). Enable with ENFORCE_SINGLE_SESSION=true in production as needed.

---

## Auth flow (idp.payez.net)

1) Login (Credentials)
- POST to IDP login → returns access_token + refresh_token for a provisional session
- Server stores both tokens in Redis and creates sessionToken
- NextAuth JWT cookie gets a signed payload containing sessionToken (no refresh token leaks to client)

2) Start 2FA
- Client calls send-code endpoint (email or sms). Server forwards to IDP using the provisional access token.

3) Verify code
- Client submits verification code to server endpoint
- Server calls IDP verify endpoint with provisional token
- On success, IDP returns new access_token (+ refresh_token) reflecting 2FA (AMR + 'mfa', ACR=3)
- Server updates Redis session, marking twoFactorComplete=true

4) App session projection
- NextAuth session callback reads Redis and projects:
  - user.twoFactorSessionVerified = session.twoFactorComplete
  - user.requiresTwoFactor = !session.twoFactorComplete

Optional: After 2FA completion, you may trigger a background call to /api/auth/session to immediately refresh the browser’s derived session state.

---

## Package surface (@payez/next-mvp)

Exports you wire in your Next.js app:
- edge/middleware (route protection and 2FA gating)
- lib/auth (NextAuth options)
- lib/session-store (Redis session APIs)
- api-handlers/auth/{login, refresh, status, signout, jwks, verify-code}
- api-handlers/session/refresh-viability
- client/fetchWithSession (auto-refresh on 401/expired)

Environment variables (minimum):
- AUTH_TRUST_HOST=true, NEXTAUTH_SECRET (auto-fetched from IDP)
- REDIS_URL
- IDP_URL (e.g., https://idp.payez.net)
- CLIENT_ID

---

## Wiring in a consuming Next.js app

1) NextAuth routes
```ts path=null start=null
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@payez/next-mvp/lib/auth';
export const { GET, POST } = { GET: NextAuth(authOptions), POST: NextAuth(authOptions) } as any;
```

2) Core auth endpoints
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

// 2FA verify endpoint (generic)
// app/api/auth/verify-code/route.ts
export { POST } from '@payez/next-mvp/api-handlers/auth/verify-code';
```

3) Send-code endpoints (host example)
```ts path=null start=null
// app/api/account/send-code/route.ts (host app)
// Proxies to IDP /api/ExternalAuth/twofa/{email|sms}/send using the provisional access token
```

4) Middleware protection
```ts path=null start=null
// src/middleware.ts
export { middleware, config } from '@payez/next-mvp/edge/middleware';
```

---

## 2FA verification flow (server)

Generic verify-code (packaged):
- Reads sessionToken from NextAuth JWT cookie (or Authorization if provided)
- Calls IDP verify-code
- On success, computes token expiries and calls transitionTo2FASession(sessionToken, newTokens, method)
- Sets twoFactorComplete=true and updates AMR/ACR claims in Redis

Examples (host-provided routes)
```ts path=null start=null
// app/api/account/verify-email/route.ts
// 1) Accept code from client
// 2) Call IDP /twofa/email/verify with provisional access token
// 3) On success: transitionTo2FASession(sessionToken, access_token, refresh_token, exp, refreshExp, 'email')
// 4) Return normalized response

// app/api/account/verify-sms/route.ts
// Same as email, with 'sms' method
```

Utility (optional): centralized helper when the IDP response is already in-memory
```ts path=null start=null
// Pseudocode: use when you directly have { accessToken, refreshToken }
import { updateTokens, mark2FAComplete } from '@payez/next-mvp/lib/session-store';

await updateTokens(sessionToken, accessToken, refreshToken, accessTokenExpires, refreshTokenExpires);
await mark2FAComplete(sessionToken);
```

---

## Client usage patterns

Login:
```ts path=null start=null
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
// Success → cookie set; server created Redis session with provisional tokens
```

Send code (email or sms):
```ts path=null start=null
await fetch('/api/account/send-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ method: 'email' }) // or 'sms'
});
```

Verify code:
```ts path=null start=null
// Option A: use generic
await fetch('/api/auth/verify-code', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: verifyCode, method: 'email' })
});

// Option B: use host route (verify-email or verify-sms)
```

Fetching with auto-refresh:
```ts path=null start=null
import { fetchWithSession } from '@payez/next-mvp/client/fetchWithSession';
const res = await fetchWithSession('/api/secure/data');
```

---

## Guarding routes by 2FA

- Middleware (exported) enforces 2FA for certain paths.
- On the server, you can also check Redis state:
```ts path=null start=null
import { getToken } from 'next-auth/jwt';
import { getSession } from '@payez/next-mvp/lib/session-store';

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const sessionToken = (token as any)?.sessionToken as string | undefined;
  if (!sessionToken) return new Response('Unauthorized', { status: 401 });
  const session = await getSession(sessionToken);
  if (!session?.twoFactorComplete) return new Response('2FA required', { status: 403 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

---

## Token refresh & concurrency

- Access/refresh tokens live in Redis only (not exposed client-side)
- Use refresh endpoint to rotate tokens; package uses refresh_lock to serialize refresh
- sessver:* increments on writes; readers can detect freshness and avoid stomping newer data

Troubleshooting:
- If 2FA completes but the UI still shows pending, call GET /api/auth/session once on the client to sync the derived session
- Ensure NEXTAUTH_SECRET is consistent across processes (cookie decode fallbacks rely on it)
- Verify REDIS_URL accessibility and that keys sess:* are being created/updated

---

## cURL examples

```bash path=null start=null
# Login (credentials)
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"correct horse battery staple"}' \
  -i

# Send email code
curl -X POST http://localhost:3000/api/account/send-code \
  -H 'Content-Type: application/json' \
  --cookie 'next-auth.session-token=...' \
  -d '{"method":"email"}' -i

# Verify code (generic)
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H 'Content-Type: application/json' \
  --cookie 'next-auth.session-token=...' \
  -d '{"code":"123456","method":"email"}' -i
```

---

## Security notes

- Refresh tokens are never returned to the browser; they remain in Redis
- Cookie contains only a signed pointer (sessionToken) to Redis
- 2FA completion updates AMR/ACR server-side; client learns state from the NextAuth session callback projection
- Consider enabling single-session policy for production

---

## FAQ

- Q: Where is the session stored?
  - A: Redis (sess:{sessionToken}); the cookie is just a signed pointer.
- Q: How do I know if the user has completed 2FA?
  - A: session.user.twoFactorSessionVerified (NextAuth session projection) reads from Redis twoFactorComplete.
- Q: Can I access the raw tokens on the client?
  - A: No. Access/refresh tokens are server-only by design.
- Q: How long does a session live?
  - A: Up to refreshTokenExpires (clamped to max 7d) with a small buffer; short TTL when no refresh token present.
