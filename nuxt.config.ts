// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [ '@nuxt/test-utils', '@nuxt/scripts'],
  css: [
    '@/assets/css/main.css',
    // '@/assets/css/fn.scss'
  ],
  typescript:{
    typeCheck: true
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/css/fn.scss";'
        }
      }
    }
  }
})