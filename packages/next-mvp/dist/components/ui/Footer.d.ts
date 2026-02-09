export interface FooterProps {
    /** Company or product name (default: 'PayEz') */
    companyName?: string;
    /** Start year for copyright range (shows "2024-2025" format if provided) */
    startYear?: number;
    /** Additional links to display */
    links?: Array<{
        label: string;
        href: string;
    }>;
    /** Additional CSS classes */
    className?: string;
    /** Variant style */
    variant?: 'minimal' | 'standard';
}
/**
 * A themeable footer component with dynamic copyright year.
 *
 * @example
 * ```tsx
 * // Minimal footer
 * <Footer />
 *
 * // With company name and start year
 * <Footer companyName="Acme Inc" startYear={2020} />
 *
 * // With links
 * <Footer
 *   links={[
 *     { label: 'Privacy', href: '/privacy' },
 *     { label: 'Terms', href: '/terms' }
 *   ]}
 * />
 * ```
 */
export declare function Footer({ companyName, startYear, links, className, variant }: FooterProps): import("react/jsx-runtime").JSX.Element;
export default Footer;
