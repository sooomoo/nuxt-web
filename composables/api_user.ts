
export const apiUser = {
    getUserInfo: () => useAsyncGet<ResponseDto<any>>("/v1/user/info"),
}