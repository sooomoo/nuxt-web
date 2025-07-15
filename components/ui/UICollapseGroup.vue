<script setup lang="ts" generic="T extends { id: string}">
defineProps<{
    items: T[]
}>();
</script>

<template>
    <div class="ui-collapse-group">
        <UICollapse v-for="(item, index) in items" :key="item.id">
            <template #header="{ contentOpen }">
                <slot name="itemHeader" :content-open="contentOpen" :item="item" :index="index"></slot>
            </template>
            <template #content="{ contentOpen }">
                <slot name="itemContent" :content-open="contentOpen" :item="item" :index="index"></slot>
            </template>
        </UICollapse>
    </div>
</template>
