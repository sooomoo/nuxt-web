<script setup lang="ts">

const props = defineProps<{
    headerClass?: string
    contentClass?: string
}>();

const contentOpen = defineModel("contentOpen", {
    type: Boolean,
    default: false
});

const emit = defineEmits<{
    (e: 'change', open: boolean): void
}>();

watch(contentOpen, (v) => {
    emit('change', v);
});

const finalHeaderClass = computed(() => {
    const clsArr = ['ui-collapse-header'];
    if (props.headerClass) clsArr.push(props.headerClass);
    return clsArr.join(' ');
});

const finalContentClass = computed(() => {
    const clsArr = ['ui-collapse-content'];
    if (props.contentClass) clsArr.push(props.contentClass);
    return clsArr.join(' ');
});
</script>
<template>
    <div class="ui-collapse" :data-open="contentOpen">
        <div :class="finalHeaderClass" @click="contentOpen = !contentOpen">
            <slot name="header" :content-open="contentOpen"></slot>
        </div>
        <div :class="finalContentClass">
            <slot name="content" :content-open="contentOpen"></slot>
        </div>
    </div>
</template>
