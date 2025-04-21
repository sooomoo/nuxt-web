// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/test-utils', '@nuxt/eslint'],
  css: [
    '@/assets/css/reset.css',
    '@/assets/css/main.css',
  ],
  typescript:{
    typeCheck: true
  },
  eslint: {

  },
  nitro:{
    devProxy: {
      '/ws': {
        target: 'ws://localhost:8001/ws',
        ws: true,
        secure: false,
        changeOrigin: true, 
      }
    }
  }
})