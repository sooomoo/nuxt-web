/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AsyncData, AsyncDataRequestStatus, NuxtApp } from 'nuxt/app';
import { FetchError } from 'ofetch';

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

export interface HttpOptions {
    cacheKey?: string
    signal?: AbortSignal
    responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
}

const fetchInstance = $fetch.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    responseType: 'json',
    timeout: 15000,
    credentials: 'include',
    retry: 3,
    retryDelay: 1000,
    async onRequest({ options }) {
        // 请求拦截：签名和加密
        const { boxKeyPair, signKeyPair, sessionId } = (options as any).__secrets as Secrets
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
            // "authorization": options.headers.get('Authorization') ?? '',
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
    onResponse({ response, options }) {
        if (response.status !== 200) {
            if (response.status === 401) {
                navigateTo(import.meta.env.VITE_LOGIN_PAGE, { redirectCode: 302 })
            }
            return
        }

        const { boxKeyPair, sessionId } = (options as any).__secrets as Secrets
        const strQuery = options.query ? stringifyObj(options.query) : ""
        const respTimestamp = response.headers.get(signHeaderTimestamp) ?? ''
        const respNonce = response.headers.get(signHeaderNonce) ?? ''
        const respSignature = response.headers.get(signHeaderSignature) ?? ''
        let respData = response._data
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
        if (!useSignVerify(respStr, respSignature)) {
            logger.tag('onResponse').warn(`【FAILED】签名验证失败`, respData)
            throw new Error('签名验证失败')
        }

        const contentType = response.headers.get('content-type') ?? ''
        if (contentType == contentTypeEncrypted) {
            respData = useDecrypt(boxKeyPair, respData)
            const rawType = response.headers.get('x-raw-type') ?? ''
            if (rawType) {
                response.headers.set('content-type', rawType)
            }
        }

        saveCookies((options as any).__nuxtCtx, response.headers.getSetCookie())

        if (options.responseType === 'json' && typeof respData === 'string') {
            response._data = JSON.parse(respData)
        } else {
            response._data = respData
        }
    },
    onResponseError({ request, response, error }) {
        logger.tag('onResponseError').error(`【FAILED】请求失败`, request, response, error)
    }
})

let refreshTokenPromise: Promise<ResponseDto<TokenPair> | undefined> | null = null;
const doRefreshToken = async (ctx?: NuxtApp): Promise<ResponseDto<TokenPair> | undefined> => {
    logger.tag('doRefreshToken').debug('start refreshing.')
    const refreshToken = await safeGetRefreshToken(ctx)
    if (!refreshToken || refreshToken.length === 0) return
    const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
    logger.tag('doRefreshToken').debug(`[doRefreshToken], start refreshing. refresh token: ${refreshToken}`, refreshPath)
    const secrets = getSecurets()
    return await fetchInstance<ResponseDto<TokenPair>>(refreshPath, {
        method: 'POST',
        __secrets: secrets,
        __path: refreshPath,
        __nuxtCtx: ctx,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
        }
    } as any)
}

const handle401 = async (nuxtCtx?: NuxtApp) => {
    try {
        if (refreshTokenPromise) {
            const results = await Promise.allSettled([refreshTokenPromise]);
            if (results[0].status === 'fulfilled') {
                // 等待刷新 token 完成
                return await refreshTokenPromise
            }
        }
        refreshTokenPromise = doRefreshToken(nuxtCtx)
        const tokens = await refreshTokenPromise
        setTimeout(() => refreshTokenPromise = null, 5000); // 5s 后释放，防止重复刷新 token
        return tokens
    } catch (error) {
        logger.tag('handle401').error(`refresh token failed.`, error)
        refreshTokenPromise = null
    }
}

const doFetch = async <TResp>(
    method: string,
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    ctx?: NuxtApp,
    options?: HttpOptions,
) => {
    const callFn = async () => {
        // 在 SSR 过程中，fetch 请求不会自动携带 cookie，需要手动传递
        // 为了方便，此处统一处理
        const cookies = safeGetCookies()
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Cookie': cookies.join('; '),
        }
        logger.tag('doFetch').debug('headers', headers)
        const secrets = getSecurets()
        if (!secrets) {
            logger.tag('doFetch').error('cannot get secrets')
            throw new Error('secrets is null')
        }
        return await fetchInstance<TResp>(path, {
            method: method,
            body: body,
            responseType: options?.responseType ?? 'json',
            query: query,
            __secrets: secrets,
            __path: path,
            __nuxtCtx: ctx,
            signal: options?.signal,
            headers: headers
        } as any)
    }
    try {
        return await callFn()
    } catch (error) {
        if (error instanceof FetchError) {
            if (error.status === 401 || error.statusCode === 401) {
                logger.tag('Handle 401').debug(`start refresh token.`)
                // 处理 401 错误
                const tokens = await handle401(ctx)
                if (tokens) {
                    logger.tag('Handle 401').debug(`refresh token success, retry call.`)
                    // 刷新 token 成功，重新调用接口
                    return await callFn()
                } else {
                    logger.tag('Handle 401').debug(`refresh token failed.`)
                }
            }
        } else {
            logger.tag('doFetch').debug(`doFetch error`, error)
        }
        throw error
    }
}

/**
 * 推荐调用此方法，在服务端渲染时可以调用 `useCookie`，客户端也是安全的
 */
export const usePost = <TResp>(
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    logger.tag('usePost').debug(`${path} will run on ${import.meta.client ? 'CLIENT' : 'SERVER'}`, query, options)
    if (import.meta.client) {
        // let res: AsyncData<TResp | null, FetchError>
        const res: AsyncData<TResp | null, FetchError> = {
            data: ref<TResp | null>(),
            error: ref<any>(null),
            status: ref<AsyncDataRequestStatus>('pending'),
            refresh: async () => {
                try {
                    res.status.value = 'pending'
                    res.data.value = await doFetch<TResp>('POST', path, body, query, undefined, options)
                    res.status.value = 'success'
                } catch (error) {
                    res.status.value = 'error'
                    res.error.value = error as any
                }
            },
            execute: async () => {
                try {
                    res.status.value = 'pending'
                    res.data.value = await doFetch<TResp>('POST', path, body, query, undefined, options)
                    res.status.value = 'success'
                } catch (error) {
                    res.status.value = 'error'
                    res.error.value = error as any
                }
            },
            clear: () => {
                res.data.value = null
                res.error.value = null
                res.status.value = 'idle'
            }
        } as AsyncData<TResp | null, FetchError>
        return new Promise<AsyncData<TResp | null, FetchError>>((resolve, reject) => {
            res.execute().then(() => resolve(res)).catch(err => reject(err))
        })
    }
    return (options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('POST', path, body, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('POST', path, body, query, ctx, options)))
}

/**
 * 推荐调用此方法，在服务端渲染时可以调用 `useCookie`，客户端也是安全的
 */
export const useGet = <TResp>(
    path: string,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    logger.tag('useGet').debug(`${path} will run on ${import.meta.client ? 'CLIENT' : 'SERVER'}`, query, options)
    if (import.meta.client) {
        const res: AsyncData<TResp | null, FetchError> = {
            data: ref<TResp | null>(),
            error: ref<any>(null),
            status: ref<AsyncDataRequestStatus>('pending'),
            refresh: async () => {
                try {
                    res.status.value = 'pending'
                    res.data.value = await doFetch<TResp>('GET', path, undefined, query, undefined, options)
                    res.status.value = 'success'
                } catch (error) {
                    res.status.value = 'error'
                    res.error.value = error as any
                }
            },
            execute: async () => {
                try {
                    res.status.value = 'pending'
                    res.data.value = await doFetch<TResp>('GET', path, undefined, query, undefined, options)
                    res.status.value = 'success'
                } catch (error) {
                    res.status.value = 'error'
                    res.error.value = error as any
                }
            },
            clear: () => {
                res.data.value = null
                res.error.value = null
                res.status.value = 'idle'
            }
        } as AsyncData<TResp | null, FetchError>
        return new Promise<AsyncData<TResp | null, FetchError>>(  (resolve, reject) => {
            res.execute().then(() => resolve(res)).catch(err => reject(err))
        })
    }
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options))
}