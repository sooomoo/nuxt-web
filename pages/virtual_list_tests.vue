<script setup lang="ts">

const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i + '',
    name: `Item ${i}`
}));

</script>

<template>
    <ClientOnly>
        <div class="scroller-container">
            <UIVirtualList :items="items" :item-height="50" :buffer="20" :gap="{ row: 10, column: 10 }" :column="1">
                <template #item="{ item, index }">
                    <div :class="{ 'item-even': index % 2 === 0 }" class="item">{{ item.name }} - {{ index }}</div>
                </template>
            </UIVirtualList>
        </div>
    </ClientOnly>
</template>

<style lang="scss" scoped>
.scroller-container {
    height: 500px;

    .before {
        height: 50px;
        line-height: 50px;
        position: sticky;
        top: 100px;
    }
}

.item {
    height: 50px;
    line-height: 50px;
    border: 1px solid #ccc;
}

.item-even {
    height: 80px;
    line-height: 50px;
    border: 1px solid #ccc;
}
</style>