import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import axios, { type AxiosRequestConfig, type CancelToken } from 'axios';
import type { AsyncDataOptions, NuxtError } from 'nuxt/app';
import type { AsyncData, KeysOf, PickFrom } from '#app/composables/asyncData';
import type { DefaultAsyncDataErrorValue } from 'nuxt/app/defaults';

const getPlatform = () => {
    const platform = useCookie('p')
    return platform.value || '8'
}

const isCryptoEnabled = () => {
    return import.meta.env.VITE_ENABLE_CRYPTO === 'true'
}

const decodeSecrets = (): [KeyPair, KeyPair, string] => {
    const sessionId = useCookie('sk')
    const clientKey = useCookie('ck')
    console.log('[decodeSecrets] sk is :', sessionId.value)
    console.log('[decodeSecrets] ck is :', clientKey.value)
    const pubKeys = decodeSecureString(sessionId.value || '')
    const priKeys = decodeSecureString(clientKey.value || '')
    const boxKeyPair = newBoxKeyPairFromArray(pubKeys.box!, priKeys.box!)
    const signKeyPair = newSignKeyPairFromArray(pubKeys.sign!, priKeys.sign!)
    console.log(`[decodeSecrets] decode from cookie `, sessionId, clientKey, signKeyPair, boxKeyPair)
    return [boxKeyPair, signKeyPair, sessionId.value || '']
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
    access: string
    refresh: string
}

// 创建一个实例并设置 baseURL
const httpInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    withCredentials: false,
    validateStatus: (_e: number) => true,
});

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
export const useAccessToken = () => {
    return useCookie('atk')
}

/**
 * 获取 refresh token
 * @returns token
 */
export const useRefreshToken = () => {
    return useCookie('rtk')
}

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
        const [boxKeyPair, signKeyPair, sessionId] = decodeSecrets()
        // 需要对请求进行签名
        const nonce = generateUUID()
        const timestamp = (Date.now() / 1000).toFixed()
        const platform = getPlatform()
        const str = stringifyObj({
            "session": sessionId,
            "nonce": nonce,
            "timestamp": timestamp,
            "platform": platform,
            "method": "GET",
            "path": path,
            "query": strQuery,
        })
        const reqSignature = useSignData(signKeyPair, str)
        console.log(`${tag} request BEGIN........`)
        console.log(`${tag} request data to sign: `, str)
        console.log(`${tag} request sign keypair: `, signKeyPair)
        console.log(`${tag} request signature: `, reqSignature)
        const headers: Record<string, string> = {
            [signHeaderPlatform]: platform,
            [signHeaderSession]: sessionId,
            [signHeaderTimestamp]: timestamp,
            [signHeaderNonce]: nonce,
            [signHeaderSignature]: reqSignature,
        }
        if (options.token) {
            headers['Authorization'] = `Bearer ${options.token}`
        }

        console.log(`${tag} request header: `, headers)
        console.log(`${tag} request END........`)

        const resp = await httpInstance.get<String>(path, {
            params: query,
            headers: headers,
            responseType: 'text',
            cancelToken: options.cancelToken,
        } as AxiosRequestConfig<any>)
        console.log(`${tag} response BEGIN........`)
        console.log(`${tag} response: `, resp)
        if (resp.status != 200 || typeof (resp.data) !== 'string') {
            return { data: null, succeed: false, httpStatus: resp.status, httpStatusText: resp.statusText }
        }

        const respTimestamp = resp.headers[signHeaderTimestamp] as string | undefined ?? ''
        const respNonce = resp.headers[signHeaderNonce] as string | undefined ?? ''
        const respSignature = resp.headers[signHeaderSignature] as string | undefined ?? ''
        const respStr = stringifyObj({
            "session": sessionId,
            "nonce": respNonce,
            "platform": platform,
            "timestamp": respTimestamp,
            "method": "GET",
            "path": path,
            "query": strQuery,
            "body": resp.data,
        })
        console.log(`${tag} response sign header: `, { respTimestamp, respNonce, respSignature })
        console.log(`${tag} response data to sign: `, respStr)
        if (!useSignVerify(respStr, respSignature)) {
            console.warn(`${tag} response sign verify: FAIL`)
            return { data: null, succeed: false, httpStatus: resp.status, httpStatusText: resp.statusText }
        }

        console.log(`${tag} response sign verify: PASS`)
        let respData = resp.data
        if (isCryptoEnabled() && resp.headers['Content-Type'] === contentTypeEncrypted) {
            // 解密
            console.log(`${tag} response <decrypt> BEFORE: `, resp.data)
            respData = useDecrypt(boxKeyPair, resp.data)
            console.log(`${tag} response <decrypt> AFTER: `, respData)
        }
        console.log(`${tag} response <JSON.parse> BEFORE: `, respData)
        const val = JSON.parse(respData)
        console.log(`${tag} response <JSON.parse> AFTER: `, val)
        return { data: val, succeed: true, httpStatus: resp.status, httpStatusText: resp.statusText }
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

                accessToken.value = resp.data.access
                refreshToken.value = resp.data.refresh
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
    } finally {
        console.log(`${tag} response END........`)
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
        const [boxKeyPair, signKeyPair, sessionId] = decodeSecrets()
        // 加密请求体
        let reqData = ''
        if (data) {
            reqData = JSON.stringify(data)
            if (isCryptoEnabled()) {
                reqData = useEncrypt(boxKeyPair, reqData)
            }
        }
        // 需要对请求进行签名
        const nonce = generateUUID()
        const timestamp = (Date.now() / 1000).toFixed()
        const platform = getPlatform()
        const str = stringifyObj({
            "session": sessionId,
            "nonce": nonce,
            "timestamp": timestamp,
            "platform": platform,
            "method": "POST",
            "path": path,
            "query": strQuery,
            "body": reqData,
        })

        const reqSignature = useSignData(signKeyPair, str)
        console.log(`${tag} request BEGIN........`)
        console.log(`${tag} request data: `, reqData)
        console.log(`${tag} request data to sign: `, str)
        console.log(`${tag} request sign keypair: `, signKeyPair)
        console.log(`${tag} request signature: `, reqSignature)
        const headers: Record<string, string> = {
            [signHeaderPlatform]: platform,
            [signHeaderSession]: sessionId,
            [signHeaderTimestamp]: timestamp,
            [signHeaderNonce]: nonce,
            [signHeaderSignature]: reqSignature,
        }
        if (options.token) {
            headers['Authorization'] = `Bearer ${options.token}`
        }
        if (isCryptoEnabled()) {
            headers['Content-Type'] = contentTypeEncrypted
        }

        console.log(`${tag} request header: `, headers)
        console.log(`${tag} request END........`)

        const resp = await httpInstance.post<String>(path, reqData, {
            params: query,
            headers: headers,
            responseType: 'text',
            cancelToken: options.cancelToken,
        } as AxiosRequestConfig<any>)
        console.log(`${tag} response BEGIN........`)
        console.log(`${tag} response: `, resp)
        if (resp.status != 200 || typeof (resp.data) !== 'string') {
            return { data: null, succeed: false, httpStatus: resp.status, httpStatusText: resp.statusText }
        }

        const respTimestamp = resp.headers[signHeaderTimestamp] as string | undefined ?? ''
        const respNonce = resp.headers[signHeaderNonce] as string | undefined ?? ''
        const respSignature = resp.headers[signHeaderSignature] as string | undefined ?? ''
        const respStr = stringifyObj({
            "session": sessionId,
            "nonce": respNonce,
            "platform": platform,
            "timestamp": respTimestamp,
            "method": "POST",
            "path": path,
            "query": strQuery,
            "body": resp.data,
        })
        console.log(`${tag} response sign header: `, { respTimestamp, respNonce, respSignature })
        console.log(`${tag} response data to sign: `, respStr)
        if (!useSignVerify(respStr, respSignature)) {
            console.warn(`${tag} response sign verify: FAIL`)
            return { data: null, succeed: false, httpStatus: resp.status, httpStatusText: resp.statusText }
        }

        console.log(`${tag} response sign verify: PASS`)
        let respData = resp.data
        if (isCryptoEnabled() && resp.headers['content-type'] == contentTypeEncrypted) {
            // 解密
            console.log(`${tag} response <decrypt> BEFORE: `, resp.data)
            respData = useDecrypt(boxKeyPair, resp.data)
            console.log(`${tag} response <decrypt> AFTER: `, respData)
        }
        console.log(`${tag} response <JSON.parse> BEFORE: `, respData)
        const val = JSON.parse(respData)
        console.log(`${tag} response <JSON.parse> AFTER: `, val)
        return { data: val, succeed: true, httpStatus: resp.status, httpStatusText: resp.statusText }
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

                accessToken.value = resp.data.access
                refreshToken.value = resp.data.refresh
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
    } finally {
        console.log(`${tag} response END........`)
    }
}


// export const useAsyncCacheKey = (path: string, query?: Record<string, any>, data?: Record<string, any>) => {
//     const strQuery = query ? stringifyObj(query) : ""
//     const strData = data ? blake3(JSON.stringify(data)) : ""
//     const hash = blake3(`${path}:${strQuery}:${strData}`)
//     return bytesToHex(hash)
// }

// /**
//  * 对 useAsyncData 和 useGet 进行封装，增加缓存功能
//  * 缓存的 key 是由 path、query 组成的，使用 blake3 进行 hash
//  * @param path  请求路径 
//  * @param query 查询参数
//  * @param options 
//  * @returns 
//  */
// export const useAsyncGet = <ResT = any, NuxtErrorDataT = any, DataT = ResT, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null>(
//     path: string, query?: Record<string, any>, httpOptions?: HttpOptions, options?: AsyncDataOptions<HttpResponse<ResT>, DataT, PickKeys, DefaultT>):
//     AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | DefaultAsyncDataErrorValue> => {
//     const cacheKey = useAsyncCacheKey(path, query)
//     return useAsyncData(cacheKey, () => useGet<ResT>(path, query, httpOptions), options)
// }

// /**
//  * 对 useAsyncData 和 usePost 进行封装，增加缓存功能
//  * 缓存的 key 是由 path、query 和 data 组成的，使用 blake3 进行 hash
//  * @param path  请求路径
//  * @param data  payload
//  * @param query 查询参数
//  * @param options 
//  * @returns 
//  */
// export const useAsyncPost = <ResT = any, NuxtErrorDataT = any, DataT = ResT, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null>(
//     path: string, data?: Record<string, any>, query?: Record<string, any>, httpOptions?: HttpOptions, options?: AsyncDataOptions<HttpResponse<ResT>, DataT, PickKeys, DefaultT>):
//     AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | DefaultAsyncDataErrorValue> => {
//     const cacheKey = useAsyncCacheKey(path, query, data)
//     console.log(`[useAsyncPost] cacheKey is: ${cacheKey}`)
//     return useAsyncData(cacheKey, async () => await usePost<ResT>(path, data, query, httpOptions), options)
// }
