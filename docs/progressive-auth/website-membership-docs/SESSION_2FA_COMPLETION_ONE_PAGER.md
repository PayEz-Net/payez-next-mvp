# 2FA Completion One-Pager (Server-Side)

Audience: API route authors and reviewers implementing 2FA verification flows.
Scope: website-membership (Next.js, NextAuth, Redis-backed sessions)

## TL;DR
- Source of truth for 2FA is Redis session: `twoFactorComplete`.
- After a successful 2FA verification with the IDP (email or SMS), store the fresh token pair into Redis and mark 2FA complete by calling:
  - `transitionTo2FASession(sessionToken, newAccessToken, refreshToken, accessTokenExpires, refreshTokenExpires, method)`
  - Location: `src/lib/session-store.ts`
- Optional but recommended: Immediately trigger `GET /api/auth/session` to force a JWT/session refresh so the browser sees `session.user.twoFactorSessionVerified = true` on the next request.
- Do NOT rely on `/api/auth/update-session` to flip server-side state. As implemented, it does not persist to Redis.

## Correct Flow (Happy Path)
1) Client submits a verification code (email or SMS) to our verification endpoint:
   - `/api/account/verify-email` or `/api/account/verify-sms`
2) Endpoint proxies to IDP using `proxy_to_idp()` and receives an upstream response that (on success) contains a fresh access/refresh token pair.
3) Endpoint extracts tokens from the unwrapped response and calls:
   - `transitionTo2FASession(sessionToken, accessToken, refreshToken, accessTokenExpires, refreshTokenExpires, 'email'|'sms')`
4) Optionally, the endpoint triggers a session refresh (`GET /api/auth/session`) so the client immediately sees updated session state.
5) Client continues with a fully authenticated session (no redirect loop back to verification).

## Do / Don’t
- DO: Treat Redis as the source of truth; update Redis via `transitionTo2FASession(...)` when 2FA completes.
- DO: Extract/derive `accessTokenExpires` and `refreshTokenExpires` (exp claims). If exp is missing, set a conservative default.
- DO: Keep logs free of token material. If you must log, redact or gate behind a development-only flag.
- DON’T: Depend on `/api/auth/update-session` to make 2FA persistent. It does not write to Redis.
- DON’T: Prefer raw Authorization headers over the server-side session tokens.
- DON’T: Ship code that completes 2FA without storing the fresh token pair; the session will remain in a pre-2FA state.

## Implementation Checklist (Verify Endpoints)
- Verify Email: `src/app/api/account/verify-email/route.ts`
- Verify SMS:  `src/app/api/account/verify-sms/route.ts`

After the `proxy_to_idp()` call returns a success response:
- [ ] Unwrap the response body (our proxy already unwraps compliant responses to `{ ... }`).
- [ ] Extract `access_token`, `refresh_token`, and expirations.
- [ ] Load `sessionToken` from NextAuth token (via `getToken({ req, secret })`).
- [ ] Call `transitionTo2FASession(sessionToken, access, refresh, accessExp, refreshExp, method)`.
- [ ] Optionally `await fetch('/api/auth/session', { method: 'GET', headers: { Cookie: ... } })` to force refresh.
- [ ] Return the proxied result to the client.

### Example (illustrative only)
```ts path=null start=null
// Inside verify-email or verify-sms handler, after proxy call succeeded
import { getToken } from 'next-auth/jwt';
import { transitionTo2FASession } from '@/lib/session-store';
import { getTokenExpiration } from '@/lib/token-utils';

const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
if (!nextAuthToken?.sessionToken) {
  return err('UNAUTHORIZED', 'No session token', { reason: 'no_session_token' }, 'account_verify', requestId, 401);
}

// Assume `data` is the unwrapped body from proxy_to_idp
const newAccessToken = data?.result?.access_token;
const newRefreshToken = data?.result?.refresh_token;
if (!newAccessToken || !newRefreshToken) {
  return err('UPSTREAM_SERVICE_ERROR', 'IDP did not return a fresh token pair', { endpoint, operation }, 'account_verify', requestId, 502);
}

const accessTokenExpires = getTokenExpiration(newAccessToken) ?? Date.now() + 55 * 60 * 1000;
const refreshTokenExpires = getTokenExpiration(newRefreshToken) ?? Date.now() + 3 * 24 * 60 * 60 * 1000;

await transitionTo2FASession(
  nextAuthToken.sessionToken,
  newAccessToken,
  newRefreshToken,
  accessTokenExpires,
  refreshTokenExpires,
  'email' // or 'sms'
);

// (Optional) Force immediate JWT/session refresh for the browser
// await fetch(new URL('/api/auth/session', req.url), {
//   method: 'GET',
//   headers: { Cookie: req.headers.get('Cookie') ?? '' },
//   credentials: 'include'
// });
```

## Acceptance Criteria (Definition of Done)
- Redis session now includes:
  - `accessToken` = fresh value
  - `refreshToken` = fresh value
  - `twoFactorComplete` = true
  - `authenticationMethods` includes `mfa`
  - `authenticationLevel` (ACR) = '3'
- Calling `/api/auth/session` returns `session.user.twoFactorSessionVerified = true`.
- No redirect loop back to verification when visiting protected pages.

## Troubleshooting
- IDP success but no token pair returned → Treat as an error; do not mark 2FA complete.
- Client keeps redirecting to verify page → Confirm Redis `twoFactorComplete` is true and that the session callback is reading it.
- Session refresh not visible → Ensure you either forced `/api/auth/session` or the client has performed a navigation/refresh.

## Security Notes
- Avoid logging token values. If absolutely necessary in development, gate under a DEBUG flag and never log full tokens.
- Rate limiting and verification middleware should remain enabled on verification endpoints.

## Related Docs
- `docs/SESSION_MANAGEMENT.md` (2FA completion and sync)
- `docs/SESSION_SYNC_ARCHITECTURE.md` (immediate session refresh pattern)
- `src/lib/session-store.ts` (`transitionTo2FASession`)
