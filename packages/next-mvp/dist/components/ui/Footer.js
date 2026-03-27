"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * A themeable footer component with dynamic copyright year.
 *
 * @example
 * ```tsx
 * // Minimal footer
 * <Footer />
 *
 * // With company name and start year
 * <Footer companyName="Acme Inc" startYear={2020} />
 *
 * // With links
 * <Footer
 *   links={[
 *     { label: 'Privacy', href: '/privacy' },
 *     { label: 'Terms', href: '/terms' }
 *   ]}
 * />
 * ```
 */
function Footer({ companyName = 'PayEz', startYear, links = [], className = '', variant = 'minimal' }) {
    const currentYear = new Date().getFullYear();
    const yearDisplay = startYear && startYear < currentYear
        ? `${startYear}-${currentYear}`
        : `${currentYear}`;
    const baseStyles = 'w-full py-4 text-sm';
    const variantStyles = {
        minimal: 'text-center text-gray-500 dark:text-gray-400',
        standard: 'border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
    };
    if (variant === 'minimal') {
        return ((0, jsx_runtime_1.jsx)("footer", { className: `${baseStyles} ${variantStyles[variant]} ${className}`, children: (0, jsx_runtime_1.jsxs)("p", { children: ["\u00A9 ", yearDisplay, " ", companyName, ". All rights reserved."] }) }));
    }
    return ((0, jsx_runtime_1.jsx)("footer", { className: `${baseStyles} ${variantStyles[variant]} ${className}`, children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("p", { children: ["\u00A9 ", yearDisplay, " ", companyName, ". All rights reserved."] }), links.length > 0 && ((0, jsx_runtime_1.jsx)("nav", { className: "flex gap-4", "aria-label": "Footer links", children: links.map((link, index) => ((0, jsx_runtime_1.jsx)("a", { href: link.href, className: "hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded transition-colors", children: link.label }, `${index}-${link.label}`))) }))] }) }) }));
}
exports.default = Footer;
