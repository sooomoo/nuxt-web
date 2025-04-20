<script setup lang="ts"> 
const log = useTagLogger('index')

onMounted(async () => {
  log.debug('home onMounted') 
  log.info('home onMounted')
  log.warn('home onMounted')
  log.error('home onMounted')
})
</script>
<template>
  <div>
    home
    <div> 
      <!-- <pre>{{ user2 }}</pre> -->
    </div>
    <!-- <button @click="handleClick">get</button> -->
    <div class="block"/>
  </div>
</template>

<style scoped lang="scss">
.block {
  width: 100px;
  height: 100px;
  background-color: #ffa41d;
}
</style>