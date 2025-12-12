<script setup lang="ts" generic="T extends { id: string | number }">
import type { ThreeState } from "./scripts/Types";

type Key = string | number;

const props = defineProps<{
    items: T[];
    itemKey: (item: T) => string
    virtualize?: boolean;
    itemHeight?: number;
    buffer?: number;
    gap?: number;
    itemsContainerClass?: string;
    itemClass?: string;
}>();

const checkedIds = defineModel<Key[]>({
    default: () => [],
    type: Array as PropType<Key[]>,
});

const isAllChecked = ref<ThreeState>("unchecked");
const innerCheckedIds = ref<Record<Key, boolean>>({});

/**
 * 刷新内部check id
 */
const refreshInnerCheckIds = () => {
    const innerChecked: Record<Key, boolean> = {}
    checkedIds.value.forEach((id) => {
        innerChecked[id] = true;
    });
    innerCheckedIds.value = innerChecked

    // 更新全选按钮的状态
    const checkedCount = checkedIds.value.length
    if (checkedCount === 0) {
        isAllChecked.value = "unchecked";
    } else if (checkedCount === props.items.length) {
        isAllChecked.value = "checked";
    } else {
        isAllChecked.value = "indeterminate";
    } 
}

watch(checkedIds, (v) => refreshInnerCheckIds())

refreshInnerCheckIds()

const onItemChecked = (id: string | number, checked: boolean) => {
    // 更新 checkedIds
    const tempIds = [...checkedIds.value]
    const idx = tempIds.findIndex(v => v == id)
    if (idx >= 0) {
        tempIds.splice(idx, 1)
    } else {
        tempIds.push(id)
    }
    checkedIds.value = [...tempIds];
}

const onAllCheckChanged = (state: ThreeState) => { 
    if (state === "checked") {
        checkedIds.value = props.items.map(v => v.id)
    } else if (state === "unchecked") {
        checkedIds.value = []
    }
}
</script>

<template>
    <div class="ui-checkbox-group">
        <UICheckBoxThreeState v-model:model-value="isAllChecked" @change="onAllCheckChanged">Check ALL
        </UICheckBoxThreeState>
        <div v-if="virtualize" :class="['ui-checkbox-group-content', itemsContainerClass]">
            <UIVirtualList :items="items" :item-key="(item) => item.id + ''" :item-height="itemHeight ?? 50"
                :buffer="buffer" :align-items="'start'" :gap="gap ? { row: gap, column: 0 } : undefined">
                <template #item="{ item, index }">
                    <UICheckBox v-model:model-value="innerCheckedIds[item.id]" :class="itemClass"
                        @change="(c) => onItemChecked(item.id, c)">
                        <slot name="item" :item="item" :index="index">
                            {{ item.id }}
                        </slot>
                    </UICheckBox>
                </template>
            </UIVirtualList>
        </div>
        <div v-else :class="['ui-checkbox-group-content', itemsContainerClass]">
            <UICheckBox v-for="(item, index) in items" :key="item.id" v-model:model-value="innerCheckedIds[item.id]"
                :class="itemClass" @change="(c) => onItemChecked(item.id, c)">
                <slot name="item" :item="item" :index="index">
                    {{ item.id }}
                </slot>
            </UICheckBox>
        </div>
    </div>
</template>