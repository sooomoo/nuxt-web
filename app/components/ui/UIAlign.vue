<script setup lang="ts">
const props = defineProps<{
    vertical?: 'top' | 'bottom' | "center" | "stretch",
    horizontal?: 'left' | 'right' | 'center' | 'stretch',
}>();

const className = computed(() => {
    const className = ['ui-flex'];
    switch (props.vertical) {
        case 'top':
            className.push('ui-flex-align-start');
            break;
        case 'bottom':
            className.push('ui-flex-align-end');
            break;
        case 'center':
            className.push('ui-flex-align-center');
            break;
        case 'stretch':
            className.push('ui-flex-align-stretch');
            break;
        default:
            break;
    }
    switch (props.horizontal) {
        case 'left':
            className.push('ui-flex-justify-start');
            break;
        case 'right':
            className.push('ui-flex-justify-end');
            break;
        case 'center':
            className.push('ui-flex-justify-center');
            break;
        case 'stretch':
            className.push('ui-flex-justify-stretch');
            break;
        default:
            break;
    }
    return className.join(' ');
});

</script>

<template>
    <div :class="className">
        <slot></slot>
    </div>
</template>