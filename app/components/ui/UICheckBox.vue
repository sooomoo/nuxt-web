<script setup lang="ts">
defineProps<{
    label?: string;
}>();

const checked = defineModel({
    type: Boolean,
    default: false,
});

const emit = defineEmits<{
    (e: "change", checked: boolean): void;
}>();
watch(checked, (val) => {
    emit("change", val);
});
</script>

<template>
    <div class="ui-checkbox" :class="{ active: checked }" @click="checked = !checked">
        <div class="ui-checkbox-icon"></div>
        <slot :label="label">{{ label }}</slot>
    </div>
</template>
