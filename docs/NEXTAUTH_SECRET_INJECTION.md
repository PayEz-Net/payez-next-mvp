# NextAuth Secret & Client Config — How It Works

**Last Updated:** 2026-03-26
**Version:** 2.0.0

## Overview

Your Next.js app gets its NextAuth secret, OAuth provider credentials, auth settings, and branding from the IDP at startup. The mechanism differs by environment:

| Environment | Source | Auth | Env Vars Needed |
|-------------|--------|------|-----------------|
| **Dev (local / 93)** | External IDP broker | None (X-Client-Id header only) | `IDP_URL`, `CLIENT_ID` |
| **Prod (AKS)** | Internal IDP endpoint | ContainerAuthorize | `INTERNAL_IDP_URL`, `CLIENT_ID`, `CONTAINERS_KEY` |

No secrets in `.env` files. No `NEXTAUTH_SECRET` in config. The app fetches everything at startup.

---

## Dev Setup

### Required Environment Variables

```bash
# .env.local
IDP_URL=http://10.0.0.93:32785
CLIENT_ID=ideal_resume_website
```

That's it. Two variables. No secrets.

### What Happens on Startup

1. App calls `ensureInitialized()` (from `startup-init.ts`)
2. Fetches full client config from IDP via broker:
   - `POST {IDP_URL}/api/ExternalAuth/sign-client-assertion`
     - Header: `X-Client-Id: {CLIENT_ID}`
     - Body: `{ issuer, subject, audience, expires_in: 60 }`
     - No auth required. IDP signs a JWT.
   - `POST {IDP_URL}/api/ExternalAuth/client-config`
     - Header: `X-Client-Id: {CLIENT_ID}`
     - Body: `{ client_assertion: "<signed JWT>" }`
     - Returns full config.
3. Config includes: `nextAuthSecret`, `oauthProviders` (with decrypted client secrets), `authSettings`, `branding`, `baseClientUrl`
4. Sets `process.env.NEXTAUTH_SECRET` from the response
5. Caches in memory + Redis (TTL from response, default 5 min)
6. App ready

### Alternative: Local-Only Mode

```bash
npm run dev:local
```

Generates a random `NEXTAUTH_SECRET` locally. No IDP call. Useful when the dev IDP is down.

---

## Production Setup (AKS)

### Required Environment Variables

Set in AKS configmap for the Next.js deployment:

```yaml
INTERNAL_IDP_URL: "https://identity-api.internal-services.svc.cluster.local:443"
CLIENT_ID: "ideal_resume_website"
CONTAINERS_KEY: "<ContainersKey secret value>"
```

### What Happens on Startup

1. App calls `ensureInitialized()`
2. Detects `INTERNAL_IDP_URL` is set — uses internal endpoint (not broker)
3. Single HTTP call:
   - `GET {INTERNAL_IDP_URL}/InternalClientConfig/{CLIENT_ID}`
   - Header: `Authorization: Secret {CONTAINERS_KEY}`
   - Returns full `IDPClientConfig` shape
4. Config includes the same fields as dev: `nextAuthSecret`, `oauthProviders`, `authSettings`, `branding`, `baseClientUrl`
5. Sets `process.env.NEXTAUTH_SECRET` from the response
6. Caches in memory + Redis
7. App ready

### Why Not the Broker in Prod?

The External IDP broker endpoints are publicly reachable on the internet. In dev, this is fine (private network). In prod, anyone who knows a client ID could call the broker and extract secrets. The internal endpoint is cluster-internal only — not exposed to the internet.

### Network Path

```
Next.js pod (external-services namespace)
  → identity-api ClusterIP (internal-services namespace)
  → Key Vault (via managed identity)
  → secrets returned to pod
```

No public endpoints involved. The internal endpoint is only reachable from within the AKS cluster.

---

## Config Response Shape

Both dev (broker) and prod (internal endpoint) return the same shape:

```typescript
interface IDPClientConfig {
  clientId: string;
  clientSlug: string;
  nextAuthSecret: string;
  configCacheTtlSeconds: number;
  oauthProviders: {
    provider: string;      // "google", "github", etc.
    enabled: boolean;
    clientId: string;
    clientSecret: string;  // Decrypted
    scopes?: string;
  }[];
  authSettings: {
    require2FA: boolean;
    allowed2FAMethods: string[];
    sessionTimeoutMinutes: number;
    idleTimeoutMinutes: number;
    // ... more settings
  };
  branding: {
    theme?: string;
    primaryColor?: string;
    logoUrl?: string;
  };
  baseClientUrl?: string;
}
```

---

## Decision Logic in Code

```
if (INTERNAL_IDP_URL is set) {
  → Prod mode: GET /InternalClientConfig/{CLIENT_ID} with ContainerAuthorize
} else if (IDP_URL is set) {
  → Dev mode: broker flow (sign-client-assertion + client-config)
} else {
  → FATAL: no IDP URL configured
}
```

File: `src/lib/idp-client-config.ts`

---

## Caching

| Layer | TTL | Survives |
|-------|-----|----------|
| In-memory | From response (`configCacheTtlSeconds`, default 5 min) | Module lifetime only |
| Redis | Same TTL + 10s buffer | Module reloads, pod restarts (if Redis persists) |
| IDP fetch | On cache miss | N/A |

Circuit breaker: 3 consecutive failures → 5-minute cooldown. Stale cache served during cooldown if available.

---

## Troubleshooting

### "FATAL: IDP_URL must be set"

Neither `IDP_URL` nor `INTERNAL_IDP_URL` is configured. Set one.

### "FATAL: CLIENT_ID or NEXT_PUBLIC_CLIENT_ID must be set"

Add `CLIENT_ID` to your `.env.local` or configmap.

### App crashes on startup with IDP connection error

- **Dev:** Is the External IDP running on 93? Check `http://10.0.0.93:32785/health`
- **Prod:** Is the Internal IDP pod running? `kubectl get pods -n internal-services -l app=identity-api`

### OAuth login fails but app starts

The IDP returned the config but OAuth provider credentials may be missing or invalid. Check:
- Is the provider enabled in IDP for this client?
- Are the OAuth client_id/client_secret correct in the IDP database?

### Secret rotation

Update the secret in Key Vault. Apps pick up the new value on next cache miss (5 minutes max). No restart needed.

---

## What NOT to Do

- **Do not set `NEXTAUTH_SECRET` directly** — let the app fetch it from IDP
- **Do not set `PAYEZ_CLIENT_SECRET`** — this was a rejected design pattern, removed from the codebase
- **Do not call the broker from AKS prod** — use the internal endpoint
- **Do not commit secrets to `.env` files** — only `IDP_URL` and `CLIENT_ID` go in `.env.local`

---

## References

- Internal endpoint: `GET /InternalClientConfig/{clientName}` on Internal IDP
- Broker endpoints: `POST /api/ExternalAuth/sign-client-assertion` + `POST /api/ExternalAuth/client-config` on External IDP
- Code: `src/lib/idp-client-config.ts`, `src/lib/startup-init.ts`
