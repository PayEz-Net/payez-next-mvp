/**
 * Theme Configuration Types for @payez/next-mvp
 *
 * These types define the shape of theme configurations that consumers
 * can provide to customize branding, colors, typography, and layout.
 */
export interface ThemeConfig {
    branding: {
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
    colors: {
        primary: string;
        secondary?: string;
        accent?: string;
        background: string;
        card: string;
        muted: string;
        border: string;
    };
    typography?: {
        fontFamily?: string;
        headingWeight?: string;
        bodyWeight?: string;
    };
    layout?: {
        maxWidth?: string;
        padding?: string;
        spacing?: string;
    };
    components?: {
        loginPage?: Partial<LoginPageTheme>;
        profilePage?: Partial<ProfilePageTheme>;
        recoveryPage?: Partial<RecoveryPageTheme>;
    };
}
export interface LoginPageTheme {
    cardBackground: string;
    gradient: string;
    buttonColor: string;
    showLogo: boolean;
}
export interface ProfilePageTheme {
    layout: "centered" | "full-width";
    showAvatar: boolean;
}
export interface RecoveryPageTheme {
    layout: "centered" | "full-width";
}
