<script setup lang="ts">
 
const doTask = async (val: number) => {
  await sleep(1000)
  console.log(val)
  return val
}
const singleExecutionTask = callOncePromise(() => doTask(1));

onMounted(() => {
  singleExecutionTask().then((res) => {
    console.log(res, 1)
  })
  singleExecutionTask().then((res) => {
    console.log(res, 2)
  }) 
})

</script>
<template>
  <div>
    home
    <div>
      <!-- <pre>{{ user2 }}</pre> -->
    </div>
    <!-- <button @click="handleClick">get</button> -->
    <div class="block" />
  </div>
</template>

<style scoped lang="scss">
.block {
  width: 100px;
  height: 100px;
  background-color: #ffa41d;
}
</style>