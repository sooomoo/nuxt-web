<script setup lang="ts">
import { openWebSocket, startWebSocket } from './workers/websocket';

const authStore = useAuthStore()

onMounted(async () => {
  startWebSocket()
  openWebSocket()
  await authStore.getUserInfo()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
