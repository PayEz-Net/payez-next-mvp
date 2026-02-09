# Locked Users Stats Fix

## Issue
The `/api/activity/user-stats` endpoint was returning `locked_out_users: 0` even though users had been updated with lockout settings in the database.

## Root Cause
In `PayEz.Services/PayEz.Application/IdServices/UserService.cs`, the `GetUserStatsAsync` method was only checking for `LockoutEnd > currentTime` but not verifying that `LockoutEnabled = true`.

## Fix Applied
**File:** `E:\Repos\payez-core\PayEz.Services\PayEz.Application\IdServices\UserService.cs`
**Lines:** 839-842

**Before:**
```csharp
// Locked out users (users with active lockout)
var lockedOutUsers = await allUsers
    .Where(u => u.LockoutEnd.HasValue && u.LockoutEnd > currentTime)
    .CountAsync();
```

**After:**
```csharp
// Locked out users (users with active lockout and lockout enabled)
var lockedOutUsers = await allUsers
    .Where(u => u.LockoutEnabled && u.LockoutEnd.HasValue && u.LockoutEnd > currentTime)
    .CountAsync();
```

## Next Steps
1. Build and deploy the payez-core API
2. Test the user stats endpoint to verify it now correctly counts locked users
3. Check that the locked_out_users count reflects the database state

## Database Context
The SQL update that was applied earlier set:
- `LockoutEnabled = 1` for user ID 12
- `LockoutEnd = '2099-12-31 23:59:59.000'` for user ID 12

This user should now be counted in the locked out users statistics.
