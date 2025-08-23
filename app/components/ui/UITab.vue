<script setup lang="ts" generic="T extends { [key: string]: any }">
const props = defineProps<{
    items: T[];
    itemKey: (item: T) => string;
    titleKey: string;
    orientation?: "vertical" | "horizontal";
}>();

const activeId = defineModel("activeId", {
    type: String,
    default: "",
});

const tabClass = computed(() => {
    if (props.orientation === "vertical") {
        return "ui-flex ui-flex-column ui-flex-align-center ui-vtab";
    }
    return "ui-flex ui-flex-row ui-flex-align-end ui-tab";
});

const tabItemClass = (item: T) => {
    const clsNames = ["ui-flex-center"];
    if (props.orientation === "vertical") {
        clsNames.push("ui-vtabitem");
        if (activeId.value === props.itemKey(item)) {
            clsNames.push("ui-vtabitem-active");
        }
    } else {
        clsNames.push("ui-tabitem");
        if (activeId.value === props.itemKey(item)) {
            clsNames.push("ui-tabitem-active");
        }
    }
    return clsNames.join(" ");
};
</script>

<template>
    <div :class="tabClass">
        <div v-for="(item, index) in items" :key="itemKey(item)" :class="tabItemClass(item)" @click="activeId = itemKey(item)">
            <slot :item="item" :index="index">{{ item[titleKey] }}</slot>
        </div>
    </div>
</template>
