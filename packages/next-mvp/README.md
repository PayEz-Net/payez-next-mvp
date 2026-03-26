# @payez/next-mvp

PayEz IDP authentication package for Next.js 14/15 with pre-built UI components and complete authentication flow.

## Version History

### v2.4.2 (2025-11-14)
- **Fixed**: Redirect loop on token expiration - middleware now allows NextAuth JWT callback to refresh expired tokens instead of immediately redirecting to login, preventing infinite redirect loops when access tokens expire

### v2.4.1 (2025-11-14)
- **Fixed**: Stale cookie detection - viability API now properly detects when JWT exists but Redis session is missing, preventing access with expired sessions
- **Fixed**: Token refresh field names - changed to PascalCase (`RefreshToken`, `AuthenticationMethods`, `AuthenticationLevel`, `TwoFactorMethod`) to match IDP requirements, resolving 400 errors during token refresh

### v2.4.0
- Auth-ready v2 handlers with pre-configured routes
- Redis session management improvements
- Token refresh optimizations

## Features

- 🔐 **Complete Authentication Flow** - Login, logout, session management, password recovery
- 🎨 **Pre-built UI Components** - Ready-to-use login, recovery, and verify-code pages
- 🔄 **Automatic Token Refresh** - Built-in refresh token handling
- 🎭 **Themeable** - Customize branding, colors, and layout via ThemeProvider
- 📱 **Responsive Design** - Mobile-first Tailwind CSS components
- 🚀 **Next.js 14/15 Ready** - Works with App Router and React Server Components
- 🔒 **Secure by Default** - JWT-based authentication with PayEz IDP

## Installation

```bash
npm install @payez/next-mvp next-auth
# or
yarn add @payez/next-mvp next-auth
```

### Peer Dependencies

Ensure you have these installed:

```bash
npm install next@^14.0.0 next-auth@^4.24.7 react@^18.2.0 react-dom@^18.2.0
```

---

## Development Scripts

PayEz MVP includes convenient development scripts for getting started quickly:

### `npm run dev:local`

**Local Development Mode** - Perfect for first-time setup and testing without an external IDP:
- Auto-generates `NEXTAUTH_SECRET` for you
- No external IDP connection required
- Great for UI development and testing

```bash
npm run dev:local
```

This will:
1. Generate a secure random `NEXTAUTH_SECRET`
2. Display the secret (save it to your `.env.local`)
3. Start the Next.js dev server on port 3000

### `npm run dev:broker`

**Broker Mode** - Production-like authentication with PayEz IDP:
- Uses OAuth/OIDC flow with PayEz IDP
- Client assertion authentication
- Required for testing real authentication flows
- **This is a core feature for PayEz MVP users**

```bash
npm run dev:broker
```

This will:
1. Enable broker mode (`USE_BROKER_MODE=true`)
2. Set client ID for IDP authentication
3. Start the Next.js dev server on port 3000
4. Automatically kills any existing process on port 3000

**Custom Port & Client ID:**
```bash
# In your consuming project's package.json
"scripts": {
  "dev:broker": "pwsh -NoProfile -ExecutionPolicy Bypass -File node_modules/@payez/next-mvp/scripts/dev-broker.ps1 -ClientId 2 -Port 3400"
}
```

### Which Script to Use?

| Scenario | Script | When to Use |
|----------|--------|-------------|
| 🎨 UI Development | `dev:local` | Building components, testing UI flows |
| 🔐 Auth Testing | `dev:broker` | Testing real OAuth flows, token management |
| 🚀 Production-like | `dev:broker` | Testing with actual IDP integration |

---

## Quick Start (App Router with UI Components)

### 1. Configure Next.js

Add to your `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@payez/next-mvp'],
};

export default nextConfig;
```

### 2. Set Environment Variables

Create `.env.local` (or `.env.development`) in your project root:

```bash
# PayEz IDP Configuration (required)
CLIENT_ID=your_client_slug_from_payez    # e.g., "payez_idp_admin_web"
IDP_URL=http://10.0.0.93:32785           # Dev server IDP
PAYEZ_CLIENT_SECRET=your_client_secret   # Required for dev broker auth

# NextAuth trusts request headers for OAuth callback URLs
AUTH_TRUST_HOST=true

# NEXTAUTH_SECRET — DO NOT SET!
# Resolved automatically at startup. See "Authentication & Secret Sourcing" below.

# Optional
REDIS_URL=redis://localhost:6379         # For session storage
NEXT_PUBLIC_IDP_BASE_URL=https://idp.payez.net  # For client-side redirects
```

> **Note:** `NEXTAUTH_SECRET` is resolved automatically at startup — do not set it manually. `PAYEZ_CLIENT_SECRET` is required for dev environments. Production uses a cluster-internal endpoint instead. See [Authentication & Secret Sourcing](#authentication--secret-sourcing) for details.

### 3. Create NextAuth API Route

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
/**
 * NextAuth API Route Handler
 * Uses pre-configured handler from @payez/next-mvp
 */
export { GET, POST } from '@payez/next-mvp/routes/auth/nextauth';
```

### 4. Wrap Your App with Providers

Create `app/providers.tsx`:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@payez/next-mvp/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

Update `app/layout.tsx`:

```typescript
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 5. Add Authentication Pages

**Login Page** - `app/account-auth/login/page.tsx`:

```typescript
'use client';

import LoginPage from '@payez/next-mvp/dist/pages/login';

export default function LoginPageWrapper() {
  return <LoginPage />;
}
```

**Password Recovery** - `app/account-auth/recovery/page.tsx`:

```typescript
'use client';

import RecoveryPage from '@payez/next-mvp/dist/pages/recovery';

export default function RecoveryPageWrapper() {
  return <RecoveryPage />;
}
```

**Verify Code (2FA)** - `app/account-auth/verify-code/page.tsx`:

```typescript
'use client';

import VerifyCodePage from '@payez/next-mvp/dist/pages/verify-code';

export default function VerifyCodePageWrapper() {
  return <VerifyCodePage />;
}
```

### 6. Protect Routes with Authentication

**Server-side protection:**

```typescript
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/account-auth/login');
  }

  return (
    <div>
      <h1>Welcome, {session.user?.email}</h1>
    </div>
  );
}
```

**Client-side hook:**

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Access Denied</div>;

  return <div>Logged in as {session?.user?.email}</div>;
}
```

---

## Advanced: V2 Middleware-Based Setup

For applications requiring middleware-based route protection:

### 1. Configure Public Routes

Create `src/lib/auth.ts`:

```typescript
import { configurePublicRoutes, createAuthOptions } from '@payez/next-mvp';
import CredentialsProvider from 'next-auth/providers/credentials';

// Define routes that do NOT require authentication
const publicRoutes = [
  '/',
  '/login',
  '/api/health',
  '/api/public/*', // Wildcard example
];

configurePublicRoutes(publicRoutes);

export const authOptions = createAuthOptions({
  credentialsProvider: CredentialsProvider,
  // Additional NextAuthOptions can be passed here
});

export { authOptions as GET, authOptions as POST } from './auth';
```

### 2. Setup NextAuth API Route

**For Pages Router (`pages/api/auth/[...nextauth].ts`):**

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '../../../src/lib/auth';

export default NextAuth(authOptions);
```

**For App Router (`app/api/auth/[...nextauth]/route.ts`):**

```typescript
export { GET, POST } from '../../../src/lib/auth';
```

### 3. Implement Middleware

Create `middleware.ts` at project root:

```typescript
import { createMvpMiddleware } from '@payez/next-mvp';

export default createMvpMiddleware();

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 4. Use `fetchWithAuth` for Protected API Calls

```typescript
import { fetchWithAuth } from '@payez/next-mvp';

async function fetchData() {
  try {
    const response = await fetchWithAuth('/api/protected-data');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Failed to fetch protected data:', error);
  }
}
```

### 5. Session Viability API Handler

**For Pages Router (`pages/api/session/viability.ts`):**

```typescript
import viabilityHandler from '@payez/next-mvp/api-handlers/session/viability';

export default viabilityHandler;
```

**For App Router (`app/api/session/viability/route.ts`):**

```typescript
export { default as GET } from '@payez/next-mvp/api-handlers/session/viability';
```

---

## Custom Theming

Customize branding and colors:

```typescript
// lib/mvp-theme-config.ts
import { ThemeConfig } from '@payez/next-mvp/theme';

const customTheme: ThemeConfig = {
  branding: {
    companyName: "Your Company",
    logoUrl: "/logo.svg",
    logoAlt: "Your Company Logo"
  },
  colors: {
    primary: "#3b82f6",      // Blue
    primaryHover: "#2563eb",
    secondary: "#10b981",    // Green
    danger: "#ef4444",       // Red
    text: "#1f2937",
    textLight: "#6b7280",
    background: "#ffffff",
    backgroundAlt: "#f9fafb",
    border: "#e5e7eb"
  },
  layout: {
    maxWidth: "28rem",       // max-w-md
    padding: "1.5rem",       // p-6
    borderRadius: "0.5rem"   // rounded-lg
  }
};

export default customTheme;
```

Then use in your Providers:

```typescript
import customTheme from '@/lib/mvp-theme-config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={customTheme}>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

---

## API Routes

Access pre-built API handlers:

```typescript
// Session validation
import { GET as validateSession } from '@payez/next-mvp/routes/auth/session';

// Token refresh
import { POST as refreshToken } from '@payez/next-mvp/routes/auth/refresh';

// Logout
import { POST as logout } from '@payez/next-mvp/routes/auth/logout';
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `CLIENT_ID` | ✅ Yes | Your PayEz IDP client ID (string slug, e.g., `payez_idp_admin_web`) |
| `IDP_URL` | ✅ Yes | PayEz IDP base URL |
| `AUTH_TRUST_HOST` | ✅ Yes | Must be `true` — NextAuth derives OAuth URLs from request headers |
| `PAYEZ_CLIENT_SECRET` | ✅ Dev | Client secret for IDP broker authentication (dev environments only) |
| `NEXTAUTH_SECRET` | 🔄 Auto | **Do NOT set** — resolved automatically at startup (see below) |
| `NEXT_PUBLIC_IDP_BASE_URL` | ⚠️ Optional | Public-facing IDP URL (for client-side redirects) |
| `REDIS_URL` | ⚠️ Optional | Redis connection string for session storage |

### Authentication & Secret Sourcing

The MVP resolves `NEXTAUTH_SECRET` and full OAuth configuration automatically at startup. **The method differs between dev and production.**

#### Dev (private network)

The app calls the IDP broker on the private network to fetch secrets:

```
Next.js app
  → POST /api/ExternalAuth/sign-client-assertion (with PAYEZ_CLIENT_SECRET)
  → POST /api/ExternalAuth/client-config (with signed assertion)
  ← Returns: NextAuth secret, OAuth providers, auth settings, branding
```

```bash
# Dev .env.local
CLIENT_ID=your_client_slug
IDP_URL=http://10.0.0.93:32785          # Private network, not public
PAYEZ_CLIENT_SECRET=your_client_secret   # Required for broker auth in dev
AUTH_TRUST_HOST=true
```

The broker endpoint is on the private network (10.0.0.93). Not exposed to the internet.

#### Production (AKS)

The app calls a **cluster-internal endpoint** — no client secret needed. Network boundary is the auth.

```
Next.js pod (external-services namespace)
  → Internal endpoint on Enc API or Internal IDP (internal-services namespace)
  ← Returns: NextAuth secret, OAuth config
```

```bash
# Prod — set via K8s configmap or Secret
CLIENT_ID=your_client_slug
IDP_URL=https://idp.payez.net
AUTH_TRUST_HOST=true
# PAYEZ_CLIENT_SECRET is NOT needed in production
# The cluster-internal endpoint authenticates by network boundary
```

The internal endpoint is only reachable within the AKS cluster. If you can reach it, you are a pod in the cluster.

#### Why two methods?

| | Dev | Production |
|-|-----|-----------|
| **Network** | Private LAN (10.0.0.x) | AKS cluster-internal DNS |
| **Auth model** | Client secret (PAYEZ_CLIENT_SECRET) | Network boundary (cluster-internal only) |
| **Endpoint** | External IDP broker (32785) | Internal endpoint (cluster-internal) |
| **Secret in env?** | Yes (PAYEZ_CLIENT_SECRET) | No |

Dev uses a client secret because the dev network has multiple machines and services — the secret proves the caller is authorized. Production uses network boundary because the AKS cluster is a trust boundary — only pods in the cluster can reach internal services.

#### If NEXTAUTH_SECRET is missing at runtime

The app throws a **FATAL** error and exits. This is intentional — running without a valid secret means sessions cannot be signed and auth is broken. Check:
1. Dev: Is `PAYEZ_CLIENT_SECRET` set? Is `IDP_URL` reachable?
2. Prod: Is the internal endpoint deployed? Can the pod reach it?

---

## Troubleshooting

### SessionProvider Error

If you see `useSession must be wrapped in a <SessionProvider />`:

1. Ensure `transpilePackages: ['@payez/next-mvp']` is in `next.config.ts`
2. Make sure all page components using PayEz components have `'use client'` directive
3. Verify your app is wrapped with `<Providers>` in `layout.tsx`

### Module Resolution Errors

If you get `Module not found` errors:

1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `npm install`
3. Restart dev server

### Authentication Not Working

1. Verify `CLIENT_ID` and `IDP_URL` are set correctly
2. Check `CLIENT_ID` matches your PayEz IDP configuration (use the slug, not numeric ID)
3. Verify IDP is running and reachable at `IDP_URL`
4. Check server logs for broker startup messages - look for "NEXTAUTH_SECRET Successfully Fetched from IDP"
5. If secret fetch fails, check IDP logs for client assertion errors
6. Check browser console for error messages

### NEXTAUTH_SECRET Issues

**"NEXTAUTH_SECRET not available" error:**
- This means the broker couldn't fetch the secret from IDP
- Check that `IDP_URL` is correct and IDP is running
- Verify `CLIENT_ID` is registered in the IDP
- Check network connectivity between your app and IDP

**Cookie cross-contamination (localhost development):**
- If running multiple apps on localhost (different ports), NextAuth cookies can conflict
- Clear `next-auth.*` cookies in browser, or use incognito
- Each app uses a unique cookie name based on CLIENT_ID to avoid conflicts

---

## Docker/CI Deployment (IMPORTANT)

When consuming `@payez/next-mvp` via a local `.tgz` file in Docker builds, you **must** use a local path reference.

### The Problem

If your `package.json` references the MVP like this:
```json
"@payez/next-mvp": "file:../PayEz-Next-MVP/packages/next-mvp/payez-next-mvp-2.6.50.tgz"
```

Docker builds will **fail** with:
```
npm error ENOENT: no such file or directory, open '/PayEz-Next-MVP/packages/next-mvp/payez-next-mvp-2.6.50.tgz'
```

The relative path `../` resolves incorrectly inside the Docker container's `/app` working directory.

### The Fix

1. **Copy the `.tgz` file into your project root:**
   ```bash
   cp ../PayEz-Next-MVP/packages/next-mvp/payez-next-mvp-*.tgz ./
   ```

2. **Update `package.json` to use a local reference:**
   ```json
   "@payez/next-mvp": "file:./payez-next-mvp-2.6.50.tgz"
   ```

3. **Run `npm install` to update `package-lock.json`**

4. **Ensure your Dockerfile copies the tgz:**
   ```dockerfile
   COPY payez-next-mvp-*.tgz ./
   ```

### Quick Fix Script

Run this in your consuming project to fix the path:
```bash
# Copy latest tgz
cp ../PayEz-Next-MVP/packages/next-mvp/payez-next-mvp-*.tgz ./

# Update package.json path (adjust version as needed)
sed -i 's|file:../PayEz-Next-MVP/packages/next-mvp/|file:./|g' package.json

# Regenerate lockfile
npm install --legacy-peer-deps
```

### After MVP Version Updates

When you update the MVP package version, repeat steps 1-3 to copy the new `.tgz` and update references.

---

## Pre-Publishing Checklist (For Package Maintainers)

Before publishing this package to npm:

### ✅ Code Quality
- [x] All `@/` path aliases converted to relative paths
- [x] TypeScript compiles without errors: `npm run build`
- [x] No hardcoded configuration values (use env variables)
- [ ] Unit tests pass (if implemented)

### 📦 Package Configuration

**CRITICAL FIXES NEEDED:**

1. **Fix `main` field in package.json (Line 5):**
   ```json
   "main": "dist/index.js",  // NOT "src/index.ts"
   ```

2. **Remove unused `tsc-alias` from devDependencies (Line 542):**
   ```json
   // DELETE this line:
   "tsc-alias": "^1.8.16"
   ```

3. **Add package metadata:**
   ```json
   {
     "description": "PayEz IDP authentication package for Next.js with ready-to-use login, recovery, and profile pages",
     "keywords": ["nextjs", "authentication", "next-auth", "payez", "idp", "oauth"],
     "author": "PayEz Team",
     "license": "MIT",
     "repository": {
       "type": "git",
       "url": "https://github.com/your-org/PayEz-Next-MVP"
     },
     "homepage": "https://github.com/your-org/PayEz-Next-MVP#readme",
     "bugs": {
       "url": "https://github.com/your-org/PayEz-Next-MVP/issues"
     }
   }
   ```

### 📝 Documentation
- [x] README.md is complete and accurate
- [ ] CHANGELOG.md exists with version history
- [ ] LICENSE file exists

### 🧪 Testing
- [ ] Test fresh installation in new Next.js 14 project
- [ ] Test fresh installation in new Next.js 15 project
- [ ] Verify all exported modules work
- [ ] Test with React 18 and React 19
- [ ] Test package build: `npm pack --dry-run`

### 🚀 Publishing Steps

```bash
# 1. Fix package.json issues (see above)

# 2. Login to npm
npm login

# 3. Build package
npm run build

# 4. Preview what will be published
npm pack --dry-run

# 5. Test the tarball locally
npm install ./payez-next-mvp-2.3.1.tgz

# 6. Bump version (patch/minor/major)
npm version patch  # 2.3.1 -> 2.3.2
npm version minor  # 2.3.1 -> 2.4.0
npm version major  # 2.3.1 -> 3.0.0

# 7. Publish to npm
npm publish

# 8. Create git tag and push
git push origin main
git push origin --tags
```

### 📋 .npmignore

Create `.npmignore` to exclude unnecessary files:

```
src/
*.test.ts
*.test.tsx
tsconfig.json
.gitignore
.git
node_modules/
*.tgz
.env*
```

### 🔒 Publish Configuration

Add to package.json:

```json
"publishConfig": {
  "access": "public",
  "registry": "https://registry.npmjs.org/"
}
```

---

## 📚 Complete Documentation

### Core Guides

- **[THEMING.md](./docs/THEMING.md)** - Complete guide to customizing auth components
  - Theme structure and configuration
  - Creating light/dark modes
  - Component-specific customization
  - Common theming issues and solutions

- **[CSS_VARIABLES_INTEGRATION.md](./docs/CSS_VARIABLES_INTEGRATION.md)** - CSS variable injection for MVP components
  - Why CSS variables are needed
  - How to inject variables in your app
  - Color conversion utilities
  - Debugging CSS variable issues

- **[THEME_EXAMPLES.md](./docs/THEME_EXAMPLES.md)** - Ready-to-use theme examples
  - 7 pre-built professional themes
  - Multi-brand theme support
  - Dynamic light/dark mode
  - Copy-paste theme configurations

### Topics Covered

#### Theming
- ✅ Brand colors and logos
- ✅ Light and dark modes
- ✅ Font families and typography
- ✅ Layout and spacing customization
- ✅ Component-specific styling
- ✅ Multi-tenant/white-label setups
- ✅ Accessibility and contrast

#### CSS Variables
- ✅ Understanding CSS custom properties
- ✅ Manual variable injection
- ✅ Color conversion (Tailwind → hex)
- ✅ Theme provider pattern
- ✅ Dynamic theme switching
- ✅ Debugging in DevTools

#### Examples
- ✅ Corporate themes
- ✅ SaaS themes
- ✅ Creative/design themes
- ✅ Accessible high-contrast themes
- ✅ Multi-brand configurations
- ✅ Gradient backgrounds
- ✅ Custom branding

### Quick Links

**Getting Started with Themes:**
1. Start with [THEMING.md](./docs/THEMING.md) - Quick Start section
2. Copy a theme from [THEME_EXAMPLES.md](./docs/THEME_EXAMPLES.md)
3. Follow integration pattern in [CSS_VARIABLES_INTEGRATION.md](./docs/CSS_VARIABLES_INTEGRATION.md)

**For Specific Tasks:**
- Want to change colors? → [THEMING.md - Creating a Theme](./docs/THEMING.md#creating-a-theme)
- Pages rendering white/no color? → [CSS_VARIABLES_INTEGRATION.md - Troubleshooting](./docs/CSS_VARIABLES_INTEGRATION.md#troubleshooting)
- Need a complete example? → [THEME_EXAMPLES.md](./docs/THEME_EXAMPLES.md)
- Debugging styling issues? → [THEMING.md - Common Issues](./docs/THEMING.md#common-issues--solutions)

---

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/PayEz-Next-MVP/issues
- Documentation: https://docs.payez.net

## Contributing

Contributions welcome! Please read our contributing guidelines first.

---

Made with ❤️ by the PayEz Team
