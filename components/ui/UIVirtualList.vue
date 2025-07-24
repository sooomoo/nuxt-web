<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">
import { logger } from 'vuepkg';
import { getScrollParent } from './scripts/ScrollParent';

class FallbackResizeObserver implements ResizeObserver {
    disconnect(): void {
        logger.debug('disconnect');
    }
    observe(target: Element, options?: ResizeObserverOptions): void {
        logger.debug('observe', target, options);
    }
    unobserve(target: Element): void {
        logger.debug('unobserve', target);
    }
}

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

const containerSize = shallowRef<{ width: number, height: number }>({ width: 0, height: 0 });

const scrollTop = ref(0);
const measuredHeights = ref<{ [key: string]: number }>({});// 存储实际高度

const finalColumn = computed(() => props.column || 1);
const finalGap = computed(() => props.gap || { row: 0, column: 0 });

const headerRef = ref<HTMLDivElement | null>(null);
const headerHeight = ref(0);
const footerRef = ref<HTMLDivElement | null>(null);
const footerHeight = ref(0);

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
    let height = padding.top + headerHeight.value + finalRowGap.value;
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

const finalRowGap = computed(() => props.gap?.row ?? 0);

// 动态总高度
const totalHeight = computed(() => {
    const padding = getContainerPadding();
    let height = padding.top + headerHeight.value + finalRowGap.value;
    for (let i = 0; i < props.items.length; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        height += Math.max(...rowHeights);
        height += finalRowGap.value;
    }
    height += footerHeight.value + padding.bottom;
    // height = Math.ceil(height);
    logger.debug('totalHeight', height);
    return height;
});


// 核心计算属性：可见项范围
const visibleRange = computed(() => {
    const padding = getContainerPadding();
    let start = 0;
    let offset = padding.top + headerHeight.value + finalRowGap.value;
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

    start = Math.max(0, start - props.buffer * finalColumn.value);
    let end = start + Math.ceil(containerSize.value.height / props.itemHeight) + 2 * props.buffer * finalColumn.value;
    if (end > props.items.length) {
        end = props.items.length;
    }

    let startOffset = padding.top + headerHeight.value + finalRowGap.value;
    for (let i = 0; i < start; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        startOffset += Math.max(...rowHeights);
        startOffset += finalRowGap.value;
    }
    // logger.debug('offsets', startOffset, scrollTop.value);
    if (startOffset > totalHeight.value) {
        startOffset = totalHeight.value;
    }

    return { start, end, startOffset };
});

// 可见项列表
const visibleItems = computed(() => {
    const items = props.items.slice(visibleRange.value.start, visibleRange.value.end);
    // 计算每个项的偏移量
    let offsetY = 0;
    logger.debug('visibleRange', visibleRange.value, 'startOffset', offsetY);//, 'visibleItems', items);

    for (let i = 0; i < items.length; i += finalColumn.value) {
        let itemWidthVal = 0;
        if (finalColumn.value > 0) {
            itemWidthVal = ((props.contentWidth || containerSize.value.width) - finalGap.value.column * (finalColumn.value - 1)) / finalColumn.value;
        }
        let offsetX = 0;
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = items[i + j];
            if (!item) continue; // 超出索引范围
            items[i + j] = {
                ...item,
                __style__: {
                    transform: offsetX > 0 ? `translateY(${offsetY}px) translateX(${offsetX}px)` : `translateY(${offsetY}px)`,
                    width: `${itemWidthVal}px`,
                },
            };
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
            offsetX += itemWidthVal + finalGap.value.column;
        }
        offsetY += Math.max(...rowHeights);
        offsetY += finalGap.value.row;
    }
    // footer 始终在最后
    if (footerRef.value) {
        if (visibleRange.value.end >= props.items.length - 1) {
            footerRef.value!.style.transform = `translateY(${visibleRange.value.startOffset + offsetY}px)`;
            footerRef.value!.style.visibility = 'visible';
        } else {
            footerRef.value!.style.visibility = 'hidden';
        }
    }

    return { items, offset: visibleRange.value.startOffset };
});

// 滚动事件处理（防抖优化）
let scrollHandling = false;
const handleScroll = () => {
    // logger.debug('scrollTop', e);
    if (scrollHandling) return;
    scrollHandling = true;
    requestAnimationFrame(() => {
        if (!scrollParent.value) {
            scrollHandling = false;
            return;
        }
        if (scrollParent.value instanceof Window) {
            scrollTop.value = scrollParent.value.scrollY;
        } else {
            scrollTop.value = scrollParent.value.scrollTop;
        }
        scrollHandling = false;
    });
};

const updateScrollParentSize = () => {
    if (!scrollParent.value) {
        return;
    }
    if (scrollParent.value instanceof Window) {
        containerSize.value = {
            width: scrollParent.value.innerWidth,
            height: scrollParent.value.innerHeight,
        };
    } else {
        containerSize.value = {
            width: scrollParent.value.clientWidth,
            height: scrollParent.value.clientHeight,
        };
    }
};
const handleResize = (e: Event) => {
    logger.debug('resize', e.target);
    updateScrollParentSize();
};

const resizeObserver = typeof ResizeObserver === 'undefined' ? new FallbackResizeObserver() : new ResizeObserver(entries => {
    for (const entry of entries) {
        if (entry.target === headerRef.value) {
            headerHeight.value = entry.contentRect.height;
        } else if (entry.target === footerRef.value) {
            footerHeight.value = entry.contentRect.height;
        } else if (entry.target === scrollParent.value) {
            containerSize.value = entry.contentRect;
        }
    }
});

const scrollParent = ref<Window | Element | null>(null);

const doRelease = () => {
    resizeObserver.disconnect();
    itemResizeObserver.disconnect();

    if (scrollParent.value) {
        scrollParent.value.removeEventListener('scroll', handleScroll);
        scrollParent.value.removeEventListener('resize', handleResize);
    }
};
const doInit = () => {
    doRelease();
    // 滚动父元素
    scrollParent.value = getScrollParent(containerRef.value);
    if (scrollParent.value) {
        scrollParent.value.addEventListener('scroll', handleScroll, { passive: true });
        logger.debug('scrollParent', scrollParent.value);
        scrollParent.value.addEventListener('resize', handleResize, { passive: true });

        updateScrollParentSize();
        handleScroll();
        // scrollTop.value = 0;
        // scrollParent.value.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    }
    // 初始测量
    if (headerRef.value && footerRef.value) {
        resizeObserver.observe(headerRef.value);
        resizeObserver.observe(footerRef.value);
        headerHeight.value = headerRef.value?.clientHeight || 0;
        footerHeight.value = footerRef.value?.clientHeight || 0;
    }
};

onMounted(() => {
    // 滚动父元素
    doInit();
});
onUnmounted(() => {
    doRelease();
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
