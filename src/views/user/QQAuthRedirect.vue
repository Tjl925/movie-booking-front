<template>
  <div class="qq-auth-redirect">
    <el-alert
        title="正在处理QQ登录..."
        type="info"
        :closable="false"
        show-icon
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from "axios"
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/stores/userInfo'

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

onMounted(async () => {
  console.log('QQAuthRedirect组件已加载')
  if (route.query.code) {
    try {
      console.log("获取到code:", route.query.code)
      const res = await axios.get(`http://localhost:8888/api/qq/callback?code=${route.query.code}`)

      console.log('QQ回调响应:', res.data)

      if (res.data.status === 'bound') {
        if (!res.data.user || !res.data.token) {
          throw new Error('后端返回数据不完整')
        }

        userInfoStore.setUserInfo({
          ...res.data.user,
          token: res.data.token
        })

        router.push('/Home')
      } else {
        router.push({
          path: '/bind-qq',
          query: {
            openId: res.data.bindInfo?.openId,
            nickname: res.data.bindInfo?.nickname,
            avatar: res.data.bindInfo?.avatar,
            suggestedUsername: res.data.bindInfo?.suggestedUsername
          }
        })
      }
    } catch (error) {
      console.error('QQ登录失败:', error)
      ElMessage.error('QQ登录失败: ' + error.message)
      router.push('/login')
    }
  } else {
    ElMessage.error('未获取到QQ授权码')
    router.push('/login')
  }
})
</script>

<style scoped>
.qq-auth-redirect {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>