# NextAuth Cookie Encryption Configuration Review

## Current Issue Context

**Problem**: After successful 2FA completion, users are redirected back to login instead of dashboard.

**Root Cause**: JWE (JSON Web Encryption) cookie decryption failure - cookie exists but can't be decrypted.

**Evidence**:
```
Cookie: "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0...."
Decoded Header: {"alg":"dir","enc":"A256GCM"}
Result: hasToken: false, sessionToken: 'undefined...'
```

## NextAuth Cookie Encryption Behavior

### **Development Mode (NODE_ENV=development)**
```javascript
// NextAuth automatically uses JWT (unencrypted) for simplicity
{
  "alg": "HS256",  // Simple HMAC-SHA256 signing
  "typ": "JWT"     // Plain JWT, not encrypted
}
```

### **Production Mode (NODE_ENV=production)**
```javascript
// NextAuth automatically uses JWE (encrypted) for security
{
  "alg": "dir",        // Direct encryption
  "enc": "A256GCM"     // AES-256-GCM encryption
}
```

## Current Configuration Analysis

### **Development (.env.local)**
```bash
NODE_ENV=development
NEXTAUTH_SECRET=temporary-next-auth-key-for-stage-testing-and-stuff
NEXTAUTH_URL=http://localhost:3200
TEST_MODE=true
```

**Expected Behavior**: Simple JWT tokens (readable in browser dev tools)

### **Production (api.payez.net)**
```bash
NODE_ENV=production
NEXTAUTH_SECRET=[fetched from IDP at runtime]
NEXTAUTH_URL=https://api.payez.net
TEST_MODE=false
```

**Expected Behavior**: Encrypted JWE tokens (unreadable binary data)

## Potential Issues & Solutions

### **Issue 1: NEXTAUTH_SECRET Inconsistency**

**Problem**: Secret changes between token creation and token reading

**Symptoms**:
- Cookie exists but decryption fails
- `hasToken: false` despite cookie presence
- Users stuck in auth loop

**Diagnostic Commands**:
```bash
# Check if secret is consistent
echo $NEXTAUTH_SECRET | md5sum

# Check cookie contents in browser
document.cookie.split(';').find(c => c.includes('next-auth.session-token'))
```

**Solutions**:
1. **Ensure secret consistency** across all app instances
2. **Use Redis or database for session storage** instead of cookies
3. **Add secret rotation handling** with multiple valid secrets

### **Issue 2: Environment Mismatch**

**Problem**: Dev uses JWT, Prod uses JWE, but config is mixed

**Current Suspected Issue**:
```javascript
// Token created in one mode (JWT)
// Token read in another mode (JWE)
// Result: Decryption failure
```

**Solutions**:
1. **Force consistent encryption mode**:
   ```javascript
   // In next-auth config
   useSecureCookies: process.env.NODE_ENV === 'production',
   cookies: {
     sessionToken: {
       name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: useSecureCookies
       }
     }
   }
   ```

2. **Explicit JWT/JWE control**:
   ```javascript
   jwt: {
     encode: async ({ secret, token }) => {
       // Force specific encoding behavior
     },
     decode: async ({ secret, token }) => {
       // Force specific decoding behavior
     }
   }
   ```

### **Issue 3: 2FA Token Upgrade Process**

**Problem**: Token upgrade during 2FA completion fails

**Flow Analysis**:
```
1. User logs in → Gets basic JWT/JWE token
2. User completes 2FA → System should upgrade token with 2FA claims
3. Upgrade process fails → Old token becomes invalid
4. User redirected to login with invalid token
```

**Solutions**:
1. **Fix token upgrade process**:
   ```javascript
   // In NextAuth callbacks
   jwt: async ({ token, user, account, profile, trigger }) => {
     if (trigger === 'signIn' && account) {
       // Handle initial login
     }
     if (trigger === 'update' && user?.twoFactorComplete) {
       // Handle 2FA upgrade - THIS IS LIKELY FAILING
       token.twoFactorComplete = true;
       token.mfaCompletedAt = new Date().toISOString();
     }
     return token;
   }
   ```

2. **Add token refresh mechanism**:
   ```javascript
   // Force token refresh after 2FA
   await signIn('credentials', { 
     redirect: false,
     refreshToken: true 
   });
   ```

## Recommended Configuration Changes

### **1. Environment-Specific Cookie Settings**

**Development** (`next.config.js`):
```javascript
module.exports = {
  // Force JWT in development for debugging
  env: {
    NEXTAUTH_JWT_STRATEGY: 'jwt'
  }
}
```

**Production** (Environment variables):
```bash
# Consistent encryption
NEXTAUTH_JWT_STRATEGY=database  # Use database sessions instead
# OR
NEXTAUTH_JWT_STRATEGY=jwt       # Force JWT with explicit encryption
```

### **2. Explicit Cookie Configuration**

```javascript
// pages/api/auth/[...nextauth].js
export default NextAuth({
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Add explicit max age to prevent token expiry issues
        maxAge: 30 * 24 * 60 * 60, // 30 days
      }
    }
  },
  
  // Explicit JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Optional: Force encryption even in development
    encode: async ({ secret, token }) => {
      if (process.env.FORCE_JWT_ENCRYPTION === 'true') {
        return await EncryptJWT(token).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).encrypt(secret);
      }
      return await new jose.SignJWT(token).setProtectedHeader({ alg: 'HS256' }).sign(secret);
    },
    decode: async ({ secret, token }) => {
      if (token.startsWith('eyJhbGciOiJkaXIi')) {
        // JWE token
        const { payload } = await jwtDecrypt(token, secret);
        return payload;
      } else {
        // JWT token
        const { payload } = await jwtVerify(token, secret);
        return payload;
      }
    }
  }
})
```

### **3. Debugging Tools**

**Add to development** (`src/lib/debug-cookies.ts`):
```javascript
export function debugNextAuthCookies() {
  if (typeof window === 'undefined') return;
  
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
  
  if (sessionCookie) {
    const token = sessionCookie.split('=')[1];
    console.log('Session Token:', token);
    
    try {
      // Try to decode as JWT
      const parts = token.split('.');
      if (parts.length === 3) {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT Header:', header);
        console.log('JWT Payload:', payload);
      }
    } catch (e) {
      console.log('Token is encrypted (JWE) - cannot read in browser');
    }
  }
}
```

## Immediate Action Items

### **For Current Demo Fix**:
1. **Clear all cookies** and try fresh login
2. **Check NEXTAUTH_SECRET consistency** across all environments
3. **Add debug logging** to token creation/reading process

### **For Long-term Fix**:
1. **Implement the explicit cookie configuration above**
2. **Add token upgrade debugging** to 2FA completion flow
3. **Consider switching to database sessions** to avoid JWE complexity
4. **Add token refresh mechanism** after successful 2FA

### **Environment Variables to Check**:
```bash
# Development
NEXTAUTH_SECRET=temporary-next-auth-key-for-stage-testing-and-stuff
NODE_ENV=development

# Production
NEXTAUTH_SECRET=[should be fetched from IDP and consistent]
NODE_ENV=production
```

### **Quick Test Commands**:
```bash
# Check current cookie encryption
curl -v https://api.payez.net/api/auth/session

# Check secret consistency
kubectl exec -it deployment/website-membership -- printenv NEXTAUTH_SECRET

# Force cookie clear
curl -b '' -c /dev/null https://api.payez.net/account-auth/login
```

This JWE encryption issue explains why 2FA succeeds but users can't access protected pages afterward!