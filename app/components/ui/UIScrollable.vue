<script setup lang="ts">
const props = defineProps<{
    /**
     * default is 'both'
     */
    direction?: 'vertical' | 'horizontal' | 'both',
}>();

const className = computed(() => {
    const className = [];
    if (props.direction === 'vertical') {
        className.push('ui-scroll-y');
    } else if (props.direction === 'horizontal') {
        className.push('ui-scroll-x');
    } else {
        className.push('ui-scroll-y');
        className.push('ui-scroll-x');
    }
    return className.join(' ');
});
</script>

<template>
    <div :class="className">
        <slot></slot>
    </div>
</template>