<script setup lang="ts">
const lvLogger = useTagLogger('LoginView')

const emit = defineEmits<{
    'status-update': [value: LoginStatus]
}>()

const mobile = ref('15900220222')
const code = ref('1234')
const password = ref('8888') 
let csrfToken = ''

onMounted(() => {
    // 获取 csrf-token
})

const handleSubmit = async () => { 
    if (!mobile.value || !code.value || !password.value) {
        lvLogger.debug('请输入手机号、验证码和密码')
        return
    }
    if (!csrfToken) {
        lvLogger.debug('请先获取 csrf-token')
        return
    }
    const { data, error } = await apiAuth.login({
        phone: mobile.value,
        code: code.value,
        secure_code: password.value
    })
    if (error.value) {
        emit('status-update', 'error')
        return
    }
    if (data.value && data.value.code === RespCode.succeed) {
        emit('status-update', 'success')
    } else {
        emit('status-update', 'fail')
    }
}

</script>
<template>
    <form class="nlogin-view" method="dialog">
        <div class="row">
            <label for="mobile">手机号</label>
            <input :value="mobile" type="text" id="mobile" name="mobile" autocomplete="mobile" placeholder="请输入手机号"
                required>
        </div>
        <div class="row">
            <label for="code">验证码</label>
            <div class="row-code">
                <input :value="code" type="text" id="code" name="code" placeholder="请输入验证码" required>
                <button class="primary-button">获取验证码</button>
            </div>
        </div>
        <div class="row">
            <label for="password">密码</label>
            <input :value="password" type="password" id="password" name="password" autocomplete="current-password"
                placeholder="请输入密码" required>
        </div>
        <button class="primary-button submit-button" @click="handleSubmit">登录</button>
    </form>
</template>

<style lang="scss" scoped>
.nlogin-view {
    width: 260px;

    .row {
        display: flex;
        flex-direction: column;
        margin-bottom: 12px;

        & label {
            margin-bottom: 6px;
        }
    }

    .row-code {
        display: flex;

        input {
            flex: 1;
            margin-right: 8px;
        }
    }

    .submit-button {
        display: block;
        width: 120px;
        margin: 0 auto;
    }
}
</style>