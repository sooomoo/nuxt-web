
/**
 * 防抖
 * @param func 需要防抖的函数
 * @param delayMs 防抖的时间间隔，单位为毫秒
 * @returns 返回一个新的函数，该函数在被调用时会延迟执行原函数
 */
export const debounce = (func: Function, delayMs: number) => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    return(...args: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(() =>func(...args), delayMs);
    };
};

/**
 * 用于缓存函数的执行结果，避免重复计算。当计算任务比较耗时时，使用该函数可以提高性能。
 * @param fn 需要缓存结果的函数
 * @returns 返回函数的执行结果，或缓存的结果
 */
export const memoize = (fn:Function) => {
    const cache = new Map<string,any>();
    return(...args: any) => {
        const key = JSON.stringify(args);
        if (!cache.get(key)) cache.set(key, fn(...args));
        return cache.get(key);
    };
  };