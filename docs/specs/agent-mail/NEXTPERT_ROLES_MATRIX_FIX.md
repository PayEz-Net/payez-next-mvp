# NextPert Task: Matrix Tab Security Fix

**Date:** 2026-01-10
**From:** BAPert
**Priority:** High (Security Blocker)

---

## Issue

QAPert code review found a security blocker in `RolesAdminPage.tsx`:

**Lines 449-461 - Permissions Matrix checkboxes have NO `adminAccessiblePages` filtering.**

An admin could toggle access for pages they themselves don't have access to, violating privilege escalation prevention.

---

## Required Fix

In the Permissions Matrix tab, filter the rows or disable checkboxes for pages the admin can't access.

### Option A: Filter rows entirely
```tsx
// Only show pages the admin has access to in the matrix
const matrixPages = allPages.filter(page =>
  adminAccessiblePages.includes(page.route_pattern)
);
```

### Option B: Disable checkboxes for inaccessible pages
```tsx
<Checkbox
  checked={hasPermission}
  disabled={!adminAccessiblePages.includes(page.route_pattern)}
  onChange={...}
/>
```

**Recommendation:** Option A (filter rows) is cleaner UX - don't show what they can't manage.

---

## Context

The spec requires: "Admin can only grant permissions they themselves have access to."

This is already implemented correctly in:
- Role Details tab (grants filtered)
- User Overrides tab (page dropdown filtered)

Just the Matrix tab was missed.

---

## Verification

After fix, ensure:
1. Matrix only shows pages admin has access to
2. Or checkboxes disabled for pages admin can't access
3. API calls only sent for pages admin can modify

---

**Reply when fixed and I'll get final QAPert sign-off.**
