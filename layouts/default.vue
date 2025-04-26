<script setup lang="ts">
const log = logger.tag('LAYOUT')
const route = useRoute()
const authStore = useAuthStore()
watchEffect(() => {
    log.debug('routing...path is : ', route.fullPath)
    log.debug('authStore.user is : ', authStore.user)
})

</script>
<template>
    <header class="default-layout__header flex flex-align-center gap-l">
        <NuxtLink to="/">
            <span>LOGO</span>
        </NuxtLink>
        <span class="spacer"></span>
        <span>Header1</span>
        <span>{{ authStore.user?.name ?? '' }}</span>
        <button type="button" @click="authStore.logout(true)">Logout</button>
    </header>
    <main class="default-layout__body">
        <slot />
    </main>
    <footer class="default-layout__footer flex-center">
        Copyright &copy; 2023
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
    background-color: var(--color-header-background);
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