<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    // Check if the id is made up of digits
    if (typeof route.params.id === 'string' && /^\d+$/.test(route.params.id)) {
      return true
    }
    return createError({
      status: 400,
      statusText: 'BadRequest: id must be a number',
    })
  }
})

const log = logger.tag('USER')
const authStore = useAuthStore()
const route = useRoute()

log.debug('user id is : ', route.params.id) 
</script>
<template>
  <div>
    <pre>{{ authStore.user }}</pre>
  </div>
  <span>&#x1F600;</span>
  首先，卡片是相对定位，光是绝对定位
监听卡片的鼠标移入事件mouseenter，当鼠标进入时显示光
监听卡片的鼠标移动事件mouseover，鼠标移动时修改光的left、top，让光跟随鼠标移动
监听卡片的鼠标移出事件mouseleave，鼠标移出时，隐藏光

作者：Sunshine_Lin
链接：https://juejin.cn/post/7373867360019742758
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
</template>
<style lang="scss" scoped></style>