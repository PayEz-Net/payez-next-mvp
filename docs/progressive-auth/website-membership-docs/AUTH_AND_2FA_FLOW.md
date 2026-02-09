# Authentication & 2FA Security Logic

## Key Files

### 1. `src/middleware.ts`
- **Purpose:** Centralizes all authentication and 2FA enforcement for protected routes.
- **Handles:**
  - Redirects to login if not authenticated or token expired.
  - Redirects to 2FA verification if required.
  - Allows access if all checks pass.
- **Key Variables:**
  - `token.accessToken`
  - `token.accessTokenExpires`
  - `token.requiresTwoFactor`
  - `token.twoFactorSessionVerified`

---

### 2. `src/app/account-auth/login/page.tsx`
- **Purpose:** Renders the login form and handles credential submission.
- **No longer handles:** Any client-side redirect based on session state (all handled by middleware).
- **Key Variables:**
  - `session` (from `useSession()`)
  - `status` (from `useSession()`)
  - `loginError` (local state for error display)

---

### 3. `src/app/account-auth/verify-code/page.tsx`
- **Purpose:** Renders the 2FA code entry form and handles code submission.
- **No longer handles:** Any client-side redirect based on session state (all handled by middleware).
- **Key Variables:**
  - `session` (from `useSessionHelper()`)
  - `status` (from `useSessionHelper()`)
  - `twoFactorSessionVerified` (from `session.user`)
  - `requiresTwoFactor` (from `session.user`)
  - `callbackUrl` (from query params)
  - `onSubmit` (handles code verification and post-success redirect)

---

### 4. `src/app/api/auth/verify-2fa/route.ts`
- **Purpose:** API route to verify the 2FA code.
- **Handles:**
  - Checks the code and updates the session/JWT to set `twoFactorSessionVerified: true` on success.
  - Redirects to the callback URL on success.

---

### 5. `src/utils/twoFactor.ts`
- **Purpose:** Utility functions for 2FA, including checking and updating `twoFactorSessionVerified`.

---

### 6. `src/utils/withApiAuthRefresh.ts` & `src/utils/withClientAuthRefresh.ts`
- **Purpose:** Helpers for refreshing tokens and ensuring valid sessions for API routes and client code.

---

## Key Variables & Their Roles

| Variable                    | Where Used                        | Purpose                                                                 |
|-----------------------------|-----------------------------------|-------------------------------------------------------------------------|
| `accessToken`               | JWT/session, middleware, utils    | Main authentication token                                               |
| `accessTokenExpires`        | JWT/session, middleware           | Expiry timestamp for access token                                       |
| `requiresTwoFactor`         | JWT/session, middleware, 2FA page | Indicates if user must complete 2FA                                     |
| `twoFactorSessionVerified`  | JWT/session, middleware, 2FA page | Indicates if user has completed 2FA for this session                    |
| `callbackUrl`               | Query param, middleware, 2FA page | Where to redirect after login/2FA success                               |
| `token`                     | middleware, API routes            | The decoded JWT/session object                                          |
| `session`                   | login/2FA pages, hooks            | The current user session (from NextAuth or custom hook)                 |

---

## How the Flow Works

1. **User visits a protected route** (`/dashboards/...`):
   - `middleware.ts` checks for a valid session and token.
   - If not authenticated, redirects to `/account-auth/login`.
   - If 2FA required and not completed, redirects to `/account-auth/verify-code`.

2. **User logs in**:
   - `login/page.tsx` submits credentials.
   - On success, user is redirected (by middleware) to `/account-auth/verify-code` if 2FA is required.

3. **User completes 2FA**:
   - `verify-code/page.tsx` submits the code.
   - On success, API updates the session/JWT to set `twoFactorSessionVerified: true`.
   - User is redirected to the original destination (`callbackUrl`).

4. **All subsequent requests**:
   - Middleware allows access if `twoFactorSessionVerified` is true.

---

## Debugging Tips

- **All access control and redirects are in `middleware.ts`.**
- **Session/JWT must be updated after 2FA to set `twoFactorSessionVerified: true`.**
- **Login and 2FA pages should not perform any session-based redirects.**
- **If you see a redirect loop, check the JWT/session for the correct flags.** 