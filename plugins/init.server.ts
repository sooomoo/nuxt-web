
/**
 * 此插件用于初始化会话密钥
 * 确保在第一次请求时会话密钥已准备好
 */
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:created', () => {
        ensureSecurets() // 本身就在 nuxt 上下文中，因此不需要传递 ctx
        const platform = useCookie('pla',{
            path:'/',
            httpOnly:true,
            sameSite:'strict',
            secure: import.meta.dev ? false : true,
        })
        platform.value = '8'
        const clientId = useCookie('cli',{
            path:'/',
            httpOnly:true,
            sameSite:'strict',
            secure: import.meta.dev? false : true,
        })
        if (!clientId.value || clientId.value.length != 32) {
            clientId.value = generateUUID()
        }
        logger.tag('init.server.ts').debug('app:created')
    })
})