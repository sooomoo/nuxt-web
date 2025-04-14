/**
 * 此插件用于初始化会话密钥
 * 确保在第一次请求时会话密钥已准备好
 */
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:created', () => {
        ensureSecurets()
    })
})