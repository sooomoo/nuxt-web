<script setup lang="ts">
import type { VisibleRange } from '~/components/ui/scripts/Virtuals';


const items = Array.from({ length: 300 }, (_, i) => ({
    id: i + '',
    name: `Item ${i}`
}));

const onVisibleRangeChanged = (range: VisibleRange) => {
    console.log('onVisibleRangeChanged', range);
};

const nowSeconds = Date.now() / 1000;
</script>

<template>
    <div class="v-list-contaner">
        <div class="sth-big-header">
            <UITime :unix-seconds="nowSeconds"></UITime>
        </div>
        <div class="sth-sticky">
            <h1 style="height: 30px; background-color: green;">Sth sticky</h1>

        </div>
        <h1>List Header</h1>
        <UIVirtualList :items="items" :item-height="50" :buffer="50" :gap="{ row: 10, column: 10 }" :column="1"
            :content-width="1000" :content-padding="{ left: 8, right: 8, top: 30, bottom: 30 }" class="v-list"
            content-class="v-list-content" @visble-range-changed="onVisibleRangeChanged">
            <template #item="{ item, index }">
                <div :class="{ 'item-even': index % 2 === 0 }" class="item">{{ item.name }} - {{ index }}</div>
            </template>
        </UIVirtualList>
        <Footer></Footer>
    </div>
</template>

<style lang="scss" scoped>
.v-list {
    // padding: 30px;
    // min-width: 1060px;
}

.v-list-contaner {
    width: 100%;
    height: calc(100vh - var(--header-height));
    overflow: auto;
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
    // top: var(--header-height);
    top: 0;
    background-color: #f00;
    z-index: 2;
    // margin: 24px 0;
    height: 70px;
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
