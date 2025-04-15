
import axios, { } from 'axios';
import type { NuxtApp } from 'nuxt/app';

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
}

interface HttpOptionsInternal extends HttpOptions {
    autoRefreshToken: boolean
    token?: string
}

/**
 * 新建一个用于取消请求的 token
 */
export const newHttpCanceler = () => axios.CancelToken.source()

// let refreshTokenPromise: Promise<TokenPair | undefined> | null = null;
// const doRefreshToken = async (nuxtCtx?: NuxtApp): Promise<TokenPair | undefined> => {
//     let refreshToken = await safeGetRefreshToken(nuxtCtx)
//     if (!refreshToken || refreshToken.length === 0) return
//     const refreshPath = import.meta.env.VITE_API_REFRESH_TOKEN_PATH
//     console.log(`[Handle 401], start refreshing. refresh token: ${refreshToken}`)
//     const opt: HttpOptionsInternal = { autoRefreshToken: false, token: refreshToken, }
//     return await usePost<TokenPair>(refreshPath, undefined, undefined, nuxtCtx, opt)
// }
// /**
//  * 
//  * @param error 
//  * @param autoRefreshToken 
//  * @param nuxtCtx 
//  * @returns 是否已被处理，true 表示已被处理，false 表示未被处理
//  */
// const handle401 = async <T>(error: unknown, autoRefreshToken: boolean, callback: () => Promise<T>, nuxtCtx?: NuxtApp): Promise<T | undefined> => {
//     if (!error || !autoRefreshToken) return
//     if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) return

//     if (refreshTokenPromise) {
//         // 等待刷新 token 完成
//         const tokens = await refreshTokenPromise
//         return tokens ? await callback() : undefined
//     }

//     refreshTokenPromise = doRefreshToken(nuxtCtx)
//     const tokens = await refreshTokenPromise
//     setTimeout(() => refreshTokenPromise = null, 5000); // 5s 后释放，防止重复刷新 token
//     return tokens ? await callback() : undefined
// }

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

const doFetch = async <TResp>(method: string, path: string, body?: Record<string, any>, query?: Record<string, any>,
    ctx?: NuxtApp, options?: HttpOptions) => {
    const secrets = await ensureSecurets(ctx)
    console.log(`doFetch secrets:`, secrets)
    const internalOpts = options as HttpOptionsInternal ?? { autoRefreshToken: true }
    internalOpts.token ??= await safeGetAccessToken(ctx)
    const resp = await fetchInstance<TResp>(path, {
        method: 'POST',
        body: body,
        query: query,
        secrets: secrets,
        __path: path,
        __nuxtCtx: ctx,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${internalOpts.token}`,
        }
    } as any)
    return resp
}

export const useFetchAsyncPost = <TResp>(
    path: string,
    body: Record<string, any>,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('POST', path, body, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('POST', path, body, query, ctx, options))
}

export const useFetchAsyncGet = <TResp>(
    path: string,
    query?: Record<string, any>,
    options?: HttpOptions
) => {
    return options?.cacheKey && options?.cacheKey.length > 0 ?
        useAsyncData<TResp>(options?.cacheKey, (ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options)) :
        useAsyncData<TResp>((ctx) => doFetch<TResp>('GET', path, undefined, query, ctx, options))
}