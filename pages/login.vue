<script setup lang="ts">

const route = useRoute()

const handleClick = async () => {
    const { data, error } = await apiAuth.login({
        phone: '08613800001111',
        code: '1234',
        secure_code: '8888'
    })
    if (data.value) {
        // 登录成功，跳转到首页
        navigateTo(decodeURIComponent(route.query.redirect as string || '/'), {
            replace: true,
        })
    }
}

</script>
<template>
    <button @click="handleClick">login</button>
</template>