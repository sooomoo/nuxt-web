<script setup lang="ts">
import { callOncePromise, sleep } from "vuepkg";
const doTask = async (val: number) => {
    await sleep(1000);
    console.log(val);
    return val;
};
const singleExecutionTask = callOncePromise(() => doTask(1));

const authStore = useAuthStore();
const wsMsg = ref("");
const bus = useAppEventBus();
onMounted(() => {
    singleExecutionTask().then((res) => {
        console.log(res, 1);
    });
    singleExecutionTask().then((res) => {
        console.log(res, 2);
    });
    bus.on("websocketMessage", (message) => {
        console.log("websocketMessage", message);
        wsMsg.value = JSON.stringify(message, null, 2) + "\n" + Date.now().toString();
    });
});
</script>

<template>
    <p>
        总结来说，WebSocket 是一种为现代 Web 应用量身定制的协议，具有实时、双向通信的优势，而 Socket
        是一种底层的网络通信机制，提供更灵活的使用方式。选择使用哪种技术取决于具体的应用场景和需求。对于需要实时交互的 Web 应用，WebSocket 是更合适的选择；而对于底层或高性能要求的网络通信，Socket
        提供了更多的控制和灵活性。333
    </p>
    home
    <div>
        <pre>{{ authStore.user }}</pre>
    </div>
    <pre>{{ wsMsg }}</pre>
    <!-- <button @click="handleClick">get</button> -->
    <div class="block" />
</template>

<style scoped lang="scss">
.block {
    width: 100px;
    height: 100px;
    background-color: #ffa41d;
}
</style>
