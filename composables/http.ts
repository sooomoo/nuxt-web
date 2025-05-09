/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AsyncData, AsyncDataRequestStatus, NuxtApp } from 'nuxt/app';
import { FetchError, type FetchResponse } from 'ofetch';

const signHeaderTimestamp = "x-timestamp";
const signHeaderNonce = "x-nonce";
const signHeaderSignature = "x-signature";
const signHeaderPlatform = "x-platform";
const signHeaderSession = "x-session";
const contentTypeEncrypted = "application/x-encrypted;charset=utf-8"

const platform = '8'

export interface HttpOptions {
    cacheKey?: string
    signal?: AbortSignal
    responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
    cookie?: string
    timeout?: number,
    autoHandle401?: boolean
}

const defaultFetchOptions: Record<string, any> = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    responseType: 'json',
    timeout: 15000,
    credentials: 'include',
    retry: 3,
    retryDelay: 1000,
}

const isRefreshTokenAvailable = (ctx?: NuxtApp): boolean => {
    if (!import.meta.server || ctx === null || ctx === undefined) {
        return true
    }
    const ctxHeaders = ctx?.ssrContext?.event.node.req.headers
    const cookie = ctxHeaders?.cookie ?? ""
    const cookies = cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
    const parsedCookies = parseCookies(cookies)
    const refreshToken = parsedCookies.find(c => c.name === import.meta.env.VITE_COOKIE_REFRESH_TOKEN_NAME)?.value ?? ''
    logger.tag('isRefreshTokenAvailable').debug(`refreshToken is: ${refreshToken}`)
    return refreshToken.length > 0
}

const getUserAgentAndCookies = (ctx?: NuxtApp): { userAgent: string, cookies: string[] } => {
    let cookies: string[] = []
    let userAgent: string = ''
    if (import.meta.server) {
        const ctxHeaders = ctx?.ssrContext?.event.node.req.headers
        const cookie = ctxHeaders?.cookie ?? ""
        userAgent = ctxHeaders?.['user-agent'] ?? ""
        cookies = cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
    } else if (import.meta.client) {
        cookies = document.cookie.split(';').map(c => c.trim()).filter(c => c.length > 0)
        userAgent = navigator.userAgent
    }
    return { userAgent, cookies }
}

const doRawFetch = async <TResp>(
    method: string,
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    ctx?: NuxtApp,
    options?: HttpOptions,
) => {
    const fetchLogger = logger.tag(`doFetchInternal: ${method} ${path}`)
    fetchLogger.debug(`ctx has value ? ${ctx !== null && ctx !== undefined}, running on ${import.meta.client ? 'CLIENT' : 'SERVER'}\n`)

    const headers = new Headers({ "Content-Type": "application/json" })
    const { userAgent, cookies } = getUserAgentAndCookies(ctx)
    if (import.meta.server) {
        headers.set('cookie', cookies.join(';'))
        headers.set('user-agent', userAgent)
    }
    if (options?.cookie) {
        headers.set('cookie', options.cookie)
    }

    fetchLogger.debug('cookies are: \n', cookies)

    const secrets = getSecuretsFromCookie(cookies)
    if (!secrets) {
        fetchLogger.error('获取会话密钥失败')
        throw new Error('获取会话密钥失败')
    }

    // 请求拦截：签名和加密
    const { boxKeyPair, signKeyPair, sessionId } = secrets
    const nonce = generateUUID()
    const timestamp = (Date.now() / 1000).toFixed()
    const strQuery = query ? stringifyObj(query) : ""
    const signData: Record<string, any> = {
        "session": sessionId,
        "nonce": nonce,
        "timestamp": timestamp,
        "platform": platform,
        "method": method,
        "path": path,
        "query": strQuery,
    }

    let finalBody = body as any
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
    fetchLogger.debug('request headers are: \n', headers)

    const response = await $fetch.raw<TResp>(path, {
        ...defaultFetchOptions,
        body: finalBody,
        query: query,
        method: method as any,
        headers: headers,
        responseType: options?.responseType ?? 'json',
        signal: options?.signal,
        timeout: options?.timeout ?? defaultFetchOptions.timeout,
    })
    // fetchLogger.debug('response', response)
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
        "method": method,
        "path": path,
        "query": strQuery,
        "body": respData,
    })

    if (!useSignVerify(respStr, respSignature)) {
        fetchLogger.warn(`【FAILED】签名验证失败`, respData)
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

    saveCookies(ctx ?? undefined, response.headers.getSetCookie())

    if ((options?.responseType ?? 'json') === 'json' && typeof respData === 'string' && respData.length > 0) {
        try {
            response._data = JSON.parse(respData)
        } catch (error) {
            fetchLogger.error(`【FAILED】解析响应数据失败`, respData, error)
        }
    } else {
        response._data = respData
    }
    return response
}

const isStatusError = (error: unknown, status: number) => error instanceof FetchError && (error.status === status || error.statusCode === status);

interface RefreshTokenArgs {
    ctx?: NuxtApp
    options?: HttpOptions
}

const onceRefreshTokenTask = callOncePromise<FetchResponse<unknown> | undefined, RefreshTokenArgs>((args) => {
    const { ctx, options } = args!
    const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
    return doRawFetch("POST", refreshPath, undefined, undefined, ctx, options)
});

const doFetch = async <TResp>(
    method: string,
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    ctx?: NuxtApp,
    options?: HttpOptions,
) => {
    logger.newlines('\n\n')
    let redirect = ''
    if (import.meta.client) {
        const pagePath = window.location.pathname + window.location.search
        redirect = pagePath === '/' || pagePath.startsWith('/login') ? '' : `?redirect=${encodeURIComponent(pagePath)}`
    } else if (import.meta.server && ctx) {
        const pagePath = ctx?._route?.fullPath ?? (ctx?.ssrContext?.event.node.req.url ?? '/')
        redirect =pagePath === '/' || pagePath.startsWith('/login') ? '' :  `?redirect=${encodeURIComponent(pagePath)}`
    } 
    logger.tag('doFetch').debug('redirect path is :', redirect)
    try {
        const res = await doRawFetch<TResp>(method, path, body, query, ctx, options)
        return res?._data as TResp
    } catch (error) {
        if (isStatusError(error, 401) && (options?.autoHandle401 ?? true)) {
            const refLog = logger.tag(`Handle 401: ${method} ${path}`)
            if (!isRefreshTokenAvailable(ctx)) {
                refLog.debug(`refresh token is not available.`)
                await navigateTo(import.meta.env.VITE_LOGIN_PAGE + redirect, { redirectCode: 302 })
                throw new Error('refresh token not available')
            }
            try {
                refLog.newlines('\n')
                refLog.debug(`start refresh token.`)
                const resRefresh = await onceRefreshTokenTask({ ctx: ctx })
                logger.tag('Handle 401').debug(`refresh token response.`, resRefresh)
                if (!resRefresh || resRefresh.status !== 200) {
                    throw error
                }

                logger.tag('Handle 401').debug(`refresh token success.`)
                // 重新发起请求
                const res = await doRawFetch<TResp>(method, path, body, query, ctx, {
                    ...options,
                    // 此处需要手动传递新的 cookie，因为在 ssr 时，刷新 token 返回的 cookie 还未同步到上下文中
                    cookie: resRefresh.headers.getSetCookie().join(';')
                })
                return res?._data as TResp
            } catch (error2) {
                refLog.error(`refresh token failed.`, error2)
                if (isStatusError(error2, 401)) {
                    await navigateTo(import.meta.env.VITE_LOGIN_PAGE + redirect, { redirectCode: 302 })
                    throw new Error('refresh token failed')
                }
            } finally {
                refLog.newlines('\n')
            }
        } else {
            logger.tag('doFetch').error(error)
        }
        throw error
    } finally {
        logger.newlines('\n\n')
    }
}

/**
 * 推荐调用此方法
 */
export const usePost = <TResp>(
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
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
 * 推荐调用此方法
 */
export const useGet = <TResp>(
    path: string,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
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