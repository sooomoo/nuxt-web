export default defineNuxtRouteMiddleware(async (_to, _from) => {
    // skip middleware on server
    if (import.meta.server) return
    
    const access = await safeGetAccessToken()
    if (!access || access.length === 0) {
        return await navigateTo(import.meta.env.VITE_LOGIN_PAGE)
    }
})