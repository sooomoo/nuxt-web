<script setup lang="ts">
import { logger, unixNow } from "vuepkg";
import { openWebSocket, startWebSocket } from "./workers/websocket";

const authStore = useAuthStore();
const config = useRuntimeConfig();

// onBeforeRouteUpdate(async (to, from) => {
//     logger.debug("routing...to is : ", to.fullPath);
//     logger.debug("routing...from is : ", from.fullPath);
//     if (to.fullPath.toLowerCase().startsWith("/login")) {
//         return false;
//     }
// });
onMounted(async () => {  
    const unixtime = unixNow();
    logger.info("onMounted", config, unixtime, Date.now(), unixtime.toString(36), unixtime.toString(16));
    await authStore.getUserInfo();
    startWebSocket((event) => {
        console.log("WebSocket message received:", event.data);
        if (event.data.type === "websocket_message") {
            useAppEventBus().emit("websocketMessage", event.data.data);
        }
    });
    openWebSocket(config.public.apiBaseUrl);
});
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<style lang="scss"></style>
