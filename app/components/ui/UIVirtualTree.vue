<script setup lang="ts" generic="T extends { children: T[]; [key: string]: any }">
import { logger } from "vuepkg";
import type { VirtualScrollerExpose, VirtualTreeScrollerExpose, VisibleRange } from "./scripts/Virtuals";

const props = defineProps<{
    items: T[];
    itemKey: (item: T) => string;
    itemHeight: number;
    buffer?: number;
    gap?: number;
    ssrVisibleItems?: number;
    itemClass?: string;
    expandTrigger?: "icon" | "item";
}>();

const vlistRef = ref<VirtualScrollerExpose | undefined>();
const finalExpandTrigger = computed(() => props.expandTrigger ?? "icon");

const flattedNodes = shallowRef<T[]>([]);

watch(
    () => props.items,
    (newNodes) => {
        console.log("newNodes", newNodes);
        flatNodes(newNodes);
    },
);

const expanedNodeSet = new Set<string>();
const isNodeExpand = (node: T) => {
    return expanedNodeSet.has(props.itemKey(node));
};

const flatNodes = (newNodes: T[]) => {
    const fnodes: T[] = [];
    const traverse = (nodes: T[], depth: number = 0) => {
        if (!nodes || nodes.length === 0) return;

        nodes.forEach((node) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node as any).__depth = depth;
            fnodes.push(node);
            if (isNodeExpand(node) && node.children.length > 0) {
                traverse(node.children, depth + 1);
            }
        });
    };
    traverse(newNodes);
    flattedNodes.value = fnodes;
};

const findNode = (newNodes: T[], key: string): T | undefined => {
    const traverse = (nodes: T[], depth: number, parent?: T): T | undefined => {
        if (!nodes || nodes.length === 0) return;
        for (const node of nodes) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node as any).__parent = parent;
            if (props.itemKey(node) === key) {
                return node;
            }

            const res = traverse(node.children, depth + 1, node);
            if (res) {
                return res;
            }
        }
    };
    return traverse(newNodes, 0);
};

flatNodes(props.items);

const emit = defineEmits<{
    (e: "visble-range-changed", range: VisibleRange): void;
    (e: "click-item", item: T): void;
}>();
const onVisibleRangeChanged = (range: VisibleRange) => {
    emit("visble-range-changed", range);
};

const toggleExpand = (item: T) => {
    const key = props.itemKey(item);
    if (isNodeExpand(item)) {
        expanedNodeSet.delete(key);
    } else {
        expanedNodeSet.add(key);
    }
    logger.debug("toggleExpand", item);
    flatNodes(props.items);
};

const onClickItem = (item: T) => {
    if (finalExpandTrigger.value === "item") {
        toggleExpand(item);
    }
    emit("click-item", item);
};

const scrollToTop = (behavior: ScrollBehavior = "auto") => {
    vlistRef.value?.scrollToTop(behavior);
};
const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    vlistRef.value?.scrollToBottom(behavior);
};
const scrollToIndex = (index: number, behavior: ScrollBehavior = "auto") => {
    if (index < 0) return;
    vlistRef.value?.scrollToIndex(index, behavior);
};
const scrollToItem = (key: string | T, behavior: ScrollBehavior = "auto") => {
    // 先展开指定项所在的父节点
    if (typeof key === "object") {
        key = props.itemKey(key);
    }
    logger.debug("scrollToItem", key);
    const node = findNode(props.items, key);
    logger.debug("scrollToItem", node);
    if (node) {
        // 递归展开父节点
        let cur: T | undefined = node;
        while (cur) {
            if (cur.__parent) {
                expanedNodeSet.add(props.itemKey(cur.__parent));
            }
            cur = cur.__parent;
        }
        flatNodes(props.items);
        const index = flattedNodes.value.findIndex((item) => props.itemKey(item) === key);
        if (index !== -1) {
            scrollToIndex(index, behavior);
        }
    }
};
defineExpose<VirtualTreeScrollerExpose>({ scrollToTop, scrollToBottom, scrollToIndex, scrollToItem });
</script>
<template>
    <UIVirtualList
        ref="vlistRef"
        :items="flattedNodes"
        :item-height="itemHeight"
        :item-key="itemKey"
        :buffer="buffer"
        :gap="{ row: gap ?? 0, column: 0 }"
        :ssr-visible-items="ssrVisibleItems"
        class="ui-virtual-tree"
        @visble-range-changed="onVisibleRangeChanged"
    >
        <template #item="{ item, index }">
            <div
                class="ui-flex ui-flex-align-center"
                :class="itemClass"
                :data-expanded="isNodeExpand(item)"
                :data-depth="item.__depth"
                :data-index="index"
                :style="{
                    '--depth': item.__depth,
                    '--index': index,
                }"
                @click="onClickItem(item)"
            >
                <div v-if="finalExpandTrigger === 'icon'" @click="toggleExpand(item)">
                    <slot name="expand" :item="item" :index="index" :is-expand="isNodeExpand(item)">
                        <div
                            v-if="item.children.length > 0"
                            class="ui-virtual-tree-expand-square"
                            :data-expanded="isNodeExpand(item)"
                        ></div>
                    </slot>
                </div>
                <slot name="item" :item="item" :index="index" :is-expand="isNodeExpand(item)"> {{ item.name }} - {{ index }} </slot>
            </div>
        </template>
    </UIVirtualList>
</template>
