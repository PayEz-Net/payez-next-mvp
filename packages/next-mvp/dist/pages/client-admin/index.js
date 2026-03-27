"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.ClientSiteAdminPage = void 0;
var ClientSiteAdminPage_1 = require("./ClientSiteAdminPage");
Object.defineProperty(exports, "ClientSiteAdminPage", { enumerable: true, get: function () { return ClientSiteAdminPage_1.ClientSiteAdminPage; } });
var ClientSiteAdminPage_2 = require("./ClientSiteAdminPage");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return ClientSiteAdminPage_2.ClientSiteAdminPage; } });
