# Authentication Modes Guide

The MVP now supports flexible authentication patterns for different application types. Instead of a one-size-fits-all approach, you can configure the auth system based on your client's needs.

## Auth Modes

### Traditional Mode
For membership-based sites where users create accounts with email and password.

**Features:**
- Email/password signup and login
- Account recovery
- Password reset
- Session management via your database

**Best for:**
- Community platforms
- SaaS applications with custom user accounts
- Enterprise internal tools
- Membership/subscription services

**Configuration:**
```typescript
authMode: 'traditional',
providers: [],
enableRecovery: true,
enableEmailSignup: true,
allowPasswordReset: true,
```

### Federated Mode
Users authenticate exclusively through OAuth providers (Google, Microsoft, Facebook, GitHub).

**Features:**
- No password management
- Immediate "sign up" via provider choice
- No password reset needed (handled by provider)
- Minimum friction - 1-click login/signup
- No account recovery flow needed

**Best for:**
- Federated B2B applications (enterprise IdP delegation)
- B2C apps targeting tech-savvy users
- Resume builders, portfolio tools, etc.
- Apps where social login is preferred

**Configuration:**
```typescript
authMode: 'federated',
providers: ['google', 'microsoft', 'facebook', 'github'],
enableRecovery: false,
enableEmailSignup: false,
allowPasswordReset: false,
```

### Hybrid Mode
Support both traditional and federated auth simultaneously. Users can sign in with either email/password OR their provider of choice.

**Features:**
- Maximum flexibility for users
- Traditional form with provider buttons above
- Recovery and password reset available
- Works for any application type

**Configuration:**
```typescript
// Leave authMode as neither 'traditional' nor 'federated'
// Or explicitly configure both:
authMode: 'hybrid',
providers: ['google', 'microsoft'],
enableRecovery: true,
enableEmailSignup: true,
allowPasswordReset: true,
```

## Setup in Your Application

### 1. Wrap Your App with AuthProvider

In your root layout or app wrapper:

```typescript
// app/layout.tsx
import { AuthProvider } from '@payez/next-mvp/client/AuthContext';

const authConfig = {
  mode: 'federated' as const,
  providers: ['google', 'microsoft'] as const,
  enableRecovery: false,
  enableEmailSignup: false,
  allowPasswordReset: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider config={authConfig}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use Mode-Aware Components

The MVP provides ready-to-use mode-aware components:

```typescript
import { ModeAwareLoginPage } from '@payez/next-mvp/components/auth/ModeAwareLoginPage';
import { ModeAwareSignupPage } from '@payez/next-mvp/components/auth/ModeAwareSignupPage';
```

### 3. Implement Your Page

**Federated-Only Login (No Email/Password):**
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ModeAwareLoginPage } from '@payez/next-mvp/components/auth/ModeAwareLoginPage';
import { FederatedProvider } from '@payez/next-mvp/types/auth';

export default function LoginPage() {
  const router = useRouter();

  const handleFederatedSignIn = (provider: FederatedProvider) => {
    // TODO: Implement NextAuth federated sign-in
    // Example: signIn(provider, { redirect: true, callbackUrl: '/dashboard' })
    console.log(`Sign in with ${provider}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.5rem' }}>
        <h1>Sign In</h1>
        <ModeAwareLoginPage onFederatedSignIn={handleFederatedSignIn} />
      </div>
    </div>
  );
}
```

**Traditional Login (Email/Password):**
```typescript
'use client';

import { ModeAwareLoginPage } from '@payez/next-mvp/components/auth/ModeAwareLoginPage';

export default function LoginPage() {
  const handleTraditionalSignIn = async (email: string, password: string) => {
    // TODO: Implement your sign-in logic
    // Example: signIn('credentials', { email, password, redirect: true })
    console.log('Sign in with', email);
  };

  const handleForgotPassword = () => {
    // Navigate to recovery page or show recovery modal
    console.log('Forgot password clicked');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.5rem' }}>
        <h1>Sign In</h1>
        <ModeAwareLoginPage
          onTraditionalSignIn={handleTraditionalSignIn}
          onForgotPassword={handleForgotPassword}
        />
      </div>
    </div>
  );
}
```

**Hybrid (Both Options):**
```typescript
'use client';

import { ModeAwareLoginPage } from '@payez/next-mvp/components/auth/ModeAwareLoginPage';
import { FederatedProvider } from '@payez/next-mvp/types/auth';

export default function LoginPage() {
  const handleFederatedSignIn = (provider: FederatedProvider) => {
    console.log(`Sign in with ${provider}`);
  };

  const handleTraditionalSignIn = async (email: string, password: string) => {
    console.log('Sign in with', email);
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '0.5rem' }}>
        <h1>Sign In</h1>
        <ModeAwareLoginPage
          onFederatedSignIn={handleFederatedSignIn}
          onTraditionalSignIn={handleTraditionalSignIn}
          onForgotPassword={handleForgotPassword}
        />
      </div>
    </div>
  );
}
```

## Composable Components

If you need more fine-grained control, use the individual components:

### FederatedAuthSection
```typescript
import { FederatedAuthSection } from '@payez/next-mvp/components/auth/FederatedAuthSection';
import { useFederatedProviders } from '@payez/next-mvp/client/AuthContext';

export function MyLoginForm() {
  const providers = useFederatedProviders();

  const handleProviderClick = (provider) => {
    // Handle sign-in
  };

  return (
    <>
      <h2>Sign In with:</h2>
      <FederatedAuthSection
        providers={providers}
        onProviderClick={handleProviderClick}
        isLoading={false}
      />
    </>
  );
}
```

### TraditionalAuthSection
```typescript
import { TraditionalAuthSection } from '@payez/next-mvp/components/auth/TraditionalAuthSection';

export function MyLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle sign-in
  };

  return (
    <TraditionalAuthSection
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isLoading={false}
      buttonText="Sign In"
      showForgotPassword={true}
      onForgotPassword={() => {}}
    />
  );
}
```

## Hooks for Dynamic Logic

Use these hooks to respond to auth mode in your components:

```typescript
import {
  useAuthConfig,      // Get full config
  useAuthMode,        // Get 'traditional' | 'federated'
  useFederatedProviders, // Get array of providers
  useFederatedAuthEnabled, // Check if federated available
  useTraditionalAuthEnabled, // Check if traditional available
} from '@payez/next-mvp/client/AuthContext';

export function MyComponent() {
  const mode = useAuthMode();
  const providers = useFederatedProviders();
  const isFederated = useFederatedAuthEnabled();
  const isTraditional = useTraditionalAuthEnabled();

  if (isFederated) {
    return <FederatedOnlyUI />;
  }

  if (isTraditional) {
    return <TraditionalOnlyUI />;
  }

  return <HybridUI />;
}
```

## Real-World Examples

### Example 1: Resume Builder (Federated Only)

No passwords, zero friction signup. Users choose their IdP.

```typescript
// Root layout
const authConfig: AuthConfig = {
  mode: 'federated',
  providers: ['google', 'microsoft'],
  enableRecovery: false,
  enableEmailSignup: false,
  allowPasswordReset: false,
};

// Login page shows ONLY:
// - Google button
// - Microsoft button
// - Nothing else
```

### Example 2: Enterprise SaaS (Hybrid)

Support both traditional accounts AND federated options.

```typescript
// Root layout
const authConfig: AuthConfig = {
  mode: 'hybrid', // or omit for implicit hybrid
  providers: ['google', 'microsoft', 'github'],
  enableRecovery: true,
  enableEmailSignup: true,
  allowPasswordReset: true,
};

// Login page shows:
// - Google button
// - Microsoft button
// - GitHub button
// - "Or sign in with email" divider
// - Email field
// - Password field
// - "Forgot password?" link
```

### Example 3: Private Community (Traditional Only)

Classic email/password with recovery.

```typescript
// Root layout
const authConfig: AuthConfig = {
  mode: 'traditional',
  providers: [],
  enableRecovery: true,
  enableEmailSignup: true,
  allowPasswordReset: true,
};

// Login page shows ONLY:
// - Email field
// - Password field
// - "Forgot password?" link
// - "Sign Up" link
```

## Migration Path

Already using the MVP with traditional auth?

1. Update your `AuthProvider` config:
   ```typescript
   // Before: Nothing, using defaults
   // After: Explicitly configure
   <AuthProvider config={{
     mode: 'traditional',
     providers: [],
     enableRecovery: true,
     enableEmailSignup: true,
     allowPasswordReset: true,
   }}>
   ```

2. Replace old login page with new mode-aware version:
   ```typescript
   import { ModeAwareLoginPage } from '@payez/next-mvp/components/auth/ModeAwareLoginPage';
   ```

3. Your page automatically adapts to config without code changes!

## API Routes & Backend

The mode configuration affects **UI only**. Your backend still needs:

- **Traditional mode:** `/api/auth/login`, `/api/auth/signup`, `/api/auth/recovery`, `/api/auth/reset-password`
- **Federated mode:** NextAuth provider configuration, OAuth flow handling
- **Hybrid mode:** Both of the above

The MVP continues to provide reference implementations for these endpoints.

## TypeScript Support

All types are exported for type safety:

```typescript
import {
  AuthMode,          // 'traditional' | 'federated'
  FederatedProvider, // 'google' | 'microsoft' | 'facebook' | 'github'
  AuthConfig,        // Full config interface
} from '@payez/next-mvp/types/auth';
```

## Testing

Test different modes by toggling the `AuthProvider` config:

```typescript
// In your test setup
<AuthProvider config={{ mode: 'federated', providers: ['google'], ... }}>
  <LoginPage />
</AuthProvider>

// Should render only Google button

<AuthProvider config={{ mode: 'traditional', providers: [], ... }}>
  <LoginPage />
</AuthProvider>

// Should render email/password form
```
