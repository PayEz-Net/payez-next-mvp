/**
 * Deterministic Reserved Space Utilities
 * 
 * PURPOSE: Measure exact computed typography and box metrics to calculate precise
 * reserved heights for dynamic UI regions, eliminating layout shift.
 * 
 * MATHEMATICAL FOUNDATION:
 * MaxHeight = (LineHeight × MaxLines) + (VerticalPadding × 2) 
 *           + (MarginBetweenItems × (MaxLines - 1)) + BorderWidths
 * 
 * All measurements are DOM-computed px values (zoom-safe, sub-pixel precision).
 */

export type TypographyMetrics = {
  fontSizePx: number;
  lineHeightPx: number; // already in px (computed)
  fontFamily: string;
  fontWeight: string;
  letterSpacingPx: number;
};

export type BoxMetrics = {
  paddingTop: number;
  paddingBottom: number;
  borderTop: number;
  borderBottom: number;
  marginTop: number;
  marginBottom: number;
};

/**
 * Extract precise typography metrics from an element's computed styles
 */
export function getTypographyMetrics(el: Element): TypographyMetrics {
  const cs = getComputedStyle(el);
  const fontSizePx = parseFloat(cs.fontSize);
  const lineHeightPx =
    cs.lineHeight === "normal" ? fontSizePx * 1.2 : parseFloat(cs.lineHeight);
  const letterSpacingPx = parseFloat(cs.letterSpacing || "0") || 0;
  return {
    fontSizePx,
    lineHeightPx,
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    letterSpacingPx,
  };
}

/**
 * Extract box model metrics from an element's computed styles
 */
export function getBoxMetrics(el: Element): BoxMetrics {
  const cs = getComputedStyle(el);
  return {
    paddingTop: parseFloat(cs.paddingTop),
    paddingBottom: parseFloat(cs.paddingBottom),
    borderTop: parseFloat(cs.borderTopWidth),
    borderBottom: parseFloat(cs.borderBottomWidth),
    marginTop: parseFloat(cs.marginTop),
    marginBottom: parseFloat(cs.marginBottom),
  };
}

/**
 * Mathematical formula per spec:
 * MaxHeight = (LineHeight × MaxLines) + (VerticalPadding × 2) 
 *           + (MarginBetweenItems × (MaxLines - 1)) + BorderWidths
 */
export function calcHeightFromLines(args: {
  lineHeightPx: number;
  maxLines: number;
  verticalPaddingPx: number; // paddingTop + paddingBottom
  marginBetweenItemsPx: number; // applied between lines/items
  borderWidthsPx: number; // borderTop + borderBottom
}): number {
  const { lineHeightPx, maxLines, verticalPaddingPx, marginBetweenItemsPx, borderWidthsPx } = args;
  const content = lineHeightPx * maxLines;
  const gaps = Math.max(0, maxLines - 1) * marginBetweenItemsPx;
  return content + verticalPaddingPx + gaps + borderWidthsPx;
}

/**
 * Measure arbitrary DOM subtree height at a constrained width using an offscreen probe.
 * This leverages the browser layout engine for exact results at any zoom level.
 * 
 * CRITICAL: The probe uses contain: layout style size to isolate layout cost.
 */
export function measureNodeHeightAtWidth(nodeFactory: () => HTMLElement, widthPx: number): number {
  const probeHost = document.createElement("div");
  probeHost.style.position = "absolute";
  probeHost.style.visibility = "hidden";
  probeHost.style.pointerEvents = "none";
  probeHost.style.left = "-100000px";
  probeHost.style.top = "0";
  probeHost.style.width = widthPx + "px";
  probeHost.style.contain = "layout style size";
  const node = nodeFactory();
  probeHost.appendChild(node);
  document.body.appendChild(probeHost);
  const h = probeHost.getBoundingClientRect().height;
  document.body.removeChild(probeHost);
  return h;
}

/**
 * Observe size changes and DPR to keep measurements exact across zoom/viewport changes.
 * Returns cleanup function.
 */
export function observeForRecalc(target: Element, cb: () => void): () => void {
  const ro = new ResizeObserver(() => cb());
  ro.observe(target as Element);
  const onResize = () => cb();
  window.addEventListener("resize", onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onResize);
  }
  return () => {
    ro.disconnect();
    window.removeEventListener("resize", onResize);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", onResize);
    }
  };
}
