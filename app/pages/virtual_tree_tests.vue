<script setup lang="ts">
import { logger } from "vuepkg";
import type { VirtualScrollerExpose, VisibleRange } from "~/components/ui/scripts/Virtuals";

const items = Array.from({ length: 50 }, (_, i) => ({
    id: i + "",
    name: `Item ${i}`,
    children: Array.from({ length: 50 }, (_, j) => ({
        id: `${i}-${j}`,
        name: `Item ${i}-${j}`,
        children: Array.from({ length: 50 }, (_, k) => ({
            id: `${i}-${j}-${k}`,
            name: `Item ${i}-${j}-${k}`,
            children: [],
        })),
    })),
}));

const visibleRange = ref<VisibleRange | undefined>();
const onVisibleRangeChanged = (range: VisibleRange) => {
    visibleRange.value = range;
};

const nowSeconds = Date.now() / 1000;
const vlistRef = ref<VirtualScrollerExpose | undefined>();
const scrollToTop = () => {
    vlistRef.value?.scrollToTop();
};
const scrollToBottom = () => {
    vlistRef.value?.scrollToBottom();
};

const indexChange = (evt: Event) => {
    if (!(evt.target instanceof HTMLInputElement)) {
        return;
    }
    logger.debug("indexChange", evt.target.valueAsNumber);
    vlistRef.value?.scrollToIndex(evt.target.valueAsNumber);
};

const itemClass = (item: unknown, index: number, isExpand: boolean) => {
    return isExpand ? "item-even" : "item";
};
</script>

<template>
    <div class="sth-sticky">
        <div class="v-info">
            itemsRange: {{ visibleRange?.bufferStart }} - [ {{ visibleRange?.visibleStart }} - {{ visibleRange?.visibleEnd }} ] -
            {{ visibleRange?.bufferEnd }}<br />
            visibleStartRelativeOffset: {{ visibleRange?.visibleStartRelativeOffset }}px<br />
            visibleEndRelativeOffset: {{ visibleRange?.visibleEndRelativeOffset }}px
        </div>
        <div class="v-actions">
            <button @click="scrollToTop">Scroll to Top</button>
            <button @click="scrollToBottom">Scroll to Bottom</button>
            <input type="number" @change="indexChange" />
        </div>
    </div>
    <div class="v-list-contaner">
        <div class="sth-big-header">
            <UITime :unix-seconds="nowSeconds"></UITime>
        </div>
        <h1>List Header</h1>
        <UIVirtualTree
            ref="vlistRef"
            :items="items"
            :item-key="(item) => item.id.toString()"
            :item-height="32"
            :buffer="20"
            :item-class="itemClass"
            @visble-range-changed="onVisibleRangeChanged"
        >
            <template #item="{ item, index }">
                <div style="flex: 1" class="ui-singleline">{{ item.name }} - {{ index }}绿水青山就是金山银山</div>
            </template>
            <!-- <template #expand="{ isExpand }">
                <div>{{ isExpand ? "coll" : "exp" }}</div>
            </template> -->
        </UIVirtualTree>
        <Footer></Footer>
    </div>
</template>

<style lang="scss" scoped>
.v-list-contaner {
    width: 200px;
    height: calc(100vh - var(--header-height) - 70px);
    overflow: auto;
}

:deep(.v-list-content) {
    background-color: var(--color-container);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

.sth-big-header {
    // min-width: 1000px;
    height: 200px;
    background-color: rgb(50, 220, 200);
}

h1 {
    margin: 0;
    height: 50px;
    align-content: center;
}

.sth-sticky {
    // min-width: 1000px;
    position: sticky;
    text-align: center;
    // top: var(--header-height);
    top: 0;
    background-color: #f005;
    z-index: 2;
    // margin: 24px 0;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;

    .v-info {
        width: 40%;
    }

    .v-actions {
        & button {
            margin: 0 8px;
            background-color: var(--color-primary);
            color: white;
        }

        & input {
            width: 100px;
            padding: 6px 12px;
        }
    }
}

.virtual-list {
    height: calc(100vh - var(--header-height));
    overflow-y: auto;
}

:deep(.item) {
    height: 32px;
    // min-width: 160px;
    // border: 1px solid #ccc;
    align-content: center;
    padding: 0 12px;
    transform: translateX(calc(var(--depth) * 18px));
    border-left: 1px dashed #666;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.3s ease;
    &:hover {
        background-color: #282828;
    }
}
:deep(.item[data-depth="0"]) {
    border-left: none;
}

:deep(.item-even) {
    height: 32px;
    // min-width: 160px;
    // border: 1px solid #2eca99;
    align-content: center;
    padding: 0 12px;
    transform: translateX(calc(var(--depth) * 18px));
    border-left: 1px dashed red;
    cursor: pointer;
    // flex-direction: row-reverse;
    user-select: none;
    // color: var(--color-primary);
    transition: background-color 0.3s ease;
    background-color: #282828;
    &:hover {
        background-color: #282828;
    }
}

:deep(.item-even[data-depth="0"]) {
    border-left: none;
}
</style>
