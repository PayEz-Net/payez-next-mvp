"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgent = parseUserAgent;
exports.getDeviceDescription = getDeviceDescription;
exports.getDeviceIcon = getDeviceIcon;
exports.getBrowserIcon = getBrowserIcon;
// -----------------------------------------------------------------------------
// DETECTION PATTERNS
// -----------------------------------------------------------------------------
const MOBILE_KEYWORDS = [
    'Mobile',
    'Android',
    'iPhone',
    'iPod',
    'BlackBerry',
    'IEMobile',
    'Opera Mini',
    'Opera Mobi',
    'Windows Phone',
];
const TABLET_KEYWORDS = [
    'iPad',
    'Tablet',
    'PlayBook',
    'Silk',
    'Kindle',
];
const BOT_KEYWORDS = [
    'bot',
    'spider',
    'crawler',
    'slurp',
    'googlebot',
    'bingbot',
    'yandex',
    'baidu',
    'duckduckbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'pinterest',
    'semrush',
    'ahref',
];
// Browser detection patterns (order matters - more specific first)
const BROWSER_PATTERNS = [
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)*)/ },
    { name: 'Opera', pattern: /(?:OPR|Opera)\/(\d+(?:\.\d+)*)/ },
    { name: 'Samsung Browser', pattern: /SamsungBrowser\/(\d+(?:\.\d+)*)/ },
    { name: 'UC Browser', pattern: /UCBrowser\/(\d+(?:\.\d+)*)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+(?:\.\d+)*)/ },
    { name: 'Chrome', pattern: /Chrome\/(\d+(?:\.\d+)*)/ },
    { name: 'Safari', pattern: /Version\/(\d+(?:\.\d+)*).*Safari/ },
    { name: 'Safari', pattern: /Safari\/(\d+(?:\.\d+)*)/ },
    { name: 'IE', pattern: /(?:MSIE |rv:)(\d+(?:\.\d+)*)/ },
];
// OS detection patterns
const OS_PATTERNS = [
    { name: 'iOS', pattern: /iPhone|iPad|iPod/, versionPattern: /OS (\d+[_\.]\d+(?:[_\.]\d+)?)/ },
    { name: 'Android', pattern: /Android/, versionPattern: /Android (\d+(?:\.\d+)*)/ },
    { name: 'Windows', pattern: /Windows/, versionPattern: /Windows NT (\d+(?:\.\d+)*)/ },
    { name: 'macOS', pattern: /Mac OS X/, versionPattern: /Mac OS X (\d+[_\.]\d+(?:[_\.]\d+)?)/ },
    { name: 'Linux', pattern: /Linux/, versionPattern: undefined },
    { name: 'Chrome OS', pattern: /CrOS/, versionPattern: undefined },
];
// Windows NT version mapping
const WINDOWS_VERSIONS = {
    '10.0': '10/11',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'Vista',
    '5.1': 'XP',
};
// -----------------------------------------------------------------------------
// PARSER FUNCTION
// -----------------------------------------------------------------------------
/**
 * Parse a user agent string to extract device, browser, and OS information.
 *
 * @param userAgent - The user agent string from request headers
 * @returns Parsed device information
 */
function parseUserAgent(userAgent) {
    const ua = userAgent || '';
    const uaLower = ua.toLowerCase();
    // Default result
    const result = {
        deviceType: 'unknown',
        browser: 'Unknown',
        os: 'Unknown',
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isBot: false,
        raw: ua,
    };
    if (!ua)
        return result;
    // Check for bots first
    result.isBot = BOT_KEYWORDS.some(keyword => uaLower.includes(keyword));
    // Detect device type
    result.isTablet = TABLET_KEYWORDS.some(keyword => ua.includes(keyword));
    result.isMobile = !result.isTablet && MOBILE_KEYWORDS.some(keyword => ua.includes(keyword));
    result.isDesktop = !result.isMobile && !result.isTablet && !result.isBot;
    if (result.isTablet) {
        result.deviceType = 'tablet';
    }
    else if (result.isMobile) {
        result.deviceType = 'mobile';
    }
    else if (result.isDesktop) {
        result.deviceType = 'desktop';
    }
    // Detect browser
    for (const { name, pattern } of BROWSER_PATTERNS) {
        const match = ua.match(pattern);
        if (match) {
            result.browser = name;
            result.browserVersion = match[1];
            break;
        }
    }
    // Detect OS
    for (const { name, pattern, versionPattern } of OS_PATTERNS) {
        if (pattern.test(ua)) {
            result.os = name;
            if (versionPattern) {
                const versionMatch = ua.match(versionPattern);
                if (versionMatch) {
                    let version = versionMatch[1].replace(/_/g, '.');
                    // Map Windows NT versions to friendly names
                    if (name === 'Windows' && WINDOWS_VERSIONS[version]) {
                        version = WINDOWS_VERSIONS[version];
                    }
                    result.osVersion = version;
                }
            }
            break;
        }
    }
    return result;
}
// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
/**
 * Get a short, human-readable description of the device
 */
function getDeviceDescription(info) {
    const parts = [];
    if (info.browser !== 'Unknown') {
        parts.push(info.browser);
    }
    if (info.os !== 'Unknown') {
        let osDesc = info.os;
        if (info.osVersion) {
            osDesc += ` ${info.osVersion}`;
        }
        parts.push(osDesc);
    }
    if (parts.length === 0) {
        if (info.isBot)
            return 'Bot';
        return info.deviceType.charAt(0).toUpperCase() + info.deviceType.slice(1);
    }
    return parts.join(' / ');
}
/**
 * Get device type icon (emoji)
 */
function getDeviceIcon(deviceType) {
    switch (deviceType) {
        case 'mobile':
            return '📱';
        case 'tablet':
            return '📲';
        case 'desktop':
            return '💻';
        default:
            return '🔌';
    }
}
/**
 * Get browser icon (emoji)
 */
function getBrowserIcon(browser) {
    const browserLower = browser.toLowerCase();
    if (browserLower.includes('chrome'))
        return '🌐';
    if (browserLower.includes('firefox'))
        return '🦊';
    if (browserLower.includes('safari'))
        return '🧭';
    if (browserLower.includes('edge'))
        return '🌐';
    if (browserLower.includes('opera'))
        return '🔴';
    if (browserLower.includes('ie') || browserLower.includes('internet explorer'))
        return '🌐';
    return '🌐';
}
