# Federated Authentication Quick Start

For applications like **idealresume.online** where you want zero-friction authentication with social providers (Google, Microsoft, GitHub, Facebook).

## TL;DR

Users see social login buttons. That's it. No passwords, no complexity.

## Setup (5 minutes)

### 1. Configure Auth Mode in Your App

**app/layout.tsx** or your root wrapper:

```typescript
import { AuthProvider } from '@payez/next-mvp/client/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider config={{
          mode: 'federated',
          providers: ['google', 'microsoft', 'facebook', 'github'],
          enableRecovery: false,
          enableEmailSignup: false,
          allowPasswordReset: false,
        }}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Update Your Login Page

Replace whatever you have with:

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ModeAwareLoginPage } from '@payez/next-mvp/components/auth/ModeAwareLoginPage';
import { FederatedProvider } from '@payez/next-mvp/types/auth';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.id === 'dark-mode';

  const handleFederatedSignIn = async (provider: FederatedProvider) => {
    // NextAuth handles the OAuth flow
    await signIn(provider, {
      redirect: true,
      callbackUrl: '/dashboard',
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400'} p-4`}>
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 max-w-md w-full`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Title */}
        <h1 className={`text-3xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Sign In
        </h1>
        <p className={`text-center mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Continue with your provider
        </p>

        {/* Federated Auth (auto-renders based on config) */}
        <ModeAwareLoginPage onFederatedSignIn={handleFederatedSignIn} />

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
            Don't have an account?{' '}
            <a
              href="/account-auth/signup"
              className={`font-semibold hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              Sign up
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
```

### 3. Update Your Signup Page

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ModeAwareSignupPage } from '@payez/next-mvp/components/auth/ModeAwareSignupPage';
import { FederatedProvider } from '@payez/next-mvp/types/auth';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';

export default function SignupPage() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.id === 'dark-mode';

  const handleFederatedSignUp = async (provider: FederatedProvider) => {
    // NextAuth handles the OAuth flow (signup is same as signin for federated)
    await signIn(provider, {
      redirect: true,
      callbackUrl: '/dashboard',
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-400'} p-4`}>
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 max-w-md w-full`}>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Title */}
        <h1 className={`text-3xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Create Account
        </h1>
        <p className={`text-center mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Choose your provider below
        </p>

        {/* Federated Auth (auto-renders based on config) */}
        <ModeAwareSignupPage onFederatedSignUp={handleFederatedSignUp} />

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
            Already have an account?{' '}
            <a
              href="/account-auth/login"
              className={`font-semibold hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              Sign in
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
```

### 4. Configure NextAuth

**auth.ts** (or equivalent):

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Microsoft from 'next-auth/providers/microsoft-entra-id';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Microsoft({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID, // optional
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store user info in JWT
      if (account) {
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        token.image = profile.image;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass token data to session
      session.user.provider = token.provider;
      session.user.providerAccountId = token.providerAccountId;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs, otherwise redirect to baseUrl
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/account-auth/login',
    signUp: '/account-auth/signup',
    error: '/account-auth/error',
  },
});
```

### 5. Set Environment Variables

Add to `.env.local`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common  # or your specific tenant

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# NextAuth - secret is auto-fetched from IDP at startup
# AUTH_TRUST_HOST=true handles OAuth callback URLs via request headers
```

## What You Get

✅ **Users see only social buttons** - No email/password confusion
✅ **Zero password management** - IdPs handle auth
✅ **Mobile-optimized flow** - Single tap/click to sign in
✅ **No recovery flow needed** - Users reset password at their provider
✅ **TypeScript safe** - Full type support for providers
✅ **Dark mode ready** - Uses theme context automatically
✅ **One-click switch** - Toggle providers in config

## What Users See

### Login Page:
```
┌─────────────────────┐
│  Your App Logo      │
│                     │
│  Sign In            │
│  Continue with...   │
│                     │
│  [ Google   ]       │
│  [ Microsoft]       │
│  [ GitHub   ]       │
│  [ Facebook ]       │
│                     │
│  Sign up? [link]    │
└─────────────────────┘
```

### No:
- Email field
- Password field
- "Forgot password?" link
- Complex recovery flow
- Password validation
- Account lockout logic

Just buttons. The way modern web works.

## Customization

Change which providers appear:

```typescript
// Only Google and Microsoft
<AuthProvider config={{
  mode: 'federated',
  providers: ['google', 'microsoft'],
  ...
}}>

// Only Google
<AuthProvider config={{
  mode: 'federated',
  providers: ['google'],
  ...
}}>

// All providers
<AuthProvider config={{
  mode: 'federated',
  providers: ['google', 'microsoft', 'github', 'facebook'],
  ...
}}>
```

Change button order, colors, styling - all via the `FederatedAuthSection` component which respects CSS variables.

## Testing Locally

1. Get OAuth credentials from Google, Microsoft, etc.
2. Ensure `AUTH_TRUST_HOST=true` in `.env.local`
3. Run your app: `npm run dev`
4. Click a provider button
5. Complete OAuth flow with that provider
6. You're signed in

## Production

1. Ensure `AUTH_TRUST_HOST=true` in ConfigMap (NextAuth reads URL from ingress headers)
2. Update OAuth provider redirect URLs to production domain
3. Deploy!

That's it. Federated auth, zero passwords, done.
