Understood. Here’s a focused, comprehensive deep-dive on the current “as-is” and recommended “to-be” for both dev and prod, covering cookies, session architecture, the NextAuth secret, and where each value lives. I’ll also explain the HS256 change and why it matters.



Executive summary

•  Root problem: Production requests often include a legacy JWE-encrypted session cookie while our app now expects HS256-signed JWT cookies (demo mode). This “dual-cookie” situation makes NextAuth’s getToken() return null intermittently, which breaks 2FA completion and session checks.

•  Interim mitigation (in code now): We force HS256-signing for session cookies and added robust fallbacks to manually verify the HS256 cookie when getToken() returns null.

•  Longer-term fix: Return to a single cookie shape and algorithm across environments (preferably NextAuth’s default JWE in prod, optionally also in dev for parity), ensure one cookie name per environment, and remove TEST\_MODE/HS256 overrides once all clients are migrated and old cookies are cleared.



What HS256 is, and why you’re seeing it

•  HS256 is HMAC-SHA256. It signs (does not encrypt) the JWT with a symmetric secret. With HS256, the cookie contains a readable JWT payload (Base64URL), verifiable with NEXTAUTH\_SECRET.

•  NextAuth’s default for session cookies is JWE (alg=dir, enc=A256GCM). This encrypts the cookie payload; it can only be decrypted with the same NEXTAUTH\_SECRET.

•  If a browser still holds an old JWE cookie but the server expects HS256, NextAuth’s getToken() may pick up the wrong cookie/shape and fail to decode, yielding null.

•  You saw both kinds in logs: a JWE token like eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0... and an HS256 token like eyJhbGciOiJIUzI1NiJ9.... When both arrive on requests, reading/decoding logic is brittle unless you handle the ambiguity.



As-is, common mechanics (dev and prod)

•  Session model

◦  The JWT cookie contains only a sessionToken (UUID) and sub; all real session state (access/refresh tokens, AMR/ACR, MFA timestamps) is in Redis at keys like sess:{sessionToken}.

◦  TTL is dynamic: sessions with refresh tokens align TTL with refreshTokenExpires; sessions without refresh token (pre-2FA) get a short TTL (15 minutes). See src/lib/session-store.ts.

•  Call sites of getToken()

◦  Many API routes and middleware call NextAuth’s getToken({ req, secret }). This function expects the cookie shape and algorithm to match what NextAuth is configured for. If a legacy cookie or shape mismatch exists, it returns null.

◦  I added robust HS256 fallbacks at key choke points to decode the cookie yourself when getToken() returns null:

▪  src/lib/simple-api-handler.ts: manual HS256 verify of next-auth.session-token and \_\_Secure-next-auth.session-token cookies before giving up

▪  src/app/api/auth/status/route.ts: same fallback

▪  src/app/api/auth/complete-2fa/route.ts: same fallback (critical for 2FA completion)

▪  src/middleware/twofa-claims.ts: same fallback (2FA enforcement points)

•  NextAuth secret resolution

◦  The helper resolveNextAuthSecret() returns process.env.NEXTAUTH\_SECRET if set. If not, it fetches a secret from the IDP using NEXT\_INSTANCE\_ID/NEXT\_INSTANCE\_KEY, caches it, and sets process.env.NEXTAUTH\_SECRET in-process. See src/lib/nextauth-secret.ts.



As-is: development

•  Where values are set

◦  .env.local

▪  NEXTAUTH\_URL=http://localhost:3200

▪  NEXTAUTH\_SECRET=temporary-next-auth-key-for-stage-testing-and-stuff

▪  NODE\_ENV=development

▪  TEST\_MODE=true

▪  NEXT\_PUBLIC\_\* and IDP\_URL point to https://idp.payez.net (you flipped these to prod IDP as part of the demo)

•  Cookie behavior (dev)

◦  In src/lib/auth.ts we force HS256 signing and disable Secure cookies for demo:

▪  session.strategy='jwt'

▪  jwt.encode/decode explicitly use HS256 via jose

▪  useSecureCookies=false

▪  cookies.sessionToken.name='next-auth.session-token'

▪  cookies.sessionToken.options.sameSite='lax', secure=false

◦  Middleware and handlers use fallback HS256 verification as needed (since TEST\_MODE=true in dev, dev flows are forgiving).

•  Expected dev outcome

◦  Dev should only ever set an HS256-signed next-auth.session-token cookie.

◦  No JWE cookie should be present in dev unless the browser is carrying a legacy cookie from an earlier run. If you see a JWE-looking cookie in dev, clear cookies for localhost and retry.



As-is: production (AKS)

•  Where values are set

◦  Kubernetes secret created by pipeline (azure-pipelines.yml)

▪  payez-idp-secrets includes nextauth-secret (NEXTAUTH\_SECRET) and redis-url (REDIS\_URL)

◦  .env.production.local reflects intended prod:

▪  NEXTAUTH\_URL=https://api.payez.net

▪  NEXT\_PUBLIC\_\* and IDP\_URL=https://idp.payez.net

▪  NODE\_ENV=production

•  Cookie behavior (prod)

◦  Code currently forces HS256 signing and non-secure cookies (from the demo override in src/lib/auth.ts). That means:

▪  A new HS256 next-auth.session-token cookie is issued.

▪  If the browser still holds an older \_\_Secure-next-auth.session-token (JWE) from prior deployments, requests can include BOTH (we’ve seen this in logs).

▪  getToken() often returns null in prod because it’s expecting one algorithm/shape, while the request brings multiple shapes. The newly added fallbacks should decode HS256 manually when that happens.

•  Observed symptoms (from logs)

◦  getToken returned: null with raw cookie header showing both a JWE and an HS256 cookie.

◦  This confirms “half encryption present”: legacy JWE cookies are still in some clients while the server now issues HS256 cookies.



To-be: near-term, demo-safe plan (stabilize immediately)

Goal: Support HS256 cookies across the stack while gracefully ignoring any leftover JWE cookies.



•  Keep the current HS256 override for now in src/lib/auth.ts (already in place).

•  Rely on the fallbacks I added where getToken() returns null:

◦  Simple handler, auth/status, complete-2fa, and twofa-claims now attempt HS256 verification of candidate cookies before failing.

•  Ensure you deploy the image containing those fallbacks (jwt-demo-fix-v3). That should stop getToken()=null loops even when a legacy JWE cookie is present.

•  Add aggressive cookie cleanup on signout (already implemented) and optionally on login callback:

◦  Signout (already clears both next-auth.session-token and \_\_Secure-next-auth.session-token, and chunked variants).

◦  Optional: on the first authenticated redirect after login, set Set-Cookie deletes for both cookie names to purge legacy cookies. If you want, I can add a tiny post-login “cookie sanitation” endpoint and call it on the login callback.

•  Prod cookie flags for demo

◦  For the demo run, you can keep secure=false to avoid any edge case with intermediaries (already set).

◦  If you prefer Secure now, set useSecureCookies=true and keep HS256; but this creates a new cookie name (\_\_Secure-next-auth.session-token). If you do this, keep the fallbacks and cleanups to avoid new duplicates.



To-be: canonical end-state (remove demo mode drift)

Goal: One algorithm, one cookie name per environment, no fallbacks needed.



•  Algorithm choice

◦  Preferred for production: NextAuth default JWE (alg=dir, enc=A256GCM). This avoids exposing any session claims in plaintext cookies and is the library’s standard.

◦  For development: choose parity (also JWE) to avoid environment drift. You can keep Secure=false in dev (cookie name will be next-auth.session-token) and Secure=true in prod (cookie name \_\_Secure-next-auth.session-token).

•  Changes to make

◦  Remove HS256 overrides in src/lib/auth.ts:

▪  Delete the custom jwt.encode/decode blocks

▪  Restore default NextAuth behavior (let it do JWE)

▪  Remove TEST\_MODE uses and any cookies override (let NextAuth manage cookie naming and secure flags)

◦  Use Secure cookies in prod:

▪  Set useSecureCookies=true when NODE\_ENV=production

▪  Don’t hardcode cookies.sessionToken.name; let NextAuth pick \_\_Secure-next-auth.session-token automatically for https.

◦  Secret hygiene

▪  Ensure NEXTAUTH\_SECRET in prod is stable and not rotated inadvertently (rotating invalidates all existing cookies).

▪  Keep dev NEXTAUTH\_SECRET distinct from prod and stable enough during development.

•  Migration strategy (to avoid breakage while you transition)

◦  Short window where code reads both HS256 and JWE (like the current fallback), but writes only the final cookie type.

◦  Once telemetry shows no requests arrive with the old cookie, remove the fallbacks.

◦  A lighter option is to invalidate/clear all old cookies at login redirect and signout and move on quickly.



Where each critical setting lives and what it should be



•  Dev

◦  NEXTAUTH\_URL: http://localhost:3200 (.env.local)

◦  NEXTAUTH\_SECRET: any 32+ char random dev secret (.env.local)

◦  Node env: NODE\_ENV=development (.env.local)

◦  TEST\_MODE: false in steady state (in demo we had true); recommended to keep false once stable

◦  Cookie behavior: default NextAuth JWE, Secure=false, cookie name next-auth.session-token

◦  Session: Redis local (REDIS\_URL=redis://127.0.0.1:6379)

•  Prod

◦  NEXTAUTH\_URL: https://api.payez.net (K8S env)

◦  NEXTAUTH\_SECRET: set by K8S secret payez-idp-secrets (pipeline variables)

◦  Node env: NODE\_ENV=production (K8S env)

◦  TEST\_MODE: must be unset/false

◦  Cookie behavior: default NextAuth JWE, Secure=true, cookie name \_\_Secure-next-auth.session-token

◦  Session: Redis prod (K8S secret REDIS\_URL)



Operational verification checklist

•  After deploying jwt-demo-fix-v3 (HS256 fallbacks everywhere):

◦  Hit /api/auth/status and verify a 200 with userId; if 401 with “No session token”, a legacy JWE cookie is probably overshadowing the HS256 cookie; confirm the fallback got used by checking logs for \[JWT\_DEBUG] Fallback HS256 verification succeeded.

◦  Complete the 2FA flow and ensure /api/account/masked-info returns 200 (fallback logic reads Redis using sessionToken when getToken() is null).

•  Cookie audit:

◦  In browser devtools, Storage > Cookies for https://api.payez.net

▪  Confirm only one of these exists after login and a refresh:

▪  During demo: next-auth.session-token (HS256)

▪  After canonical migration: \_\_Secure-next-auth.session-token (JWE)

▪  If both appear, sign out to purge (our signout handler clears both names and chunks).

•  Secret audit:

◦  Confirm prod NEXTAUTH\_SECRET exists once in K8S secret (no multiple sources). Avoid mixing “fetch-from-IDP” path in prod; rely on the env secret via K8S.

◦  Keep dev/prod secrets distinct.



Recommended action plan for tomorrow

1\) Verify build and deploy of jwt-demo-fix-v3 (ACR and AKS). Then test:

•  Login -> 2FA -> Landing page

•  /api/auth/status returns success

•  /api/account/masked-info returns success

2\) If you still see getToken null in logs:

•  Sign out to purge cookies; sign in again

•  Optionally, I can add a tiny “cookie sanitation” endpoint to clear legacy \_\_Secure-next-auth.session-token and chunked names right after login

3\) Decide the canonical end-state:

•  If we standardize on JWE in prod (recommended), I’ll prepare a patch to remove HS256 overrides, restore default NextAuth behavior, and keep a temporary dual-reader (reads HS256 and JWE) plus forced writer (writes only JWE). After a day, we remove the dual-reader.

•  If you prefer to stay HS256 for a longer demo phase, we’ll keep current overrides but turn useSecureCookies=true in prod and update fallbacks accordingly.

4\) Update secrets/documentation:

•  Confirm NEXTAUTH\_SECRET management: K8S secret only in prod; dev in .env.local

•  Document the migration date and any expected sign-outs



Key file references you may want to skim

•  NextAuth overrides (demo HS256)

◦  src/lib/auth.ts around lines 230–304 (session strategy + HS256 encode/decode + cookies)

•  Secret resolver

◦  src/lib/nextauth-secret.ts

•  Fallback decoders I added

◦  src/lib/simple-api-handler.ts around token extraction

◦  src/app/api/auth/status/route.ts

◦  src/app/api/auth/complete-2fa/route.ts

◦  src/middleware/twofa-claims.ts

•  Signout cleanup (clears both legacy and current cookies)

◦  src/app/api/auth/signout/route.ts

