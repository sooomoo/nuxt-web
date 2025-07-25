<script setup lang="ts">
import { logger } from 'vuepkg';

const log = logger.tag("LAYOUT");
const route = useRoute();
const authStore = useAuthStore();
watchEffect(() => {
    log.debug("routing...path is : ", route.fullPath);
    log.debug("authStore.user is : ", authStore.user);
});
const showFooter = computed(() => {
    return !route.path.includes('/virtual_list_tests');
});
</script>

<template>
    <header class="flex flex-align-center gap-l default-layout__header">
        <NuxtLink to="/">
            <span>LOGO</span>
        </NuxtLink>
        <span class="spacer" />
        <span>Header1</span>
        <span>{{ authStore.user?.name ?? "" }}</span>
        <button v-if="authStore.user" type="button" @click="authStore.logout(true)">Logout</button>
    </header>
    <main class="default-layout__body">
        <slot />
    </main>
    <Footer v-if="showFooter" />
</template>

<style lang="scss" scoped>
.default-layout__header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: var(--header-height);
    min-height: var(--header-height);
    z-index: 10;
    background-color: var(--color-header-background);
    backdrop-filter: blur(8px);
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.25);
    padding: 0 16px;
    gap: 32px;
}

.default-layout__body {
    height: fit-content;
    padding-top: var(--header-height);
}

.default-layout__footer {
    height: var(--footer-height);
}
</style>
