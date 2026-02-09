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
export function mergeDeep<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output: any = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = (source as any)[key];
      const targetValue = (target as any)[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        // Recursively merge nested objects
        output[key] = mergeDeep(targetValue, sourceValue);
      } else if (sourceValue !== undefined) {
        // Use source value if it's defined
        output[key] = sourceValue;
      }
    });
  }

  return output as T;
}

/**
 * Check if a value is a plain object
 */
function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}
