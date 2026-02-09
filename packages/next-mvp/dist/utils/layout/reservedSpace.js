"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypographyMetrics = getTypographyMetrics;
exports.getBoxMetrics = getBoxMetrics;
exports.calcHeightFromLines = calcHeightFromLines;
exports.measureNodeHeightAtWidth = measureNodeHeightAtWidth;
exports.observeForRecalc = observeForRecalc;
/**
 * Extract precise typography metrics from an element's computed styles
 */
function getTypographyMetrics(el) {
    const cs = getComputedStyle(el);
    const fontSizePx = parseFloat(cs.fontSize);
    const lineHeightPx = cs.lineHeight === "normal" ? fontSizePx * 1.2 : parseFloat(cs.lineHeight);
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
function getBoxMetrics(el) {
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
function calcHeightFromLines(args) {
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
function measureNodeHeightAtWidth(nodeFactory, widthPx) {
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
function observeForRecalc(target, cb) {
    const ro = new ResizeObserver(() => cb());
    ro.observe(target);
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
