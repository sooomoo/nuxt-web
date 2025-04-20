<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    // Check if the id is made up of digits
    if (typeof route.params.id === 'string' && /^\d+$/.test(route.params.id)) {
      return true
    }
    return createError({
      status: 400,
      statusText: 'BadRequest: id must be a number',
    })
  }
})
// // During SSR data is fetched twice, once on the server and once on the client.
// const dataTwice = await $fetch('/api/item')

// // This will NOT forward headers or cookies during SSR
// // During SSR data is fetched only on the server side and transferred to the client.
// const { data2 } = await useAsyncData('item', () => $fetch('/api/item'))

// // This will forward the user's headers and cookies to `/api/cookies`
// const requestFetch = useRequestFetch()
// const { data } = await useAsyncData(() => requestFetch('/api/cookies'))

// // You can also useFetch as shortcut of useAsyncData + $fetch
// const { data1 } = await useFetch('/api/item') 

const route = useRoute()

const log = logger.tag(`USER ${route.params.id}`) 
const { data: loginResp } = await apiUser.getUserInfo()
log.debug('routing...') // 123

</script>
<template>
  <div>
    <pre>{{ loginResp }}</pre>
  </div>
</template>
<style lang="sass" scoped>

</style>