import { closeWebSocket, openWebSocket } from "~/workers/websocket"

export interface LoginParam {
    phone: string
    code: string
    secure_code: string
}

export const apiAuth = {
    login: async (param: LoginParam) =>{
        const res =await usePost<ResponseDto<null>>("/v1/auth/login", param)

        if (res.error.value === null &&  res.data.value?.code === RespCode.succeed) {
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
    logout:async () => {
        await usePost<ResponseDto<null>>("/v1/auth/logout") 
        // 客户端退出时，关闭websocket连接
        closeWebSocket()
    },
}