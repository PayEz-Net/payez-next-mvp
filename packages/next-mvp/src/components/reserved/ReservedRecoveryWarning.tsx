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
import { measureNodeHeightAtWidth, observeForRecalc } from "../../utils/layout/reservedSpace";

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

export function ReservedRecoveryWarning({
  className,
  show = false,
  titleText,
  bodyText,
  actionLabel,
  containerClass = "p-4 rounded-lg border",
  titleClass = "font-medium",
  bodyClass = "text-sm",
  buttonClass = "w-full py-2 px-4 text-sm font-medium rounded-md",
  iconSizePx = 20,
  children,
}: Props) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  
  // Estimate initial height to prevent collapse during SSR/hydration
  // Formula: icon (20px) + padding (p-4 = 32px) + border (2px) + title + body + button
  // Conservative estimate: ~140px for typical warning with button
  const estimatedMinHeight = 140;
  
  const [minH, setMinH] = React.useState<number>(estimatedMinHeight);

  const recompute = React.useCallback(() => {
    const el = hostRef.current;
    if (!el) return;
    const width = el.clientWidth;

    // Wait for layout - clientWidth === 0 means container not laid out yet
    if (width === 0) {
      // Retry after next frame when layout is ready
      requestAnimationFrame(recompute);
      return;
    }

    const h = measureNodeHeightAtWidth(() => {
      // Mirror the real DOM of the warning
      const outer = document.createElement("div");
      outer.className = containerClass;
      
      // Row: icon + title (flex items-start space-x-3)
      const headerRow = document.createElement("div");
      headerRow.className = "flex items-start space-x-3";
      
      const icon = document.createElement("div");
      icon.style.width = iconSizePx + "px";
      icon.style.height = iconSizePx + "px";
      icon.style.flexShrink = "0";
      icon.style.marginTop = "2px"; // mt-0.5 to align with text
      
      const titleContainer = document.createElement("div");
      titleContainer.className = "flex-1";
      
      const h3 = document.createElement("h3");
      h3.className = titleClass;
      h3.style.margin = "0";
      h3.style.marginBottom = "8px"; // mb-2
      h3.textContent = titleText;
      
      // Body paragraph
      const p = document.createElement("p");
      p.className = bodyClass;
      p.style.margin = "0";
      p.style.marginBottom = "12px"; // mb-3
      p.textContent = bodyText;
      
      // Action button
      const btn = document.createElement("button");
      btn.className = buttonClass;
      btn.textContent = actionLabel;
      
      titleContainer.appendChild(h3);
      titleContainer.appendChild(p);
      titleContainer.appendChild(btn);
      
      headerRow.appendChild(icon);
      headerRow.appendChild(titleContainer);
      
      outer.appendChild(headerRow);
      
      return outer;
    }, width);

    setMinH(h);
  }, [titleText, bodyText, actionLabel, containerClass, titleClass, bodyClass, buttonClass, iconSizePx]);

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
      data-testid="recovery-warning-wrap"
    >
      {show ? children : null}
    </div>
  );
}

export default ReservedRecoveryWarning;

/*
MATHEMATICAL NOTES (documented per spec):
- We compute the exact height of the fully-rendered warning box by mirroring its DOM:
  - Icon+title row (flex items-start space-x-3)
  - Title (h3 with font-medium)
  - Body paragraph (text-sm)
  - CTA button (full-width)
  
- Height = Σ(child block heights) + (vertical gaps) + (padding top/bottom from p-4) + (borders)
- Text block heights come from exact font-size × line-height and wrapping given the actual width
- This is evaluated via offscreen DOM to preserve precision across zoom/browsers
- No transitions applied; min-height is a fixed px value at any zoom level
- Space is reserved even when content is hidden (show=false), eliminating jump
*/
