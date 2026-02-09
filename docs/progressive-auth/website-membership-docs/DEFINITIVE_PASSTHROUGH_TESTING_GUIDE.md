# 🔥 DEFINITIVE PASSTHROUGH TESTING GUIDE
The single source of truth for testing Next.js passthrough API routes to the C# Identity API.

Status: ✅ 100% WORKING | Last Verified: 2025-09-12

---

## TL;DR — Chosen Method

Use the automated NextAuth JWT method with TEST_MODE enabled. Do not extract tokens from a browser and do not send cookies via the Headers parameter. Always attach the cookie via a WebSession.

- Enable TEST_MODE in .env.local
- Run tests from E:\Repos\website-membership\tests\nextjs-passthrough
- Script creates a Redis session + signs a NextAuth-compatible JWT
- Script injects cookie into a WebSession and calls Next.js API endpoints

Command:

```powershell
cd E:\Repos\website-membership\tests\nextjs-passthrough
.\test-comprehensive-passthrough-fixed.ps1
```

---

## Architecture Overview

```
[PowerShell Tests]
    → [Next.js API Routes @ http://localhost:3200/api/...]
        → [External IDP API @ http://localhost:32785]
            → [Internal IDP]
```

We test the Next.js layer end-to-end (auth + passthrough + response shaping/compliance).

---

## The Automated NextAuth JWT Method (Chosen & Pipeline-Ready)

How it works:
1. TEST_MODE is enabled in NextAuth (see src/lib/auth.ts): NextAuth uses HS256 JWT signing/verification for session cookies rather than JWE encryption.
2. The test helper logs in to the IDP, creates a Redis-backed session via createSession(), then signs a NextAuth-compatible JWT that contains the Redis sessionToken GUID.
3. The test script creates a WebSession and adds the cookie next-auth.session-token using the signed JWT.
4. Authenticated requests are made to Next.js API routes and validated.

Environment prerequisites (.env.local):

```bash
NEXTAUTH_URL=http://localhost:3200
NEXTAUTH_SECRET=<same value used by tests/nextjs-passthrough/test-config.json>
TEST_MODE=true
IDP_BASE_URL=http://localhost:32785
PORT=3200
```

Note: TEST_MODE behavior is already implemented in src/lib/auth.ts via custom jwt.encode/decode using jose when TEST_MODE=true.

Run the comprehensive test:

```powershell
cd E:\Repos\website-membership\tests\nextjs-passthrough
.\test-comprehensive-passthrough-fixed.ps1
```

What the script does:
- Invokes: npx tsx nextauth-jwt-session-creator.js
- Reads credentials from: tests/api-models/login.json
- Reads test config from: tests/nextjs-passthrough/test-config.json
- Builds a WebSession and sets cookie name next-auth.session-token
- Hits multiple endpoints, prints response type analysis (CLEAN vs ENVELOPE), and a summary

---

## Critical Files and Paths

- E:\Repos\website-membership\tests\nextjs-passthrough\test-comprehensive-passthrough-fixed.ps1
- E:\Repos\website-membership\tests\nextjs-passthrough\nextauth-jwt-session-creator.js
- E:\Repos\website-membership\tests\nextjs-passthrough\test-config.json
- E:\Repos\website-membership\tests\api-models\login.json
- E:\Repos\website-membership\.env.local

Working directory for tests:

```
E:\Repos\website-membership\tests\nextjs-passthrough
```

Correct invocation inside that directory:

```powershell
npx tsx nextauth-jwt-session-creator.js
```

Do not call it with tests\nextjs-passthrough\ prefix when you’re already in that directory.

---

## Why Headers Fail (And WebSession Works)

- PowerShell Headers approach:
  - $headers = @{ 'Cookie' = "next-auth.session-token=..." }
  - Invoke-RestMethod ... -Headers $headers
  - Result: ❌ 401s, cookie formatting isn’t handled correctly for NextAuth

- WebSession approach:
  - $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  - $webSession.Cookies.Add((New-Object System.Net.Cookie('next-auth.session-token', $jwt, '/', 'localhost')))
  - Invoke-RestMethod ... -WebSession $webSession
  - Result: ✅ Works reliably and mirrors browser cookie handling

Never use the Headers cookie method.

---

## How to tell who rejected the response (IDP vs Next)

- IDP-origin error: You will see a compliant error envelope from the IDP (e.g., code like NOT_IMPLEMENTED) and the body is passed through unchanged. Status reflects the IDP response.
- Next-origin rejection: You will see code=UPSTREAM_SERVICE_ERROR and details containing endpoint, operation, status, violations, and how_to_fix. This means Next’s proxy validator rejected a non-compliant upstream response.

---

## Token Formats Compared

- Browser (normal production auth): JWE-style token that starts with eyJhbGciOiJkaXIi (encrypted). Not generated programmatically here.
- TEST_MODE (chosen for testing): HS256 JWT signed with NEXTAUTH_SECRET that includes sessionToken + sub. Starts with eyJhbGciOiJIUzI1NiI.
- Plain GUID (manual createSession result): A GUID only. Not a usable NextAuth cookie value on its own. ❌

In TEST_MODE, NextAuth’s encode/decode uses jose to sign/verify HS256, making it possible for tests to create valid cookies programmatically.

---

## Verified Results (Expected Output)

- Success across admin endpoints (roles, claims, role-categories), activity endpoints, and account endpoints
- Clean vs Envelope analysis prints
- Summary shows 100% authentication success when setup is correct

Example snippet:

```
🎉 SUCCESS! All endpoints authenticated successfully!
Success Rate: 100%
Auth test: /api/admin/roles → CLEAN (Object with properties)
Auth test: /api/admin/claims → CLEAN (Object with properties)
```

---

## Troubleshooting Checklist

Still getting 401?
- Are you using -WebSession (not -Headers)?
- Is TEST_MODE=true in .env.local?
- Do NEXTAUTH_SECRET values match between .env.local and tests/nextjs-passthrough/test-config.json?
- Is Next.js running on http://localhost:3200?

Token format issues?
- TEST_MODE JWT: starts with eyJhbGciOiJIUzI1NiI and is a standard JWT
- Avoid plain GUIDs and avoid browser-extracted tokens in this flow

Environment issues?
- Ensure IDP is up at http://localhost:32785
- Ensure PORT=3200 and NEXTAUTH_URL=http://localhost:3200

---

## Deprecated/Legacy Approaches (Do Not Use for Normal Testing)

- Browser token extraction + WebSession cookie: works but is manual. Only keep for emergency debugging.
  - Script location: tests/nextjs-passthrough/broken-auth-tests/test-final-working.ps1
- Cookie via Headers: consistently fails; do not use.
- Plain GUID from createSession as cookie: not a valid NextAuth cookie value.
- Programmatic call to /api/auth/callback/credentials: does not create a usable session cookie in this setup.

---

## Team Guidance

- Use only this guide for passthrough testing
- Default method: Automated NextAuth JWT in TEST_MODE via test-comprehensive-passthrough-fixed.ps1
- Keep production auth untouched; TEST_MODE is strictly for testing environments

---

## Appendix: Quick Commands

Start Next.js and run tests:

```powershell
# In one terminal
npm run dev

# In another terminal
cd E:\Repos\website-membership\tests\nextjs-passthrough
.\test-comprehensive-passthrough-fixed.ps1
```
