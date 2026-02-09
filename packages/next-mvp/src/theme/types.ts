/**
 * Theme Configuration Types for @payez/next-mvp
 *
 * These types define the shape of theme configurations that consumers
 * can provide to customize branding, colors, typography, and layout.
 */

export interface ThemeConfig {
  // Branding
  branding: {
    logo: {
      light: string;        // Path to logo for light backgrounds
      dark: string;         // Path to logo for dark backgrounds
      alt: string;          // Alt text
      height?: string;      // Default: "h-10"
      width?: string;       // Default: "w-auto"
    };
    appName: string;        // "Nexus", "CryptAply", etc.
    tagline?: string;       // Optional tagline
  };

  // Colors (Tailwind classes or hex)
  colors: {
    primary: string;        // Primary brand color
    secondary?: string;     // Secondary brand color
    accent?: string;        // Accent color
    background: string;     // Page background
    card: string;          // Card background
    muted: string;         // Muted text/elements
    border: string;        // Border color
  };

  // Typography
  typography?: {
    fontFamily?: string;   // Font family
    headingWeight?: string; // "font-bold", etc.
    bodyWeight?: string;   // "font-normal", etc.
  };

  // Layout
  layout?: {
    maxWidth?: string;     // "max-w-4xl", etc.
    padding?: string;      // "p-6", etc.
    spacing?: string;      // "space-y-6", etc.
  };

  // Component-specific overrides
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
