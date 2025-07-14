<script setup lang="ts">

const props = defineProps<{
    items: { id: unknown, title: string, [key: string]: unknown }[]
    orientation?: 'vertical' | 'horizontal'
}>();

const activeIndex = defineModel('activeIndex', {
    type: Number,
    default: 0
});

const tabClass = computed(() => {
    if (props.orientation === 'vertical') {
        return 'ui-flex ui-flex-column ui-flex-align-center ui-vtab';
    }
    return 'ui-flex ui-flex-row ui-flex-align-end ui-tab';
});

const tabItemClass = (index: number) => {
    const clsNames = ['ui-flex-center'];
    if (props.orientation === 'vertical') {
        clsNames.push('ui-vtabitem');
        if (activeIndex.value === index) {
            clsNames.push('ui-vtabitem-active');
        }
    } else {
        clsNames.push('ui-tabitem');
        if (activeIndex.value === index) {
            clsNames.push('ui-tabitem-active');
        }
    }
    return clsNames.join(' ');
};

</script>

<template>
    <div :class="tabClass">
        <div v-for="(item, index) in items" :key="item.id + ''" :class="tabItemClass(index)"
            @click="activeIndex = index">
            <slot :item="item" :index="index">{{ item.title }}</slot>
        </div>
    </div>
</template>
