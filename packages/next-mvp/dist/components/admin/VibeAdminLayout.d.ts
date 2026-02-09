import { ReactNode } from 'react';
interface VibeAdminLayoutProps {
    children?: ReactNode;
    activeTabId?: string;
    onTabChange?: (tabId: string) => void;
    headerContent?: ReactNode;
    isDarkMode?: boolean;
    adminRole?: string;
}
export declare function VibeAdminLayout({ children, activeTabId, onTabChange, headerContent, isDarkMode: isDarkModeProp, adminRole, }: VibeAdminLayoutProps): import("react/jsx-runtime").JSX.Element | null;
export default VibeAdminLayout;
