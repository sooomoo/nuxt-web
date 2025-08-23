<script setup lang="ts">
import type { ThreeState } from "./scripts/Types";

defineProps<{
    label?: string;
}>();

const checked = defineModel<ThreeState>({
    default: "unchecked",
    validator: (val: ThreeState) => ["indeterminate", "checked", "unchecked"].includes(val),
});

const emit = defineEmits<{
    (e: "change", checked: ThreeState): void;
}>();
watch(checked, (val) => {
    emit("change", val as ThreeState);
});

const className = computed(() => {
    const arr = ["ui-checkbox-three-state"];
    if (checked.value === "checked") {
        arr.push("ui-checkbox-three-state-checked");
    } else if (checked.value === "indeterminate") {
        arr.push("ui-checkbox-three-state-indeterminate");
    }

    return arr.join(" ");
});

const onClick = () => {
    if (checked.value !== "checked") {
        checked.value = "checked";
    } else {
        checked.value = "unchecked";
    }
};
</script>

<template>
    <div :class="className" @click="onClick">
        <div class="ui-checkbox-icon"></div>
        <slot :label="label">{{ label }}</slot>
    </div>
</template>
