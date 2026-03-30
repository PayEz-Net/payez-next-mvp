# Secret Management Architecture

How `@payez/next-mvp` applications authenticate with the PayEz IDP to receive their runtime configuration (NextAuth secret, OAuth provider credentials, auth settings, branding).

## Three-Tier Model

| Tier | Environment | Auth Method | Secret Required? |
|------|------------|-------------|-----------------|
| **Dev** | Local / dev server (93) | Vibe API secret on broker endpoint | Yes |
| **Production** | AKS (our infrastructure) | Cluster-internal endpoint | No |
| **Enterprise** | Customer infrastructure | Issued license key | Yes |

## Dev — Vibe API Secret

Developers authenticate to the IDP broker using their Vibe API secret (`X-Vibe-Client-Secret`), which is already in every project's `.env.local`.

```
Next.js app startup
  → POST /api/ExternalAuth/sign-client-assertion
    Headers: X-Vibe-Client-Secret (proves identity)
  → POST /api/ExternalAuth/client-config
    Body: signed assertion from step 1
  ← Returns: NextAuth secret, OAuth providers, auth settings, branding
```

The broker endpoint is on the private dev network (10.0.0.93:32785). Not exposed to the internet.

**Why a secret in dev?** The dev network is shared — multiple machines and services. The secret proves which IDP client is calling. Without it, anyone on the LAN could hit the broker and get another app's OAuth credentials.

### Managing Dev Secrets

The `@payez/cli` tool handles secret lifecycle:

```bash
npx @payez/cli setup              # First-time setup
npx @payez/cli secret show        # Display current env + masked secret
npx @payez/cli secret rotate      # Issue new secret, invalidate old
npx @payez/cli status             # Verify IDP connectivity
```

## Production — No Secret

Production pods run inside the AKS cluster. They call a **cluster-internal endpoint** that is only reachable from within the Kubernetes network.

```
Next.js pod (external-services namespace)
  → Internal IDP endpoint (internal-services namespace, cluster DNS)
  ← Returns: NextAuth secret, OAuth config
```

**No secret is needed.** If you can reach the endpoint, you are a pod in the cluster. The network boundary is the identity. There is nothing to configure, nothing to rotate, nothing to leak.

Developers never see or touch production secrets because there are none.

## Enterprise — License Key

Enterprise customers running `@payez/next-mvp` on their own infrastructure receive an issued license key that authenticates their deployment.

```
Customer Next.js app
  → POST to PayEz IDP (or their own IDP instance)
    Headers: X-Vibe-Client-Secret (license key)
  ← Returns: client config scoped to their license
```

The license key is managed through the same CLI:

```bash
npx @payez/cli secret rotate --enterprise   # Rotate license key
```

License keys are issued by PayEz, scoped per customer, and independently rotatable.

## How Secrets Are Stored

The IDP stores **hashed** secrets per client per environment. A client can have:

- A dev secret (used on dev network)
- An enterprise key (used on customer infrastructure)
- No prod secret (prod uses network boundary)

When a secret is rotated, the old hash is invalidated immediately. The new secret is returned to the caller once and never stored in plaintext.

## What the App Receives

Regardless of tier, the IDP returns the same configuration payload:

| Field | Description |
|-------|-------------|
| `nextAuthSecret` | Signing secret for NextAuth sessions |
| `oauthProviders[]` | OAuth provider configs (Google, etc.) with client IDs and secrets |
| `authSettings` | 2FA, session timeout, lockout, remember-me settings |
| `branding` | Theme, colors, logo URL |
| `baseClientUrl` | Public base URL for OAuth callbacks |

The app sets `process.env.NEXTAUTH_SECRET` at runtime from this response. **Never put `NEXTAUTH_SECRET` in env files** — it is always resolved dynamically at startup.

## Environment Variables

| Variable | Dev | Prod | Enterprise | Description |
|----------|-----|------|-----------|-------------|
| `CLIENT_ID` | Required | Required | Required | IDP client identifier |
| `IDP_URL` | Required | Not used | Required | Broker endpoint URL |
| `INTERNAL_IDP_URL` | Not used | Required | Not used | Cluster-internal endpoint |
| `X-Vibe-Client-Secret` | Required | Not used | Required (license key) | Auth credential |
| `AUTH_TRUST_HOST` | `true` | `true` | `true` | NextAuth header trust |
| `NEXTAUTH_SECRET` | Do not set | Do not set | Do not set | Resolved at startup |

## If Something Goes Wrong

| Symptom | Cause | Fix |
|---------|-------|-----|
| App crashes with `FATAL: PAYEZ_CLIENT_SECRET is required` | Dev: missing Vibe API secret | Run `npx @payez/cli setup` |
| App crashes with `Failed to sign client assertion: 401` | Dev: secret is wrong or rotated | Run `npx @payez/cli secret rotate` |
| App crashes with `INTERNAL_IDP_URL must be set` | Prod: configmap missing | Add `INTERNAL_IDP_URL` to K8s configmap |
| App crashes with connection refused on internal endpoint | Prod: Internal IDP pod is down | Check `internal-services` namespace |
| App works in dev but not prod | Different auth paths | Dev uses broker, prod uses internal endpoint — check which path is active |
