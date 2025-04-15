import type { NuxtApp } from "#app"

export interface TokenPair {
    access_token: string
    refresh_token: string
}

/**
 * 获取 access token
 * @returns token
 */
export const safeGetAccessToken = async (ctx?: NuxtApp): Promise<string | undefined> => {
    if (ctx) {
        return await ctx.runWithContext(() => useCookie(import.meta.env.VITE_COOKIE_ACCESS_TOKEN_NAME).value) ?? undefined
    }
    return useCookie(import.meta.env.VITE_COOKIE_ACCESS_TOKEN_NAME).value ?? undefined
}

/**
 * 获取 refresh token
 * @returns token
 */
export const safeGetRefreshToken = async (ctx?: NuxtApp): Promise<string | null> => {
    if (ctx) {
        return await ctx.runWithContext(() => useCookie(import.meta.env.VITE_COOKIE_REFRESH_TOKEN_NAME).value) ?? null
    }
    return useCookie(import.meta.env.VITE_COOKIE_REFRESH_TOKEN_NAME).value ?? null
}

/**
 * 清除所有的 Token，包括 access token 和 refresh token
 * 在 logout 时会用到
 * @param ctx 
 */
export const clearTokens = async (ctx?: NuxtApp) => {
    const fn = () => {
        useCookie(import.meta.env.VITE_COOKIE_ACCESS_TOKEN_NAME).value = undefined
        useCookie(import.meta.env.VITE_COOKIE_REFRESH_TOKEN_NAME).value = undefined
    }
    if (ctx) {
        await ctx.runWithContext(fn)
    } else {
        fn()
    }
}