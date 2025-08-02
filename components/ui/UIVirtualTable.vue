<script setup lang="ts" generic="
T extends {  [key: string]: any }, 
TCol extends {width: number, field: string, [key: string]: any},
TSpanItem">
import { logger, newPaddingFromString, newResizeObserver, zeroPadding, type Padding } from 'vuepkg';
import { useScrollParent } from './scripts/ScrollParent';
import {
    isRenderVisibleRangeSame,
    zeroRenderVisibleRange,
    type RenderVisibleRange,
    type TableSpan,
    type VirtualScrollerExpose,
    type VisibleRange
} from './scripts/Virtuals';

const props = defineProps<{
    items: T[];
    itemHeight: number
    rowKey: (item: T) => string
    /**
     * 行间距, key 为行索引, value 为间距。间距将添加在指定行的底部（最后一行不会添加）.
     * key 为-1 时，表示默认行间距
     */
    rowGap?: { [key: number]: number }
    /**
     * 列间距, key 为列索引, value 为间距。间距将添加在指定列的右侧（最后一列不会添加）。
     * key 为-1 时，表示默认列间距
     */
    columnGap?: { [key: number]: number }
    columns: TCol[]
    /**
     * 合并单元格的定义
     */
    spans?: TableSpan<TSpanItem>[]
    buffer?: number
    contentPadding?: Padding | string
    contentClass?: string
    tableClass?: string
    rowClass?: string
    cellClass?: string
    ssrVisibleItems?: number
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const rowItemsRef = ref<HTMLDivElement[]>([]);
const measuredHeights: { [key: string]: number } = {};// 存储实际高度
const { scrollTop, scrollParentSize, initScrollParent, scrollParent, isOverflowX, releaseScrollParent } = useScrollParent(containerRef);

const finalBuffer = computed(() => props.buffer ?? 10);
const finalContentPadding = computed(() => {
    if (typeof props.contentPadding === 'string') {
        return newPaddingFromString(props.contentPadding);
    }
    return props.contentPadding ?? zeroPadding();
});

const getColumnRightGap = (index: number): number => {
    const val = props.columnGap?.[index];
    if (val) {
        return val;
    }
    return props.columnGap?.[-1] ?? 0;
};

const finalColumns = computed(() => {
    const arr: TCol[] = props.columns.map((col) => ({
        ...col,
    }));
    for (let i = 0; i < arr.length; i++) {
        const col = arr[i];
        const gap = i < arr.length - 1 ? getColumnRightGap(i) : 0;
        arr[i] = {
            ...col,
            __style__: {
                width: col.width + 'px',
                marginRight: `${gap}px`
            }
        };
    }
    return arr;
});

const getRowHeight = (item: T): number => {
    return measuredHeights[props.rowKey(item)] ?? props.itemHeight;
};

const getRowBottomGap = (index: number): number => {
    const val = props.rowGap?.[index];
    if (val) {
        return val;
    }
    return props.rowGap?.[-1] ?? 0;
};

const totalHeight = ref(0);
const updateTotalHeight = () => {
    let height = finalContentPadding.value.top;
    for (let i = 0; i < props.items.length; i++) {
        const item = props.items[i];
        height += getRowHeight(item);
        if (i < props.items.length - 1) {
            height += getRowBottomGap(i);
        }
    }
    height += finalContentPadding.value.bottom;
    totalHeight.value = height;
};

const contentWidth = computed(() => {
    let width = 0;
    for (let i = 0; i < props.columns.length; i++) {
        const element = props.columns[i];
        width += element.width;
        if (i < props.columns.length - 1) {
            width += getColumnRightGap(i);
        }
    }
    return width;
});
const contentWidthWithPadding = computed(() => {
    return contentWidth.value + finalContentPadding.value.left + finalContentPadding.value.right;
});

const renderVisibleRange = shallowRef<RenderVisibleRange>(zeroRenderVisibleRange());
const emit = defineEmits<{
    (e: "visble-range-changed", range: VisibleRange): void
}>();

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
watch(scrollTop, () => refresh());
watch(scrollParentSize, () => refresh());

const itemResizeObserver = newResizeObserver((entries) => {
    // logger.debug('itemResizeObserver', entries);
    for (const entry of entries) {
        if (!(entry.target instanceof HTMLDivElement)) {
            continue;
        }

        const height = entry.contentRect.height;
        const rowId = entry.target.dataset.rowId;
        // 此处需要过滤掉==0 的值，当元素被重用时，其元素的值会短暂为 0
        // === props.itemHeight 的也没必要处理，因为默认会回退到这个尺寸
        if (!rowId || height < 1 || height === props.itemHeight) {
            continue;
        }

        if (measuredHeights[rowId] !== height) {
            measuredHeights[rowId] = height;
            refresh();
        }
    }
});
watch(rowItemsRef, (newVal, oldVal) => {
    oldVal.forEach((item) => {
        itemResizeObserver.unobserve(item);
    });
    newVal.forEach((item) => {
        itemResizeObserver.observe(item);
    });
}, { deep: true });

const getHeightToIndex = (index: number) => {
    let height = finalContentPadding.value.top;
    for (let i = 0; i < index; i++) {
        const item = props.items[i];
        height += getRowHeight(item);
        height += getRowBottomGap(i);
    }
    return height;
};
const getStartIndex = (topsHeight: number) => {
    const actualTopForList = scrollTop.value - topsHeight;
    let start = 0;
    let offset = finalContentPadding.value.top;
    let startIndexRowHeight = 0;
    for (let i = 0; i < props.items.length; i += 1) {
        startIndexRowHeight = getRowHeight(props.items[i]);
        offset += startIndexRowHeight;
        if (offset >= actualTopForList) {
            start = i;
            break;
        }
        offset += getRowBottomGap(i);
    }
    offset -= startIndexRowHeight; // 需要去掉 start 这一行的高度
    let startRelativeOffset = 0; // start 相对于视口的偏移量
    if (actualTopForList > 0) {
        startRelativeOffset = offset - actualTopForList; // start 相对于视口的偏移量
    }

    return {
        bufferStart: Math.max(0, start - finalBuffer.value),
        visibleStart: start,
        startRelativeOffset: startRelativeOffset
    };
};

const getViewportInfo = () => {
    if (!scrollParent.value) {
        let fallbackItems = props.ssrVisibleItems ?? 0;
        if (fallbackItems < 1) {
            fallbackItems = 1;
        }
        const fallbackHeight = fallbackItems * props.itemHeight;
        return { topsHeight: 0, viewportHeight: fallbackHeight, bottomsHeight: 0, scrollHeight: 0 };
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

    return {
        topsHeight,
        viewportHeight,
        bottomsHeight,
        scrollHeight,
    };
};

const checkVisibleRange = () => {
    const { topsHeight, viewportHeight } = getViewportInfo();
    if (viewportHeight < 1) {
        return;
    }
    const { bufferStart, visibleStart, startRelativeOffset } = getStartIndex(topsHeight);
    let visibleEnd = visibleStart;
    // 计算视口可见项
    let visibleItemsHeight = startRelativeOffset;
    for (let i = visibleStart; i < props.items.length; i += 1) {
        visibleEnd = i;
        visibleItemsHeight += getRowHeight(props.items[i]);
        if (visibleItemsHeight >= viewportHeight) {
            break;
        }
        if (i === props.items.length - 1) break; // 已经是最后一个项了，不再处理 

        // 加了间隔之后，如果大于了可显示高度，则还是取当前的索引
        // 此处暂不➕到visibleItemsHeight上，否则后面计算visibleEndRelativeOffset 会不准确
        const step = visibleItemsHeight + getRowBottomGap(i);
        if (step >= viewportHeight) {
            break;
        }
        visibleItemsHeight = step;
    }

    let bufferEnd = visibleEnd + finalBuffer.value;
    bufferEnd = Math.min(bufferEnd, props.items.length - 1);

    let startOffset = getHeightToIndex(bufferStart);
    startOffset = Math.min(startOffset, totalHeight.value);

    const curRange: RenderVisibleRange = {
        bufferStart,
        visibleStart,
        visibleEnd,
        bufferEnd,
        startOffset,
        visibleStartRelativeOffset: startRelativeOffset,
        visibleEndRelativeOffset: viewportHeight - visibleItemsHeight
    };
    if (!isRenderVisibleRangeSame(curRange, renderVisibleRange.value)) {
        renderVisibleRange.value = curRange;
        // emit('visble-range-changed', curRange);
        if (typeof requestAnimationFrame === 'undefined') {
            emit('visble-range-changed', curRange);
        } else {
            requestAnimationFrame(() => emit('visble-range-changed', curRange));
        }
    }
};

// 可见项列表
const visibleItems = computed(() => {
    const items = props.items.slice(renderVisibleRange.value.bufferStart, renderVisibleRange.value.bufferEnd + 1);
    // logger.debug('visibleRange', visibleRange.value);//, 'visibleItems', items);
    for (let i = 0; i < items.length; i += 1) {
        const rowIndex = renderVisibleRange.value.bufferStart + i;
        if (rowIndex < props.items.length - 1) {
            items[i] = {
                ...items[i],
                __style__: {
                    marginBottom: `${getRowBottomGap(rowIndex)}px`,
                }
            };
        }
    }

    return items;
});

const refresh = () => {
    updateTotalHeight();
    checkVisibleRange();
};

const onMouseWheel = (_e: Event) => {
    // logger.debug('onMouseWheel', _e);
    clearScrollTimeout(); // 有鼠标滚动时，取消跳转，防止滚动抖动
};

refresh();
onMounted(() => {
    initScrollParent();
    refresh();
});

onUnmounted(() => {
    releaseScrollParent();
    itemResizeObserver.disconnect();
    clearScrollTimeout();
});


const scrollToTop = (behavior: ScrollBehavior = 'auto') => {
    clearScrollTimeout();
    logger.debug('scrollToTop', behavior, scrollParent.value);
    scrollParent.value?.scrollTo({ top: 0, behavior });
};

let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
const clearScrollTimeout = () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = undefined;
    }
};
const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    // 由于高度无法提前感知，所以需要试探性的滚动，满足条件时再退出
    const delay = behavior === 'instant' ? 10 : 500;
    const doScroll = () => {
        clearScrollTimeout();
        const { scrollHeight, viewportHeight } = getViewportInfo();
        if (scrollTop.value < scrollHeight - viewportHeight) {
            scrollParent.value?.scrollTo({ top: scrollHeight - viewportHeight, behavior });
            scrollTimeout = setTimeout(() => doScroll(), delay);
        } else {
            logger.debug('scrollToBottom', 'break', scrollTop.value, scrollHeight, viewportHeight);
        }
    };
    doScroll();
};
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'auto') => {
    if (index < 0) return;
    // 由于高度无法提前感知，所以需要试探性的滚动，满足条件时再退出
    const delay = behavior === 'instant' ? 10 : 500;
    const doScroll = () => {
        clearScrollTimeout();
        const { topsHeight, scrollHeight } = getViewportInfo();
        const height = topsHeight + getHeightToIndex(index);
        logger.debug('scrollToIndex', index, topsHeight, height, scrollHeight);
        if (height > scrollHeight) {
            scrollToBottom(behavior);
            return;
        }
        scrollParent.value?.scrollTo({ top: height, behavior });
        if (index >= renderVisibleRange.value.visibleStart && index < renderVisibleRange.value.visibleEnd) {
            logger.debug('scrollToIndex', 'break');
            return;
        }
        scrollTimeout = setTimeout(() => doScroll(), delay);
    };
    doScroll();
};
defineExpose<VirtualScrollerExpose>({ scrollToTop, scrollToBottom, scrollToIndex });

</script>

<template>
    <div ref="containerRef" class="ui-virtual-table" style="padding: 0;" @wheel="onMouseWheel">
        <!-- 撑开滚动条的占位元素 -->
        <div class="ui-virtual-table-sizes" :class="contentClass" :style="{
            minWidth: contentWidthWithPadding + 'px',
            minHeight: totalHeight + 'px',
        }"></div>
        <div ref="contentRef" class="ui-virtual-table-content" :class="tableClass" :style="{
            position: 'absolute',
            width: contentWidth + 'px',
            transform: `translateY(${renderVisibleRange.startOffset}px)`,
        }">
            <div v-for="(row, index) in visibleItems" :key="rowKey(row)" ref="rowItemsRef"
                class="ui-flex ui-flex-align-stretch ui-virtual-table-row" :class="rowClass" :data-row-id="rowKey(row)"
                :style="row.__style__">
                <div v-for="col in finalColumns" :key="col.field" class="ui-virtual-table-cell" :class="cellClass"
                    :style="col.__style__">
                    <slot name="cell" :row="row" :row-index="renderVisibleRange.bufferStart + index" :col="col">
                        {{ row[col.field] ?? '' }}
                    </slot>
                </div>
            </div>
        </div>
    </div>
</template>
