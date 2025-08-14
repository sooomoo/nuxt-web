<script setup lang="ts">
import { JSONStringify } from "json-with-bigint";
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

const userJson = computed(() => JSONStringify(authStore.user, undefined, 2));
const userIDStr = computed(() => {
    const t = 1602107439422259216021074394222592n;
    return `${t}`;
});

onMounted(() => {
    singleExecutionTask().then((res) => {
        console.log(res, 1);
    });
    singleExecutionTask().then((res) => {
        console.log(res, 2);
    });
    bus.on("websocketMessage", (message) => {
        console.log("websocketMessage", message);
        wsMsg.value = JSONStringify(message, null, 2) + "\n" + Date.now().toString();
    });
});
</script>

<template>
    <p>
        总结来说，WebSocket 是一种为现代 Web 应用量身定制的协议，具有实时、双向通信的优势，而 Socket
        是一种底层的网络通信机制，提供更灵活的使用方式。选择使用哪种技术取决于具体的应用场景和需求。对于需要实时交互的 Web 应用，WebSocket
        是更合适的选择；而对于底层或高性能要求的网络通信，Socket 提供了更多的控制和灵活性。333
    </p>
    <div>UserID: {{ authStore.user?.id }}</div>
    <div>UserID: {{ userIDStr }}</div>
    <div>
        <pre>{{ userJson }}</pre>
    </div>
    <pre>{{ wsMsg }}</pre>
    <!-- <button @click="handleClick">get</button> -->
    <span>&#x1F600;</span>
    首先，卡片是相对定位，光是绝对定位 监听卡片的鼠标移入事件mouseenter，当鼠标进入时显示光
    监听卡片的鼠标移动事件mouseover，鼠标移动时修改光的left、top，让光跟随鼠标移动 监听卡片的鼠标移出事件mouseleave，鼠标移出时，隐藏光
    作者：Sunshine_Lin 链接：https://juejin.cn/post/7373867360019742758 来源：稀土掘金
    著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
    <div class="block" />
</template>

<style scoped lang="scss">
.block {
    width: 300px;
    height: 600px;
    background-color: #ffa41d;
}
</style>
