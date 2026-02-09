# Navigation Structure Visual Diagram
## Current User Management Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LEFT SIDEBAR                                       │
│ (src/components/nav/Sidebar.tsx)                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 📊 Dashboard (/dashboards)                                                     │
│ 👤 Profile (/dashboards/account/profile)                                       │
│ 🔐 IDP Admin (/dashboards/idp-admin) ────┐                                     │
│ 👥 Users (/dashboards/idp-admin/users) ──┼─┐                                   │
│ 🛡️  Roles (/dashboards/idp-admin/roles) ──┼─┼─┐                                │
│ 📋 Audit Logs (/dashboards/idp-admin/audit) ┼─┼─┼─┐                            │
│ 🏪 Merchant Dashboard (/dashboards/merchant) │ │ │ │                           │
└───────────────────────────────────────────────┼─┼─┼─┼───────────────────────────┘
                                                │ │ │ │
     ┌──────────────────────────────────────────┘ │ │ │
     │                                            │ │ │
     v                                            │ │ │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         IDP ADMIN DASHBOARD                                     │
│ Route: /dashboards/idp-admin                                                    │
│ Context: { main: "IDP Admin", page: "Overview" }                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 📊 Stats Cards:                                                                │
│ ├─ Total Users: 1,247                                                          │
│ ├─ Active Sessions: 89                                                         │
│ └─ Security Events: 12                                                         │
│                                                                                 │
│ 🎯 Action Cards:                                                                │
│ ├─ User Management ──────────────┐                                             │
│ ├─ Role Management ──────────────┼──┐                                          │
│ └─ Audit Logs ───────────────────┼──┼──┐                                       │
│                                  │  │  │                                       │
│ 🏢 IDP Clients Section           │  │  │                                       │
│ └─ Client Cards → clients/[id]   │  │  │                                       │
└──────────────────────────────────┼──┼──┼───────────────────────────────────────┘
                                   │  │  │
     ┌─────────────────────────────┘  │  │
     │          ┌─────────────────────┘  │
     │          │       ┌────────────────┘
     │          │       │
     v          v       v
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USER MANAGEMENT                                       │
│ Route: /dashboards/idp-admin/users                                              │
│ Context: { main: "IDP Admin", sub: "Users", page: "List" }                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 📋 Users List/Grid                                                             │
│ ├─ Search & Filtering                                                          │
│ ├─ Pagination                                                                  │
│ ├─ Status Management                                                           │
│ └─ Batch Operations                                                            │
│                                                                                 │
│ 🔗 Navigation Links:                                                            │
│ ├─ ➕ New User (/users/new) ──────────────────┐                                │
│ ├─ ⚡ Assignments (/users/assignments) ────────┼──┐                            │
│ └─ 👤 Individual User (/users/[id]) ───────────┼──┼──┐                         │
└─────────────────────────────────────────────────┼──┼──┼─────────────────────────┘
                                                  │  │  │
     ┌────────────────────────────────────────────┘  │  │
     │          ┌─────────────────────────────────────┘  │
     │          │          ┌─────────────────────────────┘
     │          │          │
     v          v          v
┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────────────────────────┐
│  NEW USER   │ │ ASSIGNMENTS │ │             INDIVIDUAL USER                     │
│   CREATION  │ │   CENTER    │ │ Route: /dashboards/idp-admin/users/[id]         │
├─────────────┤ ├─────────────┤ │ Context: { main: "IDP Admin", sub: "Users",     │
│ Form Fields │ │ Bulk Ops    │ │          page: "Details" }                      │
│ Client Sel  │ │ User Filter │ ├─────────────────────────────────────────────────┤
│ Role Assign │ │ Role Filter │ │ 🚀 AdminQuickActions (Top Section)            │
└─────────────┘ │ Operations  │ │ ├─ Toggle Approval                             │
                └─────────────┘ │ ├─ Toggle Lockout                              │
                                │ ├─ Toggle Email Confirmed                       │
                                │ ├─ Toggle Phone Confirmed                       │
                                │ ├─ Toggle Two Factor                            │
                                │ └─ Emergency Shutdown                           │
                                │                                                 │
                                │ 🛡️  UserAccessControl (Prominent)              │
                                │ ├─ Lockout Management                           │
                                │ ├─ Account Status                               │
                                │ ├─ Failed Attempts Reset                        │
                                │ └─ Account Unlock                               │
                                │                                                 │
                                │ 📱 Secondary Grid Cards:                        │
                                │ ├─ Contact Information ──────────┐              │
                                │ ├─ Security & Lockout ───────────┼──┐           │
                                │ ├─ Roles & Permissions ──────────┼──┼──┐        │
                                │ ├─ SSO Access Management ────────┼──┼──┼──┐     │
                                │ └─ Client Assignments ───────────┼──┼──┼──┼──┐  │
                                └───────────────────────────────────┼──┼──┼──┼──┼──┘
                                                                    │  │  │  │  │
     ┌──────────────────────────────────────────────────────────────┘  │  │  │  │
     │          ┌─────────────────────────────────────────────────────────┘  │  │  │
     │          │          ┌─────────────────────────────────────────────────────┘  │  │
     │          │          │          ┌─────────────────────────────────────────────────┘  │
     │          │          │          │          ┌─────────────────────────────────────────┘
     │          │          │          │          │
     v          v          v          v          v
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ CONTACT INFO│ │ SECURITY &  │ │   ROLES &   │ │ SSO ACCESS  │ │   CLIENT    │
│    PAGE     │ │  LOCKOUT    │ │ PERMISSIONS │ │ MANAGEMENT  │ │ ASSIGNMENTS │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│Route:       │ │Route:       │ │Route:       │ │Route:       │ │Component    │
│/users/[id]/ │ │/users/[id]/ │ │/users/[id]/ │ │/users/[id]/ │ │Embedded     │
│contact-info │ │advanced-    │ │roles        │ │sso-access   │ │             │
│             │ │settings     │ │             │ │             │ │             │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│Context:     │ │Features:    │ │Features:    │ │Features:    │ │Features:    │
│{ main:      │ │• Advanced   │ │• Assign/    │ │• Configure  │ │• View client│
│"Admin",     │ │  Config     │ │  Remove     │ │  SSO access │ │  assignments│
│sub: "Users",│ │• API Keys   │ │  roles      │ │• Client     │ │• Manage     │
│page:        │ │• Feature    │ │• Client-    │ │  roles      │ │  access     │
│"Contact     │ │  flags      │ │  specific   │ │• SSO config │ │             │
│Info" }      │ │• Sensitive  │ │  roles      │ │             │ │             │
│             │ │  settings   │ │• Role perms │ │             │ │             │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│Features:    │ │⚠️  DUPLICATE │ │⚠️  DUPLICATE │ │⚠️  DUPLICATE │ │⚠️  DUPLICATE │
│• Edit name, │ │FUNCTIONALITY│ │FUNCTIONALITY│ │FUNCTIONALITY│ │FUNCTIONALITY│
│  email,     │ │Security     │ │Role assign  │ │Role & client│ │Client       │
│  phone      │ │toggles also │ │also in main │ │management   │ │assignments  │
│• Confirm    │ │in main user │ │user page &  │ │also in other│ │also in other│
│  status     │ │page & quick │ │assignments  │ │locations    │ │locations    │
│• Address    │ │actions      │ │center       │ │             │ │             │
│             │ │             │ │             │ │             │ │             │
│⚠️  DUPLICATE │ │             │ │             │ │             │ │             │
│Contact edit │ │             │ │             │ │             │ │             │
│also in main │ │             │ │             │ │             │ │             │
│user page    │ │             │ │             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

                              API ENDPOINTS STRUCTURE
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        /api/admin/users/                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ route.ts - Main users list/search                                              │
│ [id]/                                                                          │
│ ├── route.ts - Individual user CRUD                                           │
│ ├── client-constraints/route.ts                                               │
│ ├── force-2fa-reset/route.ts                                                  │
│ ├── password/reset/route.ts                                                   │
│ ├── pause/route.ts                                                            │
│ ├── profile/update/route.ts                                                   │
│ ├── reset-2fa/route.ts                                                        │
│ ├── reset-attempts/route.ts                                                   │
│ ├── resume/route.ts                                                           │
│ ├── roles/route.ts                                                            │
│ ├── toggle/route.ts                                                           │
│ ├── tokens/                                                                   │
│ │   ├── blacklist/route.ts                                                   │
│ │   └── revoke/route.ts                                                      │
│ └── unlock/route.ts                                                           │
│ actions/route.ts                                                              │
│ client-create/route.ts                                                        │
│ grid-state/route.ts                                                           │
│ onboard/route.ts                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘

                              IDENTIFIED ISSUES
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🚨 DUPLICATE FUNCTIONALITY                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. USER STATUS MANAGEMENT (4 locations):                                       │
│    ├─ Main user grid toggles                                                   │
│    ├─ AdminQuickActions component                                              │
│    ├─ Advanced settings page                                                   │
│    └─ UserAccessControl component                                              │
│                                                                                 │
│ 2. CONTACT INFORMATION (3 locations):                                          │
│    ├─ User details page card                                                   │
│    ├─ Dedicated contact info page                                              │
│    └─ Profile update API endpoints                                             │
│                                                                                 │
│ 3. ROLE MANAGEMENT (4 locations):                                              │
│    ├─ User details page card                                                   │
│    ├─ Dedicated roles page                                                     │
│    ├─ Assignments command center                                               │
│    └─ Individual role assignment APIs                                          │
│                                                                                 │
│ 4. SECURITY MANAGEMENT (4+ locations):                                         │
│    ├─ User details page card                                                   │
│    ├─ AdminQuickActions component                                              │
│    ├─ Advanced settings page                                                   │
│    └─ Multiple API endpoints                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                      🔄 NAVIGATION INCONSISTENCIES                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Contact info page uses different navContext format                           │
│ • Multiple paths to access same functionality                                  │
│ • No clear primary/secondary action hierarchy                                  │
│ • Scattered related actions across different pages                             │
│ • No clear workflow guidance                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Legend:
- 📊 Dashboard/Stats
- 👤 User/Profile  
- 🔐 Security/Admin
- 👥 Users Management
- 🛡️ Roles/Permissions
- 📋 Audit/Logs
- 🏪 Merchant
- 🚀 Quick Actions
- 📱 Secondary Features
- ⚠️ Duplicate Functionality
- 🚨 Critical Issues

This diagram illustrates the current navigation complexity and highlights areas where functionality is duplicated across multiple pages and components.
