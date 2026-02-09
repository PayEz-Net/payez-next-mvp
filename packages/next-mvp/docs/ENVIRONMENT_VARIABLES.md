# MVP Environment Variables

Complete reference for all environment variables used by `@payez/next-mvp` applications.

> **Last Updated:** January 2026 (MVP 2.9.27+)

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Critical: IDP_URL vs INTERNAL_API_URL](#critical-idp_url-vs-internal_api_url)
3. [Authentication & Identity](#authentication--identity)
4. [OAuth Callback URLs](#oauth-callback-urls)
5. [Vibe Backend](#vibe-backend)
6. [Infrastructure](#infrastructure)
7. [Logging](#logging)
8. [UI & Feature Flags](#ui--feature-flags)
9. [Kubernetes ConfigMap Pattern](#kubernetes-configmap-pattern)
10. [Pipeline & Deployment](#pipeline--deployment)
11. [Local Development](#local-development)
12. [Common Mistakes](#common-mistakes)
13. [Troubleshooting Checklist](#troubleshooting-checklist)

---

## Quick Reference

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `IDP_URL` | Yes | ConfigMap | Identity Provider base URL |
| `AUTH_ISSUER_URL` | Yes | ConfigMap | JWT issuer URL for token validation |
| `CLIENT_ID` | Yes | ConfigMap | IDP client identifier (slug, not numeric ID) |
| `INTERNAL_API_URL` | Yes | ConfigMap | Self-referential URL (HTTP only!) |
| `AUTH_TRUST_HOST` | Yes | ConfigMap | Must be `true` - tells NextAuth to trust ingress headers |
| `NEXTAUTH_SECRET` | Auto | IDP | Session encryption secret (fetched at startup) |
| `IDENTITY_CLIENT_BASE_EXTERNAL_URL` | Auto | IDP | Public base URL (set from base_client_url) |
| `REDIS_URL` | Yes | ConfigMap | Redis connection string |
| `NODE_ENV` | Yes | ConfigMap | Runtime environment (production/development) |

---

## Critical: IDP_URL vs INTERNAL_API_URL

These two URLs serve **completely different purposes** and must not be confused.

### IDP_URL

**What it IS:** The URL to the external Identity Provider (IDP) service.

| Property | Value |
|----------|-------|
| **Used for** | OAuth flows, token refresh, 2FA, client config fetch |
| **Protocol** | HTTPS (always in production) |
| **Target** | External IDP service |
| **Example** | `https://idp.payez.net` |

**Endpoints called via IDP_URL:**
- `/api/ExternalAuth/sign-client-assertion` - Client assertion signing
- `/api/ExternalAuth/client-config` - Full client configuration
- `/api/ExternalAuth/refresh` - Token refresh
- `/api/ExternalAuth/twofa/*` - 2FA verification
- `/api/Account/*` - User account management

**What it is NOT:**
- ❌ NOT the URL to your application
- ❌ NOT interchangeable with INTERNAL_API_URL
- ❌ NOT used for self-referential calls

### INTERNAL_API_URL

**What it IS:** The URL for the application to call **ITSELF** internally.

| Property | Value |
|----------|-------|
| **Used for** | Middleware calling own API routes (session viability, etc.) |
| **Protocol** | HTTP (REQUIRED - see explanation below) |
| **Target** | Same pod/container (self-referential) |
| **Example** | `http://idealresume.external-services.svc.cluster.local:80` |

**Endpoints called via INTERNAL_API_URL:**
- `/api/session/viability` - Middleware session check
- `/api/auth/refresh` - Internal refresh trigger

### Why HTTP for INTERNAL_API_URL?

**This is NOT simply about "internal K8s traffic doesn't need TLS"** - that's misleading. The real reasons:

1. **Self-referential calls**: This is the app calling its OWN backend within the same pod
2. **Cookie encryption compatibility**: NextAuth cookies are encrypted based on the request protocol. Using HTTPS causes cookie decryption to fail because:
   - Browser request arrives through ingress (TLS terminated at ingress)
   - Pod receives HTTP internally
   - Internal self-calls must use HTTP to match the protocol context
3. **TLS termination at ingress**: The pod receives HTTP after TLS termination
4. **NOT about inter-service security**: This URL is for SELF calls only

> ⚠️ **CRITICAL**: Using HTTPS for INTERNAL_API_URL will cause auth failures due to cookie/session encryption mismatches.

---

## Authentication & Identity

### IDP_URL

```
IDP_URL=https://idp.payez.net
```

**What it IS:**
- Base URL for all IDP API calls
- Used for authentication, token management, and client configuration
- MUST be HTTPS in production

**What it is NOT:**
- ❌ NOT your application's URL
- ❌ NOT the same as AUTH_ISSUER_URL (though they may have the same value)

### AUTH_ISSUER_URL

```
AUTH_ISSUER_URL=https://idp.payez.net
```

**What it IS:**
- The JWT issuer URL used in token validation
- Must match the `iss` claim in JWTs issued by the IDP
- Used when verifying access tokens

**What it is NOT:**
- ❌ NOT optional - OAuth will fail without it
- ❌ NOT automatically derived from IDP_URL (must be explicitly set)

**Why both IDP_URL and AUTH_ISSUER_URL?**

While they often have the same value, they serve different purposes:
- `IDP_URL` = Where to CALL the IDP
- `AUTH_ISSUER_URL` = What the IDP CLAIMS to be (JWT `iss` claim)

In some architectures, these could differ (e.g., IDP behind a different internal URL than its public issuer identity).

### CLIENT_ID

```
CLIENT_ID=ideal_resume_website
```

**What it IS:**
- The client slug/identifier registered in the IDP
- Used to identify your application when fetching configuration
- Typically a human-readable slug (e.g., `ideal_resume_website`)

**What it is NOT:**
- ❌ NOT the numeric client ID (that's fetched from IDP response as `clientId`)
- ❌ NOT a secret (safe to expose, but don't confuse with client secrets)

### NEXT_PUBLIC_CLIENT_ID

```
NEXT_PUBLIC_CLIENT_ID=ideal_resume_website
```

**What it IS:**
- Same as CLIENT_ID but available to client-side code
- Used by browser-side components that need to know the client identity

**When to use which:**
- Server-side code: Use `CLIENT_ID`
- Client-side code: Use `NEXT_PUBLIC_CLIENT_ID`
- Set both to the same value

### NEXTAUTH_SECRET

```
NEXTAUTH_SECRET=<auto-fetched from IDP>
```

**What it IS:**
- The secret used to encrypt NextAuth.js session cookies
- Automatically fetched from IDP at application startup
- Set in `process.env` after successful startup

**What it is NOT:**
- ❌ NOT something you set in ConfigMap (production)
- ❌ NOT a value you generate yourself (IDP provides it)
- ❌ NOT optional - app will refuse to start without it

**How it works:**
1. App starts → calls IDP to get client config
2. IDP returns `nextAuthSecret` in response
3. MVP sets `process.env.NEXTAUTH_SECRET`
4. App is ready to handle authenticated requests

**Local development exception:**
In local development, you MAY set this manually in `.env.local` to skip the IDP call.

---

## OAuth Callback URLs

### IDENTITY_CLIENT_BASE_EXTERNAL_URL (Auto-set)

```
IDENTITY_CLIENT_BASE_EXTERNAL_URL=https://idealresume.online
```

**What it IS:**
- The public base URL for the application
- Automatically set from IDP's `base_client_url` field at startup
- Used for constructing absolute URLs in emails, redirects, etc.
- The "source of truth" for your app's public URL

**What it is NOT:**
- ❌ NOT the internal K8s service URL
- ❌ NOT something you configure in ConfigMap

### AUTH_TRUST_HOST (Required in Production)

```
AUTH_TRUST_HOST=true
```

**What it IS:**
- Tells NextAuth.js to trust the `X-Forwarded-Host` and `X-Forwarded-Proto` headers
- These headers are set by your Kubernetes ingress controller
- NextAuth uses them to construct OAuth callback URLs dynamically

**How NextAuth.js determines the OAuth callback URL:**

NextAuth.js has this internal logic (from `detect-origin.ts`):
```typescript
export function detectOrigin(forwardedHost, protocol) {
  if (process.env.VERCEL ?? process.env.AUTH_TRUST_HOST)
    return `${protocol === "http" ? "http" : "https"}://${forwardedHost}`
  return process.env.NEXTAUTH_URL  // Fallback - WE NEVER USE THIS
}
```

By setting `AUTH_TRUST_HOST=true`:
1. NextAuth reads the real host from request headers
2. No need to hardcode/duplicate the URL anywhere
3. No timing issues with environment variable mutations
4. Works automatically in both local dev and production

**Why NEXTAUTH_URL is ABOLISHED from this codebase:**

We intentionally DO NOT use `NEXTAUTH_URL` anywhere because:
1. It's error-prone (timing issues, must match exactly)
2. It duplicates information already available from request headers
3. `AUTH_TRUST_HOST=true` is the cleaner, more reliable approach
4. The IDP's `base_client_url` provides the source of truth for the public URL

**This is the ONLY mention of that variable in this documentation.** You will not find
it in any code, ConfigMap, .env example, or other docs. All hosts are trusted via
`AUTH_TRUST_HOST=true`.

**Critical requirements for IDP's base_client_url:**
1. **No trailing slash** - `https://idealresume.online` not `https://idealresume.online/`
2. **Must be public URL** - The URL users' browsers will access
3. **Managed in IDP database** - `core_identity.idp_clients.base_client_url`

---

## Vibe Backend

### VIBE_API_URL

```
VIBE_API_URL=https://api.idealvibe.online
```

**What it IS:**
- Base URL for the Vibe REST API
- Used for storing user data, preferences, sessions, etc.

### VIBE_CLIENT_ID

```
VIBE_CLIENT_ID=vibe_ddfe7e33c18041e0
```

**What it IS:**
- The client identifier for Vibe API authentication
- Used when signing requests to Vibe

### VIBE_HMAC_KEY

```
VIBE_HMAC_KEY=dnjFfQHixbhKvYGLegLaFgrgiAvZmqKfcoGqTS6tkG4=
```

**What it IS:**
- HMAC key for signing requests to Vibe
- Base64-encoded secret from Vibe Credentials tab

---

## Infrastructure

### REDIS_URL

```
REDIS_URL=redis://10.7.0.5:6379
```

**What it IS:**
- Connection string for Redis
- Used for session caching, IDP config caching, rate limiting

**What it is NOT:**
- ❌ NOT optional - required for production caching
- ❌ NOT a Redis cluster URL (just single instance format)

### NODE_ENV

```
NODE_ENV=production
```

**What it IS:**
- Standard Node.js environment indicator
- Affects cookie security, logging verbosity, error details

**Values:**
- `production` - Secure cookies, minimal logging, no stack traces
- `development` - Insecure cookies OK, verbose logging, stack traces

---

## Logging

### LOG_LEVEL

```
LOG_LEVEL=info
```

**Values:** `debug`, `info`, `warn`, `error`

### LOG_CONSOLE

```
LOG_CONSOLE=true
```

**What it IS:**
- Enable/disable console logging
- Defaults to `true` in development, `false` in production

### GRAYLOG_HOST / GRAYLOG_PORT

```
GRAYLOG_HOST=10.6.10.5
GRAYLOG_PORT=12201
```

**What it IS:**
- Centralized logging endpoint for Graylog
- Used in production for log aggregation

---

## UI & Feature Flags

### NEXT_PUBLIC_SHOW_BETA_BADGE

```
NEXT_PUBLIC_SHOW_BETA_BADGE=true
```

**What it IS:**
- Shows/hides beta badge in UI

### NEXT_PUBLIC_DISABLE_HEALTH_MONITOR

```
NEXT_PUBLIC_DISABLE_HEALTH_MONITOR=true
```

**What it IS:**
- Disables the SignalR health check component

### NEXT_TELEMETRY_DISABLED

```
NEXT_TELEMETRY_DISABLED=1
```

**What it IS:**
- Disables Next.js anonymous telemetry
- Should be `1` in production

---

## Kubernetes ConfigMap Pattern

### Example ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: idealresume-config
  namespace: external-services
  labels:
    app: idealresume
    component: frontend
    tier: web
data:
  # Application Identity
  CLIENT_ID: "ideal_resume_website"

  # PayEz Identity Service
  IDP_URL: "https://idp.payez.net"
  AUTH_ISSUER_URL: "https://idp.payez.net"

  # NextAuth Host Trust - REQUIRED for OAuth to work
  # Tells NextAuth to derive OAuth callback URLs from request headers
  AUTH_TRUST_HOST: "true"

  # Internal URL for server-to-server calls (NOT for OAuth)
  # MUST be HTTP - see documentation for why
  INTERNAL_API_URL: "http://idealresume.external-services.svc.cluster.local:80"

  # Vibe Backend (service account auth)
  VIBE_API_URL: "https://api.idealvibe.online"
  VIBE_CLIENT_ID: "vibe_ddfe7e33c18041e0"
  VIBE_HMAC_KEY: "dnjFfQHixbhKvYGLegLaFgrgiAvZmqKfcoGqTS6tkG4="

  # Infrastructure
  REDIS_URL: "redis://10.7.0.5:6379"

  # Runtime
  NODE_ENV: "production"
  NEXT_TELEMETRY_DISABLED: "1"
```

### Applying to Deployment

```yaml
spec:
  containers:
    - name: idealresume
      envFrom:
        - configMapRef:
            name: idealresume-config
        - secretRef:
            name: idealresume-secrets  # For actual secrets
```

### What Goes in ConfigMap vs Secrets

**ConfigMap (non-sensitive):**
- URLs (IDP_URL, INTERNAL_API_URL, VIBE_API_URL)
- Client identifiers (CLIENT_ID, VIBE_CLIENT_ID)
- Feature flags
- Logging configuration

**Secrets (sensitive):**
- VIBE_HMAC_KEY (though often in ConfigMap for simplicity)
- Any API keys
- Database credentials

---

## Pipeline & Deployment

### Azure DevOps Pipeline Triggers

The pipeline ONLY triggers on main/master branches:

```yaml
trigger:
  branches:
    include:
    - main
    - master
pr: none
```

**Development workflow:**
1. Develop on feature branch (e.g., `jon-dev`)
2. Test locally and in staging
3. Merge to `main` to trigger deployment
4. Pipeline builds and deploys to AKS

### ConfigMap Updates

When updating ConfigMap values:

```bash
# 1. Edit the configmap file
# 2. Apply changes
kubectl apply -f k8s/configmap.yaml

# 3. Restart deployment to pick up changes
kubectl rollout restart deployment/idealresume -n external-services

# 4. Watch rollout
kubectl rollout status deployment/idealresume -n external-services
```

### Environment Variable Precedence

At startup, MVP loads configuration in this order:

1. **Environment variables** (from ConfigMap/Secrets)
2. **IDP client config** (fetched at startup with `forceRefresh: true`)
3. **Redis cache** (for subsequent requests, NOT at startup)

**Critical:** Startup ALWAYS fetches fresh from IDP. Cache is only used after initial startup to reduce IDP load.

---

## Local Development

### .env.local Example

```bash
# .env.local for local development

# IDP URL - use staging or production IDP
IDP_URL=https://idp.payez.net
AUTH_ISSUER_URL=https://idp.payez.net

# Client configuration
CLIENT_ID=idealresume_local_dev
NEXT_PUBLIC_CLIENT_ID=idealresume_local_dev

# Internal API URL - localhost in development
INTERNAL_API_URL=http://localhost:3400

# NextAuth trusts request headers for OAuth callback URLs
AUTH_TRUST_HOST=true

# Vibe Backend
VIBE_API_URL=https://api.idealvibe.online
VIBE_CLIENT_ID=vibe_ddfe7e33c18041e0
VIBE_HMAC_KEY=dnjFfQHixbhKvYGLegLaFgrgiAvZmqKfcoGqTS6tkG4=

# Redis (local or shared)
REDIS_URL=redis://localhost:6379

# Development mode
NODE_ENV=development
```

### Broker Mode

For testing OAuth with production IDP against local app:

```bash
npm run dev:broker
```

This runs on port 3400 and uses production IDP with local app.

---

## Common Mistakes

### 1. Using INTERNAL_API_URL for IDP calls

**Wrong:**
```typescript
const IDP_URL = process.env.INTERNAL_API_URL || process.env.IDP_URL;
fetch(`${IDP_URL}/api/Account/managed-clients`);
```

**Correct:**
```typescript
const IDP_URL = process.env.IDP_URL;
fetch(`${IDP_URL}/api/Account/managed-clients`);
```

INTERNAL_API_URL points to YOUR app, not the IDP.

### 2. Using HTTPS for INTERNAL_API_URL in K8s

**Wrong:**
```
INTERNAL_API_URL=https://app.svc.cluster.local:443
```

**Correct:**
```
INTERNAL_API_URL=http://app.svc.cluster.local:80
```

HTTP is REQUIRED. HTTPS breaks cookie encryption compatibility.

### 3. Trailing slash in base_client_url

**Wrong (in IDP database):**
```
base_client_url: https://idealresume.online/
```

**Correct:**
```
base_client_url: https://idealresume.online
```

Trailing slashes cause OAuth callback URL mismatches.

### 4. Missing AUTH_ISSUER_URL

**Wrong:**
```yaml
# Only IDP_URL, missing AUTH_ISSUER_URL
IDP_URL: "https://idp.payez.net"
```

**Correct:**
```yaml
IDP_URL: "https://idp.payez.net"
AUTH_ISSUER_URL: "https://idp.payez.net"
```

Both are required. AUTH_ISSUER_URL is used for JWT validation.

### 5. Hardcoding fallbacks in production code

**Wrong:**
```typescript
const IDP_URL = process.env.IDP_URL || 'http://localhost:32785';
```

**Correct:**
```typescript
const IDP_URL = process.env.IDP_URL;
if (!IDP_URL) {
  throw new Error('[FATAL] IDP_URL environment variable is required');
}
```

Fail loud. No silent fallbacks to localhost in production.

### 6. Missing AUTH_TRUST_HOST

**Wrong (production):**
```yaml
data:
  # Missing AUTH_TRUST_HOST - OAuth callbacks will fail!
```

**Correct:**
```yaml
data:
  AUTH_TRUST_HOST: "true"  # Required! NextAuth reads URL from request headers
```

**Why:**
- `AUTH_TRUST_HOST=true` tells NextAuth to trust `X-Forwarded-Host` headers
- NextAuth then constructs OAuth callback URLs dynamically from those headers
- Works in both local dev and production environments

### 7. Expecting cache at startup

**Wrong assumption:** "The app will use cached IDP config at startup"

**Reality:** Startup ALWAYS calls IDP with `forceRefresh: true`. Cache is only for subsequent requests during the pod's lifetime.

---

## Troubleshooting Checklist

### OAuth Not Working

- [ ] `IDP_URL` is set and reachable (HTTPS)
- [ ] `AUTH_ISSUER_URL` is set (often same as IDP_URL)
- [ ] `CLIENT_ID` matches IDP registration
- [ ] IDP's `base_client_url` has NO trailing slash
- [ ] App restarted after ConfigMap changes
- [ ] Check logs for `[STARTUP]` messages

### Session Not Created After OAuth

- [ ] `INTERNAL_API_URL` uses HTTP (not HTTPS)
- [ ] `base_client_url` in IDP has no trailing slash
- [ ] `AUTH_TRUST_HOST=true` is set
- [ ] Check for `[AUTH] [SERVER_SESSION] No session found` errors

### Logout Redirecting to localhost:3000

- [ ] Verify using MVP 2.9.26+ (includes logout fix)
- [ ] signOut uses `{ redirect: false }` with manual redirect

### IDP Config Not Updating

- [ ] Restart the pod (`kubectl rollout restart`)
- [ ] Check Redis isn't serving stale cache (startup bypasses cache)
- [ ] Verify IDP database has correct values
- [ ] Check IDP itself isn't caching old values

### Startup Failing

- [ ] `IDP_URL` is reachable from the pod
- [ ] `CLIENT_ID` is registered in IDP
- [ ] Network policies allow egress to IDP
- [ ] Check pod logs: `kubectl logs -f deployment/idealresume`

---

## Environment Variable Summary

### Set in ConfigMap (Required)

| Variable | Example | Notes |
|----------|---------|-------|
| `CLIENT_ID` | `ideal_resume_website` | IDP client slug |
| `IDP_URL` | `https://idp.payez.net` | IDP base URL |
| `AUTH_ISSUER_URL` | `https://idp.payez.net` | JWT issuer |
| `AUTH_TRUST_HOST` | `true` | **REQUIRED** - NextAuth trusts ingress headers |
| `INTERNAL_API_URL` | `http://app.svc:80` | Self-call URL (HTTP!) |
| `REDIS_URL` | `redis://10.7.0.5:6379` | Redis connection |
| `NODE_ENV` | `production` | Environment |

### Auto-Set by MVP at Startup (from IDP)

| Variable | Source | Notes |
|----------|--------|-------|
| `NEXTAUTH_SECRET` | IDP client-config | Session encryption |
| `IDENTITY_CLIENT_BASE_EXTERNAL_URL` | IDP base_client_url | Public base URL |

### Abolished Variables

These variables are intentionally NOT used anywhere in the codebase:

| Variable | Replacement |
|----------|-------------|
| `NEXTAUTH_URL` | `AUTH_TRUST_HOST=true` - NextAuth derives URL from request headers |

### Optional

| Variable | Default | Notes |
|----------|---------|-------|
| `LOG_LEVEL` | `info` | Logging verbosity |
| `LOG_CONSOLE` | `true` (dev) | Console output |
| `NEXT_TELEMETRY_DISABLED` | `0` | Disable telemetry |
