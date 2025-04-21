<script setup lang="ts">
import { postConnectCmdToWebSocket, startWebSocket } from './workers/websocket'; 

onMounted(() => {
  startWebSocket() 
  postConnectCmdToWebSocket('ws://localhost:8001/v1/hub/chat')
 
  // const websocket = new WebSocket(`ws://localhost:8001/v1/hub/chat`)
  // websocket.binaryType = 'arraybuffer' 
  // websocket.onerror = (event) => {
  //   // console.log('websocket error', event)
  // }
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
