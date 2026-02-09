/**
 * My Roles Page for @payez/next-mvp
 *
 * User view of their assigned roles (/account/roles).
 * Shows roles from both IDP and app sources with expandable permissions.
 * Read-only - users cannot self-assign roles.
 *
 * @see docs/specs/ROLES_MANAGEMENT_SPEC.md
 */
import { Role } from './components';
interface MyRolesResponse {
    summary: {
        total_roles: number;
        sources: string[];
    };
    idp_roles: Role[];
    app_roles: Role[];
}
interface MyRolesPageProps {
    initialData?: MyRolesResponse;
    rolesEndpoint?: string;
}
export default function MyRolesPage({ initialData, rolesEndpoint, }: MyRolesPageProps): import("react/jsx-runtime").JSX.Element;
export {};
