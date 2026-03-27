"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrivateIP = isPrivateIP;
exports.getPublicIP = getPublicIP;
exports.extractClientIP = extractClientIP;
exports.getLocationFromIP = getLocationFromIP;
exports.formatLocation = formatLocation;
exports.getCountryFlag = getCountryFlag;
exports.clearGeoCache = clearGeoCache;
// -----------------------------------------------------------------------------
// CACHE CONFIGURATION
// -----------------------------------------------------------------------------
// In-memory cache for IP geolocation (reduces API calls)
const geoCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
// Cache for public IP lookup (to avoid repeated calls)
let cachedPublicIP = null;
const PUBLIC_IP_CACHE_TTL = 1000 * 60 * 30; // 30 minutes
// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
/**
 * Check if an IP address is private/local (not routable on the internet)
 */
function isPrivateIP(ip) {
    if (!ip)
        return true;
    // IPv6 loopback
    if (ip === '::1')
        return true;
    // IPv4 loopback
    if (ip === '127.0.0.1' || ip.startsWith('127.'))
        return true;
    // Private IPv4 ranges
    if (ip.startsWith('192.168.'))
        return true;
    if (ip.startsWith('10.'))
        return true;
    if (ip.startsWith('172.')) {
        const secondOctet = parseInt(ip.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31)
            return true;
    }
    // Link-local
    if (ip.startsWith('169.254.'))
        return true;
    return false;
}
/**
 * Fetch the public IP address of the server/network.
 * Useful for development when the detected IP is a private/local IP.
 */
async function getPublicIP() {
    // Check cache first
    if (cachedPublicIP && Date.now() - cachedPublicIP.timestamp < PUBLIC_IP_CACHE_TTL) {
        return cachedPublicIP.ip;
    }
    // List of services to try (all return plain text IP)
    const services = [
        'https://api.ipify.org',
        'https://icanhazip.com',
        'https://ifconfig.me/ip',
        'https://ipecho.net/plain',
    ];
    for (const service of services) {
        try {
            const response = await fetch(service, {
                signal: AbortSignal.timeout(3000),
            });
            if (response.ok) {
                const ip = (await response.text()).trim();
                // Validate it looks like an IP
                if (ip && /^[\d.]+$/.test(ip) || /^[a-f0-9:]+$/i.test(ip)) {
                    cachedPublicIP = { ip, timestamp: Date.now() };
                    console.log(`[geolocation] Public IP resolved: ${ip}`);
                    return ip;
                }
            }
        }
        catch {
            // Try next service
            continue;
        }
    }
    console.warn('[geolocation] Failed to resolve public IP from all services');
    return null;
}
/**
 * Extract the client IP from request headers.
 * Handles various proxy headers in order of priority.
 */
function extractClientIP(headers) {
    // Try headers in order of reliability
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Take the first IP (original client)
        const firstIP = forwardedFor.split(',')[0]?.trim();
        if (firstIP)
            return firstIP;
    }
    const realIP = headers.get('x-real-ip');
    if (realIP)
        return realIP.trim();
    const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIP)
        return cfConnectingIP.trim();
    const trueClientIP = headers.get('true-client-ip'); // Akamai/Cloudflare
    if (trueClientIP)
        return trueClientIP.trim();
    // Fallback
    return '127.0.0.1';
}
// -----------------------------------------------------------------------------
// MAIN FUNCTION
// -----------------------------------------------------------------------------
/**
 * Get geographic location from an IP address.
 * Uses ip-api.com free tier (45 req/min, no API key required).
 * Results are cached for 1 hour.
 *
 * @param ip - The IP address to look up
 * @param resolvePublicIP - If true and IP is private, attempt to resolve the public IP
 * @returns Location info or null if lookup failed
 */
async function getLocationFromIP(ip, resolvePublicIP = true) {
    // Handle private/local IPs
    if (isPrivateIP(ip)) {
        // In development, try to get the actual public IP for geolocation
        if (resolvePublicIP) {
            const publicIP = await getPublicIP();
            if (publicIP && !isPrivateIP(publicIP)) {
                console.log(`[geolocation] Private IP ${ip} -> using public IP ${publicIP}`);
                // Recursively call with public IP (but don't resolve again to prevent loops)
                return getLocationFromIP(publicIP, false);
            }
        }
        // Fallback to local indicator
        return {
            city: 'Local',
            region: 'Development',
            country: 'Local',
            countryCode: 'LO',
        };
    }
    // Check cache
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.location;
    }
    try {
        // ip-api.com free endpoint
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
            console.error(`[geolocation] HTTP error: ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (data.status !== 'success') {
            console.warn(`[geolocation] Lookup failed for ${ip}: ${data.message}`);
            // Cache the failure to avoid repeated lookups
            geoCache.set(ip, { location: null, timestamp: Date.now() });
            return null;
        }
        const location = {
            city: data.city,
            region: data.regionName,
            country: data.country,
            countryCode: data.countryCode,
            latitude: data.lat,
            longitude: data.lon,
            timezone: data.timezone,
            isp: data.isp,
        };
        // Cache the result
        geoCache.set(ip, { location, timestamp: Date.now() });
        return location;
    }
    catch (error) {
        console.error(`[geolocation] Error looking up ${ip}:`, error);
        return null;
    }
}
/**
 * Format a location object as a readable string
 */
function formatLocation(location) {
    if (!location)
        return 'Unknown';
    const parts = [location.city, location.region, location.countryCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Unknown';
}
/**
 * Get country flag emoji from country code
 */
function getCountryFlag(countryCode) {
    if (!countryCode || countryCode === 'LO')
        return '🏠'; // Local/development
    try {
        // Convert country code to flag emoji (e.g., 'US' -> 🇺🇸)
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    }
    catch {
        return '🌍';
    }
}
/**
 * Clear the geolocation cache (useful for testing)
 */
function clearGeoCache() {
    geoCache.clear();
}
