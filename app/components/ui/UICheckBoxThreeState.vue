<script setup lang="ts">
defineProps<{
    label?: string;
}>();

type State = "indeterminate" | "checked" | "unchecked";

const checked = defineModel<State>({
    default: "unchecked",
    validator: (val: State) => ["indeterminate", "checked", "unchecked"].includes(val),
});

const emit = defineEmits<{
    (e: "change", checked: State): void;
}>();
watch(checked, (val) => {
    emit("change", val as State);
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
