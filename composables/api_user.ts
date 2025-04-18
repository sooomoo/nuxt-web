
export const apiUser = {
    getUserInfo: () => useGet<ResponseDto<any>>("/v1/user/info", undefined, {
        cacheKey: "userInfo",
    }),
}