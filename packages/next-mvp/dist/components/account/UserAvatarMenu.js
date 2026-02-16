"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvatarMenu = UserAvatarMenu;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("next-auth/react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
function UserAvatarMenu({ basePath = '', showProfile = true, showSettings = true, showSecurity = true, customItems, onSignOut, }) {
    const { data: session, status } = (0, react_2.useSession)();
    const router = (0, navigation_1.useRouter)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const menuRef = (0, react_1.useRef)(null);
    // Close menu when clicking outside
    (0, react_1.useEffect)(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);
    // Close menu on Escape
    (0, react_1.useEffect)(() => {
        function handleEscape(event) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen]);
    // Loading state
    if (status === 'loading') {
        return ((0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" }));
    }
    // Not authenticated
    if (!session?.user) {
        return null;
    }
    // Derive display initial from name or email — ignore anon/internal IDs
    const userName = session.user?.name;
    const userEmail = session.user.email;
    const displaySource = userName || userEmail;
    const userInitial = displaySource?.charAt(0).toUpperCase() || '?';
    const handleNavigation = (path) => {
        setIsOpen(false);
        router.push(path);
    };
    const handleSignOut = async () => {
        setIsOpen(false);
        if (onSignOut) {
            onSignOut();
        }
        else {
            // Use NEXT_PUBLIC env var or default to root
            const logoutUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || '/';
            await (0, react_2.signOut)({ callbackUrl: logoutUrl });
        }
    };
    const handleItemClick = (item) => {
        setIsOpen(false);
        if (item.onClick) {
            item.onClick();
        }
        else if (item.href) {
            router.push(item.href);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { ref: menuRef, className: "relative", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center justify-center h-10 w-10 rounded-full bg-[#349AD5] text-white font-semibold text-lg hover:bg-[#2980b9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#349AD5] focus:ring-offset-2 dark:focus:ring-offset-slate-900", "aria-label": "User menu", "aria-expanded": isOpen, "aria-haspopup": "true", children: userInitial }), isOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute right-0 mt-2 w-56 rounded-md shadow-lg z-50\r\n            bg-white dark:bg-slate-900\r\n            border border-gray-200 dark:border-slate-700", role: "menu", "aria-orientation": "vertical", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-4 py-3 border-b border-gray-200 dark:border-slate-700", children: [userName && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-700 dark:text-slate-200 truncate", children: userName })), userEmail && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 dark:text-slate-400 truncate", children: userEmail })), !userName && !userEmail && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 dark:text-slate-400", children: "Signed in" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "py-1", children: [showProfile && ((0, jsx_runtime_1.jsx)(MenuItem, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-4 w-4" }), label: "Profile", onClick: () => handleNavigation(`${basePath}/profile`) })), showSettings && ((0, jsx_runtime_1.jsx)(MenuItem, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "h-4 w-4" }), label: "Settings", onClick: () => handleNavigation(`${basePath}/settings`) })), showSecurity && ((0, jsx_runtime_1.jsx)(MenuItem, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Shield, { className: "h-4 w-4" }), label: "Security", onClick: () => handleNavigation(`${basePath}/security`) })), customItems?.map((item, index) => ((0, jsx_runtime_1.jsx)(MenuItem, { icon: item.icon, label: item.label, onClick: () => handleItemClick(item) }, index)))] }), (0, jsx_runtime_1.jsx)("div", { className: "border-t border-gray-200 dark:border-slate-700 py-1", children: (0, jsx_runtime_1.jsx)(MenuItem, { icon: (0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "h-4 w-4" }), label: "Sign Out", onClick: handleSignOut, variant: "danger" }) })] }))] }));
}
function MenuItem({ icon, label, onClick, variant = 'default' }) {
    const baseClasses = "flex items-center w-full px-4 py-2 text-sm cursor-pointer transition-colors";
    const variantClasses = variant === 'danger'
        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800"
        : "text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800";
    return ((0, jsx_runtime_1.jsxs)("button", { onClick: onClick, className: `${baseClasses} ${variantClasses}`, role: "menuitem", children: [icon && (0, jsx_runtime_1.jsx)("span", { className: "mr-3", children: icon }), (0, jsx_runtime_1.jsx)("span", { children: label })] }));
}
