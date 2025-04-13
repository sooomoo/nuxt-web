<script setup lang="ts">
import { type ResponseDto, useAsyncPost } from '~/composables/http'
 
// const {data:user} = useAsyncData('test1', async () => {
//   return await usePost<ResponseDto<unknown>>('/v1/auth/login', {
//     phone: '08613800001111',
//     code: '2345',
//     secure_code: '3333'
//   })
// }) 
const  {data:user, refresh} = useAsyncPost<ResponseDto<string>>('/v1/auth/login', {
  phone: '08613800001111',
  code: '2345',
  secure_code: '3333'
})

const handleClick = () => {
  refresh()
}
</script>
<template>
  <div>
    home
    <div>
      <pre>{{ user }}</pre>
      <!-- <pre>{{ user2 }}</pre> -->
    </div> 
    <button @click="handleClick">click me</button>
  </div>
</template>