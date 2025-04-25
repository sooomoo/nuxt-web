<script setup lang="ts">
import { openWebSocket, startWebSocket } from './workers/websocket'; 

onMounted(() => {
  startWebSocket() 
  openWebSocket()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
