<script setup lang="ts"> 
import { ref } from 'vue';
import { getScrollParent } from './scripts/ScrollParent';

const props = defineProps<{
    behavior?:  "auto" | "instant" | "smooth"
}>()

const nodeRoot = ref<HTMLDivElement | null>(null); 
const onClick = () => {
    if (!nodeRoot.value) return;
    const p = getScrollParent(nodeRoot.value)
    p?.scrollTo({ top: 0, behavior: props.behavior ?? "auto" })
}

</script>

<template>
    <div ref="nodeRoot" class="scroll-to-top" @click="onClick"> 
        <svg class="scroll-to-top-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <path
                d="M512 10.059294C235.429647 10.059294 10.059294 235.429647 10.059294 512.030118c0 276.570353 225.370353 501.940706 501.940706 501.940706 276.600471 0 501.970824-225.370353 501.970824-501.940706C1013.970824 235.429647 788.600471 10.059294 512 10.059294z m203.806118 591.811765c-7.529412 7.529412-17.076706 11.053176-26.593883 11.053176-9.547294 0-19.094588-3.523765-26.624-11.053176l-150.588235-150.588235-150.588235 150.588235a37.888 37.888 0 0 1-53.187765 0 37.888 37.888 0 0 1 0-53.217883l177.182118-177.182117a37.857882 37.857882 0 0 1 53.217882 0l177.182118 177.182117c14.546824 15.058824 14.546824 38.671059 0 53.217883z"></path>
        </svg>
    </div>
</template>

<style lang="scss" scoped>
.scroll-to-top {
    position: fixed;
    bottom: 60px;
    right: 60px;
    z-index: 99;
    cursor: pointer;

    .scroll-to-top-icon {
        width: 40px;
        height: 40px; 
        fill: #b3b3b3; 
        transition:fill .3s ease;
    }

    &:hover{
       .scroll-to-top-icon {
        fill: rgba(158, 158, 158, 0.733);
       }
    }
}
</style>