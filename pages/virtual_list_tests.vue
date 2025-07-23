<script setup lang="ts">

const items = Array.from({ length: 1000 }, (_, i) => ({
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
    <ClientOnly>
        <!-- <div class="virtual-list"> -->
        <UIVirtualList :items="items" :item-height="50" :buffer="10" :gap="{ row: 10, column: 10 }" :column="1"
            :content-width="1000">
            <template #header>
                <h1 style="background-color: blanchedalmond;">Header</h1>
            </template>
            <template #footer>
                <Footer style="background-color: aquamarine;"></Footer>
            </template>
            <template #item="{ item, index }">
                <div :class="{ 'item-even': index % 2 === 0 }" class="item">{{ item.name }} - {{ index }}</div>
            </template>
        </UIVirtualList>
        <!-- </div> -->
    </ClientOnly>
</template>

<style lang="scss" scoped>
.sth-big-header {
    height: 200px;
    background-color: rgb(54, 54, 54);
}

h1 {
    margin: 0;
}

.sth-sticky {
    position: sticky;
    top: var(--header-height);
    background-color: #f00;
    z-index: 2;
    margin: 24px 0;
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