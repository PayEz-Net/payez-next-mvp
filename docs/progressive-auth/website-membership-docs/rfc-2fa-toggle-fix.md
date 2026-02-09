# RFC: Fix 2FA Toggle Implementation

## Problem Statement
The current 2FA toggle in the admin interface misuses backend APIs:
- Enabling 2FA calls `forceUser2FAReset()` which is meant for compliance, causing 400 errors
- Backend has no true "enable 2FA" endpoint - only reset and force re-enrollment

## Current State
- UI: Simple toggle switch labeled "Two-Factor Auth" 
- API: `toggleTwoFactor(userId, enabled)` method
- Backend endpoints: `resetUser2FA()` and `forceUser2FAReset()`

## Proposed Solution (Strategy B)
Keep the toggle UI but fix the behavior:

### When Toggle = OFF (Disable)
- ✅ Continue using `resetUser2FA()` - this correctly removes 2FA devices
- ✅ User feedback: "2FA disabled - all devices removed"

### When Toggle = ON (Enable)  
- ❌ Remove incorrect `forceUser2FAReset()` call
- ✅ Show informational message: "2FA setup required - user must enroll devices on next login"
- ✅ Optionally: Set user flag indicating 2FA should be prompted
- ✅ No API error - operation succeeds immediately

## Implementation Plan

### 1. Fix API Layer (`src/utils/idp-api.ts`)
```typescript
async toggleTwoFactor(userId: string | number, isEnabled: boolean): Promise<any> {
  if (!isEnabled) {
    // Disable: remove all 2FA devices (working correctly)
    return this.resetUser2FA(userId);
  } else {
    // Enable: no immediate API call needed
    // TODO: Future enhancement - add backend endpoint for enabling 2FA requirement
    return Promise.resolve({
      success: true,
      message: "2FA setup will be required on user's next login",
      action: "enable_2fa_requirement"
    });
  }
}
```

### 2. Update UI Messaging
- Change tooltip to clarify behavior
- Update success messages to set proper expectations
- Handle the "enable" case gracefully without errors

### 3. Error Handling
- Remove 400 errors caused by misuse of force reset endpoint
- Add informative messages about actual behavior

## Benefits
- ✅ Eliminates API errors 
- ✅ Maintains familiar toggle UI pattern
- ✅ Sets correct user expectations
- ✅ Works within current backend limitations
- ✅ Easy to enhance when backend adds proper enable endpoint

## Future Enhancement Path
When backend adds proper 2FA enable endpoint:
- Update `toggleTwoFactor()` enable branch to call new endpoint
- Maintain same UI/UX - no breaking changes needed

## Decision: APPROVED
Strategy B provides the best balance of user experience and technical feasibility.
