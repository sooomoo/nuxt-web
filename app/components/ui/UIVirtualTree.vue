<script setup lang="ts" generic="T extends { children: T[]; [key: string]: any }">
import { logger } from "vuepkg";
import type { VisibleRange } from "./scripts/Virtuals";

const props = defineProps<{
    items: T[];
    itemKey: (item: T) => string;
    itemHeight: number;
    buffer?: number;
    gap?: number;
    ssrVisibleItems?: number;
    itemClass?: (item: T, index: number, isExpand: boolean) => string;
    expandTrigger?: "icon" | "item";
}>();

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
            logger.debug("in traverse", node, node.__isExpanded);
            if (isNodeExpand(node) && node.children.length > 0) {
                traverse(node.children, depth + 1);
            }
        });
    };
    traverse(newNodes);
    flattedNodes.value = fnodes;
};

flatNodes(props.items);

const emit = defineEmits<{
    (e: "visble-range-changed", range: VisibleRange): void;
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
};
</script>
<template>
    <UIVirtualList
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
                :class="itemClass?.(item, index, isNodeExpand(item))"
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
