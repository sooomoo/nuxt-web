<script setup lang="ts" generic="T extends { id: string, [key: string]: any }">
</script>

<template>
    <div class="ui-virtual-table">
        <slot></slot>
    </div>
</template>