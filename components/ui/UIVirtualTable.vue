<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">

interface TableSpan<T> {
    row: number
    column: number
    rowSpan: number
    columnSpan: number
    item: T
}

interface TableColumn {
    width: number
    field: string
}

const props = defineProps<{
    items: T[];
    rowHeightFunc: (item: T) => number
    columns: TableColumn[],
    columnGapFunc?: (leftIndex: number, rightIndex: number) => number
    rowGapFunc?: (topIndex: number, bottomIndex: number) => number
    spans?: TableSpan<T>[]
    buffer: number
}>();

const finalBuffer = computed(() => props.buffer ?? 10);
console.log(finalBuffer);
</script>

<template>
    <div class="ui-virtual-table">
        <slot></slot>
    </div>
</template>