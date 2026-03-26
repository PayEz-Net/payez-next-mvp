export interface NavItem {
    href: string;
    label: string;
    icon?: React.ReactNode;
}
export interface NavSection {
    title?: string;
    items: Array<{
        label: string;
        icon?: React.ReactNode;
        href?: string;
        onClick?: () => void;
    }>;
}
export interface MobileNavDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    navItems: NavItem[];
    /** Extra sections like Admin, rendered after nav items with optional title */
    customSections?: NavSection[];
    /** Base path for account link (default: '/account') */
    basePath?: string;
    /** Custom sign-in handler (default: next-auth signIn) */
    onSignIn?: () => void;
    /** Callback URL after sign in (default: '/dashboard') */
    signInCallbackUrl?: string;
    /** Custom unauthenticated actions (replaces default Login + Start Free buttons) */
    unauthActions?: React.ReactNode;
    /** Custom authenticated footer (replaces default "Account Settings" link) */
    authFooter?: React.ReactNode;
}
export declare function MobileNavDrawer({ isOpen, onClose, navItems, customSections, basePath, onSignIn, signInCallbackUrl, unauthActions, authFooter, }: MobileNavDrawerProps): import("react/jsx-runtime").JSX.Element;
