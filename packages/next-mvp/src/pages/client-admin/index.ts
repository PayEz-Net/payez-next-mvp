/**
 * Client Site Admin - Your App's Admin Dashboard
 *
 * The nest for your app-specific admin features.
 * MVP Admin handles users/sessions/tiers - this handles YOUR data.
 *
 * Usage:
 * ```tsx
 * // app/admin/my-area/page.tsx
 * import { ClientSiteAdminPage } from '@payez/next-mvp/pages/client-admin';
 *
 * export default function MyAdminPage() {
 *   return (
 *     <ClientSiteAdminPage
 *       title="My Admin"
 *       collectionName="my_collection"
 *       tabs={[
 *         { id: 'overview', label: 'Overview', icon: '📊' },
 *         { id: 'items', label: 'Items', icon: '📦', table: 'items' },
 *       ]}
 *     />
 *   );
 * }
 *
 * // app/admin/my-area/layout.tsx (IMPORTANT - prevents MVP admin chrome)
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return <>{children}</>;
 * }
 * ```
 */

export { ClientSiteAdminPage, type ClientSiteAdminProps, type ClientAdminTab, type TableStats } from './ClientSiteAdminPage';
export { ClientSiteAdminPage as default } from './ClientSiteAdminPage';
