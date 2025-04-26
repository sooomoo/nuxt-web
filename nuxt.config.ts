// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/test-utils',
    '@nuxt/eslint',
    '@pinia/nuxt'
  ],
  css: [
    '@/assets/css/reset.css',
    '@/assets/css/main.css',
  ],
  app: {
    rootAttrs: {
      id: 'app',
    },
    rootTag: 'body',
  },
  typescript: {
    typeCheck: true
  },
  eslint: {

  },
  nitro: {
    // // websocket 的代理不起作用
    // devProxy: {
    //   '/hub': {
    //     target: 'ws://localhost:8001',
    //     ws: true,
    //     secure: false,
    //     changeOrigin: true, 
    //   }
    // }
  }
})