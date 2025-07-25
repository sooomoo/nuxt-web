<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">
import { logger } from 'vuepkg';
import { FallbackResizeObserver, useElementSizes, zeroPadding, type Padding } from './scripts/Elements';
import { useScrollParent } from './scripts/ScrollParent';


const props = defineProps<{
    items: T[]
    itemHeight: number
    contentWidth?: number
    column?: number
    gap?: {
        row: number
        column: number
    }
    buffer?: number
    contentPadding?: Padding
    contentClass?: string
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const listItemsRef = ref<HTMLDivElement[]>([]);
const { scrollTop, scrollParentSize, releaseScrollParent } = useScrollParent(containerRef);

const measuredHeights = ref<{ [key: string]: number }>({});// 存储实际高度
const finalColumn = computed(() => props.column || 1);
const finalGap = computed(() => props.gap || { row: 0, column: 0 });
const finalBuffer = computed(() => props.buffer ?? 10);
const finalContentPadding = computed(() => props.contentPadding ?? zeroPadding());

const headerRef = ref<HTMLDivElement | null>(null);
const footerRef = ref<HTMLDivElement | null>(null);
const { elemSizeArray, elemRelease } = useElementSizes(headerRef, footerRef);
const headerHeight = computed(() => elemSizeArray.value[0]);
const footerHeight = computed(() => elemSizeArray.value[1]);

const itemResizeObserver = typeof ResizeObserver === 'undefined' ? new FallbackResizeObserver() : new ResizeObserver((entries) => {
    // logger.debug('itemResizeObserver', entries);
    for (const entry of entries) {
        if (!(entry.target instanceof HTMLDivElement)) {
            continue;
        }

        const height = entry.contentRect.height;
        const itemId = entry.target.dataset.itemId || '';
        // 此处需要过滤掉==0 的值，当元素被重用时，其元素的值会短暂为 0
        if (!itemId || height < 1) {
            continue;
        }
        if (height !== measuredHeights.value[itemId]) {
            measuredHeights.value[itemId] = height;
        }
    }
});

watch(listItemsRef, (newVal, oldVal) => {
    oldVal.forEach((item) => {
        itemResizeObserver.unobserve(item);
    });
    newVal.forEach((item) => {
        itemResizeObserver.observe(item);
    });
}, { deep: true });

const finalContentWidthExcludePadding = computed(() => {
    const w = props.contentWidth || scrollParentSize.value.width;
    if (w) {
        return w - finalContentPadding.value.left - finalContentPadding.value.right;
    }
    return 0;
});

const finalContentWidth = computed(() => {
    const w = props.contentWidth || scrollParentSize.value.width;
    return w || 0;
});

watch(scrollParentSize, (val) => {
    if (!containerRef.value || !contentRef.value) return;
    if (props.contentWidth && val.width <= props.contentWidth) {
        containerRef.value.style.alignItems = 'flex-start';
        contentRef.value.style.left = finalContentPadding.value.left + 'px';
    } else {
        containerRef.value.style.alignItems = 'center';
        contentRef.value.style.left = '';
    }
});

const getHeightToIndex = (index: number) => {
    let height = headerHeight.value + finalContentPadding.value.top;
    for (let i = 0; i < index; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        height += Math.max(...rowHeights);
        height += finalGap.value.row;
    }
    return height;
};

const getStartIndex = () => {
    let start = 0;
    let offset = headerHeight.value + finalContentPadding.value.top;
    for (let i = 0; i < props.items.length; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        offset += Math.max(...rowHeights);
        offset += finalGap.value.row;
        if (offset >= scrollTop.value) {
            start = i;
            break;
        }
    }

    return Math.max(0, start - finalBuffer.value * finalColumn.value);
};

// 动态总高度
const totalHeight = computed(() => {
    let height = getHeightToIndex(props.items.length);
    if (height > finalGap.value.row) {
        height -= finalGap.value.row;
    }
    height += finalContentPadding.value.bottom + footerHeight.value;
    logger.debug('totalHeight', height);
    return height;
});

// 核心计算属性：可见项范围
const visibleRange = computed(() => {
    const start = getStartIndex();
    let end = start + Math.ceil(scrollParentSize.value.height / props.itemHeight) + 2 * finalBuffer.value * finalColumn.value;
    if (end > props.items.length) {
        end = props.items.length;
    }

    let startOffset = getHeightToIndex(start);
    // logger.debug('offsets', startOffset, scrollTop.value);
    if (startOffset > totalHeight.value) {
        startOffset = totalHeight.value;
    }

    return { start, end, startOffset };
});

// 可见项列表
const visibleItems = computed(() => {
    const items = props.items.slice(visibleRange.value.start, visibleRange.value.end);
    logger.debug('visibleRange', visibleRange.value);//, 'visibleItems', items);

    let itemWidth = 0;
    if (finalColumn.value > 0) {
        itemWidth = (finalContentWidthExcludePadding.value - finalGap.value.column * (finalColumn.value - 1)) / finalColumn.value;
    }

    // 计算各个项的位置
    let itemOffsetX = 0, itemOffsetY = 0;
    const rowHeights: number[] = [];
    for (let i = 0; i < items.length; i += finalColumn.value) {
        itemOffsetX = 0;
        rowHeights.splice(0, rowHeights.length);

        for (let j = 0; j < finalColumn.value; j++) {
            const item = items[i + j];
            if (!item) continue; // 超出索引范围
            items[i + j] = {
                ...item,
                __style__: {
                    transform: itemOffsetX > 0 ? `translateY(${itemOffsetY}px) translateX(${itemOffsetX}px)` : `translateY(${itemOffsetY}px)`,
                    width: `${itemWidth}px`,
                },
            };
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
            itemOffsetX += itemWidth + finalGap.value.column;
        }

        itemOffsetY += Math.max(...rowHeights);
        itemOffsetY += finalGap.value.row;
    }

    // footer 始终在最后
    if (footerRef.value) {
        if (itemOffsetY > finalGap.value.row) {
            itemOffsetY -= finalGap.value.row;
        }
        const footerOffset = visibleRange.value.startOffset + itemOffsetY + finalContentPadding.value.bottom;
        footerRef.value!.style.transform = `translateY(${footerOffset}px)`;
    }

    return { items, offset: visibleRange.value.startOffset };
});

onUnmounted(() => {
    itemResizeObserver.disconnect();
    elemRelease();
    releaseScrollParent();
});
</script>

<template>
    <div ref="containerRef" class="ui-virtual-list" style="padding: 0;">
        <!-- 撑开滚动条的占位元素 -->
        <div :class="'ui-virtual-sizes ' + props.contentClass" :style="{
            minWidth: finalContentWidth + 'px',
            minHeight: totalHeight + 'px',
        }"></div>
        <div ref="headerRef" class="ui-virtual-list-header" :style="{
            minWidth: finalContentWidth + 'px',
        }">
            <slot name="header"></slot>
        </div>
        <div ref="contentRef" class="ui-virtual-content" :style="{
            width: finalContentWidthExcludePadding + 'px',
            transform: `translateY(${visibleItems.offset}px)`,
        }">
            <div v-for="(item, index) in visibleItems.items" :key="item.id" ref="listItemsRef"
                class="ui-virtual-list-item" :data-item-id="item.id" :style="item.__style__">
                <slot name="item" :item="item" :index="visibleRange.start + index"></slot>
            </div>
        </div>
        <div ref="footerRef" class="ui-virtual-list-footer" :style="{
            minWidth: finalContentWidth + 'px',
            visibility: visibleRange.end >= props.items.length - 1 ? 'visible' : 'hidden',
        }">
            <slot name="footer"></slot>
        </div>
    </div>
</template>
