"use strict";
/**
 * Theme Utility Functions
 *
 * Provides helper functions for theme management, including deep merging
 * of theme configurations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDeep = mergeDeep;
/**
 * Deep merge two objects, with the second object taking precedence
 * @param target - Base object
 * @param source - Object to merge in (takes precedence)
 * @returns Merged object
 */
function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            const targetValue = target[key];
            if (isObject(sourceValue) && isObject(targetValue)) {
                // Recursively merge nested objects
                output[key] = mergeDeep(targetValue, sourceValue);
            }
            else if (sourceValue !== undefined) {
                // Use source value if it's defined
                output[key] = sourceValue;
            }
        });
    }
    return output;
}
/**
 * Check if a value is a plain object
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}
