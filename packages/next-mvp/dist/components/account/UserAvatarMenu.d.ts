export interface UserAvatarMenuProps {
    /** Base path for navigation (e.g., '/dashboard', '/account') */
    basePath?: string;
    /** Show Profile menu item (default: true) */
    showProfile?: boolean;
    /** Show Settings menu item (default: true) */
    showSettings?: boolean;
    /** Show Security menu item (default: true) */
    showSecurity?: boolean;
    /** Custom menu items to add before the sign out divider */
    customItems?: Array<{
        label: string;
        icon?: React.ReactNode;
        href?: string;
        onClick?: () => void;
    }>;
    /** Override default signOut behavior */
    onSignOut?: () => void;
}
export declare function UserAvatarMenu({ basePath, showProfile, showSettings, showSecurity, customItems, onSignOut, }: UserAvatarMenuProps): import("react/jsx-runtime").JSX.Element | null;
