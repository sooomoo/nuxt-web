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

const log = logger.tag('USER')
const route = useRoute()

log.debug('user id is : ', route.params.id)
const { data: loginResp } = await apiUser.getUserInfo()

</script>
<template>
  <div>
    <pre>{{ loginResp }}</pre>
  </div>
</template>
<style lang="scss" scoped></style>