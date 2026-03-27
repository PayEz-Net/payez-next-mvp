/**
 * =============================================================================
 * USER AGENT PARSER
 * =============================================================================
 *
 * Lightweight user agent parsing without external dependencies.
 * Extracts device type, browser, and OS information from user agent strings.
 *
 * USAGE:
 * ------
 * import { parseUserAgent, DeviceInfo } from '@payez/next-mvp/lib/user-agent-parser';
 *
 * const info = parseUserAgent(request.headers.get('user-agent'));
 * console.log(info.browser); // 'Chrome'
 * console.log(info.deviceType); // 'desktop'
 *
 * =============================================================================
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export interface DeviceInfo {
    deviceType: DeviceType;
    browser: string;
    browserVersion?: string;
    os: string;
    osVersion?: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isBot: boolean;
    raw: string;
}
/**
 * Parse a user agent string to extract device, browser, and OS information.
 *
 * @param userAgent - The user agent string from request headers
 * @returns Parsed device information
 */
export declare function parseUserAgent(userAgent?: string | null): DeviceInfo;
/**
 * Get a short, human-readable description of the device
 */
export declare function getDeviceDescription(info: DeviceInfo): string;
/**
 * Get device type icon (emoji)
 */
export declare function getDeviceIcon(deviceType: DeviceType): string;
/**
 * Get browser icon (emoji)
 */
export declare function getBrowserIcon(browser: string): string;
