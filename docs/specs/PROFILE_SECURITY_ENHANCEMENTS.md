# Profile & Security Page Enhancements

**Date:** 2026-01-09
**For:** BAPert (IDP Backend)
**From:** Claude (Frontend)
**Priority:** High

---

## Overview

The profile and security pages need enhancements. Frontend is ready to consume - need IDP endpoints.

---

## 1. Enhanced Profile Endpoint

### Current: `GET /api/Account/profile`

Returns basic info. Need to ensure these fields are included:

```json
{
  "email": "user@example.com",
  "email_confirmed": true,
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1-555-1234",
  "phone_confirmed": true,
  "two_factor_enabled": true,
  "created_at": "2024-03-15T10:30:00Z",
  "last_login": "2026-01-09T08:00:00Z",
  "avatar_url": null,
  "contact_information": {
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4",
    "city": "Seattle",
    "stateId": 79,
    "stateName": "Washington",
    "postalCode": "98101",
    "countryCode": "US",
    "countryName": "United States"
  }
}
```

### Requested Additions:
- `created_at` - Account creation timestamp
- `last_login` - Last successful login timestamp
- `avatar_url` - Profile picture URL (nullable)
- `stateName` - Resolved state name from stateId
- `countryName` - Resolved country name from countryCode

---

## 2. Phone Management Endpoints (NEW)

Users need to change their phone number for 2FA from the Security page.

### 2a. Initiate Phone Change
```
POST /api/Account/phone/change
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "new_phone_number": "+1-555-9999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to +1-555-9999",
  "expires_in_seconds": 300
}
```

### 2b. Verify New Phone
```
POST /api/Account/phone/verify
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number updated successfully",
  "phone_number": "+1-555-9999",
  "phone_confirmed": true
}
```

### Business Rules:
- Old phone remains active until new phone is verified
- Verification code expires after 5 minutes
- Max 3 attempts before lockout
- If 2FA is enabled, changing phone should NOT disable 2FA (new phone takes over)

---

## 3. Profile Update Endpoint

### Current: `PUT /api/Account/profile`

Ensure these fields can be updated:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "contact_info": {
    "addressLine1": "456 New St",
    "addressLine2": "",
    "city": "Portland",
    "stateId": 60,
    "postalCode": "97201",
    "countryCode": "US"
  }
}
```

---

## 4. State/Country Lookup (Nice to Have)

If not including stateName/countryName in profile response, provide lookup endpoints:

```
GET /api/Lookup/states?countryCode=US
GET /api/Lookup/countries
```

---

## Frontend Ready

Once endpoints are available, frontend will:
1. Update Profile page to show all fields + edit capability
2. Update Security page with "Change Phone Number" section
3. Add phone change flow with verification code input

---

## Questions

1. Are `created_at` and `last_login` already tracked? Just need to expose them.
2. Any existing phone change flow we can reuse?
3. Should phone change require current password confirmation?

---

**Let me know when ready and I'll build the frontend.**
