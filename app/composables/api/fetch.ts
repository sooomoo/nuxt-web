/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AsyncData, AsyncDataRequestStatus, NuxtApp } from "nuxt/app";
import { FetchError, type FetchResponse } from "ofetch";
// 备选:
// json-with-bigint
// json-bigint
// lossless-json
// import { isInteger, parse, stringify } from 'lossless-json';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import { callOncePromise, generateUUID, logger, stringifyObj, useDecrypt, useEncrypt, useSignData, useSignVerify } from "vuepkg";



// cookies
const cookieKeyPlatform = "pla"
const cookieKeySessionId = "sid"
const cookieKeyAccessToken = "acc"
const cookieKeyRefreshToken = "ref"
const cookieKeyClientId = "cli"
const cookieKeyCsrfToken = "csrf"
// headers 
const headerUserAgent = "User-Agent"
const headerCookie = "Cookie"
const headerContentType = "Content-Type"
const headerNonce = "X-Nonce"
const headerTimestamp = "X-Timestamp"
const headerSignature = "X-Signature"
// encrypt content-type
const encryptContentTypeJSON = "application/encrypt-json"
const encryptContentTypeText = "application/encrypt-text"

export class Fetcher {
    private ctx?: NuxtApp
    private retry: number = 3
    private retryDelay: number = 1000
    private timeout: number = 15000
    private cookie?: string
    private contentType?: string
    private autoHandle401: boolean = true

    constructor(ctx?: NuxtApp, retry?: number, retryDelay?: number, timeout?: number) {
        this.ctx = ctx
        this.retry = retry ?? this.retry
        this.retryDelay = retryDelay ?? this.retryDelay
        this.timeout = timeout ?? this.timeout
    }

    public setCookie = (cookie: string) => {
        this.cookie = cookie
    }
    public setContentType = (contentType: string) => {
        this.contentType = contentType
    }
    public setAutoHandle401 = (autoHandle401: boolean) => {
        this.autoHandle401 = autoHandle401
    }

    private splitCookies = (cookie: string) => {
        const cookies = cookie.split(";").map((c) => c.trim());
        return cookies.filter((c) => c.length > 0);
    }
    private isRefreshTokenAvailable = (): boolean => {
        if (!import.meta.server || this.ctx === null || this.ctx === undefined) {
            return true;
        }
        const ctxHeaders = this.ctx?.ssrContext?.event.node.req.headers;
        const cookies = this.splitCookies(ctxHeaders?.cookie ?? "");
        const parsedCookies = parseCookies(cookies);
        const config = useRuntimeConfig(this.ctx?.ssrContext?.event);
        const refreshName = config.public.refreshTokenName;
        const refreshToken = parsedCookies.find((c) => c.name === refreshName)?.value ?? "";
        logger.tag("isRefreshTokenAvailable").debug(`refreshToken is: ${refreshToken}`);
        return refreshToken.length > 0;
    };
    private getUserAgentAndCookies = (): { userAgent: string; cookies: string[] } => {
        let cookies: string[] = [];
        let userAgent: string = "";
        if (import.meta.server) {
            const ctxHeaders = this.ctx?.ssrContext?.event.node.req.headers;
            userAgent = ctxHeaders?.["user-agent"] ?? "";
            cookies = this.splitCookies(ctxHeaders?.cookie ?? "");
        } else if (import.meta.client) {
            cookies = this.splitCookies(document.cookie);
            userAgent = navigator.userAgent;
        }
        return { userAgent, cookies };
    };

    private doRawFetch = async (
        method: string,
        path: string,
        body?: Record<string, any>,
        query?: Record<string, any>,
        signal?: AbortSignal
    ) => {
        method = method.toUpperCase()
        path = path.toLowerCase()
        const fetchLogger = logger.tag(`doRawFetch: ${method} ${path}`);
        fetchLogger.debug(`ctx has value ? ${this.ctx !== null && this.ctx !== undefined}, running on ${import.meta.client ? "CLIENT" : "SERVER"}\n`);

        const headers = new Headers({ [headerContentType]: this.contentType ?? "application/json" });
        const { userAgent, cookies } = this.getUserAgentAndCookies();
        if (import.meta.server) {
            headers.set(headerCookie, cookies.join(";"));
            headers.set(headerUserAgent, userAgent);
        }
        if (this.cookie) {
            headers.set(headerCookie, this.cookie);
        }

        fetchLogger.debug("cookies are: \n", cookies);

        const secrets = getSecuretsFromCookie(cookies, this.ctx);
        if (!secrets) {
            fetchLogger.error("获取会话密钥失败");
            throw new Error("获取会话密钥失败");
        }

        // 请求拦截：签名和加密
        const { boxKeyPair, signKeyPair, sessionId } = secrets;
        const nonce = generateUUID();
        const timestamp = (Date.now() / 1000).toFixed();
        const strQuery = query ? stringifyObj(query) : "";
        const signData: Record<string, any> = { session: sessionId, nonce: nonce, timestamp: timestamp, method: method, path: path, query: strQuery };

        let finalBody = body as any;
        // 1. 加密请求体（仅针对 POST/PUT 请求）
        const config = useRuntimeConfig(this.ctx?.ssrContext?.event);
        if (body && ["post", "put"].includes(method.toLowerCase()) && config.public.enableCrypto === "true") {
            let reqData = JSON.stringify(body);
            reqData = useEncrypt(boxKeyPair, reqData, config.public.serverExPubKey);
            finalBody = reqData; // 替换原始数据为加密后的数据
            signData["body"] = bytesToHex(sha256(reqData));
            if (this.contentType?.toLowerCase() === 'application/json') {
                headers.set(headerContentType, encryptContentTypeJSON);
            } else if (this.contentType?.toLowerCase() === 'text/plain') {
                headers.set(headerContentType, encryptContentTypeText);
            }
        }
        const str = stringifyObj(signData);
        headers.set(headerTimestamp, timestamp);
        headers.set(headerNonce, nonce);
        headers.set(headerSignature, useSignData(signKeyPair, str));
        fetchLogger.debug("request headers are: \n", headers);

        const response = await $fetch.raw(path, {
            baseURL: useRuntimeConfig(this.ctx?.ssrContext?.event).public.apiBaseUrl,
            body: finalBody,
            query: query,
            method: method as any,
            headers: headers,
            signal: signal,
            responseType: "blob",
            ignoreResponseError: true,
            timeout: this.timeout,
            credentials: "include",
            retry: this.retry,
            retryDelay: this.retryDelay,
        });
        fetchLogger.debug('response', response)
        if (response.status !== 200) {
            return;
        }

        fetchLogger.debug("response data is: ", response);
        const respTimestamp = response.headers.get(headerTimestamp) ?? "";
        const respNonce = response.headers.get(headerNonce) ?? "";
        const respSignature = response.headers.get(headerSignature) ?? "";
        const contentType = (response.headers.get(headerContentType) ?? "").toLowerCase();
        fetchLogger.debug("response headers are: ", respTimestamp, respNonce, respSignature);

        let respBodyHash = ''
        let needDecrypt = contentType === encryptContentTypeJSON || contentType === encryptContentTypeText
        let respEncryptText = '';
        if (response._data instanceof Blob) {
            const respBytes = await response._data.arrayBuffer()
            const text = new TextDecoder().decode(respBytes);
            respBodyHash = bytesToHex(sha256(text));
            if (response._data.type === encryptContentTypeJSON || response._data.type === encryptContentTypeText) {
                respEncryptText = await response._data.text();
                needDecrypt = true // 需要解密
            }
        }

        fetchLogger.debug("response body hash is: ", respBodyHash);
        fetchLogger.debug("response body is: ", respEncryptText);
        const respStr = stringifyObj({ session: sessionId, nonce: respNonce, timestamp: respTimestamp, method: method, path: path, query: strQuery, body: respBodyHash });
        if (!useSignVerify(respStr, respSignature, config.public.serverSignPubKey)) {
            fetchLogger.warn(`【FAILED】签名验证失败`, respEncryptText);
            throw new Error("签名验证失败");
        }

        saveCookies(this.ctx, response.headers.getSetCookie());
        if (!needDecrypt) {
            return response;
        }

        const decryptedText = useDecrypt(boxKeyPair, respEncryptText, config.public.serverExPubKey);
        try {
            if (contentType === encryptContentTypeJSON) {
                response._data = JSON.parse(decryptedText);
            } else {
                response._data = decryptedText;
            }
        } catch (error) {
            fetchLogger.error(`【FAILED】解析响应数据失败`, respEncryptText, error);
        }

        return response;
    };

    private isStatusError = (error: unknown, status: number) =>
        error instanceof FetchError && (error.status === status || error.statusCode === status);


    private onceRefreshTokenTask = callOncePromise<FetchResponse<unknown> | undefined, AbortSignal>((signal?: AbortSignal) => {
        const config = useRuntimeConfig(this.ctx?.ssrContext?.event);
        const refreshPath = config.public.apiRefreshTokenPath;
        return this.doRawFetch("POST", refreshPath, undefined, undefined, signal);
    });

    public doFetch = async <TResp>(
        method: string,
        path: string,
        query?: Record<string, any>,
        body?: Record<string, any>,
        signal?: AbortSignal,
    ) => {
        logger.newlines("\n\n");
        let redirect = "";
        if (import.meta.client) {
            const pagePath = (window.location.pathname + window.location.search).toLowerCase();
            redirect = pagePath === "/" || pagePath.startsWith("/login") ? "" : `?redirect=${encodeURIComponent(pagePath)}`;
        } else if (import.meta.server && this.ctx) {
            const pagePath = this.ctx?._route?.fullPath ?? this.ctx?.ssrContext?.event.node.req.url ?? "/";
            redirect = pagePath === "/" || pagePath.startsWith("/login") ? "" : `?redirect=${encodeURIComponent(pagePath)}`;
        }
        logger.tag("doFetch").debug("redirect path is :", redirect);
        try {
            const res = await this.doRawFetch(method, path, body, query, signal);
            return res?._data as TResp;
        } catch (error) {
            if (this.isStatusError(error, 401) && this.autoHandle401) {
                const refLog = logger.tag(`Handle 401: ${method} ${path}`);
                if (!this.isRefreshTokenAvailable()) {
                    refLog.debug(`refresh token is not available.`);
                    const config = useRuntimeConfig(this.ctx?.ssrContext?.event);
                    await navigateTo(config.public.loginPage + redirect, {
                        redirectCode: 302,
                    });
                    throw new Error("refresh token not available");
                }
                try {
                    refLog.newlines("\n");
                    refLog.debug(`start refresh token.`);
                    const resRefresh = await this.onceRefreshTokenTask(signal);
                    logger.tag("Handle 401").debug(`refresh token response.`, resRefresh);
                    if (!resRefresh || resRefresh.status !== 200) {
                        throw error;
                    }

                    logger.tag("Handle 401").debug(`refresh token success.`);
                    // 重新发起请求
                    // 此处需要手动传递新的 cookie，因为在 ssr 时，刷新 token 返回的 cookie 还未同步到上下文中
                    this.setCookie(resRefresh.headers.getSetCookie().join(";"));
                    const res = await this.doRawFetch(method, path, body, query, signal);
                    return res?._data as TResp;
                } catch (error2) {
                    refLog.error(`refresh token failed.`, error2);
                    if (this.isStatusError(error2, 401)) {
                        const config = useRuntimeConfig(this.ctx?.ssrContext?.event);
                        await navigateTo(config.public.loginPage + redirect, {
                            redirectCode: 302,
                        });
                        throw new Error("refresh token failed");
                    }
                } finally {
                    refLog.newlines("\n");
                }
            } else {
                logger.tag("doFetch").error(error);
            }
            throw error;
        } finally {
            logger.newlines("\n\n");
        }
    };
}

/**
 * 推荐调用此方法
 */
export const usePost = <TResp>(path: string, body?: Record<string, any>, query?: Record<string, any>, signal?: AbortSignal, cacheKey?: string) => {
    if (import.meta.client) {
        const fetcher = new Fetcher();
        const res: AsyncData<TResp | null, FetchError> = {
            data: ref<TResp | null>(),
            error: ref<any>(null),
            status: ref<AsyncDataRequestStatus>("pending"),
            refresh: async () => {
                try {
                    res.status.value = "pending";
                    res.data.value = await fetcher.doFetch<TResp>("POST", path, query, body, signal);
                    res.status.value = "success";
                } catch (error) {
                    res.status.value = "error";
                    res.error.value = error as any;
                }
            },
            execute: async () => {
                try {
                    res.status.value = "pending";
                    res.data.value = await fetcher.doFetch<TResp>("POST", path, query, body, signal);
                    res.status.value = "success";
                } catch (error) {
                    res.status.value = "error";
                    res.error.value = error as any;
                }
            },
            clear: () => {
                res.data.value = null;
                res.error.value = undefined;
                res.status.value = "idle";
            },
        } as AsyncData<TResp | null, FetchError>;
        return new Promise<AsyncData<TResp | null, FetchError>>((resolve, reject) => {
            res.execute()
                .then(() => resolve(res))
                .catch((err) => reject(err));
        });
    }
    return cacheKey && cacheKey.length > 0
        ? useAsyncData<TResp>(cacheKey, (ctx) => {
            const fetcher = new Fetcher(ctx);
            return fetcher.doFetch<TResp>("POST", path, query, body, signal)
        })
        : useAsyncData<TResp>((ctx) => {
            const fetcher = new Fetcher(ctx);
            return fetcher.doFetch<TResp>("POST", path, query, body, signal)
        });
};

/**
 * 推荐调用此方法
 */
export const useGet = <TResp>(path: string, query?: Record<string, any>, signal?: AbortSignal, cacheKey?: string) => {
    if (import.meta.client) {
        const fetcher = new Fetcher();
        const res: AsyncData<TResp | null, FetchError> = {
            data: ref<TResp | null>(),
            error: ref<any>(null),
            status: ref<AsyncDataRequestStatus>("pending"),
            refresh: async () => {
                try {
                    res.status.value = "pending";
                    res.data.value = await fetcher.doFetch<TResp>("GET", path, query, undefined, signal);
                    res.status.value = "success";
                } catch (error) {
                    res.status.value = "error";
                    res.error.value = error as any;
                }
            },
            execute: async () => {
                try {
                    res.status.value = "pending";
                    res.data.value = await fetcher.doFetch<TResp>("GET", path, query, undefined, signal);
                    res.status.value = "success";
                } catch (error) {
                    res.status.value = "error";
                    res.error.value = error as any;
                }
            },
            clear: () => {
                res.data.value = null;
                res.error.value = undefined;
                res.status.value = "idle";
            },
        } as AsyncData<TResp | null, FetchError>;
        return new Promise<AsyncData<TResp | null, FetchError>>((resolve, reject) => {
            res.execute()
                .then(() => resolve(res))
                .catch((err) => reject(err));
        });
    }
    return cacheKey && cacheKey.length > 0
        ? useAsyncData<TResp>(cacheKey, (ctx) => {
            const fetcher = new Fetcher(ctx);
            return fetcher.doFetch<TResp>("GET", path, query, undefined, signal)
        })
        : useAsyncData<TResp>((ctx) => {
            const fetcher = new Fetcher(ctx);
            return fetcher.doFetch<TResp>("GET", path, query, undefined, signal)
        });
};
