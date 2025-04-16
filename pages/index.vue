<script setup lang="ts">
const loginResp = ref<ResponseDto<any> | null>(null)
const error = ref<any>(null)
const handleClick = async () => {
  const { data: loginResp1, error: err } = await apiUser.getUserInfo()
  if (error.value) {
    if (error.value.statusCode === 401) {
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
  </div>
</template>