<script setup lang="ts">
import { logger } from 'vuepkg';
import type { VirtualScrollerExpose, VisibleRange } from '~/components/ui/scripts/Virtuals';


interface TableColumn {
    width: number,
    field: string
    title: string
}
interface TableRowItem {
    id: number,
    name: string,
    title: string
    [key: string]: unknown
}


const nowSeconds = Date.now() / 1000;

const columns: TableColumn[] = [{
    width: 100,
    field: "id",
    title: "ID"
}, {
    width: 200,
    field: "name",
    title: "Name"
}, {
    width: 500,
    field: "title",
    title: "Title"
}];

const items: TableRowItem[] = Array.from({ length: 3000 }, (_, i) => ({
    id: i,
    name: `Name ${i}`,
    title: `Title ${i}`,
}));

const visibleRange = ref<VisibleRange | undefined>();
const onVisibleRangeChanged = (range: VisibleRange) => {
    visibleRange.value = range;
};

const vtableRef = ref<VirtualScrollerExpose | undefined>();
const scrollToTop = () => {
    vtableRef.value?.scrollToTop();
};
const scrollToBottom = () => {
    vtableRef.value?.scrollToBottom();
};

const indexChange = (evt: Event) => {
    if (!(evt.target instanceof HTMLInputElement)) {
        return;
    }
    logger.debug('indexChange', evt.target.valueAsNumber);
    vtableRef.value?.scrollToIndex(evt.target.valueAsNumber);
};


</script>

<template>
    <div class="virtual-table">
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
        <UIVirtualTable ref="vtableRef" :columns="columns" :items="items" :item-key="item => item.id.toString()"
            :row-height-func="item => item.id % 2 === 0 ? 50 : 50" content-class="v-table-content" content-padding="8"
            table-class="v-table" @visble-range-changed="onVisibleRangeChanged">
            <template #cell="{ row, col }">
                {{ row[col.field] ?? '' }}
            </template>
        </UIVirtualTable>
        <Footer></Footer>
    </div>
</template>

<style lang="scss" scoped>
.virtual-table {
    width: 100%;
    // height: calc(100vh - var(--header-height));
    // overflow: auto;
}

:deep(.v-table-content) {
    background-color: var(--color-container);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    border-radius: 3px;

}

:deep(.v-table) {

    & th,
    td {
        border: 1px solid #444;
        padding: 0 12px;

        &:first-child {
            position: relative;
            // box-shadow: 5px 0 4px #0001;
            // box-shadow: 5px 0 4px 0 rgba(0, 0, 0, 0.05); 
        }
    }
}

.sth-big-header {
    min-width: 1000px;
    height: 200px;
    background-color: rgb(50, 220, 200);
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
</style>
