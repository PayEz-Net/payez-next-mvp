# User and Client Status Reference

This document outlines the possible statuses and linguistic interpretations of user and client properties within the system for UI display and business logic.

## Core User Properties

### Account Status Fields
- **EmailConfirmed** (boolean): Whether user's email address has been verified
  - **UI Label:** "Email Verified" / "Email Pending"
  - **Badge Color:** Green (verified) / Orange (pending)

- **PhoneNumberConfirmed** (boolean): Whether user's phone number has been verified
  - **UI Label:** "Phone Verified" / "Phone Pending"
  - **Badge Color:** Green (verified) / Orange (pending)

- **IsApproved** (boolean): General system-wide approval status
  - **UI Label:** "Approved" / "Pending Approval"
  - **Badge Color:** Green (approved) / Yellow (pending)

- **LockoutEnd** (DateTime?): When account lockout expires (null = not locked)
  - **UI Label:** "Account Locked" / "Active"
  - **Badge Color:** Red (locked) / Green (active)

- **AccessFailedCount** (integer): Number of consecutive failed login attempts
  - **UI Label:** "High Risk" (≥3), "Medium Risk" (1-2), "Low Risk" (0)
  - **Badge Color:** Red (high), Orange (medium), Green (low)

- **RequiresPasswordChange** (boolean): Whether password must be changed on next login
  - **UI Label:** "Password Change Required" / "Password Current"
  - **Badge Color:** Orange (required) / Green (current)

### Additional User Fields
- **LastLoginAt** (DateTime?): Last successful login timestamp
  - **UI Label:** "Last Login: [date]" / "Never Logged In"
  - **Text Color:** Gray for timestamp display

- **TwoFactorEnabled** (boolean): Whether 2FA is enabled for user
  - **UI Label:** "2FA Enabled" / "2FA Disabled"
  - **Badge Color:** Green (enabled) / Gray (disabled)

## IDP Client Properties

### Client Configuration Fields
- **AllowPublicRegistration** (boolean): Whether client allows self-registration
  - **UI Context:** Shows "Sign Up" option or "Contact Admin"
  - **Client Type Impact:** Corporate clients typically false, ThirdParty may vary

- **AllowOnboarding** (boolean): Whether client supports admin-initiated onboarding
  - **UI Context:** Shows "Onboard User" button in admin interface
  - **Action Label:** "Onboard User" / "Contact System Admin"

- **Require2FA** (boolean): Whether client mandates two-factor authentication
  - **UI Context:** Forces 2FA setup during login/registration
  - **Status Impact:** Users without 2FA cannot access if true

- **IsActive** (boolean): Whether client application is currently active
  - **UI Context:** Inactive clients show maintenance message
  - **Access Impact:** Users cannot login to inactive clients

- **Type** (ClientType enum): Corporate vs ThirdParty classification
  - **Corporate (0):** Internal company applications
  - **ThirdParty (1):** External partner/customer applications
  - **UI Impact:** Different branding, stricter security for Corporate

## User-Client Security Settings

- **UserIsApprovedForClient** (boolean): Per-client approval status
  - **UI Label:** "Client Access Approved" / "Client Access Pending"
  - **Badge Color:** Green (approved) / Yellow (pending)
  - **Priority:** Overrides global IsApproved for specific client access

- **TwoFaMethod** (string): Specific 2FA method configured
  - **Values:** "none", "email", "authenticator", "sms"
  - **UI Label:** "2FA: [Method]" / "2FA: Not Configured"
  - **Badge Color:** Green (configured) / Gray (none)

## Status Combination Matrix

### User Status Priorities (Higher Priority First)

1. **BLOCKED** - Account Locked
   - **Condition:** `LockoutEnd > DateTime.Now`
   - **UI Display:** Red badge "Account Locked Until [date]"
   - **Access:** Complete denial until lockout expires

2. **SUSPENDED** - System-Wide Unapproved
   - **Condition:** `IsApproved = false`
   - **UI Display:** Red badge "Account Suspended"
   - **Access:** No access to any clients

3. **CLIENT_DENIED** - Client-Specific Denial
   - **Condition:** `UserIsApprovedForClient = false` (for specific client)
   - **UI Display:** Orange badge "Client Access Denied"
   - **Access:** Can access other approved clients

4. **PENDING_VERIFICATION** - Awaiting Confirmations
   - **Condition:** `EmailConfirmed = false OR PhoneNumberConfirmed = false`
   - **UI Display:** Yellow badge "Verification Pending"
   - **Access:** Limited functionality until verified

5. **PASSWORD_EXPIRED** - Must Change Password
   - **Condition:** `RequiresPasswordChange = true`
   - **UI Display:** Orange badge "Password Change Required"
   - **Access:** Forced to password change screen

6. **2FA_REQUIRED** - Must Configure 2FA
   - **Condition:** `Client.Require2FA = true AND TwoFaMethod = "none"`
   - **UI Display:** Blue badge "2FA Setup Required"
   - **Access:** Forced to 2FA setup screen

7. **ACTIVE** - Full Access
   - **Condition:** All checks pass
   - **UI Display:** Green badge "Active"
   - **Access:** Full system access

### Client Context Status Modifiers

- **Corporate Client + Unverified Email/Phone:** Shows as "High Priority Verification"
- **ThirdParty Client + Public Registration:** Shows "Self-Service Registration Available"
- **Inactive Client:** Overrides all user statuses with "Service Unavailable"
- **2FA Required Client:** Adds "2FA Mandatory" indicator to all user statuses

## UI Implementation Guidelines

### Badge Colors
- **Red:** Critical issues (locked, suspended, denied)
- **Orange:** Action required (password, verification)
- **Yellow:** Pending states (approval, verification)
- **Blue:** Information/setup required (2FA)
- **Green:** Active/verified states
- **Gray:** Inactive/disabled features

### Status Text Examples
- "Active" (green)
- "Pending Approval" (yellow)
- "Email Verification Required" (orange)
- "Account Locked" (red)
- "2FA Setup Required" (blue)
- "Client Access Denied" (orange)

### Contextual Messages
- Show most restrictive status first
- Include actionable next steps when possible
- Differentiate between user-fixable and admin-required actions
- Consider client type in message tone (formal for Corporate, friendly for ThirdParty)

## Database Field Mapping

### AspNetUsers Table
```sql
-- Core Identity Fields
id, user_name, email, email_confirmed
phone_number, phone_number_confirmed
lockout_end, access_failed_count
two_factor_enabled

-- Extended Fields (from migration)
is_approved, requires_password_change
last_password_change_date, password_expiry_days
last_login_at, created_date
```

### UserClientSecuritySettings Table
```sql
user_id, idp_client_id
user_is_approved_for_client
two_fa_method, email_confirmed, phone_confirmed
```

### IDPClient Table
```sql
name, type, is_active
allow_public_registration, allow_onboarding
require_2fa
```

This reference should be used by frontend developers to implement consistent user status displays and by backend developers to understand the business logic implications of various field combinations.
