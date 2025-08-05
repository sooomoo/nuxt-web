<script setup lang="ts">
const authStore = useAuthStore();
if (authStore.user) {
    // 登录成功，跳转到首页
    navigateTo("/", { replace: true });
}

const route = useRoute();

const handleLoginStatusUpdated = (status: LoginStatus) => {
    switch (status) {
        case "success" as LoginStatus:
            // 登录成功，跳转到首页
            navigateTo(decodeURIComponent((route.query.redirect as string) || "/"), {
                replace: true,
            });
            break;
        case "error" as LoginStatus:
            // 登录失败，显示错误信息
            break;
        case "fail" as LoginStatus:
            // 登录失败，显示错误信息
            break;
    }
};
</script>

<template>
    <NLoginView class="page-login" @status-update="handleLoginStatusUpdated" />
</template>

<style lang="scss" scoped>
.page-login {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    height: fit-content;
    margin: auto;
}
</style>
