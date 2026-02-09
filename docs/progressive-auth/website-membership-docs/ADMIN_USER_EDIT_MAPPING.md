# Admin User Edit Page - Frontend to Backend Mapping

## Current Requirements Analysis

Based on the `AdminQuickActions` component and backend `AdminController`, here's what we need for the edit user page:

## 🎯 Toggle Requirements Mapping

| Frontend Toggle | Next.js API Route | IDP Backend Endpoint | Status | Notes |
|----------------|-------------------|---------------------|---------|-------|
| **Account Active** (is_approved) | `POST /api/admin/users/[id]/toggle` | `POST /api/Admin/users/pause` <br> `POST /api/Admin/users/resume` | ✅ **WORKING** | Use pause/resume for approval logic |
| **Email Confirmed** | `POST /api/admin/users/[id]/toggle` | `POST /api/Admin/users/confirm-email` | ✅ **WORKING** | New endpoint using UpdateProfileAsync service |
| **Phone Confirmed** | `POST /api/admin/users/[id]/toggle` | `POST /api/Admin/users/confirm-phone` | ✅ **WORKING** | New endpoint using UpdateProfileAsync service |
| **Two-Factor Auth** | `POST /api/admin/users/[id]/toggle` | `POST /api/Admin/users/reset-2fa` | ⚠️ **PARTIAL** | Can disable but not enable easily |
| **Lockout Enabled** | `POST /api/admin/users/[id]/toggle` | `POST /api/Admin/users/unlock` | ⚠️ **PARTIAL** | Can unlock but not manually lock |

## 📞 Contact Information Updates

| Frontend Action | Next.js API Route | IDP Backend Endpoint | Status | Notes |
|----------------|-------------------|---------------------|---------|-------|
| **Update Email** | `POST /api/admin/users/[id]/profile/update` | `POST /api/Admin/update_user_profile` | ✅ **WORKING** | Uses general profile update |
| **Update Phone** | `POST /api/admin/users/[id]/profile/update` | `POST /api/Admin/update_user_profile` | ✅ **WORKING** | Uses general profile update |

## 🔧 What We Need to Fix

### 1. **CRITICAL: Email/Phone Confirmation Toggles**

**Problem**: No specific endpoints for toggling email/phone confirmation status.

**Options**:
- **Option A**: Add new IDP endpoints `POST /api/Admin/users/confirm-email` and `POST /api/Admin/users/confirm-phone`
- **Option B**: Use the existing `POST /api/Admin/update_user_profile` with only email_confirmed/phone_confirmed fields
- **Option C**: Modify pause/resume to handle confirmation states (not recommended)

**Recommendation**: **Option B** - Use existing update_user_profile endpoint for consistency.

### 2. **IMPROVEMENT: Two-Factor Toggle**

**Problem**: Can reset/disable 2FA but no clean way to enable it.

**Current Endpoints**:
- `POST /api/Admin/users/reset-2fa` - Disables 2FA

**Missing**: 
- Force 2FA enrollment endpoint

### 3. **IMPROVEMENT: Manual Lockout**

**Problem**: Can unlock users but no way to manually lock them.

**Current Endpoints**:
- `POST /api/Admin/users/unlock` - Removes lockout

**Solution**: Use existing `POST /api/Admin/users/pause` for manual lockouts.

## 🛠️ Implementation Plan

### Phase 1: Fix Email/Phone Confirmation (CRITICAL)

1. **Update Frontend Toggle Handler**:
   - Modify `toggleEmailConfirmed` and `togglePhoneConfirmed` in `idp-api.ts`
   - Use `POST /api/Admin/update_user_profile` with minimal payload

2. **Update Backend Models**:
   - Ensure `UpdateProfileRequest` handles individual field updates
   - Add validation for partial updates

### Phase 2: Improve Two-Factor Management

1. **Add Force 2FA Endpoint** (Optional):
   ```csharp
   [HttpPost("users/force-2fa")]
   public async Task<IActionResult> Force2FA([FromBody] Force2FARequest request)
   ```

2. **Or Use Existing**: Map "enable 2FA" to sending enrollment instructions

### Phase 3: Improve Lockout Management

1. **Update Frontend**: Use pause/resume for lockout toggle
2. **Backend**: Ensure pause sets lockout correctly

## 📋 Current Working Endpoints Summary

### ✅ Working in IDP Backend:
- `POST /api/Admin/users` - List/search users
- `POST /api/Admin/users/get` - Get single user details  
- `POST /api/Admin/update_user_profile` - Update user profile
- `POST /api/Admin/users/pause` - Pause/suspend user
- `POST /api/Admin/users/resume` - Resume/unsuspend user
- `POST /api/Admin/users/unlock` - Remove lockout
- `POST /api/Admin/users/reset-2fa` - Reset 2FA
- `POST /api/Admin/users/revoke-tokens` - Revoke all tokens
- `POST /api/Admin/users/confirm-email` - Toggle email confirmation ✨ **NEW**
- `POST /api/Admin/users/confirm-phone` - Toggle phone confirmation ✨ **NEW**

### ✅ Fixed/Completed:
- ✅ Email confirmation toggle - **FIXED** with new endpoint
- ✅ Phone confirmation toggle - **FIXED** with new endpoint

### ⚠️ Still Need Improvement:
- Proper 2FA enable/disable flow
- Manual lockout toggle (can use pause for now)

## 🎯 Next Steps

1. **Fix email/phone confirmation toggles** - Use update_user_profile endpoint
2. **Test approval toggle** - Ensure pause/resume works correctly  
3. **Improve 2FA toggle** - Better enable/disable flow
4. **Add proper error handling** - Better user feedback
5. **Add audit logging** - Track all admin actions

## 🧪 Testing Requirements

For each toggle, we need to test:
- ✅ Toggle ON works
- ✅ Toggle OFF works  
- ✅ UI updates correctly
- ✅ Backend state changes
- ✅ Error handling works
- ✅ Audit logs created
- ✅ Permissions enforced
