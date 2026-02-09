/**
 * Roles Admin Page for @payez/next-mvp
 *
 * Read-only admin interface for viewing roles and permissions (/admin/roles).
 * MVP scope: View IDP roles and their page permissions only.
 * Role creation/editing deferred to post-MVP.
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
interface RolesAdminPageProps {
    rolesEndpoint?: string;
    matrixEndpoint?: string;
}
export default function RolesAdminPage({ rolesEndpoint, matrixEndpoint, }: RolesAdminPageProps): import("react/jsx-runtime").JSX.Element;
export {};
