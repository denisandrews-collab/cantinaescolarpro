/**
 * Performance utility functions for optimizing the application
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T> | undefined;

  return function executedFunction(...args: Parameters<T>): ReturnType<T> | undefined {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
    return lastResult;
  };
}

/**
 * Memoizes the result of a function based on its arguments
 * Note: For better performance with complex objects, consider using a specialized library
 * like 'fast-memoize' or implementing a custom key generation strategy
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    // Simple key generation - works for primitives and simple objects
    // For complex objects or circular references, consider using a more robust solution
    const key = args.length === 0 ? '__no_args__' : 
                args.length === 1 && typeof args[0] !== 'object' ? String(args[0]) :
                JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batches multiple function calls into a single execution
 */
export function batchCalls<T>(
  func: (items: T[]) => void,
  wait: number = 100
): (item: T) => void {
  let items: T[] = [];
  let timeout: NodeJS.Timeout | null = null;

  return (item: T) => {
    items.push(item);

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(items);
      items = [];
      timeout = null;
    }, wait);
  };
}
