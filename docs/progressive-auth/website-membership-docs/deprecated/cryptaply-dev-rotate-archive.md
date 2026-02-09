# CryptAply Dev Rotate and Test Page (Archived)

This document archives the previous development-only rotate endpoint and test page that were used to prototype key rotation UI/flows. These have been removed from the live app to avoid confusion—the real home for rotation is the dashboard plugin at:

- /dashboards/idp-admin/cryptaply

What was archived

1) Dev rotate endpoint (src/app/api/dev/cryptaply/rotate/route.ts)
- Purpose: Convenience operation to ensure at least two versions exist, pick a single grace candidate, enable current+grace, disable others, and set current/grace.
- Limitation: Single-grace flow only (not aligned with multi-grace rotation used for signing keys).

2) Dev test page (src/app/dev/cryptaply-test/page.tsx)
- Purpose: Prototype UI to test Ping, Plan, and a rotate flow; later upgraded to Apply Plan with before/after summaries.
- Now replaced by the production plugin dashboard.

Why they were removed
- To avoid future misuse for signing keys. Signing key rotation uses multi-grace via a plan-driven executor (Apply Plan), not the older single-grace helper.
- To prevent confusion for operators (and future AI assistants) by consolidating all operations in the dashboard plugin.

Reference snippets

Rotate endpoint (representative version)

```ts
// src/app/api/dev/cryptaply/rotate/route.ts (archived)
import { NextResponse } from 'next/server'

// ... helpers omitted for brevity ...

export async function POST(request: Request) {
  // 1) Fetch versions/inventory
  // 2) Ensure at least two versions (optionally create new)
  // 3) Select current (newest/current-flag), select grace (newest non-current)
  // 4) Enable current/grace, disable others
  // 5) Set current/grace pairing
  // return { success: true, current, grace, disabled }
}
```

Dev test page (representative UI before removal of Rotate)

```tsx
// src/app/dev/cryptaply-test/page.tsx (archived)
"use client";
import { useState } from "react";

export default function CryptAplyKeyTestPage() {
  const [keyName, setKeyName] = useState("PayEz-Token-Signing-Key");
  // Ping, Plan, Rotate (dev) (later replaced with Apply Plan)
  // Rotation Summary (before/after/kid_valid)
  return null;
}
```

Migration
- Use the dashboard plugin’s Plan and Apply Plan.
- Multi-grace actions (add multiple grace versions) are executed via /api/dev/cryptaply/apply.

Notes
- For non-signing key operations in other apps, implement flows in the dedicated CryptAply services UI instead of reintroducing the dev rotate endpoint in Membership.

