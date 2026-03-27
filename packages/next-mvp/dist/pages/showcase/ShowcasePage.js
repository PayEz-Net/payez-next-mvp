"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowcasePage = ShowcasePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const better_auth_client_1 = require("../../client/better-auth-client");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
// Shared dark mode hook to avoid duplication
function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark') ||
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(isDark);
        };
        checkDarkMode();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkDarkMode);
        return () => mediaQuery.removeEventListener('change', checkDarkMode);
    }, []);
    return isDarkMode;
}
function FeatureCard({ title, description, status, link, children }) {
    const isDarkMode = useDarkMode();
    const content = ((0, jsx_runtime_1.jsxs)("div", { className: `p-6 rounded-lg h-full ${isDarkMode
            ? 'bg-slate-900 border border-slate-700'
            : 'bg-white border border-gray-200'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between mb-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-semibold text-lg", children: title }), status === 'coming-soon' && ((0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'}`, children: "Coming Soon" }))] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`, children: description }), children] }));
    if (link && status === 'available') {
        return ((0, jsx_runtime_1.jsx)(link_1.default, { href: link, className: "block hover:opacity-90 transition-opacity", children: content }));
    }
    return content;
}
function DemoButton({ variant, children, onClick }) {
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };
    return ((0, jsx_runtime_1.jsx)("button", { onClick: onClick, className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]}`, children: children }));
}
/**
 * Feature Showcase Page
 *
 * Demonstrates MVP capabilities with interactive examples.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/showcase/page.tsx
 * export { ShowcasePage as default } from '@payez/next-mvp/pages/showcase';
 * ```
 */
function ShowcasePage() {
    const { data: sessionData, isPending } = better_auth_client_1.authClient.useSession();
    const session = sessionData;
    const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
    const isDarkMode = useDarkMode();
    const [toastVisible, setToastVisible] = (0, react_1.useState)(false);
    const [toastMessage, setToastMessage] = (0, react_1.useState)('');
    const [modalVisible, setModalVisible] = (0, react_1.useState)(false);
    const toastTimeoutRef = (0, react_1.useRef)(null);
    const modalRef = (0, react_1.useRef)(null);
    const previousFocusRef = (0, react_1.useRef)(null);
    // Type the extended session properly
    const extSession = session;
    // Toast with proper cleanup to prevent race conditions
    const showToast = (0, react_1.useCallback)((message) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToastMessage(message);
        setToastVisible(true);
        toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 3000);
    }, []);
    // Cleanup toast timeout on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);
    // Modal focus trap and keyboard handling
    (0, react_1.useEffect)(() => {
        if (!modalVisible)
            return;
        // Store previous focus
        previousFocusRef.current = document.activeElement;
        // Focus the modal
        modalRef.current?.focus();
        // Handle Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setModalVisible(false);
            }
            // Focus trap
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
                else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Restore focus when modal closes
            previousFocusRef.current?.focus();
        };
    }, [modalVisible]);
    // Get status text for screen readers
    const getStatusText = () => {
        if (status === 'authenticated')
            return 'Authenticated';
        if (status === 'loading')
            return 'Loading';
        return 'Not authenticated';
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "max-w-6xl mx-auto", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold mb-2", children: "MVP Feature Showcase" }), (0, jsx_runtime_1.jsx)("p", { className: `${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`, children: "Interactive demonstrations of @payez/next-mvp capabilities" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `mb-8 p-4 rounded-lg flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-3 h-3 rounded-full ${status === 'authenticated' ? 'bg-green-500' :
                                            status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'}`, "aria-hidden": "true" }), (0, jsx_runtime_1.jsx)("span", { className: "sr-only", children: getStatusText() }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: status === 'authenticated' ? `Logged in as ${session?.user?.email}` :
                                            status === 'loading' ? 'Loading session...' : 'Not authenticated' })] }), status === 'unauthenticated' && ((0, jsx_runtime_1.jsx)(link_1.default, { href: "/account-auth/login", className: "text-blue-500 hover:text-blue-600 text-sm font-medium", children: "Sign in to test authenticated features" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8", children: [(0, jsx_runtime_1.jsx)(FeatureCard, { title: "Authentication", description: "Complete auth flow with traditional login, OAuth providers, and password recovery.", status: "available", link: "/account-auth/login", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "Email/Password" }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "OAuth" }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "2FA" })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Role-Based Access Control", description: "Fine-grained permissions with roles and access control configuration.", status: "available", children: (0, jsx_runtime_1.jsx)("div", { className: `text-xs p-3 rounded font-mono ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: extSession?.user?.roles ?
                                        `Roles: ${extSession.user.roles.join(', ')}` :
                                        'Sign in to view roles' }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Toast Notifications", description: "Non-blocking notifications for user feedback and status updates.", status: "available", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)(DemoButton, { variant: "primary", onClick: () => showToast('Success! Action completed.'), children: "Success" }), (0, jsx_runtime_1.jsx)(DemoButton, { variant: "danger", onClick: () => showToast('Error! Something went wrong.'), children: "Error" })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Modal Dialogs", description: "Accessible modal dialogs for confirmations and focused interactions.", status: "available", children: (0, jsx_runtime_1.jsx)(DemoButton, { variant: "secondary", onClick: () => setModalVisible(true), children: "Open Modal" }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Form Validation", description: "Client and server-side validation with real-time feedback and error handling.", status: "available", link: "/account-auth/recovery", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "Real-time" }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "Password Rules" })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Session Management", description: "JWT-based sessions with automatic refresh and secure token handling.", status: "available", link: "/test-env", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Access Token:" }), (0, jsx_runtime_1.jsx)("span", { className: extSession?.accessToken ? 'text-green-500' : 'text-red-500', children: extSession?.accessToken ? 'Valid' : 'None' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { children: "Refresh Token:" }), (0, jsx_runtime_1.jsx)("span", { className: extSession?.refreshToken ? 'text-green-500' : 'text-red-500', children: extSession?.refreshToken ? 'Valid' : 'None' })] })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "User Profile", description: "Profile management with avatar, display name, and account settings.", status: "available", link: "/profile", children: (0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-3 p-2 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium", children: session?.user?.email?.charAt(0).toUpperCase() || '?' }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm truncate", children: session?.user?.email || 'Not signed in' })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Security Settings", description: "Password management, 2FA configuration, and active session control.", status: "available", link: "/security", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "Change Password" }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "2FA Setup" })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Theme Support", description: "Light and dark mode with system preference detection and manual toggle.", status: "available", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-3", children: (0, jsx_runtime_1.jsxs)("div", { className: `px-3 py-2 rounded text-sm ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: ["Current: ", isDarkMode ? 'Dark' : 'Light'] }) }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Admin Panel", description: "Built-in admin interface for user management, roles, and system configuration.", status: "coming-soon", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "User Management" }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "Schema Browser" })] }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "Data Tables", description: "Sortable, filterable, paginated tables with column customization.", status: "coming-soon", children: (0, jsx_runtime_1.jsx)("div", { className: `text-xs p-3 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "Sort, filter, paginate, export" }) }), (0, jsx_runtime_1.jsx)(FeatureCard, { title: "API Client", description: "Type-safe API client with automatic auth headers and error handling.", status: "available", children: (0, jsx_runtime_1.jsx)("div", { className: `text-xs p-3 rounded font-mono ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`, children: "fetchWithSession(url, options)" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-6 rounded-lg ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border'}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-semibold text-lg mb-4", children: "Quick Links" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-3", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/test-env", className: `px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`, children: "Debug Tools" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/test-env/jwt-inspect", className: `px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`, children: "JWT Inspector" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/account-auth/login", className: `px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`, children: "Login Page" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/profile", className: `px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`, children: "Profile" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/security", className: `px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`, children: "Security Settings" })] })] })] }), toastVisible && ((0, jsx_runtime_1.jsx)("div", { role: "alert", "aria-live": "polite", className: `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-opacity ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-900 text-white'}`, children: toastMessage })), modalVisible && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50", onClick: (e) => {
                    if (e.target === e.currentTarget)
                        setModalVisible(false);
                }, children: (0, jsx_runtime_1.jsxs)("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", tabIndex: -1, className: `max-w-md w-full p-6 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`, children: [(0, jsx_runtime_1.jsx)("h3", { id: "modal-title", className: "text-xl font-semibold mb-4", children: "Example Modal" }), (0, jsx_runtime_1.jsx)("p", { className: `mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`, children: "This is a demonstration of an accessible modal dialog. Press Escape to close, or use Tab to navigate between buttons." }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-3", children: [(0, jsx_runtime_1.jsx)(DemoButton, { variant: "secondary", onClick: () => setModalVisible(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)(DemoButton, { variant: "primary", onClick: () => {
                                        setModalVisible(false);
                                        showToast('Action confirmed!');
                                    }, children: "Confirm" })] })] }) }))] }));
}
exports.default = ShowcasePage;
