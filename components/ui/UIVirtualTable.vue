<script setup lang="ts" generic="T extends {  [key: string]: any }, TCol extends {width: number, field: string}">
import { logger, newPaddingFromString, zeroPadding, type Padding } from 'vuepkg';
import { useScrollParent } from './scripts/ScrollParent';
import { isRenderVisibleRangeSame, zeroRenderVisibleRange, type RenderVisibleRange, type VirtualScrollerExpose, type VisibleRange } from './scripts/Virtuals';


interface TableSpan<T> {
    row: number
    column: number
    rowSpan: number
    columnSpan: number
    item: T
}

const props = defineProps<{
    items: T[];
    rowHeightFunc: (item: T) => number
    itemKey: (item: T) => string
    columns: TCol[]
    spans?: TableSpan<T>[]
    buffer?: number
    contentPadding?: Padding | string
    contentClass?: string
    tableClass?: string
    ssrVisibleItems?: number
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const { scrollTop, scrollParentSize, initScrollParent, scrollParent, isOverflowX, releaseScrollParent } = useScrollParent(containerRef);

const finalBuffer = computed(() => props.buffer ?? 10);
const finalContentPadding = computed(() => {
    if (typeof props.contentPadding === 'string') {
        return newPaddingFromString(props.contentPadding);
    }
    return props.contentPadding ?? zeroPadding();
});

const totalHeight = computed(() => {
    let height = finalContentPadding.value.top;
    for (const item of props.items) {
        height += props.rowHeightFunc(item);
    }
    height += finalContentPadding.value.bottom;
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
watch(scrollTop, () => checkVisibleRange());
watch(scrollParentSize, () => checkVisibleRange());

const getHeightToIndex = (index: number) => {
    let height = finalContentPadding.value.top;
    for (let i = 0; i < index; i++) {
        height += props.rowHeightFunc(props.items[i]);
    }
    return height;
};
const getStartIndex = (topsHeight: number) => {
    const actualTopForList = scrollTop.value - topsHeight;
    let start = 0;
    let offset = finalContentPadding.value.top;
    let startIndexRowHeight = 0;
    for (let i = 0; i < props.items.length; i += 1) {
        startIndexRowHeight = props.rowHeightFunc(props.items[i]);
        offset += startIndexRowHeight;
        if (offset > actualTopForList) {
            start = i;
            break;
        }
    }
    offset -= startIndexRowHeight; // 需要去掉 start 这一行的高度
    let startRelativeOffset = 0; // start 相对于视口的偏移量
    if (actualTopForList > 0) {
        startRelativeOffset = offset - actualTopForList; // start 相对于视口的偏移量
    }

    // logger.debug('getStartIndex', {
    //     actualTopForList,
    //     offset,
    //     scrollTopValue: scrollTop.value,
    //     startRelativeOffset,
    // });

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
        const avgHeight = props.items.length > 0 ? totalHeight.value / props.items.length : 50;
        const fallbackHeight = fallbackItems * avgHeight;
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
    // logger.debug('getViewportInfo', {
    //     // scrollContainerTop,
    //     // scrollHeight,
    //     // othersHeight,
    //     // topsHeight,
    //     // bottomsHeight,
    //     // scrollTop: scrollTop.value,
    //     // totalHeight: totalHeight.value,
    //     // containerRect,
    //     viewportHeight,
    //     scrollParentHeight: scrollParentSize.value.height,
    // });
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
        visibleItemsHeight += props.rowHeightFunc(props.items[i]);
        if (visibleItemsHeight >= viewportHeight) {
            break;
        }
        if (i === props.items.length - 1) break; // 已经是最后一个项了，不再处理
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
    return items;
});

const refresh = () => {
    checkVisibleRange();
};

const onMouseWheel = (_e: Event) => {
    // logger.debug('onMouseWheel', _e);
};

refresh();
onMounted(() => {
    initScrollParent();
    refresh();
});

onUnmounted(() => {
    releaseScrollParent();
});


const scrollToTop = (behavior: ScrollBehavior = 'auto') => {
    logger.debug('scrollToTop', behavior, scrollParent.value);
    scrollParent.value?.scrollTo({ top: 0, behavior });
};

const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const { scrollHeight, viewportHeight } = getViewportInfo();
    if (scrollTop.value < scrollHeight - viewportHeight) {
        scrollParent.value?.scrollTo({ top: scrollHeight - viewportHeight, behavior });
    } else {
        logger.debug('scrollToBottom', 'break', scrollTop.value, scrollHeight, viewportHeight);
    }
};
const scrollToIndex = (index: number, behavior: ScrollBehavior = 'auto') => {
    const { topsHeight, scrollHeight } = getViewportInfo();
    const height = topsHeight + getHeightToIndex(index);
    logger.debug('scrollToIndex', index, topsHeight, height, scrollHeight);
    if (height > scrollHeight) {
        scrollToBottom(behavior);
    }
    scrollParent.value?.scrollTo({ top: height, behavior });
    if (index >= renderVisibleRange.value.visibleStart && index < renderVisibleRange.value.visibleEnd) {
        logger.debug('scrollToIndex', 'break');
        return;
    }
};
defineExpose<VirtualScrollerExpose>({ scrollToTop, scrollToBottom, scrollToIndex });

</script>

<template>
    <div ref="containerRef" class="ui-virtual-table" style="padding: 0;" @wheel="onMouseWheel">
        <!-- 撑开滚动条的占位元素 -->
        <div :class="'ui-virtual-sizes ' + props.contentClass" :style="{
            minWidth: contentWidthWithPadding + 'px',
            minHeight: totalHeight + 'px',
        }"></div>
        <table ref="contentRef" class="ui-virtual-content" :class="tableClass" :style="{
            position: 'absolute',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
            width: contentWidth + 'px',
            transform: `translateY(${renderVisibleRange.startOffset}px)`,
        }">
            <colgroup>
                <col v-for="col in columns" :key="col.field" :style="{ width: `${col.width}px` }">
            </colgroup>
            <tbody>
                <tr v-for="(row, index) in visibleItems" :key="itemKey(row)" :data-item-id="itemKey(row)"
                    :style="{ height: `${rowHeightFunc(row)}px` }">
                    <td v-for="col in columns" :key="col.field">
                        <slot name="cell" :row="row" :row-index="index" :col="col">{{ row[col.field] ?? '' }}</slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
