"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileNavDrawer = MobileNavDrawer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const better_auth_client_1 = require("../../client/better-auth-client");
const navigation_1 = require("next/navigation");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
function MobileNavDrawer({ isOpen, onClose, navItems, customSections, basePath = '/account', onSignIn, signInCallbackUrl = '/dashboard', unauthActions, authFooter, }) {
    const { data: session } = better_auth_client_1.authClient.useSession();
    const pathname = (0, navigation_1.usePathname)();
    const isAuthenticated = !!session?.user;
    const isActiveRoute = (0, react_1.useCallback)((href) => pathname?.startsWith(href) ?? false, [pathname]);
    // Close on Escape key
    (0, react_1.useEffect)(() => {
        function handleEscape(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);
    // Lock body scroll when open
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);
    const handleSignIn = () => {
        onClose();
        if (onSignIn) {
            onSignIn();
        }
        else {
            better_auth_client_1.authClient.signIn.social({ provider: 'google', callbackURL: signInCallbackUrl });
        }
    };
    const handleSectionItemClick = (item) => {
        onClose();
        if (item.onClick) {
            item.onClick();
        }
    };
    // Derive display initial from name or email
    const userName = session?.user?.name;
    const userEmail = session?.user?.email;
    const displaySource = userName || userEmail;
    const userInitial = displaySource?.charAt(0).toUpperCase() || '?';
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: `
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `, onClick: onClose, "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("div", { role: "dialog", "aria-modal": "true", "aria-label": "Navigation menu", "aria-expanded": isOpen, className: `
          fixed top-0 right-0 bottom-0 w-80 max-w-[85vw]
          bg-white dark:bg-slate-900
          shadow-[-8px_0_32px_rgba(0,0,0,0.15)]
          dark:shadow-[-8px_0_32px_rgba(0,0,0,0.4)]
          z-50 lg:hidden
          overflow-y-auto
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Menu" }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "\r\n              p-2 rounded-xl\r\n              text-gray-400 hover:text-gray-900\r\n              dark:hover:text-white\r\n              hover:bg-gray-100 dark:hover:bg-white/10\r\n              transition-colors\r\n            ", "aria-label": "Close menu", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-5 w-5" }) })] }), isAuthenticated && session?.user && ((0, jsx_runtime_1.jsx)("div", { className: "p-4 border-b border-gray-200 dark:border-white/10", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [session.user.image ? ((0, jsx_runtime_1.jsx)(image_1.default, { src: session.user.image, alt: "", width: 48, height: 48, className: "w-12 h-12 rounded-full", unoptimized: true })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg", children: userInitial })), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [userName && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: userName })), userEmail && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 dark:text-slate-400 truncate", children: userEmail }))] })] }) })), (0, jsx_runtime_1.jsx)("div", { className: "p-2", children: navItems.map((item) => ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, onClick: onClose, className: `
                flex items-center gap-3 px-4 py-3.5 rounded-xl
                transition-colors duration-200
                ${isActiveRoute(item.href)
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'}
              `, children: [item.icon && (0, jsx_runtime_1.jsx)("span", { className: "text-xl", children: item.icon }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: item.label }), isActiveRoute(item.href) && ((0, jsx_runtime_1.jsx)("span", { className: "ml-auto w-2 h-2 rounded-full bg-blue-500" }))] }, item.href))) }), customSections?.map((section, sectionIndex) => ((0, jsx_runtime_1.jsxs)("div", { className: "p-2 border-t border-gray-200 dark:border-white/10", children: [section.title && ((0, jsx_runtime_1.jsx)("p", { className: "px-4 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider", children: section.title })), section.items.map((item, itemIndex) => item.href ? ((0, jsx_runtime_1.jsxs)(link_1.default, { href: item.href, onClick: onClose, className: "\r\n                    flex items-center gap-3 px-4 py-3 rounded-xl\r\n                    text-gray-900 dark:text-white\r\n                    hover:bg-gray-100 dark:hover:bg-white/10\r\n                    transition-colors\r\n                  ", children: [item.icon && (0, jsx_runtime_1.jsx)("span", { className: "text-xl", children: item.icon }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: item.label })] }, itemIndex)) : ((0, jsx_runtime_1.jsxs)("button", { onClick: () => handleSectionItemClick(item), className: "\r\n                    flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left\r\n                    text-gray-900 dark:text-white\r\n                    hover:bg-gray-100 dark:hover:bg-white/10\r\n                    transition-colors\r\n                  ", children: [item.icon && (0, jsx_runtime_1.jsx)("span", { className: "text-xl", children: item.icon }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: item.label })] }, itemIndex)))] }, sectionIndex))), (0, jsx_runtime_1.jsx)("div", { className: "p-4 mt-auto border-t border-gray-200 dark:border-white/10", children: !isAuthenticated ? (unauthActions ?? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: (0, jsx_runtime_1.jsx)("button", { onClick: handleSignIn, className: "\r\n                    w-full px-4 py-3 rounded-xl\r\n                    text-blue-500 font-semibold\r\n                    border border-blue-500/30\r\n                    hover:bg-blue-500/10\r\n                    transition-colors\r\n                  ", children: "Login" }) }))) : (authFooter ?? ((0, jsx_runtime_1.jsx)(link_1.default, { href: basePath, onClick: onClose, className: "\r\n                  flex items-center justify-center gap-2\r\n                  w-full px-4 py-3 rounded-xl\r\n                  text-gray-500 dark:text-slate-400 font-medium\r\n                  hover:bg-gray-100 dark:hover:bg-white/10\r\n                  transition-colors\r\n                ", children: "Account Settings" }))) })] })] }));
}
