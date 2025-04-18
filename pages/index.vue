<script setup lang="ts">

const log = logger.tag('index')

const loginResp = ref<ResponseDto<any> | null>(null)
const error = ref<any>(null)
// const handleClick = async () => {
  const { data: loginResp1, error: err } = await apiUser.getUserInfo()
  if (err.value) { 
    log.debug('err', err.value)
    if (err.value.statusCode === 401) {
      // 未登录，跳转到登录页
      navigateTo({
        path: '/login',
        query: {
          redirect: encodeURIComponent('/'),
        }
      }, {
        replace: true,
      })
    }
  }
  loginResp.value = loginResp1.value
  error.value = err.value
// }

// onMounted(async () => {
//   log.debug('home onMounted') 
//   logger.info('home onMounted')
//   logger.warn('home onMounted')
//   logger.error('home onMounted')
// })
</script>
<template>
  <div>
    home
    <div>
      <pre>{{ loginResp }}</pre>
      <!-- <pre>{{ user2 }}</pre> -->
    </div>
    <!-- <button @click="handleClick">get</button> -->
    <div class="block"></div>
  </div>
</template>

<style scoped>
.block {
  width: 100px;
  height: 100px;
  background-color: #ffa41d;
}
</style>