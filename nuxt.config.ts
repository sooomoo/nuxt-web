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
    head:{
      title: 'Nuxt3 测试',
      meta: [
        { name: 'description', content: 'Nuxt3 测试' }
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