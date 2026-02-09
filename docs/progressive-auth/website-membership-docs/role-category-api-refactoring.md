# Role Category Assignment API Refactoring

## Summary
Refactored the role category assignment API endpoints to use JSON body parameters instead of route parameters, and changed from string to int for role IDs throughout the backend stack.

## Date
2025-09-29

## Changes Made

### Backend (.NET - PayEz-Core)

#### 1. Repository Layer (`RoleCategoryRepository.cs`)
**Changed:**
- `AssignRoleToCategoryAsync(string roleId, ...)` → `AssignRoleToCategoryAsync(int roleId, ...)`
- `RemoveRoleFromCategoryAsync(string roleId)` → `RemoveRoleFromCategoryAsync(int roleId)`
- Removed all string parsing logic (e.g., `int.TryParse`)
- Changed `assignedBy` parameter from `string` to `int?`

**Why:** Database uses integer primary keys for roles. Using strings was unnecessary and added complexity with conversions.

#### 2. Service Layer (`IdentityExtensionsService.cs`)
**Changed:**
- `AssignGlobalRoleToCategoryAsync(string roleId, ...)` → `AssignGlobalRoleToCategoryAsync(int roleId, ...)`
- `RemoveGlobalRoleFromCategoryAsync(string roleId)` → `RemoveGlobalRoleFromCategoryAsync(int roleId)`
- `AssignClientRoleToCategoryAsync(..., string adminUserId)` → `AssignClientRoleToCategoryAsync(..., int? adminUserId)`
- Updated method signatures and logging

**Why:** Consistency with repository layer and actual database schema.

#### 3. Controller Layer (`AdminController.cs`)

**Old Route Signatures (REMOVED):**
```csharp
[HttpPut("roles/{id}/category")]
public async Task<IActionResult> SetRoleCategory(string id, [FromBody] SetRoleCategoryRequest request)
```

**New Route Signatures:**
```csharp
[HttpPut("roles/category")]
public async Task<IActionResult> SetRoleCategory([FromBody] AssignRoleToCategoryRequest request)

[HttpDelete("roles/category")]
public async Task<IActionResult> RemoveRoleCategory([FromBody] AssignRoleToCategoryRequest request)
```

**Request Body Structure:**
```json
{
  "role_id": 123,              // For global roles (mutually exclusive with client_role_id)
  "client_role_id": 456,        // For client-specific roles (mutually exclusive with role_id)
  "role_category_id": 10        // 0 or negative to clear category (only for PUT)
}
```

**Changes in Controller Logic:**
- Removed route parameter `{id}`
- Role ID is now in the request body
- Parse `role_id` from string to int when needed (e.g., from ASP.NET Identity which uses string IDs)
- Pass `int?` for admin user ID instead of `string`

### Frontend (website-membership)

#### 1. API Service (`rolesRedesignApi.ts`)
**Status:** ✅ Already correctly implemented

- `assignRoleToCategory()` - Uses `PUT /api/admin/roles/category` with JSON body
- `removeRoleFromCategory()` - Uses `DELETE /api/admin/roles/category` with JSON body
- Correctly sends either `role_id` (int) or `client_role_id` (int) in body

#### 2. Next.js API Routes (`/src/app/api/admin/roles/category/route.ts`)
**Status:** ✅ Already correctly implemented

- Proxies PUT and DELETE requests to IDP backend
- Forwards request body as-is
- No changes needed

#### 3. React Components
**Status:** ✅ No changes needed

- `page.tsx` in `roles/assignments/` already uses the hooks correctly
- `useCategoryAssignment` hook calls the API service methods
- Optimistic UI updates work as expected

## API Endpoint Comparison

### Before (Old):
```
PUT  /api/admin/roles/{roleId}/category
Body: { "categoryId": 10 }

DELETE /api/admin/roles/{roleId}/category
```

### After (New):
```
PUT  /api/admin/roles/category
Body: {
  "role_id": 123,              // OR
  "client_role_id": 456,
  "role_category_id": 10       // 0 to clear
}

DELETE /api/admin/roles/category
Body: {
  "role_id": 123,              // OR
  "client_role_id": 456
}
```

## Benefits

1. **Unified Endpoint**: Single endpoint handles both global and client-specific roles
2. **Type Safety**: Using `int` instead of `string` removes parsing errors and aligns with database schema
3. **Consistency**: All role category operations now use the same endpoint pattern
4. **Cleaner Code**: Removed redundant string/int conversions throughout the stack
5. **WAF Friendly**: No unbounded route parameters (role IDs are in request body)

## Testing

✅ Backend compiles successfully with 0 errors
✅ All type signatures match across layers (Repository → Service → Controller)
✅ Frontend already uses correct API format
✅ No breaking changes to existing frontend code

## Migration Notes

**For API Consumers:**
- If you have any direct API calls to the old `/api/admin/roles/{id}/category` endpoints, update them to use the new `/api/admin/roles/category` endpoint with the request body format shown above
- Change role ID from route parameter to body parameter
- Ensure role IDs are sent as integers, not strings

## Files Changed

### Backend (PayEz-Core)
- `PayEz.Repositories/RoleCategoryRepository.cs`
- `PayEz.Domain/Interfaces/IRoleCategoryRepository.cs`
- `PayEz.Services/PayEz.Identity.Application/Services/IdServices/IdentityExtensionsService.cs`
- `PayEz.Services/PayEz.Identity.Application/IIdentityExtensionsService.cs`
- `PayEz.Apis/PayEz.External.Id.Api/Controllers/AdminController.cs`

### Frontend (website-membership)
- No changes required (already compatible)

## Related Documentation
- See `roles-dashboard-redesign-dotnet.md` for overall dashboard architecture
- See `client-roles-fix-summary.md` for client role management details