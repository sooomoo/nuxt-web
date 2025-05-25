<script setup lang="ts">
import { logger, unixNow } from "vuepkg";
import { openWebSocket, startWebSocket } from "./composables/workers/websocket";

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
    startWebSocket();
    openWebSocket();
    await authStore.getUserInfo();
});
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>
