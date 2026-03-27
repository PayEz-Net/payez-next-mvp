"use strict";
/**
 * Default Theme Configuration for @payez/next-mvp
 *
 * This is the fallback theme when no custom theme is provided.
 * It provides sensible defaults that match the current unbranded styling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTheme = void 0;
exports.defaultTheme = {
    branding: {
        logo: {
            light: "/logo.svg",
            dark: "/logo.svg",
            alt: "Logo",
            height: "h-10",
            width: "w-auto",
        },
        appName: "App",
    },
    colors: {
        primary: "#3b82f6", // blue-500
        background: "bg-gray-50",
        card: "bg-white",
        muted: "text-gray-600",
        border: "border-gray-200",
    },
    layout: {
        maxWidth: "max-w-4xl",
        padding: "p-6",
        spacing: "space-y-6",
    },
};
