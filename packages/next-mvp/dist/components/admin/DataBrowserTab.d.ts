export interface CollectionInfo {
    name: string;
    tableCount: number;
}
export interface TableInfo {
    name: string;
    count: number;
}
export interface DataBrowserTabProps {
    isDark?: boolean;
    /** Base API path for admin vibe data (default: /api/admin/vibe) */
    apiBasePath?: string;
    /** Collection to focus on (optional - shows all if not specified) */
    focusCollection?: string;
    /** Title for the data browser */
    title?: string;
}
export declare function DataBrowserTab({ isDark, apiBasePath, focusCollection, title, }: DataBrowserTabProps): import("react/jsx-runtime").JSX.Element;
export default DataBrowserTab;
