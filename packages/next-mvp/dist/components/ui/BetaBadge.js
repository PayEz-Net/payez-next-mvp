"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetaBadge = BetaBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * A subtle badge component for indicating pre-release status.
 *
 * Controlled by NEXT_PUBLIC_SHOW_BETA_BADGE env var.
 * When env var is not 'true', renders nothing.
 *
 * @example
 * ```tsx
 * // In your header, next to logo
 * <Logo />
 * <BetaBadge />
 *
 * // Custom text
 * <BetaBadge text="preview" />
 *
 * // Different variant
 * <BetaBadge variant="outlined" text="coming soon" />
 * ```
 */
function BetaBadge({ text = 'beta', className = '', variant = 'subtle' }) {
    // Check env var - only render if explicitly enabled
    if (process.env.NEXT_PUBLIC_SHOW_BETA_BADGE !== 'true') {
        return null;
    }
    const baseStyles = 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full lowercase tracking-wide';
    const variantStyles = {
        subtle: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        outlined: 'border border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400',
        solid: 'bg-gray-500 text-white dark:bg-gray-600',
    };
    return ((0, jsx_runtime_1.jsx)("span", { className: `${baseStyles} ${variantStyles[variant]} ${className}`, children: text }));
}
exports.default = BetaBadge;
