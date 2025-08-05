<script setup lang="ts" generic="T extends {width: number, field: string, [key: string]: any},">

const props = defineProps<{
    /**
     * 列间距, key 为列索引, value 为间距。间距将添加在指定列的右侧（最后一列不会添加）。
     * key 为-1 时，表示默认列间距
     */
    columnGap?: { [key: number]: number }
    columns: T[]
    colClass?: string
}>();
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
            __style__: {
                width: col.width + 'px',
                marginRight: `${gap}px`
            }
        };
    }
    return arr;
});
</script>

<template>
    <div class="ui-flex ui-flex-align-stretch ui-table-header">
        <div v-for="(col, colIndex) in finalColumns" :key="col.field" :class="colClass" :style="col.__style__">
            <slot name="col" :col="col" :col-index="colIndex">
                {{ col.title }}
            </slot>
        </div>
    </div>
</template>
