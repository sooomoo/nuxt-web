/**
 * 用于处理全局错误
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // handle error, e.g. report to a service
    console.log('vueApp.config.errorHandler', error, instance, info)
  }

  // Also possible
  nuxtApp.hook('vue:error', (error, instance, info) => {
    // handle error, e.g. report to a service
    console.log('vue:error', error, instance, info)
  })

  nuxtApp.hook('app:error', (err) => {
    // handle error, e.g. report to a service
    console.log('app:error', err)
  })
})
