
/**
 * 此插件用于初始化会话密钥
 * 确保在第一次请求时会话密钥已准备好
 */
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:created', () => {
        ensureSecurets() // 本身就在 nuxt 上下文中，因此不需要传递 ctx
        logger.tag('init.server.ts').debug('app:created')
    })
})