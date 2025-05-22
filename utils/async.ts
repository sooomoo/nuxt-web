/**
 * 休眠当前的Promise
 * @param ms 需要休眠的毫秒数
 * @returns Promise
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 保证某一个Promise函数在同一时间只执行一次，多次调用时返回第一次的Promise结果
 * 1. 如果前一个请求正在执行，后一个请求会等待前一个请求的结果
 * 2. 如果前一个请求已经完成，后一个请求会立即执行
 * @param promiseFn 需要执行的Promise函数
 * @returns 执行结果
 */
export const callOncePromise = <T, TIn>(
    promiseFn: (args?: TIn) => Promise<T>,
): ((args?: TIn) => Promise<T>) => {
    let isExecuting = false;
    let resultPromise: Promise<T> | null = null;

    return (args?: TIn): Promise<T> => {
        if (isExecuting) {
            return resultPromise!;
        }
        isExecuting = true;
        resultPromise = promiseFn(args).finally(() => {
            isExecuting = false;
        });
        return resultPromise;
    };
};
