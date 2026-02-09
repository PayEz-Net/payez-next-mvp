# IDP Client Onboarding Guide

This guide covers setting up a new application to use the PayEz Identity Provider (IDP) with `@payez/next-mvp`.

## Prerequisites

1. IDP client created in the admin dashboard (website-membership)
2. Client slug (e.g., `ideal_resume_website`)
3. IDP URL (e.g., `http://localhost:32785` for dev, `https://idp.payez.net` for prod)

## 1. Environment Configuration

Create `.env.development` with these required variables:

```bash
# PayEz IDP Configuration
IDP_URL=http://localhost:32785

# Client ID (slug) - must match what's registered in IDP
CLIENT_ID=your_client_slug

# Internal API URL for Edge Runtime middleware
INTERNAL_API_URL=http://localhost:3400

# NextAuth trusts request headers for OAuth callback URLs
AUTH_TRUST_HOST=true

# IDP Issuer (for token validation)
IDENTITY_SERVICE_ISSUER=external.idp.payez.net
```

**Note:** `NEXTAUTH_SECRET` is fetched dynamically from IDP at startup. You only need to set it manually if:
- IDP is unavailable during development
- You want to override the IDP-provided secret

## 2. OAuth Provider Setup

OAuth providers (Google, Apple, Facebook, Microsoft, GitHub) are configured in the IDP admin UI, not in env vars.

### Admin UI Steps (website-membership)

1. Navigate to **IDP Admin > Clients > [Your Client] > OAuth tab**
2. Toggle ON the provider you want to enable
3. Enter the OAuth credentials:
   - **Client ID**: From the OAuth provider's console (e.g., Google Cloud Console)
   - **Client Secret**: From the OAuth provider's console
   - **Scopes**: Usually `openid email profile`
4. Click **Save**

### Google OAuth Setup Example

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Go to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3400/api/auth/callback/google`
6. Copy Client ID and Client Secret to the IDP admin UI

## 3. App Configuration

### providers.tsx

Configure the AuthProvider with federated mode:

```tsx
import { AuthProvider, AuthConfig } from '@payez/next-mvp/client';

const authConfig: Partial<AuthConfig> = {
  mode: 'federated',
  // providers: loaded dynamically from IDP via getProviders()
  enableRecovery: false,
  enableEmailSignup: false,
  allowPasswordReset: false,
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider config={authConfig}>
      {children}
    </AuthProvider>
  );
}
```

**Key point:** Don't hardcode providers in the config. The MVP fetches enabled providers from IDP at runtime via NextAuth's `getProviders()` API.

### instrumentation.ts

Enable startup initialization to fetch config from IDP:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { logStartupStatus, ensureInitialized } = await import(
        '@payez/next-mvp/lib/startup-init'
      );
      logStartupStatus();
      await ensureInitialized();
      console.log('✨ Server startup initialization complete!');
    } catch (error) {
      console.error('❌ Server startup initialization failed:', error);
    }
  }
}
```

This fetches from IDP at startup:
- `NEXTAUTH_SECRET` (for signing cookies/tokens)
- OAuth provider configurations
- Auth settings (2FA requirements, session timeouts, etc.)

## 4. Startup Verification

When your app starts, you should see logs like:

```
╔══════════════════════════════════════════════════════════════╗
║            PayEz Next MVP - Async Startup                     ║
╚══════════════════════════════════════════════════════════════╝

[STARTUP] Step 1/2: Fetching client config from IDP...
[IDP_CONFIG] Loaded client config from IDP {
  clientId: 8,
  clientSlug: 'ideal_resume_website',
  providerCount: 1,
  enabledProviders: [ 'google' ],
  cacheTtl: 300,
  require2FA: false
}
[STARTUP] Client config loaded successfully
[STARTUP]    - Client ID: 8
[STARTUP]    - Client Slug: ideal_resume_website
[STARTUP]    - Secret length: 86 chars
[STARTUP]    - OAuth Providers: google
[STARTUP]    - Require 2FA: false
[STARTUP]    - Cache TTL: 300 seconds
[STARTUP] Step 2/2: Verifying environment configuration...
[STARTUP] All required environment variables are set

╔══════════════════════════════════════════════════════════════╝
║            PayEz Next MVP Ready for Requests                  ║
╚══════════════════════════════════════════════════════════════╝
```

**Troubleshooting:**
- `Secret length: 0 chars` → IDP endpoint not returning `nextAuthSecret`. Add `NEXTAUTH_SECRET` to env as fallback.
- `enabledProviders: []` → No OAuth providers enabled in IDP admin UI.
- `IDP config fetch failed` → Check `IDP_URL` and that IDP is running.

## 5. Session-Aware UI

Use NextAuth's `useSession` hook to show auth state:

```tsx
'use client';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span>Loading...</span>;
  }

  if (session?.user) {
    return (
      <div>
        <span>✓ {session.user.email}</span>
        <button onClick={() => signOut()}>Logout</button>
      </div>
    );
  }

  return <a href="/account-auth/login">Login</a>;
}
```

## 6. Profile Page

Create a simple profile page at `app/account/profile/page.tsx`:

```tsx
'use client';
import { useSession, signOut } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return (
      <div>
        <p>You need to be logged in.</p>
        <a href="/account-auth/login">Login</a>
      </div>
    );
  }

  const user = session.user;

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user.email}</p>
      <p>OAuth Provider: {(user as any).oauthProvider}</p>
      <button onClick={() => signOut({ callbackUrl: '/' })}>
        Sign Out
      </button>
    </div>
  );
}
```

## 7. Skip Splash for Authenticated Users

If your app has a splash/welcome page, skip it for logged-in users:

```tsx
const { data: session, status } = useSession();
const [showSplash, setShowSplash] = useState(true);

useEffect(() => {
  if (status === 'authenticated' && session?.user) {
    setShowSplash(false);
  }
}, [status, session]);
```

## Common Issues

### OAuth button not showing
- Check IDP admin UI: Is the provider enabled?
- Check browser console: `getProviders()` should return the provider
- Check server logs: Are providers loaded at startup?

### "OAuthSignin" error after clicking provider
- `hasNextAuthSecret: false` → IDP not returning secret, add `NEXTAUTH_SECRET` to env
- Check OAuth redirect URI matches exactly in provider console
- Check client credentials are correct in IDP admin UI

### Session exists but UI shows "not logged in"
- Ensure `useSession()` is used within `SessionProvider`
- Check that `AuthProvider` wraps your app in `providers.tsx`

### Hydration mismatch errors
- Session state differs between server and client render
- Use `status === 'loading'` to show consistent loading state

## Wire Format Reminder

All API payloads use `lower_snake_case`:
- `client_id`, `client_secret`, `oauth_client_id`, `oauth_client_secret`
- `additional_params`, `has_secret`, `oauth_client_secret_last4`

Never use camelCase or PascalCase in API requests/responses.
