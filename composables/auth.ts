
export interface LoginParam {
    phone: string
    code: string
    secure_code: string
}

export const auth = {
    login: async (param: LoginParam) => {
        const path = import.meta.env.VITE_API_LOGIN_PATH
        const resp = await usePost<ResponseDto<TokenPair>>(path, param)
        return resp
    }
}