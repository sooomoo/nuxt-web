<script setup lang="ts">
import { postConnectCmdToWebSocket, startWebSocket } from './workers/websocket'; 

onMounted(() => {
  startWebSocket() 
  postConnectCmdToWebSocket({
    url: 'ws://localhost:8001/hub/chat',
    subprotocol: ['niu-v1'],
    heartbeatInterval: 10000,
    maxRetryAttempts: 10,
  }) 
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
