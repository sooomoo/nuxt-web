/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AsyncData, AsyncDataRequestStatus, NuxtApp } from 'nuxt/app';
import { tryUseNuxt } from 'nuxt/kit';
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

const defaultFetchOptions: Record<string, any> = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    responseType: 'json',
    timeout: 15000,
    credentials: 'include',
    retry: 3,
    retryDelay: 1000,
}

const doFetchInternal = async <TResp>(
    method: string,
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    options?: HttpOptions,
) => {
    const ctx = tryUseNuxtApp()
    const secrets = await getSecurets(ctx ?? undefined)
    if (!secrets) {
        throw new Error('获取会话密钥失败')
    }
    // 请求拦截：签名和加密
    const { boxKeyPair, signKeyPair, sessionId } = secrets
    // 需要对请求进行签名
    const nonce = generateUUID()
    const timestamp = (Date.now() / 1000).toFixed()
    const strQuery = query ? stringifyObj(query) : ""
    const signData: Record<string, any> = {
        "session": sessionId,
        "nonce": nonce,
        "timestamp": timestamp,
        "platform": platform,
        "method": method,
        "path":  path,
        "query": strQuery, 
    }
 
    let finalBody = body as any
    const headers = new Headers({
        "Content-Type": "application/json",
    })
    if (import.meta.server) {
        const ctxHeaders = ctx?.ssrContext?.event.node.req.headers
        const cookie = ctxHeaders?.cookie ?? ""
        const userAgent = ctxHeaders?.['user-agent'] ?? ""
        headers.set('cookie', cookie)
        headers.set('user-agent', userAgent)
    }
    // 1. 加密请求体（仅针对 POST/PUT 请求）
    if (['post', 'put'].includes((method).toLowerCase())) {
        let reqData = ''
        // 先加密
        if (body) {
            reqData = JSON.stringify(body)
            if (import.meta.env.VITE_ENABLE_CRYPTO === 'true') {
                reqData = useEncrypt(boxKeyPair, reqData)
            }
        }
        finalBody = reqData; // 替换原始数据为加密后的数据
        signData['body'] = reqData
        headers.set('Content-Type', contentTypeEncrypted)
    }
    const str = stringifyObj(signData)
    const reqSignature = useSignData(signKeyPair, str)
    headers.set(signHeaderPlatform, platform)
    headers.set(signHeaderSession, sessionId)
    headers.set(signHeaderTimestamp, timestamp)
    headers.set(signHeaderNonce, nonce)
    headers.set(signHeaderSignature, reqSignature)

    const response = await $fetch.raw<TResp>(path, {
        ...defaultFetchOptions,
        body: finalBody,
        query: query,
        method: method as any,
        headers: headers,
        responseType: options?.responseType ?? 'json',
        signal: options?.signal,
    })
    if (response.status !== 200) {
        return
    }
 
    const respTimestamp = response.headers.get(signHeaderTimestamp) ?? ''
    const respNonce = response.headers.get(signHeaderNonce) ?? ''
    const respSignature = response.headers.get(signHeaderSignature) ?? ''
    let respData = response._data as any
    const respStr = stringifyObj({
        "session": sessionId,
        "nonce": respNonce,
        "platform": platform,
        "timestamp": respTimestamp,
        "method":  method,
        "path": path,
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

    if ( (options?.responseType ?? 'json') === 'json' && typeof respData === 'string') {
        response._data = JSON.parse(respData)
    } else {
        response._data = respData
    }
    return response
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
})

let refreshTokenPromise: Promise<any> | null = null;
const doRefreshToken = async (secrets: Secrets, cookie: string, ctx?: NuxtApp, signal?: AbortSignal): Promise<ResponseDto<TokenPair> | undefined> => {
    logger.tag('doRefreshToken').debug('start refreshing.')
    const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
    logger.tag('doRefreshToken').debug(`[doRefreshToken], start refreshing.`, refreshPath)
    return await fetchInstance(refreshPath, {
        method: 'POST',
        responseType: 'json',
        __secrets: secrets,
        __path: refreshPath,
        __nuxtCtx: ctx,
        signal: signal,
        headers: {
            'Cookie': cookie,
        }
    } as any)
}

const handle401 = async (secrets: Secrets, cookie: string, nuxtCtx?: NuxtApp, signal?: AbortSignal) => {
    try {
        if (refreshTokenPromise) {
            const results = await Promise.allSettled([refreshTokenPromise]);
            if (results[0].status === 'fulfilled' && results[0].value) {
                return results[0].value
            }
        }
        refreshTokenPromise = doRefreshToken(secrets, cookie, nuxtCtx, signal)
        const tokens = await refreshTokenPromise
        setTimeout(() => refreshTokenPromise = null, 5000); // 5s 后释放，防止重复刷新 token
        return tokens
    } catch (error) {
        refreshTokenPromise = null
        throw error
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
    // 在 SSR 过程中，fetch 请求不会自动携带 cookie，需要手动传递
    // 为了方便，此处统一处理
    const cookies = await safeGetCookies(ctx)
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; '),
    }
    logger.tag('doFetch').debug('headers 1', headers)
    // 此处传递 secrets 是为了此次请求的 secrets 保持一致
    // 服务端也是这样处理的，单个请求的 secrets 是一致的
    const secrets = await getSecurets(ctx)
    if (!secrets) {
        logger.tag('doFetch').error('cannot get secrets')
        throw new Error('secrets is null')
    }

    try {
        return await fetchInstance<TResp>(path, {
            method: method,
            body: body,
            query: query,
            __secrets: secrets,
            __path: path,
            __nuxtCtx: ctx,
            responseType: options?.responseType ?? 'json',
            signal: options?.signal,
            headers: headers,
        } as any)
    } catch (error) {
        logger.tag('doFetch').debug(`doFetch error`, error)
        if (error instanceof FetchError && (error.status === 401 || error.statusCode === 401)) {
            try {
                logger.tag('Handle 401').debug(`start refresh token.`)
                const tokens = await handle401(secrets, cookies.join(";"), ctx)
                logger.tag('Handle 401').debug(`refresh token resulut `, tokens)
                if (tokens) {
                    logger.tag('Handle 401').debug('running on server ?', import.meta.server)
                    // 刷新 token 成功，重新调用接口 

                    const cookies = await ctx?.runWithContext(() => {
                        return useRequestHeaders()
                    })

                    logger.tag('doFetch').debug(`refresh token success, start call again.`, ctx, cookies)
                    const headers2: Record<string, string> = {
                        'Content-Type': 'application/json',
                        // 'Cookie': cookies.join('; '),
                    }
                    logger.tag('doFetch').debug('headers 2', headers2, import.meta.server)
                    return await fetchInstance<TResp>(path, {
                        method: method,
                        body: body,
                        responseType: options?.responseType ?? 'json',
                        query: query,
                        __secrets: secrets,
                        __path: path,
                        __nuxtCtx: ctx,
                        signal: options?.signal,
                        headers: headers2,
                    } as any)
                }
            } catch (error) {
                logger.tag('Handle 401').error(`refresh token failed.`, error)
                if (error instanceof FetchError && (error.status === 401 || error.statusCode === 401)) {
                    await navigateTo(import.meta.env.VITE_LOGIN_PAGE, { redirectCode: 302 })
                    throw new Error('refresh token failed')
                }
            }
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
    logger.tag('usePost').debug(`${path} will run on ${import.meta.client ? 'CLIENT' : 'SERVER'}`, query, options, useRequestHeaders())
    if (import.meta.client) {
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
    logger.tag('useGet').debug(`${path} will run on ${import.meta.client ? 'CLIENT' : 'SERVER'}`, query, options, useRequestHeaders())
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
        return new Promise<AsyncData<TResp | null, FetchError>>((resolve, reject) => {
            res.execute().then(() => resolve(res)).catch(err => reject(err))
        })
    }
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options))
}