# Current Navigation Structure Mapping
## Left Sidebar → IDP Admin Dashboard → User Management Pages

### Overview
This document maps the complete navigation flow from the left sidebar through the IDP admin dashboard to all user management related pages, identifying duplicate functionality and the current hierarchical structure.

---

## 1. Left Sidebar Navigation Structure

The left sidebar (`src/components/nav/Sidebar.tsx`) contains role-based navigation items:

### Sidebar Navigation Items:
```
├── Dashboard (/dashboards) - Common to all users
├── Profile (/dashboards/account/profile) - Common to all users
├── IDP Admin (/dashboards/idp-admin) - payez_admin role only
├── Users (/dashboards/idp-admin/users) - payez_admin role only
├── Roles (/dashboards/idp-admin/roles) - payez_admin role only
├── Audit Logs (/dashboards/idp-admin/audit) - payez_admin role only
└── Merchant Dashboard (/dashboards/merchant) - merchant role only
```

**Key Navigation Context Files:**
- `/src/app/dashboards/idp-admin/navContext.ts`: `{ main: "IDP Admin", page: "Overview" }`
- `/src/app/dashboards/idp-admin/users/navContext.ts`: `{ main: "IDP Admin", sub: "Users", page: "List" }`

---

## 2. IDP Admin Dashboard Structure

### Entry Point: `/dashboards/idp-admin`
**Files:** 
- `src/app/dashboards/idp-admin/page.tsx` → `server-page.tsx` → `client-page.tsx`
- **Navigation Context:** `{ main: "IDP Admin", page: "Overview" }`

### Dashboard Actions (from client-page.tsx):
```
┌─────────────────────────────────────────────────────┐
│ IDP Admin Dashboard                                 │
├─────────────────────────────────────────────────────┤
│ Stats Cards:                                        │
│ • Total Users (1,247)                              │
│ • Active Sessions (89)                             │
│ • Security Events (12)                             │
├─────────────────────────────────────────────────────┤
│ Action Cards:                                       │
│ • User Management → /dashboards/idp-admin/users    │
│ • Role Management → /dashboards/idp-admin/roles    │
│ • Audit Logs → /dashboards/idp-admin/audit         │
├─────────────────────────────────────────────────────┤
│ IDP Clients Section:                               │
│ • Client cards → /dashboards/idp-admin/clients/[id]│
└─────────────────────────────────────────────────────┘
```

---

## 3. User Management Pages Structure

### 3.1 Main Users List Page
**Route:** `/dashboards/idp-admin/users`
**Files:** 
- `src/app/dashboards/idp-admin/users/page.tsx`
- `src/app/dashboards/idp-admin/users/users-client.tsx`
- **Navigation Context:** `{ main: "IDP Admin", sub: "Users", page: "List" }`

**Features:**
- User grid with pagination
- Search and filtering capabilities
- User status management
- Batch operations

### 3.2 Individual User Pages

#### 3.2.1 User Details/Edit Page
**Route:** `/dashboards/idp-admin/users/[id]`
**File:** `src/app/dashboards/idp-admin/users/[id]/page.tsx`
**Navigation Context:** `{ main: "IDP Admin", sub: "Users", page: "Details" }`

**Components/Sections:**
```
┌─────────────────────────────────────────────────────┐
│ Edit User Page                                      │
├─────────────────────────────────────────────────────┤
│ 1. AdminQuickActions (Top Section)                 │
│    • Toggle Approval                               │
│    • Toggle Lockout                               │
│    • Toggle Email Confirmed                       │
│    • Toggle Phone Confirmed                       │
│    • Toggle Two Factor                            │
│    • Emergency Shutdown                           │
├─────────────────────────────────────────────────────┤
│ 2. UserAccessControl (Prominent Section)          │
│    • Lockout Management                           │
│    • Account Status                               │
│    • Failed Attempts Reset                        │
│    • Account Unlock                               │
├─────────────────────────────────────────────────────┤
│ 3. Secondary Grid Cards:                           │
│    • Contact Information                          │
│    • Security & Lockout                          │
│    • Roles & Permissions                         │
│    • SSO Access Management                       │
│    • Client Assignments                          │
└─────────────────────────────────────────────────────┘
```

#### 3.2.2 Contact Information Page
**Route:** `/dashboards/idp-admin/users/[id]/contact-info`
**File:** `src/app/dashboards/idp-admin/users/[id]/contact-info/page.tsx`
**Navigation Context:** `{ main: "Admin", sub: "Users", page: "Contact Info" }`

**Features:**
- Edit user contact details (name, email, phone, address)
- Email/phone confirmation status
- Client wrapper with error handling

#### 3.2.3 Advanced Settings Page
**Route:** `/dashboards/idp-admin/users/[id]/advanced-settings`
**File:** `src/app/dashboards/idp-admin/users/[id]/advanced-settings/page.tsx`

**Features:**
- Advanced user configuration
- API keys management
- Feature flags
- Sensitive settings

#### 3.2.4 User Roles Page
**Route:** `/dashboards/idp-admin/users/[id]/roles`
**File:** `src/app/dashboards/idp-admin/users/[id]/roles/page.tsx`

**Features:**
- Assign/remove user roles
- Client-specific role assignments
- Role permissions overview

### 3.3 User Creation and Management

#### 3.3.1 New User Creation
**Route:** `/dashboards/idp-admin/users/new`
**File:** `src/app/dashboards/idp-admin/users/new/page.tsx`

**Features:**
- Create new user form
- Client selection
- Initial role assignment
- Redirects to advanced settings after creation

#### 3.3.2 User Assignments Command Center
**Route:** `/dashboards/idp-admin/users/assignments`
**File:** `src/app/dashboards/idp-admin/users/assignments/page.tsx`

**Features:**
- Bulk user-role assignments
- Bulk user-client assignments
- Advanced filtering and selection
- Command center interface for bulk operations

---

## 4. API Endpoints Structure

### User Management API Routes:
```
/api/admin/users/
├── route.ts - Main users list/search
├── [id]/
│   ├── route.ts - Individual user CRUD
│   ├── client-constraints/route.ts
│   ├── force-2fa-reset/route.ts
│   ├── password/reset/route.ts
│   ├── pause/route.ts
│   ├── profile/update/route.ts
│   ├── reset-2fa/route.ts
│   ├── reset-attempts/route.ts
│   ├── resume/route.ts
│   ├── roles/route.ts
│   ├── toggle/route.ts
│   ├── tokens/
│   │   ├── blacklist/route.ts
│   │   └── revoke/route.ts
│   └── unlock/route.ts
├── actions/route.ts
├── client-create/route.ts
├── grid-state/route.ts
└── onboard/route.ts
```

---

## 5. Identified Duplications and Similar Functionality

### 5.1 User Status Management (Multiple Locations)
**Locations:**
1. Main user grid (`/users`) - Toggle buttons in grid
2. User details page (`/users/[id]`) - AdminQuickActions component
3. Advanced settings page (`/users/[id]/advanced-settings`)
4. UserAccessControl component

**Duplicate Functions:**
- Toggle user approval status
- Toggle lockout status
- Reset failed attempts
- Unlock account

### 5.2 Contact Information Management (Multiple Access Points)
**Locations:**
1. User details page - Contact Information card
2. Dedicated contact info page (`/users/[id]/contact-info`)
3. Profile update API endpoints

**Duplicate Functions:**
- Edit email/phone/name
- Confirm email/phone status

### 5.3 Role Management (Multiple Interfaces)
**Locations:**
1. User details page - Roles & Permissions card
2. Dedicated roles page (`/users/[id]/roles`)
3. Assignments command center (`/users/assignments`)
4. Individual role assignment APIs

**Duplicate Functions:**
- Assign/remove roles
- View role permissions
- Client-specific role management

### 5.4 Security Management (Scattered Across Pages)
**Locations:**
1. User details page - Security & Lockout card
2. AdminQuickActions component
3. Advanced settings page
4. Multiple API endpoints for 2FA, passwords, tokens

**Duplicate Functions:**
- 2FA reset/toggle
- Password reset
- Token management
- Security flag toggles

---

## 6. Navigation Inconsistencies

### 6.1 Navigation Context Inconsistencies
- Contact info page uses `{ main: "Admin", sub: "Users", page: "Contact Info" }` 
- Other pages use `{ main: "IDP Admin", sub: "Users", page: "..." }`

### 6.2 Access Patterns
- Some functionality accessible from multiple navigation paths
- No clear primary/secondary action hierarchy
- Inconsistent breadcrumb navigation

### 6.3 User Flow Issues
- Users can access same functionality through multiple routes
- No clear workflow guidance
- Scattered related actions across different pages

---

## 7. Current Hierarchical Structure

```
Left Sidebar
└── IDP Admin (/dashboards/idp-admin)
    ├── Dashboard Overview
    │   ├── Stats Display
    │   ├── Quick Actions → User Management
    │   ├── Quick Actions → Role Management  
    │   ├── Quick Actions → Audit Logs
    │   └── IDP Clients Grid
    └── Direct Navigation Links
        ├── Users (/dashboards/idp-admin/users)
        │   ├── User List/Grid
        │   ├── User Search & Filters
        │   ├── Bulk Operations
        │   ├── New User (/users/new)
        │   ├── User Assignments (/users/assignments)
        │   └── Individual User (/users/[id])
        │       ├── User Details & Quick Actions
        │       ├── Contact Info (/users/[id]/contact-info)
        │       ├── Advanced Settings (/users/[id]/advanced-settings)
        │       └── Roles Management (/users/[id]/roles)
        ├── Roles (/dashboards/idp-admin/roles)
        └── Audit Logs (/dashboards/idp-admin/audit)
```

---

## 8. Summary

### Current State:
- **Total User Management Pages:** 7 main pages + API endpoints
- **Duplicate Functionality:** High overlap in user status, contact, role, and security management
- **Navigation Paths:** Multiple ways to access the same functionality
- **Consistency Issues:** Navigation context inconsistencies and scattered related actions

### Key Areas for Consolidation:
1. User status management (approval, lockout, security flags)
2. Contact information editing
3. Role assignment and management
4. Security settings (2FA, passwords, tokens)
5. Navigation context standardization

This structure provides the foundation for the planned reorganization to reduce duplication and improve user experience.
