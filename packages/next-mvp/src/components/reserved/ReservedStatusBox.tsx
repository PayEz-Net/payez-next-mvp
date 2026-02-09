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
import { measureNodeHeightAtWidth, observeForRecalc } from "../../utils/layout/reservedSpace";

type Props = {
  className?: string;
  /** List of candidate messages representing the longest possible strings for each state */
  candidates: string[];
  /** Tailwind classes applied to the live status container (must match for accurate measurement) */
  containerClass?: string; // e.g., "p-3 text-sm leading-relaxed rounded-md border"
  /** Icon size in px (default 16 for w-4 h-4) */
  iconSizePx?: number;
  /** The dynamic status content */
  children?: React.ReactNode;
};

export function ReservedStatusBox({
  className,
  candidates,
  containerClass = "p-3 text-sm leading-relaxed rounded-md border",
  iconSizePx = 16,
  children,
}: Props) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  
  // Estimate initial height to prevent collapse during SSR/hydration
  // Formula: iconSize + padding (p-3 = 24px) + border (2px) = conservative minimum
  const estimatedMinHeight = iconSizePx + 24 + 2; // ~42px for 16px icon
  
  const [minH, setMinH] = React.useState<number>(estimatedMinHeight);

  const recompute = React.useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    const width = el.clientWidth; // width the status box will render at
    
    // Wait for layout - clientWidth === 0 means container not laid out yet
    if (width === 0) {
      // Retry after next frame when layout is ready
      requestAnimationFrame(recompute);
      return;
    }
    
    // For each candidate, build a DOM subtree matching the live structure and measure its height
    const heights = candidates.map((msg) =>
      measureNodeHeightAtWidth(() => {
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
      }, width)
    );
    
    const max = Math.max(0, ...heights);
    setMinH(max);
  }, [candidates, containerClass, iconSizePx]);

  React.useLayoutEffect(() => {
    recompute();
    if (hostRef.current) {
      return observeForRecalc(hostRef.current, recompute);
    }
  }, [recompute]);

  return (
    <div 
      ref={hostRef} 
      className={className} 
      style={{ minHeight: minH ? `${minH}px` : undefined, transition: "none" }}
      data-testid="status-wrap"
    >
      {children}
    </div>
  );
}

export default ReservedStatusBox;

/*
MATHEMATICAL NOTES (documented per spec):
- We force the exact height by measuring the maximum of all candidate messages rendered with:
  - Font metrics from applied classes: text-sm (font-size), leading-relaxed (line-height)
  - Padding p-3 (top+bottom = 2 × 12px = 24px)
  - Border widths from Tailwind's border class (1px top and bottom by default = 2px)
  - The height is the max of (iconSizePx, text line block height) plus paddings and borders,
    computed by the browser for precision
- No transitions applied; min-height is a fixed px value at any zoom level
- Text wrapping is accounted for by measuring at the actual container width
*/
