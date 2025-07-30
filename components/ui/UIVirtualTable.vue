<script setup lang="ts" generic="T extends { id: string | number | bigint, [key: string]: any }">
import { zeroPadding, type Padding } from 'vuepkg';
import { newPaddingFromString } from './scripts/Elements';
import { zeroRenderVisibleRange, type RenderVisibleRange } from './scripts/Virtuals';


interface TableSpan<T> {
    row: number
    column: number
    rowSpan: number
    columnSpan: number
    item: T
}

interface TableColumn {
    width: number
    field: string
}

const props = defineProps<{
    items: T[];
    rowHeightFunc: (item: T) => number
    columns: TableColumn[]
    spans?: TableSpan<T>[]
    buffer: number
    contentPadding?: Padding | string
    contentClass?: string
    ssrVisibleItems?: number
}>();

// const finalBuffer = computed(() => props.buffer ?? 10);
const finalContentPadding = computed(() => {
    if (typeof props.contentPadding === 'string') {
        return newPaddingFromString(props.contentPadding);
    }
    return props.contentPadding ?? zeroPadding();
});

const totalHeight = computed(() => {
    let height = 0;
    for (const item of props.items) {
        height += props.rowHeightFunc(item);
    }
    return height;
});

const contentWidth = computed(() => {
    let width = 0;
    for (const column of props.columns) {
        width += column.width;
    }
    return width;
});
const contentWidthWithPadding = computed(() => {
    return contentWidth.value + finalContentPadding.value.left + finalContentPadding.value.right;
});

const renderVisibleRange = shallowRef<RenderVisibleRange>(zeroRenderVisibleRange());
// const emit = defineEmits<{
//     (e: "visble-range-changed", range: VisibleRange): void
// }>();

// 可见项列表
const visibleItems = computed(() => {
    return [] as T[];
});
</script>

<template>
    <div class="ui-virtual-table">
        <!-- 撑开滚动条的占位元素 -->
        <div :class="'ui-virtual-sizes ' + props.contentClass" :style="{
            minWidth: contentWidthWithPadding + 'px',
            minHeight: totalHeight + 'px',
        }"></div>
        <div ref="contentRef" class="ui-virtual-content" :style="{
            width: contentWidth + 'px',
            transform: `translateY(${renderVisibleRange.startOffset}px)`,
        }">
            <div v-for="(item, index) in visibleItems" :key="item.id.toString()" ref="listItemsRef"
                class="ui-virtual-list-item" :data-item-id="item.id" :style="item.__style__">
                <slot name="item" :item="item" :index="renderVisibleRange.bufferStart + index"></slot>
            </div>
        </div>
    </div>
</template>