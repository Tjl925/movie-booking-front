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
import {onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from "axios"
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/stores/userInfo'
import {login} from "@/api/user";

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

        const loginDTO={
          username: res.data.user.username,
          password: res.data.user.password
        }

        login(loginDTO).then(res=>{
          console.info(res);
          if (res.status) {
            // 保存用户信息和token到store
            const userInfo = res.data.userInfo;
            const token = res.data.token;

            // 将用户信息和token保存到store
            userInfoStore.setUserInfo({
              ...userInfo,
              token: token
            });

            // 根据角色ID进行不同的页面重定向
            ElMessage({
              message: '登录成功啦！',
              type: 'success',
              plain: true,
            })

            // 将roleId转换为数字类型进行比较
            const roleId = Number(userInfo.roleId);

            // 根据roleId决定重定向页面
            if (roleId === 1) {
              // 超级管理员
              router.push({path: '/superadmin'});
            } else if (roleId === 2) {
              // 管理员
              router.push({path: '/admin'});
            } else {
              // 普通用户
              router.push({path: '/Home'});
            }
          }
        })
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
      router.push('/Login')
    }
  } else {
    ElMessage.error('未获取到QQ授权码')
    router.push('/Login')
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