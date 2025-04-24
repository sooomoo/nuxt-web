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

const route = useRoute()

const log = logger.tag(`USER ${route.params.id}`) 
const { data: loginResp } = await apiUser.getUserInfo()
log.debug('routing...') // 123

const logout = async () => {
  await apiAuth.logout()
}

</script>
<template>
  <div>
    <pre>{{ loginResp }}</pre>
  </div>
  <button @click="logout">Logout</button>
</template>
<style lang="scss" scoped>

</style>