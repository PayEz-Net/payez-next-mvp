# Toggle and Action Functionality Implementation

## Overview

This document describes the implementation of toggle and action functionality for user management in the admin dashboard. The implementation includes API calls and state management for:

- Updating `is_approved` status
- Toggling `EmailConfirmed`/`PhoneNumberConfirmed`
- Managing lockout status (`LockoutEnabled`/`LockoutEnd`)
- Updating `TwoFactorEnabled` status
- Proper error handling and success notifications

## Files Created/Modified

### 1. API Client Extensions (`src/utils/idp-api.ts`)

Added new methods to the `IdpApiClient` class:

```typescript
async toggleUserApproval(userId: string | number, isApproved: boolean): Promise<any>
async toggleEmailConfirmed(userId: string | number, isConfirmed: boolean): Promise<any>
async togglePhoneConfirmed(userId: string | number, isConfirmed: boolean): Promise<any>
async toggleTwoFactor(userId: string | number, isEnabled: boolean): Promise<any>
async toggleLockout(userId: string | number, isLocked: boolean): Promise<any>
async unlockUser(userId: string | number): Promise<any>
async resetFailedAttempts(userId: string | number): Promise<any>
```

### 2. API Endpoints

#### Toggle Endpoint (`src/app/api/admin/users/[id]/toggle/route.ts`)
- **Method**: POST
- **Purpose**: Toggle user settings like approval status, email confirmation, etc.
- **Request Body**: 
  ```json
  {
    "field": "is_approved" | "email_confirmed" | "phone_confirmed" | "two_factor_enabled" | "lockout_enabled",
    "value": boolean
  }
  ```

#### Unlock Endpoint (`src/app/api/admin/users/[id]/unlock/route.ts`)
- **Method**: POST
- **Purpose**: Unlock user accounts
- **Action**: Sets `lockout_enabled` to `false` and `lockout_end` to `null`

#### Reset Attempts Endpoint (`src/app/api/admin/users/[id]/reset-attempts/route.ts`)
- **Method**: POST
- **Purpose**: Reset failed login attempts
- **Action**: Sets `access_failed_count` to `0`

### 3. Enhanced AdminQuickActions Component (`src/components/admin/AdminQuickActions.tsx`)

**Key Features:**
- Interactive toggles for all user settings
- Loading states with individual action tracking
- Success/error notifications using react-hot-toast
- Visual status indicators with icons
- Proper error handling

**Props Interface:**
```typescript
interface AdminQuickActionsProps {
  userId: string;
  isApproved: boolean;
  LockoutEnabled: boolean;
  LockoutEnd: Date | null;
  EmailConfirmed: boolean;
  PhoneNumberConfirmed: boolean;
  TwoFactorEnabled: boolean;
  isActive?: boolean;
  onToggleApproval: (checked: boolean) => Promise<void>;
  onToggleLockout: (checked: boolean) => Promise<void>;
  onToggleEmailConfirmed: (checked: boolean) => Promise<void>;
  onTogglePhoneConfirmed: (checked: boolean) => Promise<void>;
  onToggleTwoFactor: (checked: boolean) => Promise<void>;
  onToggleActive?: (checked: boolean) => Promise<void>;
  className?: string;
}
```

### 4. User Detail Page Integration (`src/app/dashboards/idp-admin/users/[id]/page.tsx`)

**Added API Functions:**
```typescript
// Toggle user settings
const toggleUserSetting = async (field: string, value: boolean) => { ... }

// Unlock user account
const unlockUserAccount = async () => { ... }

// Reset failed attempts
const resetFailedAttempts = async () => { ... }
```

**Integration with Components:**
- AdminQuickActions component uses API functions for all toggles
- UserAccessControl component uses API functions for reset/unlock actions
- Real-time state updates after successful API calls

### 5. Toast Notifications (`src/components/Providers.tsx`)

Added react-hot-toast integration:
```typescript
import { Toaster } from "react-hot-toast";

// Added to Providers component
<Toaster position="top-right" reverseOrder={false} />
```

## Features Implemented

### 1. Security Approval Toggle
- **Field**: `is_approved`
- **UI**: Switch with shield icons
- **States**: Approved (green shield check) / Not Approved (red shield alert)

### 2. Email Confirmation Toggle
- **Field**: `email_confirmed`
- **UI**: Switch with check/X circle icons
- **States**: Confirmed (green check) / Unconfirmed (red X)

### 3. Phone Confirmation Toggle
- **Field**: `phone_confirmed`
- **UI**: Switch with check/X circle icons
- **States**: Confirmed (green check) / Unconfirmed (red X)

### 4. Two-Factor Authentication Toggle
- **Field**: `two_factor_enabled`
- **UI**: Switch with shield icons
- **States**: Enabled (green shield check) / Disabled (red shield alert)

### 5. Lockout Management
- **Field**: `lockout_enabled`
- **UI**: Switch with lock/unlock icons
- **States**: Enabled (yellow lock) / Disabled (green unlock)
- **Additional**: Visual lockout status indicator when account is locked

### 6. Quick Actions
- **Unlock Account**: Immediately unlocks a locked user account
- **Reset Failed Attempts**: Clears the failed login attempt counter

## Error Handling

### API Level
- Comprehensive error catching in all API endpoints
- Proper HTTP status codes and error messages
- Circuit breaker pattern for upstream service protection

### UI Level
- Loading states prevent multiple simultaneous actions
- Toast notifications for success and error states
- Graceful degradation when API calls fail

### State Management
- Optimistic updates for better user experience
- State rollback on API failures
- Real-time UI updates after successful operations

## Security Considerations

### Authentication & Authorization
- All endpoints require admin authentication
- Role-based access control through middleware
- Comprehensive audit logging for all actions

### Validation
- Input validation on all API endpoints
- Type safety with TypeScript interfaces
- Proper field validation for toggle operations

## Usage Examples

### Toggle User Approval
```typescript
// In component
const handleToggleApproval = async (checked: boolean) => {
  await toggleUserSetting('is_approved', checked);
};

// API call
POST /api/admin/users/{userId}/toggle
{
  "field": "is_approved",
  "value": true
}
```

### Unlock User Account
```typescript
// In component
const handleUnlockUser = async () => {
  await unlockUserAccount();
};

// API call
POST /api/admin/users/{userId}/unlock
```

### Reset Failed Attempts
```typescript
// In component
const handleResetAttempts = async () => {
  await resetFailedAttempts();
};

// API call
POST /api/admin/users/{userId}/reset-attempts
```

## Performance Optimizations

1. **Individual Action Tracking**: Only the active toggle shows loading state
2. **Debounced Updates**: Prevents rapid consecutive API calls
3. **Optimistic Updates**: UI responds immediately while API call processes
4. **Efficient State Management**: Minimal re-renders through proper state updates

## Testing Considerations

### Unit Tests
- Test all API client methods
- Test component state management
- Test error handling scenarios

### Integration Tests
- Test API endpoint responses
- Test authentication and authorization
- Test error scenarios and edge cases

### E2E Tests
- Test complete user workflows
- Test UI interactions and feedback
- Test error recovery scenarios

## Future Enhancements

1. **Bulk Operations**: Support for multiple user updates
2. **Audit Trail**: Detailed logging of all changes
3. **Permissions**: Granular permissions for different toggle actions
4. **Rollback**: Ability to undo recent changes
5. **Notifications**: Email/SMS notifications for critical changes

## Dependencies Added

```json
{
  "react-hot-toast": "^2.4.1"
}
```

## Conclusion

The implementation provides a comprehensive solution for user management with proper error handling, state management, and user feedback. The architecture is scalable and maintainable, following React and Next.js best practices.
