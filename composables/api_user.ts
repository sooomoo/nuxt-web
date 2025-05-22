export interface GetUserInfoResponse {
    id: string;
    name: string;
    avatarUrl: string;
    role: string;
    ipLatest: string;
}

class ApiUser {
    private readonly _getUserInfoOnce = callOncePromise(async () => {
        return await useGet<ResponseDto<GetUserInfoResponse>>("/v1/user/info");
    });

    getUserInfo() {
        return this._getUserInfoOnce();
    }
}

export const apiUser = new ApiUser();
