# Account Recovery Integration Plan (Unbranded, Out-of-the-Box)

Below is a precise, copy/paste-ready prompt for an implementer to update `E:\Repos\PayEz-Next-MVP` with an unbranded, out-of-the-box account recovery flow based on website-membership’s `acct-recovery-front-end.md`. Follow exactly.

## objective
- implement a complete, unbranded account recovery flow (page + api routes + client methods + types) in `packages/next-mvp` so consuming apps can copy the page and re-export api routes to work immediately.
- DO NOT add branded styles; mirror the plain, light style already used in `packages/next-mvp/src/pages/verify-code/page.tsx`.
- expose new api-handlers via package exports so `examples/minimal-app` and downstream apps can re-export route handlers.

## constraints
- next: app router expected by consumers, but this repo stores template pages in `packages/next-mvp/src/pages/...` (to be copied into a consumer app’s `src/app/...`).
- use only react + tailwind (no MUI/NextUI).
- keep snake_case for idp payload fields and responses.
- envs required: `IDP_BASE_URL`, `NEXTAUTH_SECRET`, `CLIENT_ID` (`NEXT_PUBLIC_IDP_CLIENT_ID` acceptable)

## deliverables
- new types: `packages/next-mvp/src/types/recovery.ts`
- api client updates: `packages/next-mvp/src/utils/api.ts` (remove mocks; add real methods)
- new api handlers (proxied to idp):
  - `packages/next-mvp/src/api-handlers/account/recovery/initiate.ts`
  - `packages/next-mvp/src/api-handlers/account/recovery/send-code.ts`
  - `packages/next-mvp/src/api-handlers/account/recovery/verify-code.ts`
  - `packages/next-mvp/src/api-handlers/account/reset-password.ts`
- package exports updated in `packages/next-mvp/package.json`
- new unbranded recovery page template:
  - `packages/next-mvp/src/pages/recovery/page.tsx` (template for consumer’s `src/app/account-auth/recovery/page.tsx`)
  - `packages/next-mvp/src/components/recovery/{InitiateRecoveryStep.tsx, SelectMethodStep.tsx, VerifyCodeStep.tsx, SetPasswordStep.tsx, CompleteStep.tsx}`
- login template uplift: show “account lockout warning” + CTA to recovery when `attempts_remaining <= 1`

## phase_0_prepare
- read: `E:\Repos\website-membership\docs\ux-design\acct-recovery-front-end.md` (source-of-truth for flow and interfaces).
- study: `packages/next-mvp/src/pages/verify-code/page.tsx` (use its unbranded, light style as your styling baseline).
- note: api-handlers already exist for masked-info/send-code/verify-sms/verify-email; these are for 2FA after login, not account recovery. new recovery endpoints are public/provisional-token-based and must not require next-auth session.

## phase_1_types
- create `packages/next-mvp/src/types/recovery.ts` with these types (snake_case aligned with idp):
```ts
export type RecoveryStep = 'initiate' | 'select-method' | 'verify-code' | 'set-password' | 'complete';

export interface RecoverySession {
  recoveryToken: string;
  email: string;
  maskedEmail?: string;
  maskedPhone?: string;
  hasAuthenticator?: boolean;
  availableMethods: Array<'email' | 'sms' | 'authenticator'>;
  expiresAt: string;
}

export interface PasswordResetToken {
  token: string;
  expiresAt: string;
}

export interface RecoveryError {
  code: string;
  message: string;
  attemptsRemaining?: number;
}

export interface RecoveryInitiateResponse {
  success: boolean;
  data: {
    recovery_session_token?: string;
    masked_email?: string;
    masked_phone?: string;
    has_authenticator?: boolean;
    available_methods?: Array<'email' | 'sms' | 'authenticator'>;
    expires_at?: string;
    message?: string;
  };
}

export interface SendCodeResponse {
  success: boolean;
  data: {
    method: string;
    masked_destination: string;
    code_length: number;
    expires_in: number;
  };
}

export interface VerifyCodeResponse {
  success: boolean;
  data?: {
    password_reset_token: string;
    expires_at: string;
  };
  error?: RecoveryError;
}
```

## phase_2_api_client
- edit `packages/next-mvp/src/utils/api.ts`:
  - remove mocked methods:
    - `sendResetCode(email: string)`
    - `verifyResetCode(email: string, code: string)`
  - add real recovery methods:
```ts
class AccountApi {
  async initiateRecovery(email: string) {
    const res = await fetch('/api/account/recovery/initiate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Failed to initiate recovery');
    return res.json();
  }

  async sendRecoveryCode(recoveryToken: string, method: 'email' | 'sms' | 'authenticator') {
    const res = await fetch('/api/account/recovery/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recoveryToken}` },
      body: JSON.stringify({ method }),
    });
    if (!res.ok) throw new Error('Failed to send recovery code');
    return res.json();
  }

  async verifyRecoveryCode(recoveryToken: string, code: string, method: string) {
    const res = await fetch('/api/account/recovery/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recoveryToken}` },
      body: JSON.stringify({ code, method }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      throw new Error(e?.error?.message || 'Invalid verification code');
    }
    return res.json();
  }

  async resetPasswordWithToken(email: string, resetToken: string, newPassword: string, confirmPassword: string) {
    const res = await fetch('/api/account/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password_reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    if (!res.ok) throw new Error('Failed to reset password');
    return res.json();
  }
}
```
- ensure exported instance remains: `export const accountApi = new AccountApi();`

## phase_3_api_handlers
- create these files under `packages/next-mvp/src/api-handlers/account/recovery/`:

1) `initiate.ts` (public, no next-auth token)
  - POST -> IDP: `${IDP_BASE_URL}/api/Account/recovery/initiate`
  - request: `{ email }`
  - response: pass through normalized json (preserve snake_case fields)
```ts
import { NextRequest, NextResponse } from 'next/server';

const IDP = process.env.IDP_BASE_URL || process.env.IDENTITY_SERVICE_URL || 'http://localhost:32785';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const upstream = await fetch(`${IDP}/api/Account/recovery/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'initiate_failed' }, { status: 500 });
  }
}
```

2) `send-code.ts` (public; requires recovery session bearer)
  - header: `Authorization: Bearer <recovery_session_token>`
  - POST -> `${IDP}/api/Account/recovery/send-code` with `{ method }`
```ts
import { NextRequest, NextResponse } from 'next/server';
const IDP = process.env.IDP_BASE_URL || process.env.IDENTITY_SERVICE_URL || 'http://localhost:32785';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const { method } = await req.json();
    const upstream = await fetch(`${IDP}/api/Account/recovery/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ method }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'send_code_failed' }, { status: 500 });
  }
}
```

3) `verify-code.ts` (public; requires recovery session bearer)
  - POST -> `${IDP}/api/Account/recovery/verify-code` with `{ code, method }`
```ts
import { NextRequest, NextResponse } from 'next/server';
const IDP = process.env.IDP_BASE_URL || process.env.IDENTITY_SERVICE_URL || 'http://localhost:32785';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const { code, method } = await req.json();
    const upstream = await fetch(`${IDP}/api/Account/recovery/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code, method }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'verify_code_failed' }, { status: 500 });
  }
}
```

4) `reset-password.ts` (public; accepts password_reset_token)
  - POST -> `${IDP}/api/Account/reset-password` with:
    `{ email, password_reset_token, new_password, confirm_password }`
```ts
import { NextRequest, NextResponse } from 'next/server';
const IDP = process.env.IDP_BASE_URL || process.env.IDENTITY_SERVICE_URL || 'http://localhost:32785';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json(); // expects snake_case fields
    const upstream = await fetch(`${IDP}/api/Account/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'reset_password_failed' }, { status: 500 });
  }
}
```

## phase_4_package_exports
- update `packages/next-mvp/package.json` exports to include:
  - `"./api-handlers/account/recovery/initiate": "./src/api-handlers/account/recovery/initiate.ts"`
  - `"./api-handlers/account/recovery/send-code": "./src/api-handlers/account/recovery/send-code.ts"`
  - `"./api-handlers/account/recovery/verify-code": "./src/api-handlers/account/recovery/verify-code.ts"`
  - `"./api-handlers/account/reset-password": "./src/api-handlers/account/reset-password.ts"`
- also add missing exports for existing handlers (optional but recommended):
  - `"./api-handlers/account/send-code": "./src/api-handlers/account/send-code.ts"`
  - `"./api-handlers/account/verify-email": "./src/api-handlers/account/verify-email.ts"`
  - `"./api-handlers/account/verify-sms": "./src/api-handlers/account/verify-sms.ts"`

## phase_5_ui_components_unbranded
- create unbranded components mirroring the website-membership steps but styled like verify-code (light theme, borders, gray text), no external UI deps:
  - `packages/next-mvp/src/components/recovery/InitiateRecoveryStep.tsx`
  - `packages/next-mvp/src/components/recovery/SelectMethodStep.tsx`
  - `packages/next-mvp/src/components/recovery/VerifyCodeStep.tsx`
  - `packages/next-mvp/src/components/recovery/SetPasswordStep.tsx`
  - `packages/next-mvp/src/components/recovery/CompleteStep.tsx`
- each uses only `<form>`, `<input>`, `<button>` with tailwind classes similar to `src/pages/verify-code/page.tsx`.

## phase_6_recovery_page_template
- create `packages/next-mvp/src/pages/recovery/page.tsx`:
  - client component with 5-step state machine:
    - initiate → select-method → verify-code → set-password → complete
  - calls `accountApi` methods added in phase_2
  - pulls prefilled email from query (`?email=`)
  - no branded background; copy container/card look from verify-code template
- include clear status boxes (loading/error/success) matching verify-code’s tone.

## phase_7_login_template_update
- edit `packages/next-mvp/src/pages/login/page.tsx`:
  - add: `const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);`
  - on `signIn` error, attempt `JSON.parse(result.error)` and check:
    - extract password error with `attempts_remaining`
    - when `attempts_remaining <= 1` → `setShowRecoveryOptions(true)`
  - render a warning panel below current status box when `showRecoveryOptions` is true, with a button linking:
    - href to `/account-auth/recovery?email=${encodeURIComponent(email)}`
  - change footer link text to “Start account recovery” and point to `/account-auth/recovery`.

## phase_8_example_app_wiring (non-breaking demo)
- add re-export routes in `examples/minimal-app` (so it’s runnable end-to-end):
  - `examples/minimal-app/app/api/account/recovery/initiate/route.ts`
  - `examples/minimal-app/app/api/account/recovery/send-code/route.ts`
  - `examples/minimal-app/app/api/account/recovery/verify-code/route.ts`
  - `examples/minimal-app/app/api/account/reset-password/route.ts`
- each file content is a one-liner re-export:
```ts
export { POST } from '@payez/next-mvp/api-handlers/account/recovery/initiate';
```
- instruct consumer apps to do the same re-exports and copy the template page:
  - copy `packages/next-mvp/src/pages/recovery/page.tsx` → `src/app/account-auth/recovery/page.tsx`
  - copy all step components into `src/components/recovery/*`

## phase_9_testing
- unit:
  - mock fetch and test `accountApi.initiateRecovery/sendRecoveryCode/verifyRecoveryCode/resetPasswordWithToken` happy/err paths.
  - ensure snake_case payloads preserved.
- integration (example app):
  - full flow: initiate → method select → code verify → reset password → redirects ok.
  - invalid email: still moves to complete with generic message (no account enumeration).
  - invalid/expired code: shows friendly error; resend works with cooldown.
- e2e (with idp):
  - validate lockout warning appears at 1 attempt remaining on login.
  - verify recovery CTA pre-fills email via query param.

## phase_10_acceptance_criteria
- api routes re-exportable from `@payez/next-mvp` and functional with IDP when envs set.
- unbranded recovery page matches verify-code minimal style; no MUI/NextUI usage.
- login shows recovery warning when `attempts_remaining <= 1`; CTA navigates to recovery with email prefilled.
- mocks removed; real `accountApi` methods present and used.
- types compile; no ts errors; build passes.
- consumer setup requires only:
  - copy page + components
  - add 4 route re-exports
  - set envs

## handoff_notes
- keep all idp request/response fields in snake_case.
- do not leak sensitive data in logs; friendly messages in ui, detailed in console only.
- ensure `NEXTAUTH_SECRET`, `IDP_BASE_URL`, `CLIENT_ID` present for local testing.

## done_when
- minimal-app runs complete recovery flow against an available IDP with above exports present; consumer integration verified by copying page/components and re-exporting routes exactly as described.
