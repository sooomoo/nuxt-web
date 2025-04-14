import axios, { type AxiosRequestConfig, type CancelToken } from 'axios';

const getPlatform = () => {
    const platform = useCookie('p')
    return platform.value || '8'
}

const isCryptoEnabled = () => {
    return import.meta.env.VITE_ENABLE_CRYPTO === 'true'
}


const signHeaderTimestamp = "x-timestamp";
const signHeaderNonce = "x-nonce";
const signHeaderSignature = "x-signature";
const signHeaderPlatform = "x-platform";
const signHeaderSession = "x-session";
const contentTypeEncrypted = "application/x-encrypted;charset=utf-8"

export interface ResponseDto<T> {
    code: string
    msg: string
    data: T
}

export interface TokenPair {
    access_token: string
    refresh_token: string
}

/**
 * 将对象按照 key 排序后，拼接成字符串
 * @param obj 待排序的对象
 * @returns 排序后的字符串
 */
const stringifyObj = (obj: any): string => {
    if (!obj) {
        return ""
    }
    if (typeof (obj) !== 'object') {
        return `${obj}`
    }
    const keys = Object.keys(obj).sort()
    const strObj = keys.map(k => `${k}=${obj[k]}`).join('&')
    return strObj
}

/**
 * 获取 access token
 * @returns token
 */
export const useAccessToken = () => useCookie(import.meta.env.VITE_COOKIE_ACCESS_TOKEN_NAME)

/**
 * 获取 refresh token
 * @returns token
 */
export const useRefreshToken = () => useCookie(import.meta.env.VITE_COOKIE_REFRESH_TOKEN_NAME)

// 创建一个实例并设置 baseURL
const httpInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    withCredentials: true,
    // validateStatus: (_e: number) => true,
});

httpInstance.interceptors.request.use((config) => {
    const [boxKeyPair, signKeyPair, sessionId] = ensureSecurets()
    // 需要对请求进行签名
    const nonce = generateUUID()
    const timestamp = (Date.now() / 1000).toFixed()
    const platform = getPlatform()
    const strQuery = config.params ? stringifyObj(config.params) : ""
    const signData: Record<string, any> = {
        "session": sessionId,
        "nonce": nonce,
        "timestamp": timestamp,
        "platform": platform,
        "method": "POST",
        "path": config.url,
        "query": strQuery,
        // "authorization": config.headers['Authorization'] || '',
    }
    // 1. 加密请求体（仅针对 POST/PUT 请求）
    if (['post', 'put'].includes((config.method ?? '').toLowerCase())) {
        let reqData = ''
        // 先加密
        if (config.data) {
            reqData = JSON.stringify(config.data)
            if (isCryptoEnabled()) {
                reqData = useEncrypt(boxKeyPair, reqData)
            }
        }
        config.data = reqData; // 替换原始数据为加密后的数据
        signData['body'] = reqData
        config.headers['Content-Type'] = contentTypeEncrypted
    }
    const str = stringifyObj(signData)
    const reqSignature = useSignData(signKeyPair, str)
    config.headers[signHeaderPlatform] = platform
    config.headers[signHeaderSession] = sessionId
    config.headers[signHeaderTimestamp] = timestamp
    config.headers[signHeaderNonce] = nonce
    config.headers[signHeaderSignature] = reqSignature
    return config;
})

httpInstance.interceptors.response.use(
    resp => {
        // 2xx 范围内的状态码都会触发该函数。
        const [boxKeyPair, _, sessionId] = ensureSecurets()
        const strQuery = resp.config.params ? stringifyObj(resp.config.params) : ""
        const respTimestamp = resp.headers[signHeaderTimestamp] as string | undefined ?? ''
        const respNonce = resp.headers[signHeaderNonce] as string | undefined ?? ''
        const respSignature = resp.headers[signHeaderSignature] as string | undefined ?? ''
        const respStr = stringifyObj({
            "session": sessionId,
            "nonce": respNonce,
            "platform": getPlatform(),
            "timestamp": respTimestamp,
            "method": "POST",
            "path": resp.config.url,
            "query": strQuery,
            "body": resp.data,
        })
        if (!useSignVerify(respStr, respSignature)) {
            return Promise.reject(new Error('签名验证失败'));
        }

        let respData = resp.data
        if (isCryptoEnabled() && resp.headers['content-type'] == contentTypeEncrypted) {
            respData = useDecrypt(boxKeyPair, resp.data)
        }
        resp.data = JSON.parse(respData)
        return resp;
    }, async error => {
        if (axios.isCancel(error)) {
            return null;
        }

        const config = error.config;
        if (axios.isAxiosError(error) && error.response && config) {
            if (error.response.status == 401) {
                if (!config.autoRefreshToken) return error
                // 刷新 token，然后重试 
                const accessToken = useAccessToken()
                accessToken.value = null                // 清除原来的 token
                const refreshToken = useRefreshToken()
                if (!refreshToken.value) return error

                const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
                const resp = await usePost<TokenPair>(refreshPath, undefined, undefined, {
                    retries: 3,
                    autoRefreshToken: false,
                    token: refreshToken.value,
                })
                if (!resp.data) return error

                accessToken.value = resp.data.access_token
                refreshToken.value = resp.data.refresh_token
                return await httpInstance(config);
            } else if (error.response.status >= 500 && error.response.status < 600) {
                // 如果没有设置重试次数或者已经重试过了，则不进行重试
                if (!config || !config.retry) return error;

                // 设置一个计数器，用于记录重试次数
                config.__retryCount = config.__retryCount || config.retry;

                // 如果重试次数小于设定的最大重试次数，则进行重试
                if (config.__retryCount >= config.retry) return error;
                config.__retryCount += 1;
                // 创建一个新的 promise 来等待一段时间后再进行重试 
                await sleep(1000 * config.__retryCount); // 指数退避

                return await httpInstance(config);
            }
        }

        return error;
    })


export interface HttpResponse<T> {
    data: T | null
    succeed: boolean
    httpStatus: number
    httpStatusText: string
}

export interface HttpOptions {
    retries: number
    autoRefreshToken: boolean
    token?: string
    cancelToken?: CancelToken
}

/**
 * 新建一个用于取消请求的 token
 */
export const newHttpCanceler = () => {
    const canceler = axios.CancelToken.source()
    return canceler
}

/**
 * get 请求不需要加密，因为没有请求体；只需要做签名即可
 * @param path 请求路径
 * @param query 查询参数
 * @returns 业务数据
 */
export const useGet = async  <T = any>(path: string, query?: Record<string, any>, options?: HttpOptions): Promise<HttpResponse<T>> => {
    const strQuery = query ? stringifyObj(query) : ""
    const tag = `【GET: ${path}?${strQuery}】`
    options ??= {
        retries: 3,
        autoRefreshToken: true,
    }
    options.token ??= useAccessToken().value || ''
    try {

        const headers: Record<string, string> = {}
        if (options.token) {
            headers['Authorization'] = `Bearer ${options.token}`
        }

        const resp = await httpInstance.get<T>(path, {
            params: query,
            headers: headers,
            responseType: 'json',
            cancelToken: options.cancelToken,
        } as AxiosRequestConfig<any>)
        if (resp.status != 200) {
            return { data: null, succeed: false, httpStatus: resp.status, httpStatusText: resp.statusText }
        }

        return { data: resp.data, succeed: true, httpStatus: resp.status, httpStatusText: resp.statusText }
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error(`【${path}【CANCELLED】 `)
            return { data: null, succeed: false, httpStatus: 0, httpStatusText: 'cancel' };
        }

        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status == 401) {
                if (!options.autoRefreshToken) throw error
                // 刷新 token，然后重试 
                const accessToken = useAccessToken()
                accessToken.value = null                // 清除原来的 token
                const refreshToken = useRefreshToken()
                if (!refreshToken.value) throw error

                const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
                console.log(`${tag} response 401, start refreshing. refresh token: ${refreshPath}`)
                const resp = await usePost<TokenPair>(refreshPath, undefined, undefined, {
                    retries: 3,
                    autoRefreshToken: false,
                    token: refreshToken.value,
                })
                if (!resp.data) throw error

                accessToken.value = resp.data.access_token
                refreshToken.value = resp.data.refresh_token
                return await useGet(path, query, { retries: 3, autoRefreshToken: false, token: accessToken.value })
            } else if ([500, 502, 503, 504].includes(error.response.status)) {
                if (options.retries > 0) {
                    await sleep(1000 * (4 - options.retries)); // 指数退避
                    options.retries--;
                    return await useGet(path, query, options);
                }
            }
        }
        console.error(`【${path}【FAILED】 error is:`, error)
        throw error
    }
}

/**
 * post 请求需要加密，因为有请求体；同时，还需要做签名
 * @param path 请求路径
 * @param query 查询参数
 * @returns 业务数据
 */
export const usePost = async  <T = any>(path: string, data?: Record<string, any>, query?: Record<string, any>, options?: HttpOptions): Promise<HttpResponse<T>> => {
    const strQuery = query ? stringifyObj(query) : ""
    const tag = `【POST: ${path}?${strQuery}】`
    options ??= {
        retries: 3,
        autoRefreshToken: true,
    }
    options.token ??= useAccessToken().value || ''
    try {
        const headers: Record<string, string> = {}
        if (options.token) {
            headers['Authorization'] = `Bearer ${options.token}`
        }
        const resp = await httpInstance.post<T>(path, data, {
            params: query,
            headers: headers,
            responseType: 'json',
            cancelToken: options.cancelToken,
        } as AxiosRequestConfig<any>)
        if (resp.status != 200) {
            return { data: null, succeed: false, httpStatus: resp.status, httpStatusText: resp.statusText }
        }

        return { data: resp.data, succeed: true, httpStatus: resp.status, httpStatusText: resp.statusText }
    } catch (error) {
        if (axios.isCancel(error)) {
            console.error(`【${path}【CANCELLED】 `)
            return { data: null, succeed: false, httpStatus: 0, httpStatusText: 'cancel' };
        }

        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status == 401) {
                if (!options.autoRefreshToken) throw error
                // 刷新 token，然后重试 
                const accessToken = useAccessToken()
                accessToken.value = null                // 清除原来的 token
                const refreshToken = useRefreshToken()
                if (!refreshToken.value) throw error

                const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
                console.log(`${tag} response 401, start refreshing. refresh token: ${refreshPath}`)
                const resp = await usePost<TokenPair>(refreshPath, undefined, undefined, {
                    retries: 3,
                    autoRefreshToken: false,
                    token: refreshToken.value,
                })
                if (!resp.data) throw error

                accessToken.value = resp.data.access_token
                refreshToken.value = resp.data.refresh_token
                return await usePost(path, data, query, { retries: 3, autoRefreshToken: false, token: accessToken.value })
            } else if ([500, 502, 503, 504].includes(error.response.status)) {
                if (options.retries > 0) {
                    await sleep(1000 * (4 - options.retries)); // 指数退避
                    options.retries--;
                    return await usePost(path, data, query, options);
                }
            }
        }
        console.error(`【${path}【FAILED】 error is:`, error)
        throw error
    }
}

export interface LoginParam {
    phone: string
    code: string
    secure_code: string
}

export const useLogin = async (param: LoginParam) => {
    const path = import.meta.env.VITE_API_LOGIN_PATH
    const resp = await usePost<ResponseDto<TokenPair>>(path, param)
    return resp
}
