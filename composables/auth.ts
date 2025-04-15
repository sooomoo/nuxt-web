export interface LoginParam {
    phone: string
    code: string
    secure_code: string
}

export const auth = {
    login: (param: LoginParam) => useAsyncPost<ResponseDto<TokenPair>>("/v1/auth/login", param, undefined)
}