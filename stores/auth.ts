
const authLog = logger.tag('AuthStore')

export const useAuthStore = defineStore('auth', () => {
    const user = ref<GetUserInfoResponse | null>(null)
    const getUserInfo = async () => {
        const { data } = await apiUser.getUserInfo()
        if (data.value?.code === RespCode.succeed) {
            user.value = data.value.data
        } else {
            user.value = null
        }
    }
    const logout = async (redirectToLogin?: boolean) => {
        await apiAuth.logout(redirectToLogin)
        user.value = null
    }
    return { user, getUserInfo, logout }
})
