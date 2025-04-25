<script setup lang="ts">
const route = useRoute()

const handleLoginStatusUpdated = (status: LoginStatus) => {
    switch (status) {
        case 'success':
            // 登录成功，跳转到首页
            navigateTo(decodeURIComponent(route.query.redirect as string || '/'), {
                replace: true,
            })
            break
        case 'error':
            // 登录失败，显示错误信息
            break
        case 'fail':
            // 登录失败，显示错误信息
            break
    }
}

</script>
<template>
    <NLoginView @status-update="handleLoginStatusUpdated" class="page-login " />
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