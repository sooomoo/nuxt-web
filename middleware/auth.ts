export default defineNuxtRouteMiddleware((_to, _from) => {
    const access = useAccessToken()
    if (!access.value) {
        return navigateTo(import.meta.env.VITE_LOGIN_PAGE)
    }
})