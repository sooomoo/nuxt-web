
import axios, { type AxiosRequestConfig, type CancelToken } from 'axios';
import type { AsyncDataOptions, NuxtApp, NuxtError } from 'nuxt/app';
import type { AsyncData, KeysOf, PickFrom } from '#app/composables/asyncData';
import type { DefaultAsyncDataErrorValue } from 'nuxt/app/defaults';

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

const platform = '8'
// 创建一个实例并设置 baseURL
const httpInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
    withCredentials: true,
    validateStatus: (code: number) => code === 200,
});

httpInstance.interceptors.request.use(async (config) => {
    const { boxKeyPair, signKeyPair, sessionId } = (config as any).secrets as Secrets
    // 需要对请求进行签名
    const nonce = generateUUID()
    const timestamp = (Date.now() / 1000).toFixed()
    const strQuery = config.params ? stringifyObj(config.params) : ""
    const signData: Record<string, any> = {
        "session": sessionId,
        "nonce": nonce,
        "timestamp": timestamp,
        "platform": "8",
        "method": "POST",
        "path": config.url,
        "query": strQuery,
        "authorization": config.headers['Authorization'] || '',
    }
    // 1. 加密请求体（仅针对 POST/PUT 请求）
    if (['post', 'put'].includes((config.method ?? '').toLowerCase())) {
        let reqData = ''
        // 先加密
        if (config.data) {
            reqData = JSON.stringify(config.data)
            if (import.meta.env.VITE_ENABLE_CRYPTO === 'true') {
                reqData = useEncrypt(boxKeyPair, reqData)
            }
        }
        config.data = reqData; // 替换原始数据为加密后的数据
        signData['body'] = reqData
        config.headers['Content-Type'] = contentTypeEncrypted
    }
    const str = stringifyObj(signData)
    const reqSignature = useSignData(signKeyPair, str)
    config.headers[signHeaderPlatform] = "8"
    config.headers[signHeaderSession] = sessionId
    config.headers[signHeaderTimestamp] = timestamp
    config.headers[signHeaderNonce] = nonce
    config.headers[signHeaderSignature] = reqSignature
    return config;
})

httpInstance.interceptors.response.use(
    resp => {
        // 2xx 范围内的状态码都会触发该函数。
        const { boxKeyPair, sessionId } = (resp.config as any).secrets as Secrets
        const strQuery = resp.config.params ? stringifyObj(resp.config.params) : ""
        const respTimestamp = resp.headers[signHeaderTimestamp] as string | undefined ?? ''
        const respNonce = resp.headers[signHeaderNonce] as string | undefined ?? ''
        const respSignature = resp.headers[signHeaderSignature] as string | undefined ?? ''

        const respStr = stringifyObj({
            "session": sessionId,
            "nonce": respNonce,
            "platform": "8",
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
        if (import.meta.env.VITE_ENABLE_CRYPTO === 'true' && resp.headers['content-type'] == contentTypeEncrypted) {
            respData = useDecrypt(boxKeyPair, resp.data)
        }
        resp.data = JSON.parse(respData)
        return resp;
    }, async error => {
        console.log('error', error)
        if (axios.isCancel(error)) {
            return null;
        }

        const config = error.config;
        // 仅重试 500～600 范围内的错误；对于 401 问题，在具体请求里面处理
        // 因为它可能需要重新登录
        if (config && axios.isAxiosError(error) && error.response && error.response.status >= 500 && error.response.status < 600) {
            // 如果没有设置重试次数或者已经重试过了，则不进行重试
            if (!config || !config.retry) return error;

            // 设置一个计数器，用于记录重试次数
            config.__retryCount = config.__retryCount || 0;

            // 如果重试次数小于设定的最大重试次数，则进行重试
            if (config.__retryCount >= config.retry) return error;
            config.__retryCount += 1;
            // 创建一个新的 promise 来等待一段时间后再进行重试 
            await sleep(1000 * config.__retryCount); // 指数退避

            return await httpInstance(config);
        }

        return error;
    })

export interface HttpOptions {
    cacheKey?: string
    cancelToken?: CancelToken
}

interface HttpOptionsInternal extends HttpOptions {
    autoRefreshToken: boolean
    token?: string
}

/**
 * 新建一个用于取消请求的 token
 */
export const newHttpCanceler = () => axios.CancelToken.source()


let refreshTokenPromise: Promise<TokenPair | undefined> | null = null;
const doRefreshToken = async (nuxtCtx?: NuxtApp): Promise<TokenPair | undefined> => {
    let refreshToken = await safeGetRefreshToken(nuxtCtx)
    if (!refreshToken || refreshToken.length === 0) return
    const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
    console.log(`[Handle 401], start refreshing. refresh token: ${refreshToken}`)
    const opt: HttpOptionsInternal = { autoRefreshToken: false, token: refreshToken, }
    return await usePost<TokenPair>(refreshPath, undefined, undefined, nuxtCtx, opt)
}
/**
 * 
 * @param error 
 * @param autoRefreshToken 
 * @param nuxtCtx 
 * @returns 是否已被处理，true 表示已被处理，false 表示未被处理
 */
const handle401 = async <T>(error: unknown, autoRefreshToken: boolean, callback: () => Promise<T>, nuxtCtx?: NuxtApp): Promise<T | undefined> => {
    if (!error || !autoRefreshToken) return
    if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) return

    if (refreshTokenPromise) {
        // 等待刷新 token 完成
        const tokens = await refreshTokenPromise
        return tokens ? await callback() : undefined
    }

    refreshTokenPromise = doRefreshToken(nuxtCtx)
    const tokens = await refreshTokenPromise
    setTimeout(() => refreshTokenPromise = null, 5000); // 5s 后释放，防止重复刷新 token
    return tokens ? await callback() : undefined
}

/**
 * get 请求不需要加密，因为没有请求体；只需要做签名即可
 * @param path 请求路径
 * @param query 查询参数
 * @returns 业务数据
 */
export const useGet = async  <T = any>(
    path: string,
    query?: Record<string, any>,
    nuxtCtx?: NuxtApp,
    options?: HttpOptions
): Promise<T> => {
    const tag = `【GET: ${path}】`
    const internalOpts = options as HttpOptionsInternal ?? { autoRefreshToken: true }
    internalOpts.token ??= await safeGetAccessToken(nuxtCtx)
    try {
        const secrets = await ensureSecurets(nuxtCtx)
        console.log(`${tag} secrets:`, secrets)
        const headers: Record<string, string> = {}
        if (internalOpts.token) headers['Authorization'] = `Bearer ${internalOpts.token}`

        const resp = await httpInstance.get<T>(path, {
            params: query,
            headers: headers,
            responseType: 'json',
            cancelToken: internalOpts.cancelToken,
            retry: 3,
            secrets: secrets,
        } as AxiosRequestConfig<any>)
        await saveCookies(nuxtCtx, resp.headers['set-cookie']) // 保存 cookie
        return resp.data
    } catch (error) {
        const res = await handle401<T>(error, internalOpts.autoRefreshToken, async () => {
            return await useGet<T>(path, query, nuxtCtx, { autoRefreshToken: false } as HttpOptionsInternal)
        }, nuxtCtx)
        if (res) return res
        console.error(`${tag}【FAILED】 error is:`, error)
        throw error
    }
}

/**
 * post 请求需要加密，因为有请求体；同时，还需要做签名
 * @param path 请求路径
 * @param query 查询参数
 * @returns 业务数据
 */
export const usePost = async  <T = any>(
    path: string,
    data?: Record<string, any>,
    query?: Record<string, any>,
    nuxtCtx?: NuxtApp,
    options?: HttpOptions
): Promise<T> => {
    const tag = `【POST: ${path}】`
    const internalOpts = options as HttpOptionsInternal ?? { autoRefreshToken: true }
    internalOpts.token ??= await safeGetAccessToken(nuxtCtx)
    try {
        const secrets = await ensureSecurets(nuxtCtx)
        console.log(`${tag} secrets:`, secrets)
        const headers: Record<string, string> = {}
        if (internalOpts.token) headers['Authorization'] = `Bearer ${internalOpts.token}`
        const resp = await httpInstance.post<T>(path, data, {
            params: query,
            headers: headers,
            responseType: 'json',
            cancelToken: internalOpts.cancelToken,
            retry: 3,
            secrets: secrets,
        } as AxiosRequestConfig<any>)
        await saveCookies(nuxtCtx, resp.headers['set-cookie']) // 保存 cookie
        return resp.data
    } catch (error) {
        const res = await handle401<T>(error, internalOpts.autoRefreshToken, async () => {
            return await usePost(path, data, query, nuxtCtx, { autoRefreshToken: false } as HttpOptionsInternal)
        }, nuxtCtx)
        if (res) return res
        console.error(`${tag}【FAILED】 error is:`, error)
        throw error
    }
}

/**
 * 对 useAsyncData 和 useGet 进行封装 
 * @param path  请求路径 
 * @param query 查询参数
 * @param options 
 * @returns 
 */
export const useAsyncGet = <ResT = any, NuxtErrorDataT = any, DataT = ResT, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null>(
    path: string,
    query?: Record<string, any>,
    httpOptions?: HttpOptions,
    options?: AsyncDataOptions<ResT, DataT, PickKeys, DefaultT>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | DefaultAsyncDataErrorValue> => {
    return httpOptions?.cacheKey ?
        useAsyncData(httpOptions.cacheKey, (ctx) => useGet<ResT>(path, query, ctx, httpOptions), options) :
        useAsyncData((ctx) => useGet<ResT>(path, query, ctx, httpOptions), options)
}

/**
 * 对 useAsyncData 和 usePost 进行封装 
 * @param path  请求路径
 * @param data  payload
 * @param query 查询参数
 * @param options 
 * @returns 
 */
export const useAsyncPost = <ResT = any, NuxtErrorDataT = any, DataT = ResT, PickKeys extends KeysOf<DataT> = KeysOf<DataT>, DefaultT = null>(
    path: string,
    data?: Record<string, any>,
    query?: Record<string, any>,
    httpOptions?: HttpOptions,
    options?: AsyncDataOptions<ResT, DataT, PickKeys, DefaultT>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | DefaultAsyncDataErrorValue> => {
    return httpOptions?.cacheKey ?
        useAsyncData(httpOptions.cacheKey, async (ctx) => await usePost<ResT>(path, data, query, ctx, httpOptions), options) :
        useAsyncData(async (ctx) => await usePost<ResT>(path, data, query, ctx, httpOptions), options)
}


const fetchInstance = $fetch.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    responseType: 'json',
    timeout: 15000,
    credentials: 'include',
    retry: 3,
    retryDelay: 1000,
    async onRequest({ request, options }) {
        // 请求拦截：签名和加密
        const { boxKeyPair, signKeyPair, sessionId } = (options as any).secrets as Secrets
        // 需要对请求进行签名
        const nonce = generateUUID()
        const timestamp = (Date.now() / 1000).toFixed()
        const strQuery = options.query ? stringifyObj(options.query) : ""
        const signData: Record<string, any> = {
            "session": sessionId,
            "nonce": nonce,
            "timestamp": timestamp,
            "platform": platform,
            "method": options.method,
            "path": (options as any).__path,
            "query": strQuery,
            "authorization": options.headers.get('Authorization') ?? '',
        }
        // 1. 加密请求体（仅针对 POST/PUT 请求）
        if (['post', 'put'].includes((options.method ?? '').toLowerCase())) {
            let reqData = ''
            // 先加密
            if (options.body) {
                reqData = JSON.stringify(options.body)
                if (import.meta.env.VITE_ENABLE_CRYPTO === 'true') {
                    reqData = useEncrypt(boxKeyPair, reqData)
                }
            }
            options.body = reqData; // 替换原始数据为加密后的数据
            signData['body'] = reqData
            options.headers.set('Content-Type', contentTypeEncrypted)
        }
        const str = stringifyObj(signData)
        const reqSignature = useSignData(signKeyPair, str)
        options.headers.set(signHeaderPlatform, platform)
        options.headers.set(signHeaderSession, sessionId)
        options.headers.set(signHeaderTimestamp, timestamp)
        options.headers.set(signHeaderNonce, nonce)
        options.headers.set(signHeaderSignature, reqSignature)
    },
    onRequestError({ request, options, error }) {
        console.log('【onRequestError】 Failed to request', request, options, error)
    },
    onResponse({ request, response, options }) {
        if (response.status !== 200) {
            return
        }
        const { boxKeyPair, sessionId } = (options as any).secrets as Secrets
        const strQuery = options.query ? stringifyObj(options.query) : ""
        const respTimestamp = response.headers.get(signHeaderTimestamp) ?? ''
        const respNonce = response.headers.get(signHeaderNonce) ?? ''
        const respSignature = response.headers.get(signHeaderSignature) ?? ''
        console.log(`onResponse【verify】1`, respSignature)
        let respData = response._data
        console.log(`onResponse【verify】2`, respData)
        const respStr = stringifyObj({
            "session": sessionId,
            "nonce": respNonce,
            "platform": platform,
            "timestamp": respTimestamp,
            "method": options.method,
            "path": (options as any).__path,
            "query": strQuery,
            "body": respData,
        })
        console.log(`onResponse【verify】3`, respStr)
        if (!useSignVerify(respStr, respSignature)) {
            console.log(`onResponse【FAILED】签名验证失败`, respData)
            throw new Error('签名验证失败')
        }
        const contentType = response.headers.get('content-type') ?? ''

        if (import.meta.env.VITE_ENABLE_CRYPTO === 'true' && contentType == contentTypeEncrypted) {
            respData = useDecrypt(boxKeyPair, respData)
        }

        saveCookies((options as any).__nuxtCtx, response.headers.getSetCookie())
        response._data = JSON.parse(respData)
    },
    onResponseError({ request, response, options }) {
        console.log('【onResponseError】 Failed to fetch', response, options)
    },
})

export const useFetchAsyncPost = <TResp>(path: string, body: Record<string, any>, cacheKey?: string) => {
    const fn = async (ctx?: NuxtApp) => {
        const secrets = await ensureSecurets(ctx)
        console.log(`useF secrets:`, secrets)
        const resp = await fetchInstance<ResponseDto<TResp>>(path, {
            method: 'POST',
            body: body,
            secrets: secrets,
            __path: path,
            __nuxtCtx: ctx,
            headers: {
                'Content-Type': 'application/json',
            }
        } as any)
        return resp
    }
    return cacheKey && cacheKey.length > 0 ?
        useAsyncData<ResponseDto<TResp>>(cacheKey, fn) :
        useAsyncData<ResponseDto<TResp>>(fn)
}

export const useFetchAsyncGet = <TResp>(path: string, query?: Record<string, any>, cacheKey?: string) => {
    const fn = async (ctx?: NuxtApp) => {
        const secrets = await ensureSecurets(ctx)
        console.log(`useF secrets:`, secrets)
        const resp = await fetchInstance<ResponseDto<TResp>>(path, {
            method: 'GET',
            query: query,
            secrets: secrets,
            __path: path,
            __nuxtCtx: ctx,
            headers: {
                'Content-Type': 'application/json',
            }
        } as any)
        return resp
    }
    return cacheKey && cacheKey.length > 0 ?
        useAsyncData<ResponseDto<TResp>>(cacheKey, fn) :
        useAsyncData<ResponseDto<TResp>>(fn)
}