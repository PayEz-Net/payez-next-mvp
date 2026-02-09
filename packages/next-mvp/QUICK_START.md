# @payez/next-mvp Quick Start Guide

  Get authentication working in your Next.js app in **5 minutes**.

  ## Prerequisites

  - Next.js 14+ project with App Router
  - Tailwind CSS configured
  - Redis server (optional, but recommended for production)
  - Client registered in PayEz IDP Manager

  ## Step 1: Install the Package

  ```bash
  npm install @payez/next-mvp next-auth

  Step 2: Set Up Environment Variables

  Create .env.development (for dev) and .env.production (for prod):

  # IDP Configuration
  IDP_URL=https://idp.payez.net
  CLIENT_ID=your_client_slug

  # Internal API URL (your app's URL for internal calls)
  INTERNAL_API_URL=http://localhost:3000

  # NextAuth trusts request headers for OAuth callback URLs
  AUTH_TRUST_HOST=true

  # Optional: Redis for session storage (recommended)
  REDIS_URL=redis://localhost:6379

  Note: NEXTAUTH_SECRET is fetched automatically from IDP in broker mode. No need to set
  it manually.

  Step 3: Configure next.config.js (REQUIRED)

  Your next.config.js must include output: 'standalone':

  /** @type {import('next').NextConfig} */
  const path = require('path');

  const nextConfig = {
    output: 'standalone',
    outputFileTracingRoot: path.join(__dirname),
    transpilePackages: ['@payez/next-mvp'],
    // ... your other config
  };

  module.exports = nextConfig;

  Without output: 'standalone', the instrumentation hook won't run and OAuth providers
  won't load!

  Step 4: Set Up Instrumentation (REQUIRED for Broker Mode)

  Create instrumentation.ts in the correct location based on your project structure:

  - If app/ is inside src/ → put instrumentation.ts in src/
  - If app/ is at project root → put instrumentation.ts at project root

  export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║            PayEz Next MVP - Server Startup                   ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('');

      try {
        const { logStartupStatus, ensureInitialized } = await import(
          '@payez/next-mvp/lib/startup-init'
        );
        logStartupStatus();
        await ensureInitialized();
        console.log('Server startup initialization complete!');
      } catch (error) {
        console.error('Server startup initialization failed:', error);
      }
    }
  }

  This fetches OAuth providers and secrets from IDP at server startup.

  Step 5: Configure Middleware

  Create middleware.ts (same location rules as instrumentation):

  export { middleware, config } from '@payez/next-mvp/edge/middleware';

  Step 6: Set Up NextAuth API Route

  Create app/api/auth/[...nextauth]/route.ts:

  export { GET, POST } from '@payez/next-mvp/routes/auth/nextauth';

  Step 7: Create Auth API Routes

  7.1: Login Handler

  Create app/api/auth/login/route.ts:

  export { POST } from '@payez/next-mvp/api-handlers/auth/login';

  7.2: Masked Info Handler

  Create app/api/account/masked-info/route.ts:

  export { POST } from '@payez/next-mvp/api-handlers/account/masked-info';

  7.3: Send Code Handler

  Create app/api/account/send-code/route.ts:

  export { POST } from '@payez/next-mvp/api-handlers/account/send-code';

  7.4: Verify Email Handler

  Create app/api/account/verify-email/route.ts:

  export { POST } from '@payez/next-mvp/api-handlers/account/verify-email';

  7.5: Verify SMS Handler

  Create app/api/account/verify-sms/route.ts:

  export { POST } from '@payez/next-mvp/api-handlers/account/verify-sms';

  Step 8: Add Auth Pages

  8.1: Copy Login Page

  Copy from package: @payez/next-mvp/src/pages/login/page.tsx

  To: app/account-auth/login/page.tsx

  8.2: Copy Verify Code Page

  Copy from package: @payez/next-mvp/src/pages/verify-code/page.tsx

  To: app/account-auth/verify-code/page.tsx

  That's it! You now have a complete auth flow.

  ---
  Verifying the Setup

  When you start your dev server, you should see:

  ╔══════════════════════════════════════════════════════════════╗
  ║            PayEz Next MVP - Server Startup                   ║
  ╚══════════════════════════════════════════════════════════════╝

  [IDP_CONFIG] Step 1: Requesting signed client assertion...
  [IDP_CONFIG] Step 2: Fetching client config...
  [IDP_CONFIG] Loaded client config from IDP {
    clientId: 8,
    clientSlug: 'your_client',
    providerCount: 2,
    enabledProviders: [ 'google', 'microsoft' ],
    ...
  }

  If you don't see this, check:
  1. output: 'standalone' in next.config.js
  2. instrumentation.ts in correct location (see Step 4)
  3. IDP_URL and CLIENT_ID are set correctly
  4. Client exists in IDP Manager and has signing key enabled

  ---
  Project Structure Reference

  With src/ folder (recommended):

  project/
  ├── src/
  │   ├── app/
  │   │   └── api/auth/[...nextauth]/route.ts
  │   ├── instrumentation.ts  ← HERE
  │   └── middleware.ts       ← HERE
  ├── next.config.js
  ├── .env.development
  └── package.json

  Without src/ folder:

  project/
  ├── app/
  │   └── api/auth/[...nextauth]/route.ts
  ├── instrumentation.ts  ← HERE
  ├── middleware.ts       ← HERE
  ├── next.config.js
  ├── .env.development
  └── package.json

  ---
  Troubleshooting

  Broker handshake not running at startup

  - Ensure output: 'standalone' is in next.config.js
  - Ensure instrumentation.ts is in correct location for your project structure
  - Delete .next folder and restart

  404 on client assertion

  - Verify CLIENT_ID matches exactly the slug in IDP Manager
  - Ensure client has signing key enabled in IDP Manager

  "Authentication required" error

  - Check startup logs for NEXTAUTH_SECRET being set
  - Verify Redis connection if using session store

  OAuth providers not showing

  - Check IDP Manager to ensure providers are enabled for your client
  - Verify enabledProviders array in startup logs

  ---
  What's Included

  ✅ Provided by Package

  - Middleware for route protection
  - API handlers for auth flow
  - Session management (Redis or in-memory)
  - Token refresh logic
  - Dynamic OAuth provider loading from IDP
  - Reference UI pages (Tailwind only)
  - TypeScript types

  ❌ Not Included

  - Custom UI component library (use your own!)
  - Database integration
  - User registration flow

  ---
  License

  MIT License - see LICENSE file for details
  