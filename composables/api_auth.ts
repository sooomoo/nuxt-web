export interface LoginParam {
    phone: string
    code: string
    secure_code: string
}

export const apiAuth = {
    login: (param: LoginParam) => useAsyncPost<ResponseDto<TokenPair>>("/v1/auth/login", param, undefined),
    logout:async () => {
        await useAsyncPost<ResponseDto<null>>("/v1/auth/logout")
        await clearTokens()
    },
}