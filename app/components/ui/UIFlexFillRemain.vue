<script setup lang="ts">
const props = defineProps<{
    /**
     * 内容展示方向：default is 'both'
     */
    direction?: 'vertical' | 'horizontal' | 'both',
    /**
     * 内容无法全部展示时，是否展示滚动条：default is false
     */
    scrollIfNeed?: boolean
}>();

const className = computed(() => {
    const className = ['ui-flex-one'];
    if (props.direction === 'vertical') {
        className.push('ui-flex-fill-remain-y');
        if (props.scrollIfNeed) className.push('ui-scroll-y');
    } else if (props.direction === 'horizontal') {
        className.push('ui-flex-fill-remain-x');
        if (props.scrollIfNeed) className.push('ui-scroll-x');
    } else {
        className.push('ui-flex-fill-remain-y');
        className.push('ui-flex-fill-remain-x');
        if (props.scrollIfNeed) {
            className.push('ui-scroll-y');
            className.push('ui-scroll-x');
        }
    }
    return className.join(' ');
});
</script>

<template>
    <div :class="className">
        <slot></slot>
    </div>
</template>