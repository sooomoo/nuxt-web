<script setup lang="ts">
const emit = defineEmits<{
    (e: 'sort', dir: 'asc' | 'desc'): void
}>();
</script>

<template>
    <div class="ui-flex-center ui-flex-column ui-sorter">
        <div class="ui-flex-center ui-clickable ui-sorter-clickable  ui-sorter-asc" @click="emit('sort', 'asc')">
            <UIIconArrowFill></UIIconArrowFill>
        </div>
        <div class="ui-flex-center ui-clickable ui-sorter-clickable  ui-sorter-desc" @click="emit('sort', 'desc')">
            <UIIconArrowFill></UIIconArrowFill>
        </div>
    </div>
</template>
