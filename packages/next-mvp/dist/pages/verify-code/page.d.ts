/**
 * Themed 2FA Verification Page for @payez/next-mvp
 *
 * PLAIN STYLING, FULL FUNCTIONALITY
 * - Clean, professional appearance
 * - All functional patterns from website-membership
 * - Themeable via ThemeProvider
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Progressive disclosure: method selection → code input
 * ✅ Method locking after selection (prevents accidental multi-send)
 * ✅ Masked contact info display (informational only)
 * ✅ Auto-submit when code reaches 6 digits
 * ✅ Cooldown timers (30s) on resend buttons
 * ✅ Stale session detection (401 → redirect to login)
 * ✅ JWT-specific error detection and messaging
 * ✅ Session viability polling (every 30s) to detect expiration early
 * ✅ Duplicate submission prevention
 * ✅ Success/error states with atomic management
 * ✅ "Change method" action
 * ✅ Session cleanup on success/expiry
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/verify-code
 * 2. Wrap your app with ThemeProvider to customize branding
 */
export default function VerifyCodePage(): import("react/jsx-runtime").JSX.Element;
