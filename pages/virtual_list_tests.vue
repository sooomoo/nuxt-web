<script setup lang="ts">

const items = Array.from({ length: 300 }, (_, i) => ({
    id: i + '',
    name: `Item ${i}`
}));

const nowSeconds = Date.now() / 1000;
</script>

<template>
    <div class="sth-big-header">
        <UITime :unix-seconds="nowSeconds"></UITime>
    </div>
    <div class="sth-sticky">
        <h1>Sth sticky</h1>
    </div>
    <h1>List Header</h1>
    <UIVirtualList :items="items" :item-height="50" :buffer="10" :gap="{ row: 10, column: 10 }" :column="2"
        :content-width="1000" :content-padding="{ left: 12, right: 12, top: 12, bottom: 12 }" class="v-list"
        content-class="v-list-content">
        <template #item="{ item, index }">
            <div :class="{ 'item-even': index % 2 === 0 }" class="item">{{ item.name }} - {{ index }}</div>
        </template>
    </UIVirtualList>
    <Footer></Footer>
</template>

<style lang="scss" scoped>
.v-list {
    // padding: 30px;
    // min-width: 1060px;
}

:deep(.v-list-content) {
    background-color: white;
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
}

.sth-sticky {
    min-width: 1000px;
    position: sticky;
    top: var(--header-height);
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
    height: 80px;
    border: 1px solid #ccc;
    align-content: center;
    padding: 0 12px;
    border-radius: 4px;
}
</style>
