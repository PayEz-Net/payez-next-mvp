export interface BetaBadgeProps {
    /** Text to display (default: 'beta') */
    text?: string;
    /** Additional CSS classes */
    className?: string;
    /** Badge variant */
    variant?: 'subtle' | 'outlined' | 'solid';
}
/**
 * A subtle badge component for indicating pre-release status.
 *
 * Controlled by NEXT_PUBLIC_SHOW_BETA_BADGE env var.
 * When env var is not 'true', renders nothing.
 *
 * @example
 * ```tsx
 * // In your header, next to logo
 * <Logo />
 * <BetaBadge />
 *
 * // Custom text
 * <BetaBadge text="preview" />
 *
 * // Different variant
 * <BetaBadge variant="outlined" text="coming soon" />
 * ```
 */
export declare function BetaBadge({ text, className, variant }: BetaBadgeProps): import("react/jsx-runtime").JSX.Element | null;
export default BetaBadge;
