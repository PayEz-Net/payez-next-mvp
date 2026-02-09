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
    lineHeightPx: number;
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
export declare function getTypographyMetrics(el: Element): TypographyMetrics;
/**
 * Extract box model metrics from an element's computed styles
 */
export declare function getBoxMetrics(el: Element): BoxMetrics;
/**
 * Mathematical formula per spec:
 * MaxHeight = (LineHeight × MaxLines) + (VerticalPadding × 2)
 *           + (MarginBetweenItems × (MaxLines - 1)) + BorderWidths
 */
export declare function calcHeightFromLines(args: {
    lineHeightPx: number;
    maxLines: number;
    verticalPaddingPx: number;
    marginBetweenItemsPx: number;
    borderWidthsPx: number;
}): number;
/**
 * Measure arbitrary DOM subtree height at a constrained width using an offscreen probe.
 * This leverages the browser layout engine for exact results at any zoom level.
 *
 * CRITICAL: The probe uses contain: layout style size to isolate layout cost.
 */
export declare function measureNodeHeightAtWidth(nodeFactory: () => HTMLElement, widthPx: number): number;
/**
 * Observe size changes and DPR to keep measurements exact across zoom/viewport changes.
 * Returns cleanup function.
 */
export declare function observeForRecalc(target: Element, cb: () => void): () => void;
