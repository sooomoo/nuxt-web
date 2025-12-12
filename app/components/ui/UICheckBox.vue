<script setup lang="ts">
defineProps<{
    label?: string;
}>();

const modelValue = defineModel({
    type: Boolean,
    default: false,
});

const emit = defineEmits<{
    (e: "change", checked: boolean): void;
}>();
// watch(checked, (val) => {
//     emit("change", val);
// });

const onClick = ()=>{
    const newVal = !modelValue.value 
    modelValue.value = newVal 
    emit("change", newVal );
}

</script>

<template>
    <div class="ui-checkbox" :class="{ active: modelValue }" @click.stop="onClick">
        <div class="ui-checkbox-icon"></div>
        <slot :label="label">{{ label }}</slot>
    </div>
</template>