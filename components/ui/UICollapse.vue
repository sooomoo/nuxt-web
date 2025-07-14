<script setup lang="ts">
const contentVisible = defineModel("contentVisible", {
    type: Boolean,
    default: false
});

const contentClass = computed(() => {
    if (contentVisible.value) {
        return 'ui-collapse-content ui-collapse-content-open';
    }
    return 'ui-collapse-content';
});
</script>
<template>
    <div class="ui-collapse-header" @click="contentVisible = !contentVisible">
        <slot name="header"></slot>
    </div>
    <div :class="contentClass">
        <slot name="content"></slot>
    </div>
</template>
