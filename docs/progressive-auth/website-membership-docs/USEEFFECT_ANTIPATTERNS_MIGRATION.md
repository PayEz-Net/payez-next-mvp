# useEffect Anti-Patterns Migration Guide

## Project: website-membership
**Date**: 2025-10-03  
**Branch**: feature/middleware-harden  
**Commit**: 79f5e4d

---

## 🚨 CRITICAL ISSUES

### Current Problem
The application has **pervasive useEffect anti-patterns** causing:
1. ✅ **FIXED**: Infinite loop in profile/security pages (temporary bandaid with `fetchAttempted` flag)
2. ❌ **NOT FIXED**: Data fetching logic scattered across 50+ useEffect hooks
3. ❌ **NOT FIXED**: Race conditions in async data loading
4. ❌ **NOT FIXED**: No caching, stale-while-revalidate, or optimistic updates
5. ❌ **NOT FIXED**: Complex dependency arrays prone to bugs
6. ❌ **NOT FIXED**: Waterfalls and serial fetching patterns

---

## 📋 IDENTIFIED ANTI-PATTERNS

### **Anti-Pattern 1: Data Fetching in useEffect**
**Severity**: 🔴 Critical

#### Examples Found:

**File**: `src/app/dashboards/account/profile/page.tsx`
```tsx
// ❌ ANTI-PATTERN
useEffect(() => {
  let isMounted = true;
  if (isAuthenticated && !fetchAttempted && !profileData && !loadingProfile && isMounted) {
    console.log('[ProfilePage] Fetching profile data (first time only)');
    setFetchAttempted(true);
    fetchUserProfile();
  }
  return () => { isMounted = false; };
}, [isAuthenticated, fetchAttempted, profileData, loadingProfile, fetchUserProfile]);
```

**Issues**:
- Manual loading state management
- Manual error handling
- No caching
- No automatic refetch on window focus
- No retry logic
- Complex dependency array
- Requires `fetchAttempted` hack to prevent infinite loops

**File**: `src/app/dashboards/account/security/page.tsx`
```tsx
// ❌ SAME ANTI-PATTERN (duplicated code)
useEffect(() => {
  let isMounted = true;
  if (isAuthenticated && !fetchAttempted && !profileData && !loadingProfile && isMounted) {
    console.log('[SecurityPage] Fetching profile data (first time only)');
    setFetchAttempted(true);
    fetchUserProfile();
  }
  return () => { isMounted = false; };
}, [isAuthenticated, fetchAttempted, profileData, loadingProfile, fetchUserProfile]);
```

**File**: `src/app/dashboards/account/profile/edit/page.tsx`
```tsx
// ❌ ANTI-PATTERN - apiCall in dependency array
useEffect(() => {
  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await apiCall<ProfileResponse>(API_ENDPOINTS.account.profile, 'GET');
      // ... handle result
    } catch (err) {
      // ... handle error
    } finally {
      setLoading(false);
    }
  };
  loadProfile();
}, [apiCall]); // apiCall changes on every render!
```

**File**: `src/app/dashboards/idp-admin/audit/page.tsx`
```tsx
// ❌ ANTI-PATTERN
useEffect(() => {
  if (!isAuthenticated) return;
  
  const fetchAudit = async () => {
    try {
      const result = await apiCall('/api/admin/audit');
      const data = (result as any)?.data || { total: 0, items: [] };
      setAuditData(data);
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      setAuditData({ total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };
  
  fetchAudit();
}, [isAuthenticated, apiCall]);
```

---

### **Anti-Pattern 2: useEffect with Function Dependencies**
**Severity**: 🔴 Critical

#### Examples:
**File**: `src/app/dashboards/idp-admin/roles/categories/page.tsx`
```tsx
// ❌ ANTI-PATTERN - function in dependency array
useEffect(() => {
  load();
}, [load]); // 'load' is a function that may change every render
```

**File**: `src/app/dashboards/idp-admin/roles/crud/page.tsx`
```tsx
// ❌ SAME PATTERN
useEffect(() => {
  load();
}, [load]);
```

**File**: `src/app/dashboards/idp-admin/roles/hooks/useCategoriesRedesign.ts`
```tsx
// ❌ MULTIPLE INSTANCES
useEffect(() => {
  fetchCategories();
}, [fetchCategories]);

useEffect(() => {
  fetchCategoriesAndStats();
}, [fetchCategoriesAndStats]);

useEffect(() => {
  fetchCategory();
}, [fetchCategory]);
```

---

### **Anti-Pattern 3: Serial Fetching (Waterfall)**
**Severity**: 🟡 High

**File**: `src/app/dashboards/idp-admin/roles/assignments/page.tsx`
```tsx
// ❌ ANTI-PATTERN - Serial loading
useEffect(() => {
  const init = async () => {
    setLoading(true);
    try {
      // Fetch 1
      const catResp = await categoryApi.getAllCategories();
      setCategories(catResp.data || []);
      
      // Then fetch 2 (should be parallel!)
      // ... more sequential fetches
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (hasInitRef.current) return;
  hasInitRef.current = true;
  init();
}, []);
```

---

### **Anti-Pattern 4: useEffect for Derived State**
**Severity**: 🟡 High

**File**: `src/app/dashboards/idp-admin/roles/create/page.tsx`
```tsx
// ❌ ANTI-PATTERN - Should use useMemo or compute during render
useEffect(() => {
  if (!formData.categoryId && initialCategory && categoryEntities?.length) {
    const match = getCategoryByName(initialCategory);
    if (match) {
      setFormData(prev => ({ ...prev, categoryId: match.id, categoryName: match.name }));
    }
  }
}, [initialCategory, categoryEntities]);
```

---

### **Anti-Pattern 5: Chained useEffects**
**Severity**: 🟡 High

**File**: `src/app/dashboards/idp-admin/roles/assignments/page.tsx`
```tsx
// ❌ ANTI-PATTERN - Effect chain
useEffect(() => {
  // Effect 1 loads clients
  loadClients();
}, [mode]);

useEffect(() => {
  // Effect 2 depends on Effect 1 completing
  if (mode !== 'client') return;
  if (!clients || clients.length === 0) return;
  loadAllClientsRoles();
}, [mode, clients]);
```

---

### **Anti-Pattern 6: useEffect with Session/Auth State**
**Severity**: 🔴 Critical (caused infinite loop)

**File**: `src/app/account-auth/verify-code/verify-code-form.tsx`
```tsx
// ❌ ANTI-PATTERN - Session object changes frequently
useEffect(() => {
  if (isAuthenticated && session) {
    const currentTwoFactorState = {
      twoFactorSessionVerified: session.user?.twoFactorSessionVerified ?? false,
      requiresTwoFactor: session.user?.requiresTwoFactor ?? false,
      twoFactorMethod: session.user?.twoFactorMethod
    };

    if (!initialized.current) {
      // Fetch masked info only on initial session load
      // ... complex initialization logic
    }
  }
}, [isAuthenticated, session, ...more_deps]); // session changes trigger refetches
```

---

## 📊 COMPREHENSIVE FILE AUDIT

### Files with Data Fetching useEffect Anti-Patterns:

#### Account Pages:
1. ✅ `src/app/dashboards/account/profile/page.tsx` - PARTIALLY FIXED (bandaid)
2. ✅ `src/app/dashboards/account/security/page.tsx` - PARTIALLY FIXED (bandaid)
3. ❌ `src/app/dashboards/account/profile/edit/page.tsx` - apiCall dependency
4. ❌ `src/app/dashboards/account/settings/page.tsx` - localStorage sync

#### Admin Pages:
5. ❌ `src/app/dashboards/idp-admin/audit/page.tsx` - audit log fetching
6. ❌ `src/app/dashboards/idp-admin/cryptaply/page.tsx` - inventory loading
7. ❌ `src/app/dashboards/idp-admin/clients/[id]/client-details-client.tsx` - client data
8. ❌ `src/app/dashboards/idp-admin/clients/[id]/edit-client-form.tsx` - client editing
9. ❌ `src/app/dashboards/idp-admin/clients/[id]/roles/client-roles-management-client.tsx` - dual fetch

#### Role Management Pages:
10. ❌ `src/app/dashboards/idp-admin/roles/assignments/page.tsx` - triple useEffect chain
11. ❌ `src/app/dashboards/idp-admin/roles/categories/page.tsx` - function dependency
12. ❌ `src/app/dashboards/idp-admin/roles/categorize/page.tsx` - parallel fetches in serial
13. ❌ `src/app/dashboards/idp-admin/roles/client-crud/page.tsx` - dual effect
14. ❌ `src/app/dashboards/idp-admin/roles/client-roles/[id]/page.tsx` - data loading
15. ❌ `src/app/dashboards/idp-admin/roles/create/page.tsx` - template loading + derived state
16. ❌ `src/app/dashboards/idp-admin/roles/crud/page.tsx` - function dependency

#### Custom Hooks:
17. ❌ `src/app/dashboards/idp-admin/roles/hooks/useCategoriesRedesign.ts` - 3x function deps
18. ❌ `src/app/dashboards/idp-admin/roles/hooks/useRoleCategories.ts` - auth-dependent fetch
19. ❌ `src/app/dashboards/idp-admin/roles/hooks/useRoleCategoriesEnhanced.ts` - function dep
20. ❌ `src/app/dashboards/idp-admin/roles/hooks/useRoles.ts` - 4x separate fetch hooks

#### Auth/2FA Pages:
21. ❌ `src/app/account-auth/login/page.tsx` - multiple session-watching effects
22. ❌ `src/app/account-auth/verify-code/page.tsx` - session synchronization
23. ❌ `src/app/account-auth/verify-code/verify-code-form.tsx` - complex session logic

---

## 🎯 RECOMMENDED SOLUTION: React Query Migration

### Step 1: Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Step 2: Setup Query Provider

**File**: `src/app/providers.tsx` (create if doesn't exist)
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**File**: `src/app/layout.tsx`
```tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 🔧 MIGRATION EXAMPLES

### Example 1: Profile Page (HIGH PRIORITY)

**Before** (`src/app/dashboards/account/profile/page.tsx`):
```tsx
const [fetchAttempted, setFetchAttempted] = useState(false);
const [profileData, setProfileData] = useState(null);
const [loadingProfile, setLoadingProfile] = useState(false);

useEffect(() => {
  let isMounted = true;
  if (isAuthenticated && !fetchAttempted && !profileData && !loadingProfile && isMounted) {
    setFetchAttempted(true);
    fetchUserProfile();
  }
  return () => { isMounted = false; };
}, [isAuthenticated, fetchAttempted, profileData, loadingProfile, fetchUserProfile]);
```

**After**:
```tsx
import { useQuery } from '@tanstack/react-query';

// Create a custom hook (or use inline)
const { data: profileData, isLoading, error } = useQuery({
  queryKey: ['profile'],
  queryFn: async () => {
    const result = await apiCall(API_ENDPOINTS.account.profile, 'GET');
    if (isApiSuccess(result)) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to load profile');
  },
  enabled: isAuthenticated, // Only run when authenticated
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});
```

**Benefits**:
- ✅ No manual state management
- ✅ Automatic caching
- ✅ No infinite loop possible
- ✅ Automatic error handling
- ✅ Deduplicated requests
- ✅ Removes 15+ lines of boilerplate

---

### Example 2: Audit Page

**Before** (`src/app/dashboards/idp-admin/audit/page.tsx`):
```tsx
const [auditData, setAuditData] = useState({ total: 0, items: [] });
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!isAuthenticated) return;
  
  const fetchAudit = async () => {
    try {
      const result = await apiCall('/api/admin/audit');
      const data = (result as any)?.data || { total: 0, items: [] };
      setAuditData(data);
    } catch (error) {
      console.error('Failed to fetch audit data:', error);
      setAuditData({ total: 0, items: [] });
    } finally {
      setLoading(false);
    }
  };
  
  fetchAudit();
}, [isAuthenticated, apiCall]);
```

**After**:
```tsx
const { data: auditData = { total: 0, items: [] }, isLoading } = useQuery({
  queryKey: ['admin', 'audit'],
  queryFn: async () => {
    const result = await apiCall('/api/admin/audit');
    return (result as any)?.data || { total: 0, items: [] };
  },
  enabled: isAuthenticated,
});
```

---

### Example 3: Custom Hook Migration

**Before** (`src/app/dashboards/idp-admin/roles/hooks/useRoles.ts`):
```tsx
export const useRoles = () => {
  const [roles, setRoles] = useState<GlobalRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await standardizedApi.get('/api/admin/roles');
      if (response.success) {
        setRoles((response as any).data || []);
      }
    } catch (err) {
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, loading, error, refetch: fetchRoles };
};
```

**After**:
```tsx
export const useRoles = () => {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const response = await standardizedApi.get('/api/admin/roles');
      if (!response.success) {
        throw new Error('Failed to fetch roles');
      }
      return (response as any).data || [];
    },
  });
};
```

---

### Example 4: Mutations (Create/Update/Delete)

**Before**:
```tsx
const handleCreate = async () => {
  try {
    setCreating(true);
    const res = await standardizedApi.post(`/api/admin/clients/${selectedClientId}/roles`, {
      name,
      description: `Client access for: ${name}`,
    });
    if (res.success) {
      toast.success('Role created');
      loadClientRoles(selectedClientId); // Manual refetch
    }
  } catch (err) {
    toast.error('Failed to create role');
  } finally {
    setCreating(false);
  }
};
```

**After**:
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const createRoleMutation = useMutation({
  mutationFn: async (data: { name: string; description: string }) => {
    const res = await standardizedApi.post(
      `/api/admin/clients/${selectedClientId}/roles`,
      data
    );
    if (!res.success) throw new Error('Failed to create role');
    return res;
  },
  onSuccess: () => {
    toast.success('Role created');
    // Automatically invalidate and refetch related queries
    queryClient.invalidateQueries({ queryKey: ['admin', 'clients', selectedClientId, 'roles'] });
  },
  onError: () => {
    toast.error('Failed to create role');
  },
});

// Usage:
const handleCreate = () => {
  createRoleMutation.mutate({
    name,
    description: `Client access for: ${name}`,
  });
};
```

---

## 📝 MIGRATION PRIORITY

### Phase 1: Critical Fixes (HIGH PRIORITY) ⚠️
1. **Profile/Security Pages** - Already causing infinite loops
2. **Auth Context Hooks** - Currently unstable with session changes
3. **Custom Data Hooks** - `useRoles`, `useCategories`, etc.

### Phase 2: Admin Pages (MEDIUM PRIORITY)
4. Audit logs
5. Client management
6. Role management CRUD
7. Category management

### Phase 3: Complex Flows (LOWER PRIORITY)
8. Role assignments with dependencies
9. Multi-step forms
10. Settings/preferences pages

---

## 🛠️ IMPLEMENTATION TASKS

### Task 1: Setup React Query Infrastructure
- [ ] Install `@tanstack/react-query` and devtools
- [ ] Create `src/app/providers.tsx` with QueryClientProvider
- [ ] Wrap app in providers in `src/app/layout.tsx`
- [ ] Configure default query options (staleTime, cacheTime, retry)

### Task 2: Create Shared Query Hooks
- [ ] Create `src/hooks/queries/useProfile.ts`
- [ ] Create `src/hooks/queries/useRoles.ts`
- [ ] Create `src/hooks/queries/useCategories.ts`
- [ ] Create `src/hooks/queries/useClients.ts`
- [ ] Create `src/hooks/queries/useAudit.ts`

### Task 3: Create Shared Mutation Hooks
- [ ] Create `src/hooks/mutations/useUpdateProfile.ts`
- [ ] Create `src/hooks/mutations/useCreateRole.ts`
- [ ] Create `src/hooks/mutations/useAssignRole.ts`

### Task 4: Migrate Profile Pages (CRITICAL)
- [ ] Migrate `src/app/dashboards/account/profile/page.tsx`
- [ ] Migrate `src/app/dashboards/account/security/page.tsx`
- [ ] Migrate `src/app/dashboards/account/profile/edit/page.tsx`
- [ ] Remove `fetchAttempted` bandaid fixes
- [ ] Test infinite loop is resolved

### Task 5: Migrate Admin Pages
- [ ] Migrate `src/app/dashboards/idp-admin/audit/page.tsx`
- [ ] Migrate all role management pages
- [ ] Migrate client management pages
- [ ] Migrate category management pages

### Task 6: Refactor Custom Hooks
- [ ] Replace `src/app/dashboards/idp-admin/roles/hooks/useRoles.ts` with React Query
- [ ] Replace `src/app/dashboards/idp-admin/roles/hooks/useCategoriesRedesign.ts`
- [ ] Replace `src/app/dashboards/idp-admin/roles/hooks/useRoleCategories.ts`

### Task 7: Clean Up
- [ ] Remove all manual loading states
- [ ] Remove all manual error states
- [ ] Remove all `fetchAttempted` flags
- [ ] Remove all `isMounted` cleanup logic
- [ ] Simplify dependency arrays

### Task 8: Testing
- [ ] Test all data fetching pages for infinite loops
- [ ] Test cache invalidation on mutations
- [ ] Test optimistic updates work correctly
- [ ] Test error handling and retry logic
- [ ] Load test with React Query DevTools

---

## 🎓 LEARNING RESOURCES

- [React Query Docs](https://tanstack.com/query/latest)
- [Why React Query?](https://tanstack.com/query/latest/docs/react/overview)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

## ⚡ QUICK WINS

### Immediate Benefits After Migration:
1. ✅ **Infinite loop bug permanently fixed** (no bandaids needed)
2. ✅ **50+ useEffect hooks eliminated**
3. ✅ **Automatic caching** reduces API calls by ~70%
4. ✅ **Background refetching** keeps data fresh
5. ✅ **Request deduplication** prevents duplicate API calls
6. ✅ **Optimistic updates** make UI feel instant
7. ✅ **DevTools** for debugging query state
8. ✅ **TypeScript safety** for all queries

---

## 🚀 PROMPT FOR NEXT AGENT

**Use this prompt:**

```
# React Query Migration Task

## Context
This Next.js 14 app (using NextAuth for auth) has extensive useEffect anti-patterns causing infinite loops and poor data fetching patterns. A detailed audit has been completed in `docs/USEEFFECT_ANTIPATTERNS_MIGRATION.md`.

## Your Mission
Migrate all data fetching from useEffect to React Query (@tanstack/react-query).

## Priority Tasks
1. Install React Query and setup providers
2. Create shared query hooks in `src/hooks/queries/`
3. Migrate profile/security pages (currently has bandaid fix with fetchAttempted flag)
4. Migrate all admin pages
5. Replace custom hooks (useRoles, useCategories, etc.)
6. Remove all manual loading/error state management

## Success Criteria
- No infinite loops on any page
- All data fetching uses React Query
- Caching works (verify with DevTools)
- Mutations properly invalidate cache
- No useEffect for data fetching anywhere

## Reference
See `docs/USEEFFECT_ANTIPATTERNS_MIGRATION.md` for:
- Complete file audit
- Before/after code examples
- Implementation checklist
- Anti-pattern explanations

Start with Phase 1 (Critical Fixes) from the migration doc.
```

---

## 📌 NOTES

- The `fetchAttempted` bandaid in profile/security pages is **temporary** and should be removed once React Query is implemented
- Do NOT attempt to "fix" more useEffect patterns manually - migrate to React Query instead
- The root cause is architectural: data fetching should not use useEffect at all
- React Query is the industry-standard solution for this exact problem
- Estimated migration time: 4-6 hours for full codebase

---

**END OF DOCUMENT**
