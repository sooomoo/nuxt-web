<script setup lang="ts">
import { logger, unixNow } from "vuepkg";
import { openWebSocket, startWebSocket } from "./workers/websocket";

const authStore = useAuthStore();

onMounted(async () => {
    const unixtime = unixNow();
    logger.info(
        "onMounted",
        unixtime,
        Date.now(),
        unixtime.toString(36),
        unixtime.toString(16),
    );
    await authStore.getUserInfo();
    startWebSocket((event) => {
        console.log("WebSocket message received:", event.data);
        if (event.data.type === "websocket_message") {
            useAppEventBus().emit("websocketMessage", event.data.data);
        }
    });
    openWebSocket();
});
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<style lang="scss">
#app {
    display: flex;
    flex-direction: column;
    height: 100vh;
}
</style>
