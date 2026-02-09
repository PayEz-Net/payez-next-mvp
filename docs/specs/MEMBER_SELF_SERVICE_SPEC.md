# Member Self-Service Pages Specification

**Version:** 1.0
**Date:** 2026-01-09
**Status:** Draft
**Authors:** BAPert
**For:** DotNetPert (Backend), NextPert (Frontend)

---

## Overview

Complete specification for the three core member self-service pages:
1. **Profile** - Identity and contact information
2. **Security** - Account protection and authentication
3. **Site Settings** - Preferences and personalization

Goal: Production-quality, polished user experience for member account management.

---

## Data Sources

### Existing Tables

| Table | Schema | Key Fields |
|-------|--------|------------|
| `asp_net_users` | core_identity | email, phone, 2FA, password dates, activity timestamps |
| `contact_info` | common | name, address, secondary contact |
| `user_client_security_settings` | core_identity | 2FA method per client, site admin flag |
| `asp_net_user_logins` | core_identity | OAuth provider links |
| `state_provinces` | common | state/province lookup |
| `countries` | common | country lookup |

### New Schema Required

#### 1. User Preferences Table (Vibe)

```sql
CREATE TABLE IF NOT EXISTS vibe.user_preferences
(
    user_preference_id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    client_id integer NOT NULL,
    user_id integer NOT NULL,

    -- Appearance
    theme character varying(20) DEFAULT 'system',  -- light, dark, system
    compact_mode boolean NOT NULL DEFAULT false,

    -- Localization
    language character varying(10) DEFAULT 'en',
    timezone character varying(50) DEFAULT 'UTC',
    date_format character varying(20) DEFAULT 'MM/DD/YYYY',

    -- Notifications
    email_notifications boolean NOT NULL DEFAULT true,
    sms_notifications boolean NOT NULL DEFAULT false,
    notification_frequency character varying(20) DEFAULT 'immediate',  -- immediate, daily, weekly

    -- Privacy
    profile_visibility character varying(20) DEFAULT 'private',  -- private, team, public

    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone,

    CONSTRAINT user_preferences_pkey PRIMARY KEY (user_preference_id),
    CONSTRAINT user_preferences_client_user_key UNIQUE (client_id, user_id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS vibe.user_preferences OWNER to payezidpdbadmin;
GRANT ALL ON TABLE vibe.user_preferences TO payezidpdbadmin;
GRANT ALL ON TABLE vibe.user_preferences TO vibe_api_user;

CREATE INDEX IF NOT EXISTS idx_user_preferences_client_user
    ON vibe.user_preferences USING btree (client_id, user_id);
```

#### 2. User Sessions Table (IDP)

```sql
CREATE TABLE IF NOT EXISTS core_identity.user_sessions
(
    user_session_id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    user_id integer NOT NULL,
    session_token_hash character varying(128) NOT NULL,  -- hashed for security

    -- Device info
    device_type character varying(50),  -- desktop, mobile, tablet
    device_name character varying(100),  -- "Chrome on Windows", "Safari on iPhone"
    browser character varying(50),
    os character varying(50),

    -- Location
    ip_address character varying(45),
    city character varying(100),
    country character varying(100),

    -- Timestamps
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    last_active_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,

    CONSTRAINT user_sessions_pkey PRIMARY KEY (user_session_id)
)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user
    ON core_identity.user_sessions (user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token
    ON core_identity.user_sessions (session_token_hash);
```

#### 3. Avatar Storage

```sql
-- Add to asp_net_users
ALTER TABLE core_identity.asp_net_users
ADD COLUMN IF NOT EXISTS avatar_url character varying(500);

-- Add to contact_info
ALTER TABLE common.contact_info
ADD COLUMN IF NOT EXISTS bio text;
```

#### 4. Pending Email Change (IDP)

```sql
-- Add to asp_net_users for safe email change flow
ALTER TABLE core_identity.asp_net_users
ADD COLUMN IF NOT EXISTS pending_email character varying(256),
ADD COLUMN IF NOT EXISTS pending_email_token character varying(100),
ADD COLUMN IF NOT EXISTS pending_email_expires_at timestamp with time zone;

-- Add pending phone (if not exists)
ALTER TABLE core_identity.asp_net_users
ADD COLUMN IF NOT EXISTS pending_phone_number character varying(20),
ADD COLUMN IF NOT EXISTS pending_phone_expires_at timestamp with time zone;
```

---

## Page 1: Profile

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROFILE                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐                                                           │
│  │          │   John Doe                                                │
│  │  AVATAR  │   john.doe@example.com ✓                                  │
│  │          │   +1 (555) 123-4567 ✓                                     │
│  └──────────┘                                                           │
│  [Change Photo]                                                          │
│                                                                          │
│  Member since January 15, 2024                                          │
│  Last active 2 hours ago                                                │
│  Account ID: USR-12345                                                   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  PERSONAL INFORMATION                                       [Edit]      │
│  ─────────────────────────────────────────────────────────────────      │
│  First Name         │ John                                              │
│  Last Name          │ Doe                                               │
│  Title              │ Software Engineer                                 │
│  Bio                │ Building great software...                        │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  CONTACT INFORMATION                                        [Edit]      │
│  ─────────────────────────────────────────────────────────────────      │
│  Primary Email      │ john.doe@example.com ✓        [Change]            │
│  Primary Phone      │ +1 (555) 123-4567 ✓           [Change]            │
│  Secondary Email    │ john.backup@gmail.com                             │
│  Secondary Phone    │ +1 (555) 987-6543                                 │
│  Website            │ https://johndoe.dev                               │
│  Preferred Contact  │ Email                                             │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ADDRESS                                                    [Edit]      │
│  ─────────────────────────────────────────────────────────────────      │
│  123 Main Street                                                        │
│  Apt 4B                                                                 │
│  Seattle, Washington 98101                                              │
│  United States                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Profile API Endpoints

#### GET /api/Account/profile

Returns complete profile data.

**Response:**
```json
{
  "user_id": 12345,
  "account_id": "USR-12345",

  "identity": {
    "email": "john.doe@example.com",
    "email_confirmed": true,
    "phone_number": "+15551234567",
    "phone_confirmed": true,
    "full_name": "John Doe",
    "avatar_url": "https://storage.payez.com/avatars/12345.jpg",
    "created_at": "2024-01-15T10:30:00Z",
    "last_sign_in": "2026-01-09T14:00:00Z",
    "last_activity": "2026-01-09T16:30:00Z"
  },

  "personal_info": {
    "first_name": "John",
    "last_name": "Doe",
    "title": "Software Engineer",
    "bio": "Building great software..."
  },

  "contact_info": {
    "secondary_email": "john.backup@gmail.com",
    "secondary_phone": "+15559876543",
    "website": "https://johndoe.dev",
    "preferred_contact_method": "email"
  },

  "address": {
    "address_line_1": "123 Main Street",
    "address_line_2": "Apt 4B",
    "city": "Seattle",
    "state_id": 79,
    "state_name": "Washington",
    "postal_code": "98101",
    "country_code": "US",
    "country_name": "United States"
  }
}
```

#### PUT /api/Account/profile

Update personal info and contact info (not email/phone - those have separate flows).

**Request:**
```json
{
  "personal_info": {
    "first_name": "John",
    "last_name": "Doe",
    "title": "Senior Software Engineer",
    "bio": "Updated bio..."
  },
  "contact_info": {
    "secondary_email": "john.new@gmail.com",
    "secondary_phone": "+15551112222",
    "website": "https://newsite.dev",
    "preferred_contact_method": "email"
  },
  "address": {
    "address_line_1": "456 New Street",
    "address_line_2": "",
    "city": "Portland",
    "state_id": 60,
    "postal_code": "97201",
    "country_code": "US"
  }
}
```

**Validation:**
- first_name: required, max 50 chars
- last_name: required, max 50 chars
- title: optional, max 100 chars
- bio: optional, max 500 chars
- secondary_email: valid email format if provided
- website: valid URL format if provided
- preferred_contact_method: enum (email, sms, both)

#### POST /api/Account/avatar

Upload profile picture.

**Request:** multipart/form-data with image file

**Constraints:**
- Max size: 5MB
- Formats: jpg, png, gif, webp
- Dimensions: min 100x100, max 2000x2000
- Stored: Azure Blob Storage or similar

**Response:**
```json
{
  "success": true,
  "avatar_url": "https://storage.payez.com/avatars/12345.jpg?v=2"
}
```

#### DELETE /api/Account/avatar

Remove profile picture.

#### POST /api/Account/email/change

Initiate email change (sends verification to NEW email).

**Request:**
```json
{
  "new_email": "john.newemail@example.com",
  "current_password": "required_for_security"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent to john.newemail@example.com",
  "expires_in_seconds": 3600
}
```

**Business Rules:**
- Requires current password
- New email must not be in use
- Token valid for 1 hour
- Old email remains active until new is verified
- Send notification to old email about change request

#### POST /api/Account/email/verify

Complete email change.

**Request:**
```json
{
  "token": "abc123..."
}
```

#### POST /api/Account/phone/change

Initiate phone change (sends SMS to NEW phone).

**Request:**
```json
{
  "new_phone_number": "+15559999999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to +1 (555) 999-9999",
  "expires_in_seconds": 300
}
```

**Business Rules:**
- Code expires in 5 minutes
- Max 3 attempts before lockout
- Old phone remains active until new is verified
- If 2FA uses SMS, transfers to new phone

#### POST /api/Account/phone/verify

Complete phone change.

**Request:**
```json
{
  "code": "123456"
}
```

#### GET /api/Lookup/states?countryCode=US

Return states/provinces for country.

**Response:**
```json
{
  "states": [
    { "state_id": 1, "name": "Alabama", "code": "AL" },
    { "state_id": 2, "name": "Alaska", "code": "AK" },
    ...
  ]
}
```

#### GET /api/Lookup/countries

Return all countries.

**Response:**
```json
{
  "countries": [
    { "country_code": "US", "name": "United States" },
    { "country_code": "CA", "name": "Canada" },
    ...
  ]
}
```

---

## Page 2: Security

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PASSWORD                                                                │
│  ─────────────────────────────────────────────────────────────────      │
│  Last changed: December 1, 2025 (39 days ago)                           │
│  Expires in: 51 days                                                    │
│                                                        [Change Password] │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  TWO-FACTOR AUTHENTICATION                                              │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  Status: ENABLED                                                         │
│  Method: SMS to +1 (555) ***-4567                                       │
│  Last updated: November 15, 2025                                        │
│                                                                          │
│  [Change Method]  [Disable 2FA]                                         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Backup Codes                                                    │   │
│  │  You have 8 of 10 backup codes remaining.          [View Codes]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  CONNECTED ACCOUNTS                                                      │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  [Google Icon]  Google                                                  │
│                 john.doe@gmail.com                         [Disconnect] │
│                 Connected: March 10, 2024                               │
│                                                                          │
│  [Microsoft Icon]  Microsoft                                            │
│                    john.doe@outlook.com                    [Disconnect] │
│                    Connected: March 10, 2024                            │
│                                                                          │
│                                              [Connect Another Account]  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ACTIVE SESSIONS                                                         │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  [Desktop Icon]  Windows - Chrome                      THIS DEVICE      │
│                  Seattle, US - 192.168.1.xxx                            │
│                  Active now                                              │
│                                                                          │
│  [Mobile Icon]   iPhone - Safari                           [Revoke]     │
│                  Portland, US - 10.0.0.xxx                              │
│                  Last active: 2 hours ago                               │
│                                                                          │
│  [Desktop Icon]  MacOS - Firefox                           [Revoke]     │
│                  San Francisco, US - 172.16.xxx                         │
│                  Last active: 3 days ago                                │
│                                                                          │
│                                              [Sign Out All Other Devices]│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  RECENT ACTIVITY                                                         │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  [Check]  Successful login - Chrome, Seattle          Today, 2:30 PM    │
│  [Check]  Password changed                            Dec 1, 10:15 AM   │
│  [Check]  Successful login - iPhone, Portland         Nov 28, 8:00 AM   │
│  [X]      Failed login attempt - Unknown, Russia      Nov 25, 3:45 AM   │
│  [Check]  2FA method changed to SMS                   Nov 15, 4:20 PM   │
│                                                                          │
│                                                    [View Full History]  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  DANGER ZONE                                                             │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  [Download Icon]  Download My Data                                      │
│                   Get a copy of all your personal data                  │
│                                                        [Request Export] │
│                                                                          │
│  [Trash Icon]     Delete Account                                        │
│                   Permanently delete your account and all data          │
│                                                        [Delete Account] │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security API Endpoints

#### GET /api/Account/security

Returns security overview.

**Response:**
```json
{
  "password": {
    "last_changed": "2025-12-01T10:15:00Z",
    "expires_at": "2026-03-01T10:15:00Z",
    "days_until_expiry": 51,
    "requires_change": false
  },

  "two_factor": {
    "enabled": true,
    "method": "sms",
    "method_display": "SMS to +1 (555) ***-4567",
    "last_updated": "2025-11-15T16:20:00Z",
    "requires_reenrollment": false,
    "backup_codes_remaining": 8
  },

  "connected_accounts": [
    {
      "provider": "Google",
      "provider_key": "google-oauth2",
      "email": "john.doe@gmail.com",
      "connected_at": "2024-03-10T14:00:00Z",
      "can_disconnect": true
    },
    {
      "provider": "Microsoft",
      "provider_key": "microsoft",
      "email": "john.doe@outlook.com",
      "connected_at": "2024-03-10T14:30:00Z",
      "can_disconnect": true
    }
  ],

  "active_sessions": [
    {
      "session_id": "sess_abc123",
      "device_type": "desktop",
      "device_name": "Windows - Chrome",
      "ip_address": "192.168.1.xxx",
      "location": "Seattle, US",
      "created_at": "2026-01-09T08:00:00Z",
      "last_active_at": "2026-01-09T16:30:00Z",
      "is_current": true
    },
    {
      "session_id": "sess_def456",
      "device_type": "mobile",
      "device_name": "iPhone - Safari",
      "ip_address": "10.0.0.xxx",
      "location": "Portland, US",
      "created_at": "2026-01-07T12:00:00Z",
      "last_active_at": "2026-01-09T14:30:00Z",
      "is_current": false
    }
  ],

  "recent_activity": [
    {
      "event_type": "login_success",
      "description": "Successful login",
      "device": "Chrome, Seattle",
      "timestamp": "2026-01-09T14:30:00Z",
      "success": true
    },
    {
      "event_type": "password_changed",
      "description": "Password changed",
      "device": null,
      "timestamp": "2025-12-01T10:15:00Z",
      "success": true
    },
    {
      "event_type": "login_failed",
      "description": "Failed login attempt",
      "device": "Unknown, Russia",
      "timestamp": "2025-11-25T03:45:00Z",
      "success": false
    }
  ]
}
```

#### POST /api/Account/password/change

Change password.

**Request:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword456",
  "confirm_password": "newSecurePassword456"
}
```

**Validation:**
- Current password must be correct
- New password: min 12 chars, 1 upper, 1 lower, 1 number, 1 special
- Cannot reuse last 5 passwords
- confirm_password must match new_password

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "next_expiry": "2026-04-09T16:30:00Z"
}
```

#### GET /api/Account/2fa/status

Get current 2FA status.

#### POST /api/Account/2fa/enable

Enable 2FA with specified method.

**Request:**
```json
{
  "method": "sms",  // sms, email, authenticator
  "phone_number": "+15551234567"  // required for sms
}
```

**Response (for authenticator):**
```json
{
  "success": true,
  "method": "authenticator",
  "setup_key": "JBSWY3DPEHPK3PXP",
  "qr_code_url": "otpauth://totp/PayEz:john@example.com?secret=...",
  "backup_codes": ["12345678", "23456789", ...]
}
```

#### POST /api/Account/2fa/verify-setup

Verify 2FA setup with code.

**Request:**
```json
{
  "code": "123456"
}
```

#### POST /api/Account/2fa/disable

Disable 2FA.

**Request:**
```json
{
  "current_password": "required_for_security",
  "code": "123456"  // current 2FA code
}
```

#### GET /api/Account/2fa/backup-codes

Get backup codes (regenerates if requested).

**Request:**
```json
{
  "regenerate": false
}
```

**Response:**
```json
{
  "codes": ["12345678", "23456789", ...],
  "remaining": 10,
  "generated_at": "2026-01-09T16:30:00Z"
}
```

#### GET /api/Account/connected-accounts

List connected OAuth providers.

#### DELETE /api/Account/connected-accounts/{provider}

Disconnect OAuth provider.

**Business Rules:**
- Cannot disconnect if it's the only login method and no password set
- Requires current password or 2FA code

#### GET /api/Account/sessions

List active sessions.

#### DELETE /api/Account/sessions/{sessionId}

Revoke specific session.

#### POST /api/Account/sessions/revoke-all

Revoke all sessions except current.

**Response:**
```json
{
  "success": true,
  "revoked_count": 3,
  "message": "Signed out of 3 other devices"
}
```

#### GET /api/Account/activity?limit=20&offset=0

Get security activity log.

**Response:**
```json
{
  "activities": [...],
  "total_count": 150,
  "has_more": true
}
```

#### POST /api/Account/export-data

Request data export (GDPR).

**Response:**
```json
{
  "success": true,
  "message": "Export requested. You will receive an email when ready.",
  "estimated_time_minutes": 30
}
```

**Business Rules:**
- Generates ZIP with all user data
- Emails download link when ready
- Link valid for 7 days
- Rate limit: 1 export per 24 hours

#### POST /api/Account/delete

Request account deletion.

**Request:**
```json
{
  "current_password": "required",
  "confirmation": "DELETE MY ACCOUNT",
  "reason": "optional feedback"
}
```

**Business Rules:**
- Requires password confirmation
- Requires typing "DELETE MY ACCOUNT"
- 30-day grace period before permanent deletion
- Can cancel during grace period
- Email confirmation sent

---

## Page 3: Site Settings

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SETTINGS                                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  APPEARANCE                                                              │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  Theme                                                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                                 │
│  │  Light  │  │  Dark   │  │ System  │  <- selected                    │
│  └─────────┘  └─────────┘  └─────────┘                                 │
│                                                                          │
│  Compact Mode                                              [Toggle OFF] │
│  Reduce spacing and padding for denser layouts                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  LOCALIZATION                                                            │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  Language              [English (US)            v]                      │
│                                                                          │
│  Timezone              [America/Los_Angeles     v]                      │
│                        Currently: PST (UTC-8)                           │
│                                                                          │
│  Date Format           [MM/DD/YYYY              v]                      │
│                        Example: 01/09/2026                              │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  NOTIFICATIONS                                                           │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  Email Notifications                                       [Toggle ON]  │
│  Receive updates and alerts via email                                   │
│                                                                          │
│    Security alerts (login from new device, etc.)           [Toggle ON]  │
│    Account updates (password expiry, etc.)                 [Toggle ON]  │
│    Product news and tips                                   [Toggle OFF] │
│    Marketing and promotions                                [Toggle OFF] │
│                                                                          │
│  SMS Notifications                                         [Toggle OFF] │
│  Receive urgent alerts via text message                                 │
│                                                                          │
│    Security alerts only                                    [Toggle ON]  │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  PRIVACY                                                                 │
│  ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│  Profile Visibility                                                      │
│  ○ Private - Only you can see your profile                             │
│  ○ Team - Team members can see your profile                 <- selected│
│  ○ Public - Anyone can see your profile                                │
│                                                                          │
│  Activity Status                                           [Toggle ON]  │
│  Show when you're active to team members                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Settings API Endpoints

#### GET /api/v1/user/preferences

Get user preferences (Vibe endpoint).

**Response:**
```json
{
  "appearance": {
    "theme": "system",
    "compact_mode": false
  },
  "localization": {
    "language": "en",
    "timezone": "America/Los_Angeles",
    "timezone_display": "PST (UTC-8)",
    "date_format": "MM/DD/YYYY"
  },
  "notifications": {
    "email_enabled": true,
    "email_security_alerts": true,
    "email_account_updates": true,
    "email_product_news": false,
    "email_marketing": false,
    "sms_enabled": false,
    "sms_security_alerts": true
  },
  "privacy": {
    "profile_visibility": "team",
    "show_activity_status": true
  }
}
```

#### PUT /api/v1/user/preferences

Update user preferences.

**Request:**
```json
{
  "appearance": {
    "theme": "dark",
    "compact_mode": true
  },
  "localization": {
    "language": "en",
    "timezone": "America/New_York",
    "date_format": "DD/MM/YYYY"
  },
  "notifications": {
    "email_enabled": true,
    "email_security_alerts": true,
    "email_account_updates": true,
    "email_product_news": true,
    "email_marketing": false,
    "sms_enabled": true,
    "sms_security_alerts": true
  },
  "privacy": {
    "profile_visibility": "private",
    "show_activity_status": false
  }
}
```

#### GET /api/v1/lookup/languages

List available languages.

**Response:**
```json
{
  "languages": [
    { "code": "en", "name": "English (US)" },
    { "code": "en-GB", "name": "English (UK)" },
    { "code": "es", "name": "Spanish" },
    { "code": "fr", "name": "French" },
    { "code": "de", "name": "German" },
    { "code": "ja", "name": "Japanese" },
    { "code": "zh", "name": "Chinese (Simplified)" }
  ]
}
```

#### GET /api/v1/lookup/timezones

List available timezones.

**Response:**
```json
{
  "timezones": [
    { "id": "America/Los_Angeles", "display": "Pacific Time (US)", "offset": "-08:00" },
    { "id": "America/New_York", "display": "Eastern Time (US)", "offset": "-05:00" },
    { "id": "Europe/London", "display": "London", "offset": "+00:00" },
    { "id": "Asia/Tokyo", "display": "Tokyo", "offset": "+09:00" },
    ...
  ]
}
```

---

## Implementation Priority

### Phase 1: Core Profile (Week 1)
1. Enhanced GET /api/Account/profile
2. PUT /api/Account/profile
3. Phone change flow (already in progress)
4. State/country lookups

### Phase 2: Security Basics (Week 2)
5. GET /api/Account/security overview
6. Password change
7. 2FA management (enable/disable/change method)
8. Connected accounts list

### Phase 3: Sessions & Activity (Week 3)
9. Session management (list, revoke)
10. Activity log
11. Avatar upload

### Phase 4: Settings & Polish (Week 4)
12. User preferences (Vibe)
13. Email change flow
14. Data export
15. Account deletion

---

## Security Requirements

1. **All endpoints require authentication** (Bearer token)
2. **Sensitive operations require password confirmation:**
   - Change email
   - Disable 2FA
   - Disconnect OAuth (if last method)
   - Delete account
3. **Rate limiting:**
   - Password change: 3 attempts per hour
   - 2FA code verification: 5 attempts per 5 minutes
   - Data export: 1 per 24 hours
4. **Audit logging:**
   - All security-related actions logged
   - Include IP, device, timestamp
5. **Session security:**
   - Sessions expire after 30 days of inactivity
   - Sensitive actions extend session
   - IP change may trigger re-auth

---

## Frontend Components Needed

### Shared
- `VerificationCodeInput` - 6-digit code entry
- `PasswordStrengthMeter` - Visual password strength
- `ConfirmationModal` - Dangerous action confirmation
- `DeviceIcon` - Device type icons
- `ProviderIcon` - OAuth provider logos

### Profile Page
- `AvatarUpload` - Drag-drop image upload with crop
- `ProfileHeader` - Avatar, name, status
- `EditableSection` - Inline edit with save/cancel
- `AddressForm` - Address with state/country dropdowns

### Security Page
- `PasswordSection` - Status + change form
- `TwoFactorSection` - Enable/disable/method change
- `ConnectedAccountsList` - OAuth providers
- `SessionsList` - Active sessions with revoke
- `ActivityLog` - Security events timeline
- `DangerZone` - Export/delete actions

### Settings Page
- `ThemeSelector` - Light/dark/system toggle
- `TimezoneSelector` - Searchable timezone dropdown
- `NotificationToggles` - Grouped notification settings
- `PrivacySettings` - Visibility options

---

## Acceptance Criteria

### Profile
- [ ] User can view all profile information
- [ ] User can edit personal info (name, title, bio)
- [ ] User can edit contact info (secondary email/phone, website)
- [ ] User can edit address with state/country dropdowns
- [ ] User can upload/change avatar
- [ ] User can change primary email (with verification)
- [ ] User can change primary phone (with verification)

### Security
- [ ] User can view security overview
- [ ] User can change password
- [ ] User can enable/disable 2FA
- [ ] User can change 2FA method
- [ ] User can view/regenerate backup codes
- [ ] User can see connected OAuth accounts
- [ ] User can disconnect OAuth accounts
- [ ] User can see active sessions
- [ ] User can revoke individual sessions
- [ ] User can sign out all other devices
- [ ] User can view security activity log
- [ ] User can request data export
- [ ] User can delete account (with grace period)

### Settings
- [ ] User can change theme
- [ ] User can enable compact mode
- [ ] User can set language
- [ ] User can set timezone
- [ ] User can set date format
- [ ] User can manage email notification preferences
- [ ] User can manage SMS notification preferences
- [ ] User can set profile visibility

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-09 | BAPert | Initial comprehensive spec |
