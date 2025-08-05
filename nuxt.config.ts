import fs from "fs";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: ["@nuxt/test-utils", "@nuxt/eslint", "@pinia/nuxt"],
    devtools: { enabled: true },
    imports: {
        dirs: ["stores/**", "composables/**", "utils/**"],
    },
    components: [
        {
            path: "components/",
            global: true,
            pathPrefix: false,
        },
    ],
    app: {
        rootAttrs: {
            id: "app",
        },
        rootTag: "body",
        // layoutTransition: { name: 'layout', mode: 'out-in' },
        // pageTransition: { name: 'page', mode: 'out-in' },
        head: {
            title: "Nuxt3 测试",
            meta: [
                { name: "description", content: "Nuxt3 测试" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                // // for production

                // { 'http-equiv': 'content-security-policy', content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:" },
                { name: "format-detection", content: "telephone=no" },
                { name: "mobile-web-app-capable", content: "yes" },
                { name: "apple-mobile-web-app-status-bar-style", content: "black" },
                { name: "apple-mobile-web-app-title", content: "Nuxt3 测试" },
                { name: "msapplication-TileColor", content: "#da532c" },
                { name: "msapplication-TileImage", content: "/ms-icon-144x144.png" },
                { name: "theme-color", content: "#ffffff" },
                { name: "og:title", content: "Nuxt3 测试" },
                { name: "og:description", content: "Nuxt3 测试" },
                { name: "og:image", content: "/logo.png" },
                { name: "og:site_name", content: "Nuxt3 测试" },
                { name: "og:type", content: "website" },
                { name: "og:locale", content: "zh_CN" },
            ],
            link: [
                { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
                // 字体懒加载
                {
                    rel: "preload",
                    as: "style",
                    href: "/fonts/regular/result.css",
                    onload: 'this.onload=null;this.rel="stylesheet"',
                    // crossorigin: 'anonymous',
                },
                {
                    rel: "prefetch",
                    as: "style",
                    href: "/fonts/bold/result.css",
                    onload: 'this.onload=null;this.rel="stylesheet"',
                    // crossorigin: 'anonymous',
                },
                // 预获取资源
                // {
                //   rel: 'prefetch',
                //   as: 'image',
                //   href: '/logo.png',
                // },
            ],
        },
    },
    css: ["@/assets/css/reset.css", "@/assets/css/main.scss"],
    compatibilityDate: "2025-05-15",
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
    },
    vite: {
        envDir: '.',
        envPrefix: 'VITE_',
    },
    devServer: {
        port: 3000,
        host: "127.0.0.1",
        https: {
            cert: fs.readFileSync("/Users/muro/work/certs/cert.pem", "utf-8"),
            key: fs.readFileSync("/Users/muro/work/certs/key.pem", "utf-8"),
        },
    },
    typescript: {
        typeCheck: true,
    },
});
