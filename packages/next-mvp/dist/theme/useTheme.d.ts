/**
 * Theme Hooks for @payez/next-mvp
 *
 * Convenience hooks for accessing specific parts of the theme configuration.
 * These hooks can only be used within components wrapped by ThemeProvider.
 */
/**
 * Access the full theme configuration
 */
export declare function useTheme(): import("./types").ThemeConfig;
/**
 * Access branding configuration (logo, app name, tagline)
 */
export declare function useBranding(): {
    logo: {
        light: string;
        dark: string;
        alt: string;
        height?: string;
        width?: string;
    };
    appName: string;
    tagline?: string;
};
/**
 * Access color configuration
 */
export declare function useColors(): {
    primary: string;
    secondary?: string;
    accent?: string;
    background: string;
    card: string;
    muted: string;
    border: string;
};
/**
 * Access typography configuration
 */
export declare function useTypography(): {
    fontFamily?: string;
    headingWeight?: string;
    bodyWeight?: string;
} | undefined;
/**
 * Access layout configuration
 */
export declare function useLayout(): {
    maxWidth?: string;
    padding?: string;
    spacing?: string;
} | undefined;
/**
 * Access component-specific theme overrides
 */
export declare function useComponentTheme(): {
    loginPage?: Partial<import("./types").LoginPageTheme>;
    profilePage?: Partial<import("./types").ProfilePageTheme>;
    recoveryPage?: Partial<import("./types").RecoveryPageTheme>;
} | undefined;
