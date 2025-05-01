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
    '@/assets/css/font.css',
    '@/assets/css/main.css',
  ],
  app: {
    rootAttrs: {
      id: 'app',
    },
    rootTag: 'body',
    // layoutTransition: { name: 'layout', mode: 'out-in' },
    // pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Nuxt3 测试',
      meta: [
        { name: 'description', content: 'Nuxt3 测试' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // // for production
        // { 'http-equiv': 'content-security-policy', content:"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"},
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
        { name: 'apple-mobile-web-app-title', content: 'Nuxt3 测试' },
        { name: 'msapplication-TileColor', content: '#da532c' },
        { name: 'msapplication-TileImage', content: '/ms-icon-144x144.png' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'og:title', content: 'Nuxt3 测试' },
        { name: 'og:description', content: 'Nuxt3 测试' },
        { name: 'og:image', content: '/logo.png' },
        { name: 'og:site_name', content: 'Nuxt3 测试' },
        { name: 'og:type', content: 'website' },
        { name: 'og:locale', content: 'zh_CN' },
        
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // 字体懒加载
        // {
        //   rel: 'preload',
        //   as: 'font',
        //   href: '/fonts/iconfont.woff2',
        //   crossorigin: 'anonymous',
        // },
        // 预获取资源
        // {
        //   rel: 'prefetch',
        //   as: 'image',
        //   href: '/logo.png',
        // },
      ]
    }
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