<script setup lang="ts">
import { formatDate } from 'vuepkg';
const props = defineProps<{
    unixSeconds: number
    locale?: string
    format?: string
}>();

const displayTime = computed(() => {
    if (props.locale) {
        return new Date(props.unixSeconds * 1000).toLocaleString(new Intl.Locale(props.locale));
    } else {
        return formatDate(props.unixSeconds, props.format);
    }
});
</script>
<template>
    <span>{{ displayTime }}</span>
</template>