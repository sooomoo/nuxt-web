import type { NuxtApp } from 'nuxt/app';
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
        console.log('【onRequestError】 Failed to request', error)
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
    onResponseError: async ({ request, response, options, error }) => {
        console.log('【onResponseError】 Failed to fetch', response.status, response.statusText, error)
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
 * 在服务端渲染时不安全, 因为在 SSR 中无法调用 `useCookie`。
 * 如果确信是在 browser 中调用的，可以使用
 */
export const usePost = <TResp>(
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    if (import.meta.server) {
        console.warn(`usePost 在服务端渲染时不安全, 因为在 SSR 中无法调用 'useCookie'.`)
    }
    return doFetch<TResp>('POST', path, body, query, undefined, options)
}

/**
 * 在服务端渲染时不安全, 因为在 SSR 中无法调用 `useCookie`。
 * 如果确信是在 browser 中调用的，可以使用
 */
export const useGet = <TResp>(
    path: string,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    if (import.meta.server) {
        console.warn(`useGet 在服务端渲染时不安全, 因为在 SSR 中无法调用 'useCookie'.`)
    }
    return doFetch<TResp>('GET', path, undefined, query, undefined, options)
}

/**
 * 推荐调用此方法，在服务端渲染时可以调用 `useCookie`，客户端也是安全的
 */
export const useAsyncPost = <TResp>(
    path: string,
    body?: Record<string, any>,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('POST', path, body, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('POST', path, body, query, ctx, options))
}

/**
 * 推荐调用此方法，在服务端渲染时可以调用 `useCookie`，客户端也是安全的
 */
export const useAsyncGet = <TResp>(
    path: string,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options))
}