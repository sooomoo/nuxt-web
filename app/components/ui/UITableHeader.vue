<script setup lang="ts" generic="T extends { width: number; field: string; [key: string]: any }">
const props = defineProps<{
    /**
     * 列间距, key 为列索引, value 为间距。间距将添加在指定列的右侧（最后一列不会添加）。
     * key 为-1 时，表示默认列间距
     */
    columnGap?: { [key: number]: number };
    columns: T[];
    colClass?: string;
    resizerClass?: string;
    resizerActiveClass?: string;
}>();

const finalResizerClass = computed(() => {
    if (props.resizerClass) {
        return "hor-resizer " + props.resizerClass;
    }
    return "hor-resizer";
});

const finalResizerActiveClass = computed(() => {
    if (props.resizerActiveClass) {
        return "hor-resizer-active " + props.resizerActiveClass;
    }
    return "hor-resizer-active";
});

const getColumnRightGap = (index: number): number => {
    const val = props.columnGap?.[index];
    if (val) {
        return val;
    }
    return props.columnGap?.[-1] ?? 0;
};
const finalColumns = computed(() => {
    const arr: T[] = props.columns.map((col) => ({
        ...col,
    }));
    for (let i = 0; i < arr.length; i++) {
        const col = arr[i]!;
        const gap = i < arr.length - 1 ? getColumnRightGap(i) : 0;
        arr[i] = {
            ...col,
            __gap__: gap,
            __style__: {
                width: col.width + "px",
                marginRight: `${gap}px`,
            },
        };
    }
    return arr;
});

const handleResize = (leftColIndex: number, rightColumnIndex: number, deltaX: number, _deltaY: number) => {
    const col = props.columns[leftColIndex]!;
    let newVal = col.width + deltaX;
    if (newVal < col.minWidth) {
        newVal = col.minWidth;
    }
    if (newVal > col.maxWidth) {
        newVal = col.maxWidth;
    }
    col.width = newVal;
};
</script>

<template>
    <div class="ui-flex ui-flex-align-stretch ui-table-header">
        <div v-for="(col, colIndex) in finalColumns" :key="col.field" class="column-item" :class="colClass" :style="col.__style__">
            <slot name="col" :col="col" :col-index="colIndex">
                {{ col.title }}
            </slot>
            <UIResizer
                v-if="colIndex < finalColumns.length - 1"
                :class="finalResizerClass"
                :active-class="finalResizerActiveClass"
                :direction="'hor'"
                :style="{
                    width: '4px',
                    transform: `translateX(${(col.__gap__ + 4) / 2}px)`,
                }"
                @resize="(dx, dy) => handleResize(colIndex, colIndex + 1, dx, dy)"
            >
            </UIResizer>
        </div>
    </div>
</template>
