export interface LoginParam {
    phone: string
    code: string
    secure_code: string
}

export const auth = {
    login: (param: LoginParam) => useFetchAsyncPost<ResponseDto<TokenPair>>("/v1/auth/login", param, undefined),
    // logout:async () => {
    //     await useAsyncPost<ResponseDto<null>>("/v1/auth/logout", undefined, undefined)
    //     await clearTokens()
    // },
}