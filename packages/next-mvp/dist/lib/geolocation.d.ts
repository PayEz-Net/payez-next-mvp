/**
 * =============================================================================
 * GEOLOCATION UTILITY
 * =============================================================================
 *
 * Server-side utility for resolving IP addresses to geographic locations.
 * Uses ip-api.com (free tier: 45 requests/minute).
 *
 * USAGE:
 * ------
 * import { getLocationFromIP, extractClientIP } from '@payez/next-mvp/lib/geolocation';
 *
 * const ip = extractClientIP(request.headers);
 * const location = await getLocationFromIP(ip);
 * console.log(location?.city); // 'Mountain View'
 *
 * =============================================================================
 */
export interface LocationInfo {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
}
/**
 * Check if an IP address is private/local (not routable on the internet)
 */
export declare function isPrivateIP(ip: string): boolean;
/**
 * Fetch the public IP address of the server/network.
 * Useful for development when the detected IP is a private/local IP.
 */
export declare function getPublicIP(): Promise<string | null>;
/**
 * Extract the client IP from request headers.
 * Handles various proxy headers in order of priority.
 */
export declare function extractClientIP(headers: Headers): string;
/**
 * Get geographic location from an IP address.
 * Uses ip-api.com free tier (45 req/min, no API key required).
 * Results are cached for 1 hour.
 *
 * @param ip - The IP address to look up
 * @param resolvePublicIP - If true and IP is private, attempt to resolve the public IP
 * @returns Location info or null if lookup failed
 */
export declare function getLocationFromIP(ip: string, resolvePublicIP?: boolean): Promise<LocationInfo | null>;
/**
 * Format a location object as a readable string
 */
export declare function formatLocation(location?: LocationInfo | null): string;
/**
 * Get country flag emoji from country code
 */
export declare function getCountryFlag(countryCode?: string): string;
/**
 * Clear the geolocation cache (useful for testing)
 */
export declare function clearGeoCache(): void;
