<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">
import { newGapFromString, newPaddingFromString, newResizeObserver, zeroPadding, type Gap, type Padding } from './scripts/Elements';
import { useScrollParent } from './scripts/ScrollParent';
import { isRenderVisibleRangeSame, zeroRenderVisibleRange, type RenderVisibleRange, type VisibleRange } from './scripts/Virtuals';

const props = defineProps<{
    items: T[]
    itemHeight: number
    contentWidth?: number
    column?: number
    gap?: Gap | string
    buffer?: number
    contentPadding?: Padding | string
    contentClass?: string
    ssrVisibleItems?: number
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const listItemsRef = ref<HTMLDivElement[]>([]);
const { scrollTop, scrollParentSize, initScrollParent, scrollParent, isOverflowX, releaseScrollParent } = useScrollParent(containerRef);

const measuredHeights: { [key: string]: number } = {};// 存储实际高度
const finalColumn = computed(() => props.column || 1);
const finalGap = computed(() => {
    if (typeof props.gap === 'string') {
        return newGapFromString(props.gap);
    }
    return props.gap || { row: 0, column: 0 };
});
const finalBuffer = computed(() => props.buffer ?? 10);
const finalContentPadding = computed(() => {
    if (typeof props.contentPadding === 'string') {
        return newPaddingFromString(props.contentPadding);
    }
    return props.contentPadding ?? zeroPadding();
});

const renderVisibleRange = shallowRef<RenderVisibleRange>(zeroRenderVisibleRange());

const emit = defineEmits<{
    (e: "visble-range-changed", range: VisibleRange): void
}>();

const itemResizeObserver = newResizeObserver((entries) => {
    // logger.debug('itemResizeObserver', entries);
    for (const entry of entries) {
        if (!(entry.target instanceof HTMLDivElement)) {
            continue;
        }

        const height = entry.contentRect.height;
        const itemId = entry.target.dataset.itemId || '';
        // 此处需要过滤掉==0 的值，当元素被重用时，其元素的值会短暂为 0
        // === props.itemHeight 的也没必要处理，因为默认会回退到这个尺寸
        if (!itemId || height < 1 || height === props.itemHeight) {
            continue;
        }

        if (measuredHeights[itemId] !== height) {
            measuredHeights[itemId] = height;
            updateTotalHeight();
            checkVisibleRange();
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
    let remainWidth = props.contentWidth || scrollParentSize.value.width;
    if (remainWidth) {
        remainWidth = remainWidth - finalContentPadding.value.left - finalContentPadding.value.right;
    }
    return remainWidth > 0 ? remainWidth : 0;
});

const finalContentWidth = computed(() => {
    return props.contentWidth || scrollParentSize.value.width || 0;
});

watch(isOverflowX, (val) => {
    // logger.debug('isOverflowX', val);
    if (!containerRef.value || !contentRef.value) return;
    if (val) {
        containerRef.value.style.alignItems = 'flex-start';
        contentRef.value.style.left = finalContentPadding.value.left + 'px';
    } else {
        containerRef.value.style.alignItems = 'center';
        contentRef.value.style.left = '';
    }
});
watch(scrollTop, () => checkVisibleRange());
watch(scrollParentSize, () => checkVisibleRange());

const getHeightToIndex = (index: number) => {
    let height = finalContentPadding.value.top;
    for (let i = 0; i < index; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights[item.id] || props.itemHeight);
        }
        height += Math.max(...rowHeights);
        height += finalGap.value.row;
    }

    return height;
};

const getStartIndex = (topsHeight: number) => {
    const actualTopForList = scrollTop.value - topsHeight;
    let start = 0;
    let offset = finalContentPadding.value.top;
    for (let i = 0; i < props.items.length; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights[item.id] || props.itemHeight);
        }
        offset += Math.max(...rowHeights);
        if (offset >= actualTopForList) {
            start = i;
            break;
        }
        offset += finalGap.value.row;
    }

    return {
        bufferStart: Math.max(0, start - finalBuffer.value * finalColumn.value),
        visibleStart: start
    };
};

const totalHeight = ref(0);

const updateTotalHeight = () => {
    let height = getHeightToIndex(props.items.length);
    if (height > finalGap.value.row) {
        height -= finalGap.value.row;
    }
    height += finalContentPadding.value.bottom;
    totalHeight.value = height;
};

const getViewportInfo = () => {
    if (!scrollParent.value) {
        let fallbackItems = props.ssrVisibleItems ?? 0;
        if (fallbackItems < 1) {
            fallbackItems = 1;
        }
        const fallbackHeight = fallbackItems * props.itemHeight + (fallbackItems - 1) * finalGap.value.row;
        return { topsHeight: 0, viewportHeight: fallbackHeight, bottomsHeight: 0 };
    }
    let scrollHeight = 0;
    let scrollContainerTop = 0;
    if (scrollParent.value instanceof Window) {
        scrollHeight = scrollParent.value.document.scrollingElement?.scrollHeight ?? 0;
    } else if (scrollParent.value instanceof HTMLElement) {
        scrollHeight = scrollParent.value.scrollHeight;
        const rect = scrollParent.value.getBoundingClientRect();
        scrollContainerTop = rect.top;
    }

    // 此处需要计算相对 top，因为 getBoundingClientRect 会返回相对于视口的位置，而不是相对于滚动容器的位置
    const containerTop = (containerRef.value?.getBoundingClientRect()?.top ?? 0);
    const relativeTop = containerTop - scrollContainerTop;
    let viewportHeight = scrollParentSize.value.height;
    // 此处需要处理掉 padding 部分的高度
    if (relativeTop > -finalContentPadding.value.top) {
        viewportHeight = viewportHeight - relativeTop - finalContentPadding.value.top;
    }

    const othersHeight = scrollHeight - totalHeight.value;
    const topsHeight = Math.floor(relativeTop + scrollTop.value);
    const bottomsHeight = othersHeight - topsHeight;
    // logger.debug('getViewportInfo', {
    //     scrollContainerTop,
    //     scrollHeight,
    //     othersHeight,
    //     topsHeight,
    //     bottomsHeight,
    //     scrollTop: scrollTop.value,
    //     totalHeight: totalHeight.value,
    //     containerRect,
    //     viewportHeight,
    // });
    return {
        topsHeight,
        viewportHeight,
        bottomsHeight,
    };
};

const checkVisibleRange = () => {
    const { topsHeight, viewportHeight } = getViewportInfo();
    if (viewportHeight < 1) {
        return;
    }
    updateTotalHeight();
    const { bufferStart, visibleStart } = getStartIndex(topsHeight);
    let visibleEnd = visibleStart;
    // 计算视口可见项
    let visibleItemsHeight = 0;
    const rowHeights: number[] = [];
    for (let i = visibleStart; i < props.items.length; i += finalColumn.value) {
        rowHeights.splice(0, rowHeights.length);
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights[item.id] || props.itemHeight);
        }
        visibleEnd = i;
        visibleItemsHeight += Math.max(...rowHeights);
        if (visibleItemsHeight > viewportHeight) {
            break;
        }
        // 加了间隔之后，如果大于了可显示高度，则还是取当前的索引
        visibleItemsHeight += finalGap.value.row;
        if (visibleItemsHeight > viewportHeight) {
            break;
        }
    }

    let bufferEnd = visibleEnd + finalBuffer.value * finalColumn.value;
    bufferEnd = Math.min(bufferEnd, props.items.length - 1);

    let startOffset = getHeightToIndex(bufferStart);
    // startOffset += finalGap.value.row;
    startOffset = Math.min(startOffset, totalHeight.value);

    const curRange: RenderVisibleRange = { bufferStart, visibleStart, visibleEnd, bufferEnd, startOffset };
    if (!isRenderVisibleRangeSame(curRange, renderVisibleRange.value)) {
        renderVisibleRange.value = curRange;
        // logger.debug('viewport', {
        //     topsHeight,
        //     viewportHeight,
        //     bottomsHeight,
        // });
        emit('visble-range-changed', { bufferStart, visibleStart, visibleEnd, bufferEnd });
    }
};

// 可见项列表
const visibleItems = computed(() => {
    const items = props.items.slice(renderVisibleRange.value.bufferStart, renderVisibleRange.value.bufferEnd + 1);
    // logger.debug('visibleRange', visibleRange.value);//, 'visibleItems', items);

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
            rowHeights.push(measuredHeights[item.id] || props.itemHeight);
            itemOffsetX += itemWidth + finalGap.value.column;
        }

        itemOffsetY += Math.max(...rowHeights);
        itemOffsetY += finalGap.value.row;
    }

    return items;
});

updateTotalHeight();
checkVisibleRange();
onMounted(() => {
    initScrollParent();
    updateTotalHeight();
    checkVisibleRange();
});

onUnmounted(() => {
    itemResizeObserver.disconnect();
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
        <div ref="contentRef" class="ui-virtual-content" :style="{
            width: finalContentWidthExcludePadding + 'px',
            transform: `translateY(${renderVisibleRange.startOffset}px)`,
        }">
            <div v-for="(item, index) in visibleItems" :key="item.id" ref="listItemsRef" class="ui-virtual-list-item"
                :data-item-id="item.id" :style="item.__style__">
                <slot name="item" :item="item" :index="renderVisibleRange.bufferStart + index"></slot>
            </div>
        </div>
    </div>
</template>
