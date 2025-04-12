<script setup lang="ts">
const envVal = import.meta.env

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
    <ClientOnly>
      <div>{{ envVal }}</div>
    </ClientOnly>
    <button @click="handleClick">click me</button>
  </div>
</template>