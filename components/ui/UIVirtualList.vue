<script setup lang="ts" generic="T extends { id: string  }">
import { logger } from 'vuepkg';


const props = defineProps<{
    items: T[]
    itemHeight: number
    buffer: number
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const listItemsRef = ref<HTMLDivElement[]>([]);

const scrollTop = ref(0);
const measuredHeights = ref<{ [key: string]: number }>({});// 存储实际高度
// 动态总高度
const totalHeight = computed(() => {
    let height = 0;
    props.items.forEach((item) => {
        height += measuredHeights.value[item.id] || props.itemHeight;
    });
    logger.debug('totalHeight', height, measuredHeights.value);
    return height;
});


// 核心计算属性：可见项范围
const visibleRange = computed(() => {
    if (!containerRef.value) {
        return { start: 0, end: 0 };
    }

    let start = 0;
    let offset = 0;
    for (let i = 0; i < props.items.length; i++) {
        const element = props.items[i];
        offset += measuredHeights.value[element.id] || props.itemHeight;
        if (offset > scrollTop.value) {
            start = i;
            break;
        }
    }
    start = Math.max(0, start - props.buffer);

    let end = start + Math.ceil(containerRef.value!.clientHeight / props.itemHeight) + 2 * props.buffer;
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
    return items;
});

// 滚动事件处理（防抖优化）
const handleScroll = () => {
    if (!containerRef.value) {
        return;
    }
    scrollTop.value = containerRef.value.scrollTop;
    requestAnimationFrame(() => {
        updateMeasuredHeights();
    });
};

// 偏移量计算
const offset = computed(() => {
    let sum = 0;
    for (let i = 0; i < visibleRange.value.start; i++) {
        sum += measuredHeights.value[props.items[i].id] || props.itemHeight;
    }
    logger.debug('offset', sum, measuredHeights.value);
    return sum;
});

// 测量元素高度
const updateMeasuredHeights = () => {
    listItemsRef.value.forEach((el) => {
        const height = el.offsetHeight;
        const itemId = el.dataset.itemId || '';
        if (height !== measuredHeights.value[itemId]) {
            measuredHeights.value[itemId] = height;
        }
    });
};

// 元素尺寸变化监听
const onItemResize = () => {
    nextTick(() => {
        updateMeasuredHeights();
    });
};

onMounted(() => {
    // 初始测量
    nextTick(updateMeasuredHeights);
});

</script>

<template>
    <div ref="containerRef" class="ui-virtual-list" @scroll="handleScroll">
        <!-- 撑开滚动条的占位元素 -->
        <div :style="{ height: totalHeight + 'px' }"></div>
        <div class="ui-virtual-content" :style="{ transform: `translateY(${offset}px)` }">
            <div v-for="(item, index) in visibleItems" :key="item.id" ref="listItemsRef" :data-item-id="item.id"
                @resize="onItemResize">
                <slot name="item" :item="item" :index="visibleRange.start + index"></slot>
            </div>
        </div>
    </div>
</template>