<script setup lang="ts">
const props = defineProps<{
    align?: "start" | "end" | "center" | "baseline" | "stretch",
    justify?: 'start' | 'end' | 'center' | 'stretch' | "space-around" | "space-between" | "space-evenly",
    direction?: 'column' | 'row',
}>();

const className = computed(() => {
    const className = ['ui-flex'];
    if (props.direction === 'column') {
        className.push('ui-flex-column');
    } else {
        className.push('ui-flex-row');
    }
    if (props.align) {
        className.push(`ui-flex-align-${props.align}`);
    }
    if (props.justify) {
        className.push(`ui-flex-justify-${props.justify}`);
    }
    return className.join(' ');
});

</script>

<template>
    <div :class="className">
        <slot></slot>
    </div>
</template>