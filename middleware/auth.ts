export default defineNuxtRouteMiddleware(async (_to, _from) => {
    const access = await safeGetAccessToken()
    if (!access || access.length === 0) {
        return navigateTo(import.meta.env.VITE_LOGIN_PAGE)
    }
})