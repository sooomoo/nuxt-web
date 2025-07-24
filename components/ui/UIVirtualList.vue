<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">
import { logger } from 'vuepkg';
import { FallbackResizeObserver, useElementSizes } from './scripts/Elements';
import { useScrollParent } from './scripts/ScrollParent';


interface Padding {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

const props = defineProps<{
    items: T[]
    itemHeight: number
    contentWidth?: number
    column?: number
    gap?: {
        row: number
        column: number
    }
    buffer: number
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const listItemsRef = ref<HTMLDivElement[]>([]);
const { scrollTop, scrollParentSize, releaseScrollParent } = useScrollParent(containerRef);

const measuredHeights = ref<{ [key: string]: number }>({});// 存储实际高度
const finalColumn = computed(() => props.column || 1);
const finalGap = computed(() => props.gap || { row: 0, column: 0 });

const headerRef = ref<HTMLDivElement | null>(null);
const footerRef = ref<HTMLDivElement | null>(null);
const { elemSizeArray, elemRelease } = useElementSizes(headerRef, footerRef);

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

const getContainerPadding = (): Padding => {
    if (!containerRef.value) {
        return { top: 0, bottom: 0, right: 0, left: 0 };
    }
    const parsePX = (px: string) => {
        const val = parseFloat(px.replace('px', ''));
        return isNaN(val) ? 0 : val;
    };
    const style = getComputedStyle(containerRef.value);
    return {
        top: parsePX(style.paddingTop),
        bottom: parsePX(style.paddingBottom),
        right: parsePX(style.paddingRight),
        left: parsePX(style.paddingLeft),
    };
};

const getHeightToIndex = (index: number, padding: Padding) => {
    let height = padding.top + elemSizeArray.value[0] + finalRowGap.value;
    for (let i = 0; i < index; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        height += Math.max(...rowHeights);
        height += finalRowGap.value;
    }
    return height;
};

const getStartIndex = (padding: Padding) => {
    let start = 0;
    let offset = padding.top + elemSizeArray.value[0] + finalRowGap.value;
    for (let i = 0; i < props.items.length; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        offset += Math.max(...rowHeights);
        offset += finalRowGap.value;
        if (offset >= scrollTop.value) {
            start = i;
            break;
        }
    }

    return Math.max(0, start - props.buffer * finalColumn.value);
};

const finalRowGap = computed(() => props.gap?.row ?? 0);

// 动态总高度
const totalHeight = computed(() => {
    const padding = getContainerPadding();
    let height = getHeightToIndex(props.items.length, padding);
    height += elemSizeArray.value[1] + padding.bottom;
    logger.debug('totalHeight', height);
    return height;
});

// 核心计算属性：可见项范围
const visibleRange = computed(() => {
    const padding = getContainerPadding();
    const start = getStartIndex(padding);
    let end = start + Math.ceil(scrollParentSize.value.height / props.itemHeight) + 2 * props.buffer * finalColumn.value;
    if (end > props.items.length) {
        end = props.items.length;
    }

    let startOffset = getHeightToIndex(start, padding);
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
        itemWidth = ((props.contentWidth || scrollParentSize.value.width) - finalGap.value.column * (finalColumn.value - 1)) / finalColumn.value;
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
        if (visibleRange.value.end >= props.items.length - 1) {
            footerRef.value!.style.transform = `translateY(${visibleRange.value.startOffset + itemOffsetY}px)`;
            footerRef.value!.style.visibility = 'visible';
        } else {
            footerRef.value!.style.visibility = 'hidden';
        }
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
    <div ref="containerRef" class="ui-virtual-list">
        <!-- 撑开滚动条的占位元素 -->
        <div :style="{ minHeight: totalHeight + 'px' }"></div>
        <div ref="headerRef" class="ui-virtual-list-header">
            <slot name="header"></slot>
        </div>
        <div class="ui-virtual-content" :style="{
            width: props.contentWidth ? props.contentWidth + 'px' : '100%',
            transform: `translateY(${visibleItems.offset}px)`
        }">
            <div v-for="(item, index) in visibleItems.items" :key="item.id" ref="listItemsRef"
                class="ui-virtual-list-item" :data-item-id="item.id" :style="item.__style__">
                <slot name="item" :item="item" :index="visibleRange.start + index"></slot>
            </div>
        </div>
        <div ref="footerRef" class="ui-virtual-list-footer" style="visibility: hidden;">
            <slot name="footer"></slot>
        </div>
    </div>
</template>
