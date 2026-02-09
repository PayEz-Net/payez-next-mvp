Specification: IDP Admin – Roles Management (reimagined)



Purpose and audience

•  Audience: IDP administrators and support staff managing roles, role categories, and role assignments (global and client-scoped).

•  Goals:

◦  Make role discovery and categorization obvious.

◦  Center workflows on assignments and management (not vanity cards).

◦  Reduce cognitive load with clear filters, consistent focus, and predictable row actions.



Information architecture

•  Single page with:

◦  Left sidebar: Role categories and quick filters.

◦  Header toolbar: Search and filter chips (scope, client, category).

◦  Main content: Roles table (default), with optional details drawer.

◦  Right-side drawer (on demand): Role details and management (assignments, permissions).

•  No summary cards at the top. Replace with compact, persistent filter chips and an unobtrusive stats pill if needed.



Layout and responsive behavior

•  Desktop (≥1280px)

◦  Sidebar left (fixed 280px): Categories list and filters.

◦  Content header: Search input full width; chips below it on wrap; clear all action.

◦  Table: Paginated, sticky header. Min 800px width for columns; horizontal scroll allowed for narrow screens.

◦  Drawer: Right-side 560px width overlay for role details; pushes content subtly.

•  Tablet (768–1279px)

◦  Sidebar collapses to a “Filters” button opening a left drawer.

◦  Table density switched to compact.

•  Mobile (<768px)

◦  List view (card rows) replacing table; essential fields only.

◦  Filters in a modal; details open as full-screen sheet.



Data sources and invariants (system-of-record)

•  Primary dataset: GET api/admin/roles

◦  Includes role identity (RoleKey, RoleId), type (global or client-specific), client context, category info, and assignment metadata from roles\_with\_categories\_and\_clients view.

•  Secondary datasets:

◦  Categories: GET api/admin/role-categories (and related CRUD/hierarchy endpoints).

◦  Role assignments: GET api/admin/roles/{id}/assignments (users in role).

◦  Role claims (global roles): GET/POST/DELETE api/admin/roles/{id}/claims\[…].

◦  Client role permissions: client-specific endpoints under api/admin/clients/{client\_id}/roles/{role\_id}/permissions\[…].

◦  Category assignment: PUT api/admin/roles/{id} with category name or “uncategorized”.



URL and state model

•  Query parameters

◦  q: free-text search across name, normalized name, category name, client name.

◦  scope: global | client\_specific

◦  client\_id: integer ID for client filter

◦  category\_slug: category selection

◦  sort: name\_asc (default) | name\_desc | category | client | type

◦  page: 1-based index; size: page size (default 25)

•  State persistence

◦  All filters mirrored to URL; refresh-safe.

◦  Sidebar selection syncs with query params.

◦  Chips reflect active filters; clearable individually and “Clear all”.



Left sidebar: Categories and filters

•  Categories

◦  Title: “Categories”

◦  List ordered by display\_order then name.

◦  Each item shows icon and name; optional count badge (roles in category).

◦  First item: “All roles”; second: “Uncategorized”.

◦  Hierarchy: If present, collapse/expand within list; child items indented.

•  Filters

◦  Scope: two check options (radio or segmented) – Global, Client-specific. Defaults to All (unset); or explicitly include a third “All” toggle.

◦  Client: single-select dropdown or searchable combobox (disabled unless scope=client\_specific).

◦  Actions: Clear filters resets scope/client selections.



Header toolbar

•  Search (left aligned): Placeholder “Search roles by name, client, or category”.

•  Filter chips (right aligned; wrap to next line)

◦  Scope chip: Global or Client-specific.

◦  Client chip: “Client: {name}”.

◦  Category chip: “Category: {name}”.

◦  Clear all link appears only when any filter is active.



Roles table (default view)

•  Columns (left to right)

◦  Role: Name (primary text); below it small muted: RoleKey; to the right a small badge for RoleType (Global or Client).

◦  Category: Category name with icon; muted “Uncategorized” state; color dot using category color.

◦  Client: ClientDisplayName (if client-specific); dash for global.

◦  Assignments: User count (if available) or placeholder “—”; click opens details to Assignments tab.

◦  Last updated: From AssignedAt if present; else “—”; tooltip with ISO timestamp.

◦  Actions: Inline icons with labels on hover

▪  Assign category

▪  Manage claims/permissions

▪  View details

•  Sorting

◦  Default sort by Role name asc.

◦  Sortable columns: Role, Category, Client, Last updated.

•  Selection and bulk actions (optional, if needed)

◦  Checkbox per row; header checkbox selects page.

◦  Bulk actions: Assign category; Remove from category (disabled if selection mixed with uncategorized).



Role details drawer (right-side)

•  Header

◦  Role name; badge with RoleType; optional copy icon for RoleId.

◦  Small metadata: RoleKey, NormalizedName.

•  Tabs

&nbsp; 1) Overview

•  Category: name + icon (editable with a “Change” button that opens category picker).

•  Scope \& client: displays role type; if client-specific, show client display name.

•  Description: placeholder or linked to future metadata.

•  Quick links: “Open assignments”, “Manage claims/permissions”.

&nbsp; 2) Assignments

•  Users in role: list with avatar, username, email; search and filter by client (if applicable).

•  Remove user from role (if client-specific and endpoint exists); otherwise show read-only.

•  Empty state guidance when no assignments.

&nbsp; 3) Permissions

•  If RoleType=global: list of claims; add/remove via claims endpoints.

•  If client-specific: list of client permissions mapped to this role; add/remove via client role permission endpoints.

•  Group permissions by category; include quick filter.

&nbsp; 4) Activity (optional future)

•  Usage stats: users count, assignment trends (requires additional data).



Category assignment UX

•  Entry points

◦  Row action “Assign category”.

◦  Overview tab “Change” next to Category.

•  Interaction

◦  Opens a compact picker with:

▪  Search box for categories.

▪  List grouped by parent/child if hierarchy present.

▪  “Uncategorized” option at top.

◦  Confirmation applies immediately:

▪  If pick a category: call AssignRoleToCategory via PUT roles/{id} with category name.

▪  If pick “Uncategorized”: call RemoveRoleFromCategory via service method.

◦  On success:

▪  Update table cell optimistically; show toast “Role moved to {Category}”.

▪  Retain focus on the edited role.



Filtering and search behavior

•  Search matches role name, normalized name, category name, client name; debounce 300ms before fetch.

•  Scope filter:

◦  Global shows only global roles.

◦  Client-specific shows only client roles; client picker becomes enabled.

•  Category filter:

◦  Clicking a category in sidebar sets category\_slug and filters list.

•  Chip interactions:

◦  Clicking chip opens inline picker for quick change.

◦  “Clear all” removes q, scope, client\_id, category\_slug.



Empty, loading, error states

•  Initial load: skeleton rows (5–10).

•  No results: “No roles match your filters” with a subline showing active filters and a “Clear all” action.

•  Error: Inline error banner with retry.

•  Sidebar categories empty: Show “No categories yet” with link “Create category” (if permitted).



Permissions and guardrails

•  Only admins with the appropriate role can manage categories and claims.

•  Disable actions based on permissions; show tooltip “Insufficient permissions”.

•  Confirm dialogs:

◦  Removing a claim/permission.

◦  Removing a role from a category (optional).



Performance and UX polish

•  Pagination: page size 25 (configurable); preserve across sessions.

•  Client filter options loaded on demand; cached in memory.

•  Optimistic UI for category assignment and claims add/remove with rollback if API fails.

•  Keyboard accessibility:

◦  Search focuses on “/”.

◦  Tab traversal keeps focus inside drawers until dismissed.

•  Announce changes via ARIA live regions (filter applied, assignment added).



Microcopy and labels

•  Page title: “Roles”

•  Sidebar title: “Categories”

•  Search placeholder: “Search roles by name, client, or category”

•  Column headers: Role, Category, Client, Assignments, Last updated, Actions

•  Empty list: “No roles match your filters”

•  Success toasts:

◦  “Role moved to {Category}”

◦  “Claim added to role”

◦  “Claim removed from role”

•  Error toasts are actionable: “Couldn’t update category. Retry”



Non-functional requirements

•  Don’t show summary cards at top; favor chips and inline indicators.

•  All visible state is reflectable in the URL.

•  Visual emphasis order: Role name > Scope badge > Category > Client.

•  Color usage from category.Color and icon from category.Icon; ensure sufficient contrast.

•  Auditability: log category changes and claims modifications (server events).



API mapping (for implementation planning)

•  Load roles: GET api/admin/roles

•  Load role details (if needed): GET api/admin/roles/{id}

•  Load users in role: GET api/admin/roles/{id}/assignments

•  Manage claims (global): GET/POST/DELETE api/admin/roles/{id}/claims\[…]

•  Manage client permissions (client-specific): POST/DELETE api/admin/clients/{client\_id}/roles/{role\_id}/permissions\[…]

•  Categories:

◦  List: GET api/admin/role-categories (and /active, /hierarchy)

◦  Create/Update/Delete: POST/PUT/DELETE api/admin/role-categories\[…]

◦  Validate: GET api/admin/role-categories/validate/name/{name}, …/slug/{slug}

◦  Assign role to category: PUT api/admin/roles/{id} with “category” or “uncategorized”



Open questions to resolve before high-fidelity

•  Should client-specific roles be categorizable in the same way as global roles? Confirm schema supports it end-to-end (assignment currently references Identity roles).

•  Do we need first-class Role description? If yes, where is it stored (new table vs extended ApplicationRole)?

•  Should we surface usage counts in the main table (users per role)? If so, define performant aggregation strategy.

•  Bulk operations required for category assignment?

•  Any WAF constraints on route params affecting these endpoints or should all be payload-based?



Acceptance criteria (UX)

•  From a cold start, an admin can:

◦  Filter to a category and scope in two clicks and find a role in <5 seconds.

◦  Reassign a role to a category without leaving the list, with confirmation feedback.

◦  Open a role’s details and add/remove a claim (global) or permission (client) within one drawer, with visible success state.

◦  Linkable URLs reproduce the exact view state.



Visual style notes

•  Density: comfortable by default; compact available on smaller breakpoints.

•  Icons: use category.Icon for category column; standard shield/user icons for role/assignments.

•  Badges: RoleType (Global / Client) as small rounded badge next to role name.

•  Colors: category.Color used as a small dot; do not color the entire cell.



This spec is designed to be prompt-ready for wireframing: it defines layout, components, interactions, API boundaries, states, and success criteria without prescribing visuals beyond functional cues.

