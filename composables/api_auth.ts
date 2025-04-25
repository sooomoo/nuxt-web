import { closeWebSocket, openWebSocket } from "~/workers/websocket"

export interface LoginParam {
    phone: string
    img_code: string
    msg_code: string
    csrf_token: string
}

export type LoginStatus = 'success' | 'error' | 'fail'

export interface PrepareLoginResponse {
    csrf_token: string
    image_data: string
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

        let pagePath = '/'
        if (import.meta.client) {
            pagePath = window.location.pathname + window.location.search
        }
        await navigateTo(import.meta.env.VITE_LOGIN_PAGE + `?redirect=${encodeURIComponent(pagePath)}`, { redirectCode: 302 })
    },
}