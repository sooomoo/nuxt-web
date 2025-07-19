<script setup lang="ts" generic="T extends { id: string}">
import { logger } from 'vuepkg';

type OpenStatus = { [key: string]: boolean }

const props = defineProps<{
    items: T[]
    defaultOpenedItems?: string[]
    mutex?: boolean
    itemClass?: string
    itemHeaderClass?: string
    itemContentClass?: string
}>();

const formatDefaultItems = () => {
    const tmp = {} as OpenStatus;
    props.defaultOpenedItems?.forEach(id => {
        tmp[id] = true;
    });
    return tmp;
};
const itemOpenStatus = shallowRef<OpenStatus>(formatDefaultItems());

const onChange = (item: T, open: boolean) => {
    if (props.mutex && open) {
        itemOpenStatus.value = { [item.id]: true };
    } else {
        const obj = { ...itemOpenStatus.value };
        obj[item.id] = open;
        itemOpenStatus.value = obj;
    }
    logger.debug('itemOpenStatus', itemOpenStatus.value);
};

</script>

<template>
    <div class="ui-collapse-group">
        <UICollapse v-for="(item, index) in items" :key="item.id" :content-open="itemOpenStatus[item.id]"
            :class="itemClass" :header-class="itemHeaderClass" :content-class="itemContentClass"
            @change="(v) => onChange(item, v)">
            <template #header="{ contentOpen }">
                <slot name="itemHeader" :content-open="contentOpen" :item="item" :index="index"></slot>
            </template>
            <template #content="{ contentOpen }">
                <slot name="itemContent" :content-open="contentOpen" :item="item" :index="index"></slot>
            </template>
        </UICollapse>
    </div>
</template>
