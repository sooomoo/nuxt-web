<script setup lang="ts" generic="T extends { id: string}">
const props = defineProps<{
    items: T[]
    itemClass?: string
    itemHeaderClass?: string
    itemContentClass?: string
    mutex?: boolean
}>();

const itemOpenStatus = shallowRef<{ [key: string]: boolean }>({});

const onChange = (item: T, open: boolean) => {
    if (props.mutex) {
        itemOpenStatus.value = { [item.id]: open };
    } else {
        const obj = { ...itemOpenStatus.value };
        obj[item.id] = open;
        itemOpenStatus.value = obj;
    }
};

</script>

<template>
    <div class="ui-collapse-group">
        <UICollapse v-for="(item, index) in items" :key="item.id" :class="itemClass" :header-class="itemHeaderClass"
            :content-class="itemContentClass" @change="(v) => onChange(item, v)">
            <template #header="{ contentOpen }">
                <slot name="itemHeader" :content-open="contentOpen" :item="item" :index="index"></slot>
            </template>
            <template #content="{ contentOpen }">
                <slot name="itemContent" :content-open="contentOpen" :item="item" :index="index"></slot>
            </template>
        </UICollapse>
    </div>
</template>
