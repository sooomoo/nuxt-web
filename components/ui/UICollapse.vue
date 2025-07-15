<script setup lang="ts">

const props = defineProps<{
    headerClass?: string
    headerOpenClass?: string
    contentClass?: string
    contentOpenClass?: string
}>();

const contentOpen = defineModel("contentOpen", {
    type: Boolean,
    default: false
});

const finalHeaderClass = computed(() => {
    const clsArr = ['ui-collapse-header'];
    if (contentOpen.value) {
        if (props.headerOpenClass) clsArr.push(props.headerOpenClass);
        else if (props.headerClass) clsArr.push(props.headerClass);
    } else {
        if (props.headerClass) clsArr.push(props.headerClass);
    }
    return clsArr.join(' ');
});

const finalContentClass = computed(() => {
    const clsArr = ['ui-collapse-content'];
    if (contentOpen.value) {
        clsArr.push('ui-collapse-content-open');
        if (props.contentOpenClass) clsArr.push(props.contentOpenClass);
        else if (props.contentClass) clsArr.push(props.contentClass);
    } else {
        if (props.contentClass) clsArr.push(props.contentClass);
    }
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
