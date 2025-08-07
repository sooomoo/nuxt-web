<script setup lang="ts">

const props = defineProps<{
    direction: 'hor' | 'vert' | 'all'
}>()

const className = computed(() => {
    const className = ['ui-resizer'];
    if (props.direction === 'hor') {
        className.push('ui-resizer-hor');
    } else if (props.direction === 'vert') {
        className.push('ui-resizer-vert');
    } else {
        className.push('ui-resizer-all');
    }
    return className.join(' ');
})

const emit = defineEmits<{
    (e: 'resize', deltaX: number, deltaY: number): void
}>()

let isResizing = false

const handleResize = (e: MouseEvent) => {
    if (!isResizing) return
    emit('resize', e.movementX, e.movementY)
}

const stopResize = () => {
    isResizing = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
}

const startResize = (e: MouseEvent) => {
    console.log('start resize', e)
    isResizing = true
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
}
</script>
<template>
    <div :class="className" @mousedown="startResize"></div>
</template>
