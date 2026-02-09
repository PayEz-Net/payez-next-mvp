# NextAuth Secret Injection Guide

## Overview

This guide explains how to securely inject `NEXTAUTH_SECRET` into your Next.js runtime from Azure Key Vault via the PayEz-Core broker API, eliminating the need for `.env` files with plaintext secrets.

**Architecture:**
```
Next.js Startup → PayEz-Core API → Azure Key Vault → Secret Injected to process.env
```

---

## Why This Pattern?

### Security Benefits
- ✅ **No plaintext secrets on disk** - No `.env` files with secrets
- ✅ **Server-only access** - Secret never exposed to browsers
- ✅ **Centralized management** - Azure Key Vault is source of truth
- ✅ **Easy rotation** - Update in Key Vault, apps fetch new version
- ✅ **Audit trail** - All access logged with correlation IDs

### Operational Benefits
- ✅ **No deployment required** for secret rotation
- ✅ **Multi-tenant support** - Per-client secrets
- ✅ **Version tracking** - Know which secret version is in use
- ✅ **Cache-friendly** - Short-lived caching reduces Key Vault calls

---

## Quick Start

### 1. Environment Variables

Add to your `.env.local` (or production config):

```bash
# PayEz IDP Configuration
IDP_BASE_URL=https://idp.payez.net
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# Optional: For advanced scenarios
NEXTAUTH_SECRET_CACHE_TTL=300  # Cache for 5 minutes (default)
```

**Important**: `CLIENT_ID` and `CLIENT_SECRET` are **service credentials** for your application, NOT the NextAuth secret itself.

### 2. Implement Secret Fetcher

Create `lib/secret-client.ts`:

```typescript
interface NextAuthSecretResponse {
  secret: string;
  version: string;
  rotatedAt: string;
  secretName: string;
}

interface SecretBrokerEnvelope {
  success: boolean;
  data: NextAuthSecretResponse;
  operation_code: string;
  request_id: string;
}

/**
 * Fetches NextAuth secret from PayEz-Core broker
 * Uses HTTP Basic authentication with service client credentials
 *
 * @param clientId - Your IDP client ID (numeric)
 * @param clientSecret - Your IDP client secret
 * @param baseUrl - PayEz IDP base URL
 * @returns NextAuth secret and metadata
 */
export async function fetchNextAuthSecret({
  clientId,
  clientSecret,
  baseUrl,
}: {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}): Promise<NextAuthSecretResponse> {
  // Create HTTP Basic auth header
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const url = `${baseUrl}/api/ExternalAuth/next-auth/secret`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
      'X-Correlation-Id': crypto.randomUUID().replace(/-/g, ''),
    },
    cache: 'no-store',
  });

  // Handle errors
  if (response.status === 403) {
    throw new Error('Forbidden: Invalid client credentials or not authorized');
  }

  if (response.status === 404) {
    throw new Error('Not found: Client inactive or secret missing in Key Vault');
  }

  if (!response.ok) {
    throw new Error(`Secret broker error: ${response.status} ${response.statusText}`);
  }

  // Parse PayEz envelope
  const envelope = await response.json() as SecretBrokerEnvelope;

  if (!envelope.success || !envelope.data?.secret) {
    throw new Error('Invalid secret payload from broker');
  }

  return envelope.data;
}
```

### 3. Bootstrap at Startup

Create `lib/env-bootstrap.ts`:

```typescript
import { fetchNextAuthSecret } from './secret-client';

let cachedSecret: string | null = null;
let cacheExpiry: number = 0;

/**
 * Initialize NextAuth secret from PayEz broker
 * Call this BEFORE initializing NextAuth
 */
export async function initializeNextAuthSecret(): Promise<void> {
  // Check cache
  const now = Date.now();
  if (cachedSecret && now < cacheExpiry) {
    process.env.NEXTAUTH_SECRET = cachedSecret;
    return;
  }

  // Fetch from broker
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const baseUrl = process.env.IDP_BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    throw new Error('Missing required environment variables: CLIENT_ID, CLIENT_SECRET, IDP_BASE_URL');
  }

  try {
    const result = await fetchNextAuthSecret({
      clientId,
      clientSecret,
      baseUrl,
    });

    // Set in process environment
    process.env.NEXTAUTH_SECRET = result.secret;

    // Cache for 5 minutes (or configured TTL)
    const cacheTtl = parseInt(process.env.NEXTAUTH_SECRET_CACHE_TTL || '300', 10);
    cachedSecret = result.secret;
    cacheExpiry = now + (cacheTtl * 1000);

    console.log(`[NextAuth] Secret loaded (version: ${result.version}, name: ${result.secretName})`);
  } catch (error) {
    console.error('[NextAuth] Failed to fetch secret:', error);
    throw error;
  }
}

/**
 * Get current NextAuth secret
 * Automatically fetches if not cached
 */
export async function getNextAuthSecret(): Promise<string> {
  if (!process.env.NEXTAUTH_SECRET) {
    await initializeNextAuthSecret();
  }

  return process.env.NEXTAUTH_SECRET!;
}
```

### 4. Update NextAuth Configuration

Modify your NextAuth setup to use the bootstrapped secret:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { getNextAuthSecret } from '@/lib/env-bootstrap';

// Initialize secret before NextAuth
await getNextAuthSecret();

export const authOptions = {
  // ... your NextAuth config
  secret: process.env.NEXTAUTH_SECRET,  // Now available!
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## API Contract

### Request

**Endpoint:** `POST /api/ExternalAuth/next-auth/secret`

**Headers:**
```
Authorization: Basic <base64(clientId:clientSecret)>
Accept: application/json
X-Correlation-Id: <uuid-without-dashes>
```

**Query Parameters:**
- `clientId` (optional) - Numeric client ID for multi-tenant scenarios
- `environment` (optional) - Environment name (dev, staging, prod)

### Response (200 OK)

PayEz standard envelope:

```json
{
  "success": true,
  "data": {
    "secret": "<64-char-base64-secret>",
    "version": "<key-vault-version>",
    "rotatedAt": "2025-01-13T12:00:00Z",
    "secretName": "nextauth-secret-client-4"
  },
  "operation_code": "clientadminsecrets_getnextauthsecret",
  "request_id": "<correlation-id>",
  "meta": {
    "timestamp": "2025-01-13T12:00:01Z"
  }
}
```

### Error Responses

**403 Forbidden:**
- Invalid client credentials
- Non-service token (interactive/human login not allowed)

**404 Not Found:**
- Client doesn't exist or is inactive
- Secret not found in Key Vault

**500 Internal Server Error:**
- Key Vault unavailable
- Unexpected broker error

---

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `IDP_BASE_URL` | Yes | PayEz IDP base URL | `https://idp.payez.net` |
| `CLIENT_ID` | Yes | Your service client ID | `ideal_resume_website` |
| `CLIENT_SECRET` | Yes | Your service client secret | `<from-key-vault>` |
| `NEXTAUTH_SECRET_CACHE_TTL` | No | Cache duration in seconds | `300` (5 minutes) |
| `NEXTAUTH_SECRET` | No | Emergency override only | Not recommended |

### Key Vault Secret Naming

Secrets are named per client:
```
nextauth-secret-client-{numeric-id}
```

Example: `nextauth-secret-client-4`

---

## Security Best Practices

### ✅ DO

- **Call from server-side only** - Never fetch from browser
- **Use HTTP Basic auth** - Client credentials in Authorization header
- **Include correlation IDs** - For tracing and debugging
- **Cache responsibly** - 5 minutes max, in-memory only
- **Handle rotation gracefully** - Check `version` field
- **Log access** - But never log the secret value itself
- **Use TLS** - HTTPS in production always
- **Validate responses** - Check envelope structure

### ❌ DON'T

- **Never commit secrets** - No `.env` files with NEXTAUTH_SECRET
- **Never log secret values** - Log version/name only
- **Never expose to client** - Browser should never see this
- **Don't cache indefinitely** - Respect rotation
- **Don't use interactive tokens** - Service-to-service only
- **Don't skip error handling** - Handle 403/404 explicitly

---

## Development Workflow

### Local Development

**Option 1: Use dev:local script (recommended)**

```bash
npm run dev:local
```

This generates a random NEXTAUTH_SECRET locally without calling the broker.

**Option 2: Call broker locally**

```bash
# Set local environment
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
IDP_BASE_URL=http://localhost:5253

npm run dev
```

### Production Deployment

1. **Azure Key Vault Setup:**
   - Create secret: `nextauth-secret-client-{id}`
   - Generate secure 64-byte base64 value
   - Enable versioning

2. **Service Configuration:**
   - Set `CLIENT_ID` and `CLIENT_SECRET` from secure config
   - Set `IDP_BASE_URL` to production IDP
   - Verify Managed Identity or service principal has Key Vault access

3. **Deployment:**
   - No secret rotation needed on deploy
   - App fetches secret on startup
   - Cache expires after 5 minutes

---

## Rotation Procedures

### Rotating the Secret

1. **Update Key Vault:**
   ```bash
   # Azure CLI
   az keyvault secret set \
     --vault-name <vault-name> \
     --name nextauth-secret-client-4 \
     --value $(openssl rand -base64 64)
   ```

2. **Verify Version:**
   - New version created automatically
   - `version` field in response changes

3. **Propagation:**
   - Apps fetch new version on next cache miss (5 minutes)
   - No restart required
   - Monitor for 403/404 errors

4. **Validation:**
   - Test with correlation ID
   - Check logs for version change
   - Verify no auth failures

---

## Troubleshooting

### "Missing CLIENT_ID or CLIENT_SECRET"

**Cause:** Environment variables not set

**Fix:**
```bash
# Check variables
echo $CLIENT_ID
echo $CLIENT_SECRET

# Set in .env.local
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
```

### "403 Forbidden"

**Cause:** Invalid credentials or unauthorized client

**Fix:**
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check client is active in IDP database
- Ensure client is authorized for secret access

### "404 Not Found"

**Cause:** Secret doesn't exist in Key Vault

**Fix:**
```bash
# Create secret in Key Vault
az keyvault secret set \
  --vault-name <vault> \
  --name nextauth-secret-client-{id} \
  --value $(openssl rand -base64 64)
```

### "Secret retrieval failed: 500"

**Cause:** Key Vault unavailable or configuration error

**Fix:**
- Check PayEz-Core API logs
- Verify Key Vault access policy
- Check Managed Identity permissions
- Review Azure service health

### "NextAuth error: secret must be set"

**Cause:** Secret not initialized before NextAuth

**Fix:**
```typescript
// Call BEFORE NextAuth initialization
await getNextAuthSecret();

// THEN initialize NextAuth
const handler = NextAuth(authOptions);
```

---

## Testing

### Unit Test Example

```typescript
import { fetchNextAuthSecret } from './secret-client';

describe('fetchNextAuthSecret', () => {
  it('should fetch secret from broker', async () => {
    const result = await fetchNextAuthSecret({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      baseUrl: 'https://test-idp.local',
    });

    expect(result.secret).toBeDefined();
    expect(result.version).toBeDefined();
    expect(result.secretName).toBe('nextauth-secret-client-test');
  });

  it('should handle 403 errors', async () => {
    await expect(
      fetchNextAuthSecret({
        clientId: 'invalid',
        clientSecret: 'invalid',
        baseUrl: 'https://test-idp.local',
      })
    ).rejects.toThrow('Forbidden');
  });
});
```

### Integration Test

```bash
# Test broker endpoint
CLIENT_ID=4
CLIENT_SECRET=<your-secret>

curl -X POST \
  -H "Authorization: Basic $(printf '%s:%s' $CLIENT_ID $CLIENT_SECRET | base64)" \
  -H "X-Correlation-Id: $(uuidgen | tr -d '-')" \
  https://idp.payez.net/api/ExternalAuth/next-auth/secret
```

---

## Monitoring

### Metrics to Track

- **Secret fetch success rate** - Should be >99.9%
- **Cache hit rate** - Should be >80% with 5min TTL
- **Fetch latency** - P50, P95, P99
- **Version changes** - Track rotations
- **Error rates by code** - 403, 404, 500

### Logging Best Practices

```typescript
// ✅ Good - Log metadata
console.log('[NextAuth] Secret fetched', {
  version: result.version,
  secretName: result.secretName,
  correlationId: '<uuid>',
});

// ❌ Bad - Never log secret value
console.log('[NextAuth] Secret:', result.secret);  // DON'T DO THIS!
```

### Alerts

Set up alerts for:
- 403/404 error rate >1%
- 500 error rate >0.1%
- Fetch latency P95 >2 seconds
- Missing CLIENT_ID/CLIENT_SECRET

---

## Migration from .env Files

### Before (Insecure)

```bash
# .env.local - Committed to repo (BAD!)
NEXTAUTH_SECRET=my-super-secret-key-12345

# app/api/auth/[...nextauth]/route.ts
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};
```

### After (Secure)

```bash
# .env.local - Only service credentials
CLIENT_ID=ideal_resume_website
CLIENT_SECRET=<from-key-vault>
IDP_BASE_URL=https://idp.payez.net
```

```typescript
// lib/env-bootstrap.ts - Fetch at runtime
await initializeNextAuthSecret();

// app/api/auth/[...nextauth]/route.ts
await getNextAuthSecret();  // Ensures secret is loaded
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,  // Now injected securely
};
```

---

## Advanced Scenarios

### Multi-Tenant Applications

```typescript
// Fetch specific client's secret
const result = await fetchNextAuthSecret({
  clientId: '4',  // Specific tenant
  clientSecret: process.env.CLIENT_SECRET!,
  baseUrl: process.env.IDP_BASE_URL!,
});
```

### Environment-Specific Secrets

```typescript
// Development vs Production
const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

const result = await fetchNextAuthSecret({
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  baseUrl: process.env.IDP_BASE_URL!,
  environment,  // Pass environment hint
});
```

### Custom Cache Strategy

```typescript
// Redis cache example
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const cacheKey = 'nextauth:secret';

async function getNextAuthSecretCached(): Promise<string> {
  // Check Redis
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Fetch from broker
  const result = await fetchNextAuthSecret({...});

  // Cache in Redis with TTL
  await redis.setex(cacheKey, 300, result.secret);

  return result.secret;
}
```

---

## References

- [Azure Key Vault Documentation](https://learn.microsoft.com/azure/key-vault/)
- [NextAuth.js Secret Configuration](https://next-auth.js.org/configuration/options#secret)
- [PayEz IDP Architecture](../docs/PayEz-IDP-Architecture.md)
- [HTTP Basic Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)

---

## Support

Questions or issues?
1. Check this guide first
2. Review PayEz-Core API logs with correlation ID
3. Verify Key Vault permissions
4. Contact the platform team

**Last Updated:** 2025-01-13
**Version:** 1.0.0
