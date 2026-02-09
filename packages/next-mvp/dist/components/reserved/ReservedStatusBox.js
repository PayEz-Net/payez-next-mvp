"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservedStatusBox = ReservedStatusBox;
const jsx_runtime_1 = require("react/jsx-runtime");
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
const react_1 = __importDefault(require("react"));
const reservedSpace_1 = require("../../utils/layout/reservedSpace");
function ReservedStatusBox({ className, candidates, containerClass = "p-3 text-sm leading-relaxed rounded-md border", iconSizePx = 16, children, }) {
    const hostRef = react_1.default.useRef(null);
    // Estimate initial height to prevent collapse during SSR/hydration
    // Formula: iconSize + padding (p-3 = 24px) + border (2px) = conservative minimum
    const estimatedMinHeight = iconSizePx + 24 + 2; // ~42px for 16px icon
    const [minH, setMinH] = react_1.default.useState(estimatedMinHeight);
    const recompute = react_1.default.useCallback(() => {
        const el = hostRef.current;
        if (!el)
            return;
        const width = el.clientWidth; // width the status box will render at
        // Wait for layout - clientWidth === 0 means container not laid out yet
        if (width === 0) {
            // Retry after next frame when layout is ready
            requestAnimationFrame(recompute);
            return;
        }
        // For each candidate, build a DOM subtree matching the live structure and measure its height
        const heights = candidates.map((msg) => (0, reservedSpace_1.measureNodeHeightAtWidth)(() => {
            const outer = document.createElement("div");
            outer.className = containerClass + " flex items-center space-x-2"; // must match live
            // icon placeholder
            const icon = document.createElement("div");
            icon.style.width = iconSizePx + "px";
            icon.style.height = iconSizePx + "px";
            icon.style.flexShrink = "0";
            // message text
            const span = document.createElement("span");
            span.className = "flex-1"; // let text wrap if needed
            span.textContent = msg;
            outer.appendChild(icon);
            outer.appendChild(span);
            return outer;
        }, width));
        const max = Math.max(0, ...heights);
        setMinH(max);
    }, [candidates, containerClass, iconSizePx]);
    react_1.default.useLayoutEffect(() => {
        recompute();
        if (hostRef.current) {
            return (0, reservedSpace_1.observeForRecalc)(hostRef.current, recompute);
        }
    }, [recompute]);
    return ((0, jsx_runtime_1.jsx)("div", { ref: hostRef, className: className, style: { minHeight: minH ? `${minH}px` : undefined, transition: "none" }, "data-testid": "status-wrap", children: children }));
}
exports.default = ReservedStatusBox;
