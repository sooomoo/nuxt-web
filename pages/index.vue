<script setup lang="ts">
const loginResp = ref<ResponseDto<any> | null>(null)
const error = ref<any>(null)
const handleClick = async () => {
  const { data: loginResp1, error: err } = await apiUser.getUserInfo()
  if (err.value) { 
    console.log('err', err.value)
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
}

onMounted(async () => {
  logger.debug('home onMounted') 
  logger.tag('index').debug('home onMounted') 
  logger.info('home onMounted')
  logger.tag('index').info('home onMounted') 
  logger.warn('home onMounted')
  logger.tag('index').warn('home onMounted') 
  logger.error('home onMounted')
  logger.tag('index').error('home onMounted') 
})
</script>
<template>
  <div>
    home
    <div>
      <pre>{{ loginResp }}</pre>
      <!-- <pre>{{ user2 }}</pre> -->
    </div>
    <div>{{ error }}</div>
    <button @click="handleClick">get</button>
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