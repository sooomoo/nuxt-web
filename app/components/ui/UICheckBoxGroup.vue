<script setup lang="ts" generic="T extends { id: string | number }">
import UICheckBox from "./UICheckBox.vue";
import UICheckBoxThreeState from "./UICheckBoxThreeState.vue";

type Key = string | number;

const props = defineProps<{
    items: T[];
}>();

const checkedIds = defineModel<Key[]>({
    default: () => [],
    type: Array as PropType<Key[]>,
});

const isAllChecked = ref<"indeterminate" | "checked" | "unchecked">("unchecked");
const innerCheckedIds = reactive<Record<Key, boolean>>({});
watch(isAllChecked, (val) => {
    if (val === "checked") {
        props.items.forEach((item) => {
            innerCheckedIds[item.id] = true;
        });
    } else if (val === "unchecked") {
        props.items.forEach((item) => {
            innerCheckedIds[item.id] = false;
        });
    }
});
const updateStatus = () => {
    const checked = Object.values(innerCheckedIds).filter((v) => v);
    if (checked.length === 0) {
        isAllChecked.value = "unchecked";
    } else if (checked.length === props.items.length) {
        isAllChecked.value = "checked";
    } else {
        isAllChecked.value = "indeterminate";
    }
};
watch(
    () => innerCheckedIds,
    () => {
        updateStatus();
        // 更新 checkedIds
        const tempIds = new Set<Key>();
        for (const key in innerCheckedIds) {
            if (Object.prototype.hasOwnProperty.call(innerCheckedIds, key)) {
                if (innerCheckedIds[key]) {
                    tempIds.add(key);
                }
            }
        }
        checkedIds.value = [...tempIds];
    },
    {
        deep: true,
        immediate: true,
    },
);

if (checkedIds.value) {
    checkedIds.value.forEach((id) => {
        innerCheckedIds[id] = true;
    });
}
updateStatus();
</script>

<template>
    <div class="ui-checkbox-group">
        <UICheckBoxThreeState v-model:model-value="isAllChecked">Check All</UICheckBoxThreeState>
        <UICheckBox v-for="(item, index) in items" :key="item.id" v-model:model-value="innerCheckedIds[item.id]">
            <slot name="item" :item="item" :index="index">
                {{ item.id }}
            </slot>
        </UICheckBox>
    </div>
</template>
