/**
 * 获取当前时间的unix时间戳
 * @returns 当前时间戳，单位为秒
 */
export const unixNow = () => {
    return Math.floor(new Date().getTime() / 1000);
};
