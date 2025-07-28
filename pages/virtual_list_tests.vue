<script setup lang="ts">
import { logger } from 'vuepkg';
import type { VirtualScrollerExpose, VisibleRange } from '~/components/ui/scripts/Virtuals';
import UIVirtualList from '~/components/ui/UIVirtualList.vue';


const items = Array.from({ length: 300 }, (_, i) => ({
    id: i + '',
    name: `Item ${i}`
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
    logger.debug('indexChange', evt.target.valueAsNumber);
    vlistRef.value?.scrollToIndex(evt.target.valueAsNumber);
};
</script>

<template>
    <div class="v-list-contaner">
        <div class="sth-big-header">
            <UITime :unix-seconds="nowSeconds"></UITime>
        </div>
        <div class="sth-sticky">
            <div class="v-info">
                itemsRange: {{ visibleRange?.bufferStart }} - [ {{ visibleRange?.visibleStart }} - {{
                    visibleRange?.visibleEnd
                }}
                ] - {{
                    visibleRange?.bufferEnd }}<br />
                visibleStartRelativeOffset: {{ visibleRange?.visibleStartRelativeOffset }}px<br />
                visibleEndRelativeOffset: {{ visibleRange?.visibleEndRelativeOffset }}px
            </div>
            <div class="v-actions">
                <button @click="scrollToTop">Scroll to Top</button>
                <button @click="scrollToBottom">Scroll to Bottom</button>
                <input type="number" @change="indexChange" />
            </div>
        </div>
        <h1>List Header</h1>
        <UIVirtualList ref="vlistRef" :items="items" :item-height="50" :buffer="10" gap="10" :column="1"
            :content-width="1000" content-padding="10" content-class="v-list-content"
            @visble-range-changed="onVisibleRangeChanged">
            <template #item="{ item, index }">
                <div :class="{ 'item-even': index % 2 === 0 }" class="item">{{ item.name }} - {{ index }}</div>
            </template>
        </UIVirtualList>
        <Footer></Footer>
    </div>
</template>

<style lang="scss" scoped>
.v-list-contaner {
    width: 100%;
    // height: calc(100vh - var(--header-height));
    // overflow: auto;
}


:deep(.v-list-content) {
    background-color: var(--color-container);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

.sth-big-header {
    min-width: 1000px;
    height: 200px;
    background-color: rgb(174, 248, 228);
}

h1 {
    margin: 0;
    height: 50px;
    align-content: center;
}

.sth-sticky {
    min-width: 1000px;
    position: sticky;
    text-align: center;
    top: var(--header-height);
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

.item {
    height: 50px;
    border: 1px solid #ccc;
    align-content: center;
    padding: 0 12px;
    border-radius: 4px;
}

.item-even {
    height: 50px;
    border: 1px solid #ccc;
    align-content: center;
    padding: 0 12px;
    border-radius: 4px;
}
</style>
