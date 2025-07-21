<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">
import { logger } from 'vuepkg';

const props = defineProps<{
    items: T[]
    itemHeight: number
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

// 动态总高度
const totalHeight = computed(() => {
    let height = 0;
    for (let i = 0; i < props.items.length; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        height += Math.max(...rowHeights);
    }
    logger.debug('totalHeight', height, measuredHeights.value);
    return height;
});


// 核心计算属性：可见项范围
const visibleRange = computed(() => {
    let start = 0;
    let offset = 0;
    for (let i = 0; i < props.items.length; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        offset += Math.max(...rowHeights);
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

    const range = { start, end };
    logger.debug('visibleRange', range);

    return range;
});

// 可见项列表
const visibleItems = computed(() => {
    const items = props.items.slice(visibleRange.value.start, visibleRange.value.end);
    logger.debug('visibleItems', items);
    // 计算每个项的偏移量
    let offset = getStartOffset();

    for (let i = 0; i < items.length; i += finalColumn.value) {
        let itemWidth = '100%';
        let itemWidthVal = 0;
        if (finalColumn.value > 1) {
            itemWidthVal = (containerSize.value.width - finalGap.value.column * (finalColumn.value - 1)) / finalColumn.value;
            itemWidth = `${itemWidthVal}px`;
        }
        let offsetX = 0;
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = items[i + j];
            if (!item) continue; // 超出索引范围
            items[i + j] = {
                ...item,
                __style__: {
                    transform: `translateY(${offset}px) translateX(${offsetX}px)`,
                    width: itemWidth,
                },
            };
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
            offsetX += itemWidthVal + finalGap.value.column;
        }
        offset += Math.max(...rowHeights);
        offset += finalGap.value.row;
    }
    return items;
});

// 滚动事件处理（防抖优化）
const handleScroll = () => {
    requestAnimationFrame(() => {
        if (!containerRef.value) {
            return;
        }
        scrollTop.value = containerRef.value.scrollTop;
        logger.debug('handleScroll', scrollTop.value);
    });

    // scheduleMeasureHeights();
};

// 偏移量计算
const getStartOffset = () => {
    let sum = 0;
    for (let i = 0; i < visibleRange.value.start; i += finalColumn.value) {
        const rowHeights: number[] = [];
        for (let j = 0; j < finalColumn.value; j++) {
            const item = props.items[i + j];
            if (!item) continue; // 超出索引范围
            rowHeights.push(measuredHeights.value[item.id] || props.itemHeight);
        }
        sum += Math.max(...rowHeights);
    }
    logger.debug('offset', sum, measuredHeights.value);
    return sum;
};

// 测量元素高度 
let pendingUpdate = false;
const scheduleMeasureHeights = () => {
    if (pendingUpdate) return;
    pendingUpdate = true;
    requestAnimationFrame(() => {
        listItemsRef.value.forEach((el) => {
            const height = el.offsetHeight;
            const itemId = el.dataset.itemId || '';
            if (height !== measuredHeights.value[itemId]) {
                measuredHeights.value[itemId] = height;
            }
        });
        pendingUpdate = false;
    });
};

// 元素尺寸变化监听
const onItemResize = () => {
    scheduleMeasureHeights();
};

const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
        containerSize.value = entry.contentRect;
    }
});

onMounted(() => {
    // 初始测量
    scheduleMeasureHeights();
    if (containerRef.value) {
        resizeObserver.observe(containerRef.value);
        containerSize.value = {
            width: containerRef.value.clientWidth,
            height: containerRef.value.clientHeight,
        };
    }
});
onUnmounted(() => {
    resizeObserver.disconnect();
});

</script>

<template>
    <div ref="containerRef" class="ui-virtual-list" @scroll="handleScroll">
        <!-- 撑开滚动条的占位元素 -->
        <div :style="{ height: totalHeight + 'px' }"></div>
        <div v-for="(item, index) in visibleItems" :key="item.id" ref="listItemsRef" class="ui-virtual-list-item"
            :data-item-id="item.id" :style="item.__style__" @resize="onItemResize">
            <slot name="item" :item="item" :index="visibleRange.start + index"></slot>
        </div>
    </div>
</template>