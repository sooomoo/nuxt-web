<script setup lang="ts">
const props = defineProps<{
    unixSeconds: number
    locale?: string
}>();

const displayTime = computed(() => {
    return new Date(props.unixSeconds * 1000).toLocaleString(new Intl.Locale(props.locale || 'zh-CN'));
});
</script>
<template>
    <span>{{ displayTime }}</span>
</template>