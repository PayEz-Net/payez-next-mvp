# URGENT: Package Reinstall Required

**To**: Blocked Developer  
**From**: Jon + AI Agent  
**Date**: 2025-10-26  
**Priority**: HIGH

---

## 🚨 The Problem You Hit

Your 2FA flow broke because the old package had the verify-code page calling `getSession()` when there was no full session yet. This is fundamentally wrong - a session DOES exist during 2FA, it just has an intermediate token.

## ✅ The Fix

We've rebuilt the package from `website-membership` (the working reference implementation) with ALL code review fixes applied.

---

## 📋 What You Need to Do

### 1. Uninstall Old Package (5 minutes)

```bash
# In your project directory (e.g., Nexus.CryptAply)
npm uninstall @payez/next-mvp
rm -rf node_modules package-lock.json
```

### 2. Reinstall Fresh Package (5 minutes)

```bash
npm install @payez/next-mvp@latest
npm install
```

### 3. Fix Your verify-code Page (10 minutes)

**Find this WRONG pattern:**
```typescript
useEffect(() => {
  const fetchMaskedInfo = async () => {
    const session = await getSession();  // ❌ WRONG
    if (!session?.user?.email || !session?.accessToken) {
      console.error('[2FA] No session available');
      return;
    }
    // ...
  };
}, []);
```

**Replace with CORRECT pattern:**
```typescript
import { useAuthStore } from '@/stores/authStore';  // ← From your Zustand store
import { accountApi } from '@payez/next-mvp';       // ← From package

const { session } = useAuthStore();  // ← Session EXISTS with intermediate token

useEffect(() => {
  if (!session?.accessToken || !session?.user?.email) {
    return;  // Just return, don't error
  }

  const fetchMasked = async () => {
    const response = await accountApi.getMaskedInfo(
      session.user.email,
      session.accessToken  // ← This token exists after login!
    );
    setMaskedInfo(response);
  };

  fetchMasked();
}, [session]);
```

### 4. Fix masked-info API Route (5 minutes)

**Ensure your route exports POST (not GET):**

```typescript
// app/api/account/masked-info/route.ts
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // Validate token and return masked info
  // ...
}
```

### 5. Test (10 minutes)

1. Start your app: `npm run dev`
2. Login with valid credentials
3. Verify you reach verify-code page
4. Check console - should see masked email/phone load
5. Submit 2FA code
6. Should reach dashboard

**Look for**:
- ✅ No "No session available" errors
- ✅ No 405 errors
- ✅ Masked info loads
- ✅ No PII in console (emails should show as `***@***`)

---

## 📚 More Details

If you need more info:
- `MIGRATION_GUIDE.md` - Full migration steps
- `DOCS_2FA_TOKEN_FLOW.md` - Why the token flow works this way
- `CHANGELOG.md` - What changed in v2.0.0

---

## 🆘 Still Stuck?

Contact Jon or check these files in the package repo:
- E:\Repos\PayEz-Next-MVP\MIGRATION_GUIDE.md
- E:\Repos\PayEz-Next-MVP\CHANGELOG.md

**Source**: website-membership commit `b3f7438` (all fixes applied)

---

## ⏱️ Estimated Total Time

30-40 minutes including testing

Good luck! 🚀
