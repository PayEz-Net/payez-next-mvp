# App-Level Roles Architecture Assessment

**Date:** 2026-01-10
**Author:** Claude (DotNetPert)
**For:** BAPert, QAPert (Security Review)
**Status:** REQUIRES ARCHITECTURAL DECISION

---

## Executive Summary

During implementation of the Roles Management spec (ID:1891), a significant architectural gap was identified: **the PayEz IDP currently has no concept of "app-level roles"**. The spec assumes a `vibe_app.user_roles` table exists, but it doesn't. This is not a simple CRUD implementation - it's a fundamental extension to the identity architecture.

**Recommendation:** STOP implementation and conduct proper architectural review before proceeding.

---

## Current State Analysis

### What We Have

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT IDENTITY MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  core_identity schema (IDP)                                      │
│  ─────────────────────────                                      │
│  asp_net_users          - All platform users                    │
│  asp_net_roles          - Platform-wide roles                   │
│  asp_net_user_roles     - User ↔ Role assignments               │
│                                                                  │
│  Roles are PLATFORM-WIDE:                                       │
│  • payez_user, payez_admin                                      │
│  • cryptaply_user, cryptaply_admin                              │
│                                                                  │
│  vibe schema (Page RBAC)                                         │
│  ──────────────────────                                         │
│  page_permissions       - Route patterns per client             │
│  page_role_requirements - Role names needed for each page       │
│  page_claim_requirements - Claim requirements                   │
│  page_permission_overrides - User-specific grants/denies        │
│                                                                  │
│  Note: page_role_requirements stores role NAMES as strings      │
│        No actual role definitions exist in Vibe                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What The Spec Assumes Exists

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSUMED MODEL (NOT BUILT)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  vibe_app schema (NEW - DOES NOT EXIST)                         │
│  ───────────────────────────────────────                        │
│  app_roles              - Client-specific role definitions      │
│  user_app_roles         - User ↔ App Role assignments           │
│                                                                  │
│  Expected capabilities:                                          │
│  • Roles scoped to a specific client (multi-tenant)             │
│  • Admin creates custom roles per client                        │
│  • Users can have different app roles per client                │
│  • App roles are separate from IDP roles                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Gap: Why This Is A Big Deal

### 1. Multi-Tenancy Model Question

**Critical Question:** Can a user have different roles in different clients/apps?

```
Scenario: User john@example.com
├── Client A (IdealVibe)
│   └── Roles: vibe_app_admin, content_editor
├── Client B (AnotherApp)
│   └── Roles: viewer (only)
└── IDP (global)
    └── Roles: payez_user (same everywhere)
```

**Current IDP model:** Roles are global. A `payez_admin` is admin everywhere.

**Spec assumption:** App roles are client-scoped. You can be admin in one app but not another.

This is a FUNDAMENTAL architectural difference.

### 2. Role Source Ambiguity

The spec shows two role sources:
- **IDP roles** (read-only, from `asp_net_user_roles`)
- **App roles** (editable, from... where?)

Questions:
- Where do app roles live? New schema? New table?
- Who owns the role definitions? IDP? Vibe? Each app?
- How do app roles interact with page_role_requirements?

### 3. Security Boundary Concerns

**Current:** IDP is the single source of truth for roles.

**Proposed:** Two role systems running in parallel.

Risks:
- Role confusion (which system is authoritative?)
- Privilege escalation (app admin grants themselves IDP admin?)
- Cross-client data leakage (admin in Client A sees Client B users?)
- Token claims (do app roles go in JWT? Fetched at runtime?)

### 4. Database Schema Impact

Creating `vibe_app.app_roles` and `vibe_app.user_app_roles` requires:
- New schema creation (`vibe_app`)
- Migration strategy
- Seeding of default roles (vibe_app_admin)
- Foreign key relationships to core_identity.asp_net_users

---

## Options Analysis

### Option A: Full App Roles in Vibe

```sql
-- New schema
CREATE SCHEMA vibe_app;

-- Role definitions
CREATE TABLE vibe_app.app_roles (
    app_role_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, role_name)
);

-- User assignments
CREATE TABLE vibe_app.user_app_roles (
    user_app_role_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- FK to asp_net_users
    app_role_id INT NOT NULL,  -- FK to app_roles
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by INT,
    UNIQUE(user_id, app_role_id)
);
```

**Pros:**
- Clean separation from IDP
- Full multi-tenant support
- Client admins can create custom roles

**Cons:**
- Two parallel role systems
- Complexity in authorization logic
- JWT token bloat (or runtime fetch needed)
- Migration complexity

### Option B: Extend IDP with Client Scoping

```sql
-- Modify existing asp_net_roles
ALTER TABLE core_identity.asp_net_roles
ADD COLUMN client_id INT NULL,
ADD COLUMN role_type VARCHAR(20) DEFAULT 'platform';
-- NULL client_id = platform role (payez_user, etc.)
-- Non-null client_id = app role (scoped to that client)
```

**Pros:**
- Single source of truth
- Uses existing ASP.NET Identity infrastructure
- Roles already in JWT claims

**Cons:**
- Breaks ASP.NET Identity conventions
- Platform roles could accidentally get scoped
- Requires IDP code changes
- May conflict with future IDP upgrades

### Option C: Hybrid - Role References Only

Keep role definitions minimal, treat `page_role_requirements.role_name` as the authoritative list.

```sql
-- No new role table, but track metadata
CREATE TABLE vibe.role_metadata (
    role_name VARCHAR(50) PRIMARY KEY,
    client_id INT NOT NULL,
    display_name VARCHAR(100),
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE
);

-- User assignments still separate
CREATE TABLE vibe_app.user_app_roles (...);
```

**Pros:**
- Minimal schema changes
- Roles defined implicitly by usage
- Simpler migration

**Cons:**
- Role definitions scattered
- Hard to list "all roles" for a client
- Orphaned role references possible

### Option D: Defer App Roles, IDP Roles Only

For MVP, only support IDP roles. App roles deferred to v2.

**Pros:**
- No architectural changes
- Ship faster
- Well-understood security model

**Cons:**
- Spec descoped significantly
- Admin can only view roles, not manage
- No client-specific customization

---

## Security Considerations (For QAPert)

### 1. Role Assignment Authorization

Who can assign app roles?
- Only `vibe_app_admin` for that client?
- Any `payez_admin`?
- Self-assignment prevention required

### 2. IDP Role Protection

IDP roles MUST NOT be modifiable through Vibe API:
- `payez_admin`, `payez_user` are sacred
- 403 Forbidden if attempted
- No backdoor escalation paths

### 3. Token Claims Strategy

If app roles don't go in JWT:
- Runtime fetch on every request?
- Caching strategy?
- Stale role data risk?

If app roles DO go in JWT:
- Token size limits
- Token refresh on role change
- Multi-client token complexity

### 4. Cross-Client Isolation

Admin in Client A must NOT:
- See users from Client B
- Assign roles in Client B
- Access Client B role definitions

### 5. Audit Requirements

All role changes must be logged:
- Who changed what
- When
- Previous value
- New value

---

## Recommendation

**For MVP:** Implement **Option D** (IDP Roles Only) with preparation for Option A.

### Phase 1 (Now - MVP)
1. Implement `GET /api/Account/my-roles` - DONE
2. Show IDP roles in UI (read-only)
3. Skip app roles CRUD entirely
4. Document that app roles are "coming soon"

### Phase 2 (Post-MVP)
1. Proper architecture review with full team
2. Design app roles schema
3. Security review and penetration testing
4. Implement with proper migration strategy

### Why?

1. **Time:** Proper app roles implementation is 2-3x larger than estimated
2. **Risk:** Rushing security-critical features invites vulnerabilities
3. **Value:** MVP users can still see their roles (main use case)
4. **Flexibility:** We can design app roles properly without legacy constraints

---

## Questions for BAPert

1. Is client-scoped app roles a hard requirement for MVP?
2. Can we ship with read-only role display (IDP roles only)?
3. Who should own app roles - IDP team or Vibe team?
4. Is there existing roadmap for multi-tenant role scoping?
5. What's the timeline pressure vs. quality tradeoff here?

---

## Files Affected (If We Proceed)

For full app roles implementation (Option A):

### New Files
- `PayEz.Domain/Entities/Vibe/AppRole.cs`
- `PayEz.Domain/Entities/Vibe/UserAppRole.cs`
- `PayEz.Domain/Interfaces/Vibe/IAppRoleRepository.cs`
- `PayEz.Infrastructure/Repositories/Vibe/AppRoleRepository.cs`
- `PayEz.Vibe.Public.Api/Controllers/V1/AdminRolesController.cs`
- Migration: `AddVibeAppRolesSchema.cs`

### Modified Files
- `PayEz.Infrastructure/Context/VibeDbContext.cs`
- `PayEz.Vibe.Public.Api/Services/IVibePageRbacService.cs`
- `PayEz.Vibe.Public.Api/Services/VibePageRbacService.cs`
- `PayEz.Vibe.Public.Api/Program.cs` (DI registration)

### Estimated LOC
- New code: ~1,500-2,000 lines
- Tests: ~500-800 lines
- Migration: ~100 lines

---

## Conclusion

This is not a "quick CRUD implementation" - it's a fundamental extension to the identity architecture. The current spec assumes infrastructure that doesn't exist. Proceeding without proper design risks:

1. Security vulnerabilities
2. Technical debt
3. Breaking changes later
4. Confused authorization model

**Recommended Action:** Pause Phase 2-4 of Roles Management, complete Phase 1 (my-roles display), and schedule architecture review.

---

*Report generated during Roles Management implementation. Ready for BAPert review.*
