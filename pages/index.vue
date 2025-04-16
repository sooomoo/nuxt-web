<script setup lang="ts">
import { encode } from '@juanelas/base64';

const { data: loginResp, error } = await apiUser.getUserInfo()
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
</script>
<template>
  <div>
    home
    <div>
      <pre>{{ loginResp }}</pre>
      <!-- <pre>{{ user2 }}</pre> -->
    </div>
    <div>{{ error }}</div>
  </div>
</template>