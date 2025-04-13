export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
      // handle error, e.g. report to a service
    }
  
    // Also possible
    nuxtApp.hook('vue:error', (error, instance, info) => {
      // handle error, e.g. report to a service
    })

    nuxtApp.hook('app:error', (err ) => {
      // handle error, e.g. report to a service
    })
  })
  