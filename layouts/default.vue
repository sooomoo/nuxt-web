<script setup lang="ts"> 
</script>
<template>
    <header class="default-layout__header flex flex-align-center gap-l">
        <slot name="header">
            <span>LOGO</span>
            <span class="spacer"></span>
            <span>Header1</span>
            <span>Header1</span>
            <span>Header1</span>
        </slot>
    </header>
    <main class="default-layout__body">
        <slot />
    </main>
    <footer class="default-layout__footer flex-center">
        <slot name="footer">
            Copyright &copy; 2023
        </slot>
    </footer>
</template>

<style lang="scss" scoped>
.default-layout__header {
    backdrop-filter: blur(8px);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: var(--header-height);
    z-index: 10; 
    background-color: #fffb;
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.25);
    padding: 0 16px;
    gap: 32px;
}
.default-layout__body {
    margin: 0;
    padding-top: var(--header-height);
    min-height: calc(100vh - var(--footer-height));
}
.default-layout__footer { 
    height: var(--footer-height); 
}
</style>