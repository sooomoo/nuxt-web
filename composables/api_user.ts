
export const apiUser = {
    getUserInfo: () => useGet<ResponseDto<unknown>>("/v1/user/info"),
}