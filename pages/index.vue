<script setup lang="ts">
 
const loginResp = ref({})
const handleClick = async () => { 
  loginResp.value = await auth.login({
    phone: '08613800001111',
    code: '1234',
    secure_code: '8888'
  })
}
</script>
<template>
  <div>
    home
    <div>
      <pre>{{ loginResp }}</pre>
      <!-- <pre>{{ user2 }}</pre> -->
    </div>
    <button @click="handleClick">click me</button>
  </div>
</template>