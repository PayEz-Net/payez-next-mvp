Summary of the service layer relevant to retooling the Roles page



Primary service facade

•  IIdentityExtensionsService (PayEz.Services/PayEz.Identity.Application)

?  Roles with categories and client scope

?  GetAllRolesWithCategoriesAsync() -> List<RoleWithCategoryDto>

?  Unified list from DB view roles\_with\_categories\_and\_clients including: RoleKey, RoleId, RoleType (global or client-specific), ClientId/Name, Category info, assignment metadata.

?  Role category management

?  GetAllRoleCategoriesAsync(), GetActiveRoleCategoriesAsync(), GetRootCategoriesAsync(), GetChildCategoriesAsync(parentId), GetCategoriesWithHierarchyAsync()

?  GetRoleCategoryByIdAsync(id), GetRoleCategoryByNameAsync(name), GetRoleCategoryBySlugAsync(slug)

?  CreateRoleCategoryAsync(dto), UpdateRoleCategoryAsync(dto), DeleteRoleCategoryAsync(id)

?  UpdateCategoryDisplayOrderAsync(id, newOrder)

?  IsCategoryNameUniqueAsync(name, excludeId?), IsCategorySlugUniqueAsync(slug, excludeId?)

?  GetCategoryStatisticsAsync()

?  GetRoleCategoryAssignmentsAsync()

?  AssignRoleToCategoryAsync(roleId, categoryId, adminUserId)

?  RemoveRoleFromCategoryAsync(roleId)

?  Client roles, permissions and user-role assignments (client-scope)

?  GetClientRolesAsync(clientId), CreateClientRoleAsync(model), UpdateClientRoleAsync(clientId, model), DeleteClientRoleAsync(clientId, roleId)

?  GetClientPermissionsAsync(clientId), GetClientPermissionAsync(clientId, permissionId), CreateClientPermissionAsync(model), UpdateClientPermissionAsync(clientId, model), DeleteClientPermissionAsync(clientId, permissionId)

?  AssignPermissionToRoleAsync(model), RemovePermissionFromRoleAsync(clientId, roleId, permissionId)

?  AssignClientRoleToUserAsync(model), RemoveClientRoleFromUserAsync(userId, clientId, roleId)

?  Web page role assignment and route authorization (site-level RBAC)

?  AssignRoleToPageAsync, RemoveRoleFromPageAsync

?  GetAllWebPagePermissionsAsync(), GetWebPagePermissionByIdAsync(id)

?  CanUserAccessRouteAsync(userId, routePattern) (placeholder now)



Key repositories and data sources

•  IdentityExtensionsRepository (PayEz.Services/PayEz.Infrastructure/Repositories/Identity)

?  GetAllRolesWithCategoriesAsync():

?  SELECTs from IdentityExtensionsContext.RolesWithCategories (DbSet<RoleWithCategory> mapping the view roles\_with\_categories\_and\_clients)

?  Maps to RoleWithCategoryResult, then service converts to RoleWithCategoryDto

?  Client roles/permissions and client user-role assignment methods (IDPClientRole\*, IDPClientPermission\*, UserClientRole)

?  Web page permission + role assignment methods

•  RoleCategoryRepository (PayEz.Services/PayEz.Infrastructure/Repositories/Common)

?  Backed by CommonContext, handles RoleCategory CRUD/hierarchy/validation

?  AssignRoleToCategoryAsync(roleId:string, roleCategoryId:int, assignedBy?):

?  Parses roleId to int; upserts RoleCategoryAssignment for RoleId; one role -> one category

?  RemoveRoleFromCategoryAsync(roleId)

?  GetAllAssignmentsAsync()



DTOs and converters

•  RoleWithCategoryDto

?  Includes role identity (RoleKey, RoleId, RoleType), client context, category info, and placeholders for usage stats

•  RoleWithCategoryConverter

?  Converts RoleWithCategoryResult -> RoleWithCategoryDto

?  UsageStats values are currently zeroed (TODO markers)

•  RoleCategoryDto and RoleCategoryConverter

?  Generated converter mapping between RoleCategory entity and DTO (with hierarchy)



API surface you can build the UI against (AdminController)

•  Roles

?  GET api/admin/roles -> GetAllRolesWithCategoriesAsync()

?  GET api/admin/roles/for-client/{client\_id} -> Filters above, marks is\_assigned\_to\_client (global treated as available to all)

?  POST api/admin/roles -> CreateRole (RoleManager)

?  GET api/admin/roles/{id} -> Role details + claims + users (RoleManager/UserManager)

?  PUT api/admin/roles/{id} -> UpdateRole (and supports category assignment via name; “uncategorized” clears assignment)

?  DELETE api/admin/roles/{id} -> DeleteRole (guarded by user assignments)

?  GET api/admin/roles/{id}/assignments -> Users in role

?  GET api/admin/roles/stats -> Aggregated usage stats (basic, TODO to enhance)

?  Claims: GET api/admin/claims (static list for now)

?  POST api/admin/roles/{id}/claims -> AddClaimsToRole

?  DELETE api/admin/roles/{id}/claims/{claimId} -> RemoveClaimFromRole

•  Role categories

?  GET api/admin/role-categories, .../active, .../hierarchy, .../root, .../system, .../user-created, .../stats

?  GET api/admin/role-categories/{id}, .../name/{name}, .../slug/{slug}, .../{parentId}/children

?  POST api/admin/role-categories -> Create

?  PUT api/admin/role-categories/{id} -> Update

?  DELETE api/admin/role-categories/{id} -> Delete (with CanDelete check)

?  PUT api/admin/role-categories/{id}/display-order -> Update display order

?  GET api/admin/role-categories/validate/name/{name} and .../validate/slug/{slug}

?  Note: Assign/unassign role to category is done via PUT api/admin/roles/{id} by setting “category” (name) or “uncategorized” (it calls AssignRoleToCategoryAsync/RemoveRoleFromCategoryAsync).

•  Client roles and permissions

?  GET/POST/PUT/DELETE api/admin/clients/{client\_id}/roles\[/...]

?  GET/POST/PUT/DELETE api/admin/clients/{client\_id}/permissions\[/...]

?  POST/DELETE api/admin/clients/{client\_id}/roles/{role\_id}/permissions\[/...]



What’s ready vs. gaps for the redesigned Roles page



Ready

•  Single-source list of roles with categories and client scope via GET api/admin/roles (from DB view). Ideal for a table-first UI with filters for:

?  scope (global vs client-specific), client, category (by slug/name), search by name.

•  Full category CRUD and hierarchy endpoints. Good for building a category sidebar, chips, and editors.

•  Simple category assignment model (one role -> one category). Exposed via UpdateRole with category name; or could be a small specialized endpoint later if desired.

•  Claims management endpoints for global roles.

•  Client-side role/permission endpoints, if you bring client scope into the page.



Gaps or cautions

•  Usage stats in RoleWithCategoryDto are placeholders (0s). Controller’s stats endpoint calculates some counts ad hoc by querying users in role. If we want “don’t make me think” insights per row (user count, client count) in the main list, we may:

?  Enhance the view or add service methods to compute counts efficiently (possibly materialized view or aggregate query), or

?  Lazy-load counts per role (batch per page) to keep the main query fast.

•  Category assignment appears implemented for ASP.NET Identity roles (ApplicationRole) via RoleCategoryAssignment(RoleId -> asp\_net\_roles.id). It’s unclear whether client-specific roles can be categorized; the view includes category columns for “both”, but the assignment storage class references AspNetRole IDs only. If categorizing client-specific roles is a requirement, we’ll need to validate current schema or extend it.

•  Role descriptions are not first-class for ApplicationRole. AdminController uses blank description in role detail. If the UX needs descriptions, we’ll need to add metadata (e.g., a RoleProfile table or extend ApplicationRole).

•  Permissions for global roles (RolePermission) exist in Domain, but admin endpoints for global role-permission assignment are not present. Only client role permissions (IDPClientRolePermission) have endpoints. If we need “global permissions” on this page, we’ll need endpoints.



How this informs the new page design

•  Data source: use GET api/admin/roles as the primary source of truth. Layer in clientId and category filters in the UI; use role-categories endpoints to populate sidebar/chips.

•  Category management: use the dedicated role-categories endpoints for CRUD/hierarchy. For role assignment, call PUT api/admin/roles/{id} with “category” set to the category name or “uncategorized”.

•  Claims and permissions:

?  Global: use claims endpoints per role.

?  Client-specific: if you surface client roles here, use client role permission endpoints.

•  For “assignments” UX: show users in role on demand via GET api/admin/roles/{id}/assignments and consider the stat endpoint for summaries.



If you’re good with this, I’ll propose wireframes next:

•  Left: Category list (ordered, counts), scope and client filter chips.

•  Top: Search + compact filter chips (replace space-hogging cards).

•  Main: Roles table with key columns and inline actions (assign category, manage claims/permissions, view assignments).

•  Details drawer or modal for role details/assignments.

