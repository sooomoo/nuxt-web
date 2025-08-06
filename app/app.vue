<script setup lang="ts">
import { logger, unixNow } from "vuepkg";
import { openWebSocket, startWebSocket } from "./workers/websocket";

const authStore = useAuthStore();
const config = useRuntimeConfig();

onMounted(async () => {
    // // 15986004295946240
    // // 15994431603740672
    // // 9007199254740992
    // console.log(Number.MAX_SAFE_INTEGER);
    // const str = `{"id":15986004295946240,"value": 9223372036854775807,"values":[159860042959.462418,1598600429594.62429,1598600429594.62430],"ids":[159860042959462418,159860042959462429,159860042959462430],"arr":[1,2,3],"age":30}`;
    // const obj = JSON.parse(str, (key, value, context) => {
    //     console.log(key, value, context);
    //     if (typeof key === "string" && typeof value === "number") {
    //         if (typeof value === "number" && value >= Number.MAX_SAFE_INTEGER) {
    //             return BigInt(context.source);
    //         }
    //     }
    //     return value;
    // });
    // console.log(obj);
    // return;
    const unixtime = unixNow();
    logger.info(
        "onMounted",
        config,
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
    openWebSocket(config.public.apiBaseUrl);
});
</script>

<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<style lang="scss"></style>
