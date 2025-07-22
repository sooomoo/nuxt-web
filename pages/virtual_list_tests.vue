<script setup lang="ts">

const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i + '',
    name: `Item ${i}`
}));

</script>

<template>
    <ClientOnly>
        <UIVirtualList class="virtual-list" :items="items" :item-height="50" :buffer="20" :gap="{ row: 10, column: 10 }"
            :column="2" :content-width="1000">
            <template #header>
                <h1>Header</h1>
            </template>
            <template #footer>
                <Footer></Footer>
            </template>
            <template #item="{ item, index }">
                <div :class="{ 'item-even': index % 2 === 0 }" class="item">{{ item.name }} - {{ index }}</div>
            </template>
        </UIVirtualList>
    </ClientOnly>
</template>

<style lang="scss" scoped>
.virtual-list {
    height: calc(100vh - var(--header-height));
}

.item {
    height: 50px;
    line-height: 50px;
    border: 1px solid #ccc;
    align-content: center;
}

.item-even {
    height: 80px;
    line-height: 50px;
    border: 1px solid #ccc;
    align-content: center;
}
</style>