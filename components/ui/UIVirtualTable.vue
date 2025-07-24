<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">

interface TableSpan<T> {
    row: number
    column: number
    rowSpan: number
    columnSpan: number
    item: T
}

defineProps<{
    items: T[];
    rowHeight: number
    columnWidths: number[],
    columnGapFunc: (leftIndex: number, rightIndex: number) => number
    rowGapFunc: (topIndex: number, bottomIndex: number) => number
    spans: TableSpan<T>[]
    buffer: number
}>();
</script>

<template>
    <div class="ui-virtual-table">
        <slot></slot>
    </div>
</template>