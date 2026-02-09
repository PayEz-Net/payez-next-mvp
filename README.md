# PayEz-Next-MVP

Production-ready Next.js authentication package with 2FA, session management, and type-safe API clients.

**Source**: Extracted from `website-membership` (battle-tested reference implementation)  
**Version**: 2.0.0  
**Last Updated**: 2025-10-26

---

## 🚀 Quick Start

### Installation

```bash
npm install @payez/next-mvp
```

### Basic Setup

```typescript
// app/layout.tsx
import { SessionProvider } from 'next-auth/react';
import { SessionSync } from '@payez/next-mvp/components';

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      <SessionSync>
        {children}
      </SessionSync>
    </SessionProvider>
  );
}
```

---

## 📦 What's Included

### ✅ Session Management
- **SessionSync** - Bridges NextAuth and Zustand with strict validation
- **useAuthStore** - Zustand store for auth state
- **isValidSession** - Type guard prevents invalid session states
- **SessionService** - Role checks, 2FA status, sign-out helpers

### ✅ 2FA Flow
- Intermediate token handling during verification
- Masked contact info API client
- Token exchange after successful 2FA
- Type-safe session states (`twoFactorSessionVerified`)

### ✅ API Clients
- **standardizedApi** - Type-safe HTTP client with token refresh
- **accountApi** - Pre-built methods for common operations
- Runtime validation for API responses
- Graceful error handling

### ✅ TypeScript Support
- NextAuth module augmentation included
- Full type safety without assertions
- Proper session, user, and JWT types

### ✅ Security
- PII redaction in logs
- Prevents duplicate sign-outs
- Generic error codes (no internal details exposed)
- Session validation prevents empty user data bugs

---

## 📖 Key Features

### Correct 2FA Token Flow

**After Login** → Session exists with intermediate `accessToken`  
**During 2FA** → Use that token to fetch masked info and submit codes  
**After 2FA** → IDP issues new token with MFA claims, session continues

```typescript
// verify-code page
import { useAuthStore } from '@payez/next-mvp/stores/authStore';
import { accountApi } from '@payez/next-mvp/utils/api';

const { session } = useAuthStore();

useEffect(() => {
  if (session?.accessToken && session?.user?.email) {
    accountApi.getMaskedInfo(session.user.email, session.accessToken)
      .then(setMaskedInfo);
  }
}, [session]);
```

### Type-Safe API Calls

```typescript
import { standardizedApi, isApiSuccess, extractApiData } from '@payez/next-mvp';

const res = await standardizedApi.get<UserData>('/api/users/me');

if (isApiSuccess(res)) {
  const user = extractApiData(res);
  console.log(user.name); // ✅ Type-safe
}
```

### Session Validation

```typescript
import { isValidSession } from '@payez/next-mvp/lib/session';

if (isValidSession(session)) {
  // ✅ TypeScript knows session has valid user.id, user.email, accessToken
  console.log(session.user.id);
}
```

---

## 🔧 Configuration

### NextAuth Types

The package includes NextAuth module augmentation. If you have custom fields, extend in your `types/next-auth.d.ts`:

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    // Package provides these by default:
    // - user.id, user.email, user.roles
    // - user.twoFactorSessionVerified, user.requiresTwoFactor
    // - sessionToken, accessToken, refreshToken
    // - authenticationMethods, mfaExpiresAt, etc.
    
    // Add your custom fields:
    customField?: string;
  }
}
```

### Environment Variables

Required for full functionality:

```bash
# IDP Service
IDP_URL=https://your-idp-service.com
CLIENT_ID=your-client-id

# NextAuth - secret is auto-fetched from IDP at startup
AUTH_TRUST_HOST=true

# Internal URLs (for server-side calls)
INTERNAL_API_URL=http://localhost:3000

# Redis for session storage
REDIS_URL=redis://localhost:6379
```

---

## 📚 Documentation

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Upgrading from 1.x
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[DOCS_2FA_TOKEN_FLOW.md](./DOCS_2FA_TOKEN_FLOW.md)** - Detailed 2FA flow
- **[CODE_REVIEW_221ff2e2.md](./CODE_REVIEW_221ff2e2.md)** - Technical review

---

## 🧪 Testing

After installation, verify:

- [ ] Login redirects to verify-code
- [ ] Verify-code loads masked info
- [ ] 2FA submission works
- [ ] Dashboard loads after 2FA
- [ ] No console errors
- [ ] No PII in logs

---

## 🐛 Troubleshooting

### "No session available for masked info"
**Fix**: Use `useAuthStore()` instead of `getSession()` on verify-code page

### 405 Method Not Allowed on masked-info
**Fix**: Ensure your API route exports `POST` handler

### TypeScript errors on session properties
**Fix**: Update your `next-auth.d.ts` to include missing fields

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for more solutions.

---

## 🤝 Contributing

This package is extracted from `website-membership`. To contribute:

1. Make changes in `website-membership` first
2. Test thoroughly in that repo
3. Extract to package
4. Update version and CHANGELOG
5. Test in consuming apps

**Source of Truth**: `website-membership` commit `b3f7438`

---

## 📄 License

Private package for PayEz internal use.

---

## 📞 Support

Questions? Check:
1. Migration guide
2. 2FA flow docs
3. Code review document
4. Contact the team

**Latest Version**: See [CHANGELOG.md](./CHANGELOG.md)
