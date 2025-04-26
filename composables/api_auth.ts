import { closeWebSocket, openWebSocket } from "~/workers/websocket"

export interface LoginParam {
    countryCode: string // 国家码，如 +86
    phone: string // 手机号
    imgCode: string // 图片验证码
    msgCode: string // 短信验证码
    csrfToken: string // csrf token 
}

export type LoginStatus = 'success' | 'error' | 'fail'

export interface PrepareLoginResponse {
    csrfToken: string
    imageData: string
}

export const apiAuth = {
    prepareLogin: async () => {
        return await usePost<ResponseDto<PrepareLoginResponse>>("/v1/auth/login/prepare")
    },
    login: async (param: LoginParam) => {
        const res = await usePost<ResponseDto<null>>("/v1/auth/login/do", param)
        if (res.error.value === null && res.data.value?.code === RespCode.succeed) {
            if (import.meta.client) {
                openWebSocket()
            } else {
                useNuxtApp().hooks.hookOnce('app:rendered', () => {
                    openWebSocket()
                })
            }
        }

        return res
    },
    logout: async (redirectToLogin?: boolean) => {
        await usePost<ResponseDto<null>>("/v1/auth/logout")
        // 客户端退出时，关闭websocket连接
        closeWebSocket()

        if (redirectToLogin !== true) {
            return // 不需要重定向到登录页，直接返回
        }
        let pagePath = '/'
        if (import.meta.client) {
            pagePath = window.location.pathname + window.location.search
        }
        navigateTo(import.meta.env.VITE_LOGIN_PAGE + `?redirect=${encodeURIComponent(pagePath)}`, { redirectCode: 302 })
    },
}