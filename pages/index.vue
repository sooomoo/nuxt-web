<script setup lang="ts">
const envVal = ref({})

onMounted(() => {
  envVal.value = import.meta.env
})
const handleClick = () => {
  usePost('/v1/auth/login', {
    phone: '008613800001111',
    code: '2345',
    secure_code: '3333'
  })
}
</script>
<template>
  <div>
    home 
    <div>{{ envVal }}</div>
    <button @click="handleClick">click me</button>
  </div>
</template>