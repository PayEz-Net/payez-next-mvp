/**
 * Theme Utility Functions
 *
 * Provides helper functions for theme management, including deep merging
 * of theme configurations.
 */
/**
 * Deep merge two objects, with the second object taking precedence
 * @param target - Base object
 * @param source - Object to merge in (takes precedence)
 * @returns Merged object
 */
export declare function mergeDeep<T extends Record<string, any>>(target: T, source: Partial<T>): T;
