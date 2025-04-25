<script setup lang="ts">
const lvLogger = useTagLogger('LoginView')

const emit = defineEmits<{
    'status-update': [value: LoginStatus]
}>()

const mobile = ref('')
const imgCode = ref('')
const msgCode = ref('')
const csrfResp = ref<PrepareLoginResponse>()

onMounted(() => {
    // 获取 csrf-token
    doPrepareLogin()
})

/**
 * 刷新 csrf-token
 */
const doPrepareLogin = async () => {
    // 获取 csrf-token
    const { data, error } = await apiAuth.prepareLogin()
    if (error.value) {
        lvLogger.debug('获取 csrf-token 失败')
        return
    }
    if (data.value && data.value.code === RespCode.succeed) {
        csrfResp.value = data.value.data
    }
    lvLogger.debug('prepareLogin', data.value, error.value)
}

/**
 * 发起登录请求
 */
const handleSubmit = async () => {
    if (!mobile.value || !imgCode.value || !msgCode.value) {
        lvLogger.debug('请输入手机号、验证码和密码', mobile.value, imgCode.value, msgCode.value)
        return
    }
    if (!csrfResp.value?.csrf_token) {
        lvLogger.debug('请先获取 csrf-token')
        return
    }
    const { data, error } = await apiAuth.login({
        phone: mobile.value,
        img_code: imgCode.value,
        msg_code: msgCode.value,
        csrf_token: csrfResp.value.csrf_token,
    })
    lvLogger.debug('login result', data.value, error.value)
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
    <div class="nlogin-view">
        <div class="row">
            <label for="mobile">手机号</label>
            <input v-model="mobile" type="text" id="mobile" name="mobile" autocomplete="mobile" placeholder="请输入手机号"
                required>
        </div>
        <div class="row">
            <label for="imgCode">人机检测</label>
            <div class="row-code">
                <input v-model="imgCode" type="text" id="imgCode" name="imgCode" placeholder="请输入图中的数字" required>
                <img :src="csrfResp?.image_data" draggable="false" class="img-code" alt="" @click="doPrepareLogin" />
            </div>
        </div>
        <div class="row">
            <label for="msgCode">验证码</label>
            <div class="row-code">
                <input v-model="msgCode" type="text" id="msgCode" name="msgCode" placeholder="请输入短信验证码" required>
                <button type="button" class="primary-button">获取验证码</button>
            </div>
        </div>
        <button type="submit" class="primary-button submit-button" @click="handleSubmit">登录</button>
    </div>
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

    .img-code {
        width: auto;
        height: 30px;
        background-color: #0000001d;
        border-radius: 4px;
        cursor: pointer;
    }

    .submit-button {
        display: block;
        width: 120px;
        margin: 0 auto;
    }
}
</style>