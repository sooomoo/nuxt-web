<script setup lang="ts">
import UIIconClose from './icons/UIIconClose.vue';

defineProps<{
    title?: string;
    contentClass?: string;
}>();

const visible = defineModel("visible", {
    type: Boolean,
    default: false,
});

const hideDialog = ()=>{
    visible.value = false
}

const onClickRoot = (_: Event) => {  
    visible.value = !visible.value;
};
</script>

<template>
    <div class="ui-dialog" @click="onClickRoot">
        <slot></slot>
        <Teleport to="#teleports">
            <Transition name="ui-fade">
                <div v-if="visible" class="ui-dialog-background" @click="hideDialog"> </div>
            </Transition>
            <Transition name="ui-slidefade">
                <div v-if="visible" ref="dialogContentRef" :class="['ui-dialog-content', contentClass]">
                    <div class="ui-dialog-header">
                        <slot name="title">{{ title }}</slot>
                        <div class="spacer"></div>
                        <UIIconClose style="cursor: pointer;" @click="hideDialog"></UIIconClose>
                    </div>
                    <slot name="content"></slot>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>