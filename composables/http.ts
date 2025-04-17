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
        logger.tag('onRequestError').error('failed to request', request, error)
    },
    onResponse({ request, response, options }) {
        if (response.status !== 200) {
            if (response.status === 401) {
                navigateTo('/login', { redirectCode: 302 })
            }
            return
        }

        const { boxKeyPair, sessionId } = (options as any).secrets as Secrets
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
    onResponseError: async ({ request, response, options, error }) => {
        logger.tag('onRequestError').error('failed to fetch', request, response.status, response.statusText, error)
    },
})

let refreshTokenPromise: Promise<ResponseDto<TokenPair> | undefined> | null = null;
const doRefreshToken = async (ctx?: NuxtApp): Promise<ResponseDto<TokenPair> | undefined> => {
    let refreshToken = await safeGetRefreshToken(ctx)
    if (!refreshToken || refreshToken.length === 0) return
    const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
    console.log(`[Handle 401], start refreshing. refresh token: ${refreshToken}`)
    const secrets = await ensureSecurets(ctx)
    return await fetchInstance<ResponseDto<TokenPair>>(refreshPath, {
        method: 'POST',
        secrets: secrets,
        __path: refreshPath,
        __nuxtCtx: ctx,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`,
        }
    } as any)
}

const handle401 = async (nuxtCtx?: NuxtApp) => {
    if (refreshTokenPromise) {
        // 等待刷新 token 完成
        return await refreshTokenPromise
    }

    refreshTokenPromise = doRefreshToken(nuxtCtx)
    const tokens = await refreshTokenPromise
    setTimeout(() => refreshTokenPromise = null, 5000); // 5s 后释放，防止重复刷新 token
    return tokens
}

const doFetch = async <TResp>(
    method: string,
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    ctx?: NuxtApp,
    options?: HttpOptions
) => {
    const callFn = async () => {
        const secrets = await ensureSecurets(ctx)
        const token = await safeGetAccessToken(ctx)
        return await fetchInstance<TResp>(path, {
            method: method,
            body: body,
            query: query,
            secrets: secrets,
            __path: path,
            __nuxtCtx: ctx,
            signal: options?.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        } as any)
    }
    try {
        return await callFn()
    } catch (error) {
        if (error instanceof FetchError) {
            if (error.status === 401 || error.statusCode === 401) {
                console.log(`[Handle 401] start refresh token.`)
                // 处理 401 错误
                const tokens = await handle401(ctx)
                if (tokens) {
                    console.log(`[Handle 401] refresh token success, retry call.`)
                    // 刷新 token 成功，重新调用接口
                    return await callFn()
                }
            }
        } else {
            console.log(`doFetch error is not a FetchError:`, error)
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
        let res: AsyncData<TResp | null, FetchError>
        res = {
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
        return new Promise<AsyncData<TResp | null, FetchError>>(async (resolve) => {
            await res.execute()
            resolve(res)
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
        let res: AsyncData<TResp | null, FetchError>
        res = {
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
        return new Promise<AsyncData<TResp | null, FetchError>>(async (resolve) => {
            await res.execute()
            resolve(res)
        })
    }
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options))
}