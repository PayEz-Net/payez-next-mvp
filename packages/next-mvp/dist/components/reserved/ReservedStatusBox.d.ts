/**
 * ReservedStatusBox - Deterministic Reserved Space for Status Messages
 *
 * PURPOSE: Eliminate layout shift when status messages (ready/submitting/error/success)
 * appear/disappear by reserving exact height mathematically.
 *
 * MATHEMATICAL APPROACH:
 * - Measures all candidate messages at current container width
 * - Computes height = max(iconSizePx, text block height) + paddings + borders
 * - Font metrics from Tailwind: text-sm (0.875rem = 14px), leading-relaxed (1.625)
 * - Padding from p-3: 0.75rem = 12px (top + bottom = 24px)
 * - Border from border class: 1px (top + bottom = 2px)
 * - Sets minHeight to the maximum of all candidates
 *
 * CRITICAL: No transitions on height; exact px value at any zoom level
 */
import React from "react";
type Props = {
    className?: string;
    /** List of candidate messages representing the longest possible strings for each state */
    candidates: string[];
    /** Tailwind classes applied to the live status container (must match for accurate measurement) */
    containerClass?: string;
    /** Icon size in px (default 16 for w-4 h-4) */
    iconSizePx?: number;
    /** The dynamic status content */
    children?: React.ReactNode;
};
export declare function ReservedStatusBox({ className, candidates, containerClass, iconSizePx, children, }: Props): import("react/jsx-runtime").JSX.Element;
export default ReservedStatusBox;
