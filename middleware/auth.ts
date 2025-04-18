export default defineNuxtRouteMiddleware((_to, _from) => {
    logger.tag('AUTH').debug(`running on ${import.meta.server ? "SERVER" : "CLIENT"}`)
    // client 不需要处理这个，因为在 client 的时候获取不到 access token
    if (import.meta.client) return

    const parsedCookies = parseCookies(safeGetCookies())
    const access = parsedCookies.find(c => c.name === import.meta.env.VITE_COOKIE_ACCESS_TOKEN_NAME)?.value ?? ""
    logger.tag('AUTH').debug("access", access, parsedCookies)
    if (!access || access.length === 0) {
        return navigateTo(import.meta.env.VITE_LOGIN_PAGE, { redirectCode: 302 })
    }
})