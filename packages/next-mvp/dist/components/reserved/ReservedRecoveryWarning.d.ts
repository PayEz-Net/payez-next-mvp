/**
 * ReservedRecoveryWarning - Deterministic Reserved Space for Account Lockout Warning
 *
 * PURPOSE: Eliminate layout shift when the lockout warning appears/disappears
 * by reserving exact height mathematically.
 *
 * MATHEMATICAL APPROACH:
 * - Mirrors the complete DOM structure (icon+title row, body paragraph, CTA button)
 * - Height = Σ(child block heights) + (vertical gaps from space-y-3) + (padding top/bottom from p-4) + (borders)
 * - Text block heights from exact font-size × line-height and wrapping at actual width
 * - space-y-3: 0.75rem = 12px gap between children
 * - p-4: 1rem = 16px padding (top + bottom = 32px)
 * - border: 1px (top + bottom = 2px)
 * - Evaluated via offscreen DOM for precision across zoom/browsers
 *
 * CRITICAL: No transitions on height; reserves space even when hidden
 */
import React from "react";
type Props = {
    className?: string;
    /** Whether the warning is actually visible */
    show?: boolean;
    /** Provide the actual copy used so we can measure precise wrapping (localizable) */
    titleText: string;
    bodyText: string;
    actionLabel: string;
    /** Class recipes that match the live styles */
    containerClass?: string;
    titleClass?: string;
    bodyClass?: string;
    buttonClass?: string;
    /** Icon size in px (default 20 for w-5 h-5) */
    iconSizePx?: number;
    /** The dynamic warning content */
    children?: React.ReactNode;
};
export declare function ReservedRecoveryWarning({ className, show, titleText, bodyText, actionLabel, containerClass, titleClass, bodyClass, buttonClass, iconSizePx, children, }: Props): import("react/jsx-runtime").JSX.Element;
export default ReservedRecoveryWarning;
