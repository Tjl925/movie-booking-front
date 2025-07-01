<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from "axios"
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/stores/userInfo'
import { register } from "@/api/user"

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()

// 绑定请求数据
const BindRequestDTO = ref({
  openId: route.query.openId || '',
  nickname: route.query.nickname || '',
  avatar: route.query.avatar || '',
  suggestedUsername: route.query.suggestedUsername || ''
})

// 注册表单数据
const registerDTO = ref({
  username: BindRequestDTO.value.suggestedUsername || '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  openId: route.query.openId || ''
})

const bindType = ref('existing') // 'existing'或'new'

// 注册并绑定方法
const registerWithOpenId = async () => {

    const res = await register(registerDTO.value)
    console.log(res)
    if (res.status) {
      userInfoStore.setUserInfo({
        ...res.data.userInfo,
        token: res.data.token
      })
      ElMessage.success('注册成功！')
      await router.push('/Home')
    } else {
      ElMessage.warning(res.message || '注册失败')
    }

}

// 立即绑定方法
const submitBind = async () => {

    const payload = {
      username: registerDTO.value.username,
      password: registerDTO.value.password,
      openId: BindRequestDTO.value.openId
    }

    const res = await axios.post('/api/bind-qq', payload)
    console.log(res)
    if (res.data.status === 'bound') {
      userInfoStore.setUserInfo({
        ...res.data.user,
        token: res.data.token
      })
      ElMessage.success('绑定成功')
      await router.push('/Home')
    } else {
      ElMessage.warning(res.data.message || '绑定失败')
    }

}

// 统一提交方法
const handleSubmit = () => {
  return bindType.value === 'existing' ? submitBind() : registerWithOpenId()
}
</script>

<template>
  <div class="bind-container">
    <h2>绑定QQ账号</h2>

    <!-- QQ信息展示 -->
    <div class="qq-info">
      <el-avatar :src="BindRequestDTO.avatar" size="large"/>
      <div>
        <div class="nickname">{{ BindRequestDTO.nickname }}</div>
        <div class="tip">当前登录的QQ账号</div>
      </div>
    </div>

    <!-- 绑定方式选择 -->
    <el-radio-group v-model="bindType" class="bind-type">
      <el-radio label="existing">绑定现有账号</el-radio>
      <el-radio label="new">创建新账号</el-radio>
    </el-radio-group>

    <!-- 绑定表单 -->
    <div class="bind-form">
      <el-input
          v-model="registerDTO.username"
          placeholder="用户名"
          class="form-item"
      />

      <el-input
          v-model="registerDTO.password"
          type="password"
          show-password
          :placeholder="bindType === 'existing' ? '密码' : '设置密码'"
          class="form-item"
      />

      <el-input
          v-if="bindType === 'new'"
          v-model="registerDTO.confirmPassword"
          type="password"
          show-password
          placeholder="确认密码"
          class="form-item"
      />

      <el-input
          v-if="bindType === 'new'"
          v-model="registerDTO.email"
          placeholder="邮箱"
          class="form-item"
      />

      <el-input
          v-if="bindType === 'new'"
          v-model="registerDTO.phone"
          placeholder="手机号"
          class="form-item"
      />

      <el-button
          type="primary"
          @click="handleSubmit"
          class="submit-btn"
      >
        {{ bindType === 'existing' ? '立即绑定' : '注册并绑定' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.bind-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background: #fff;
}

.qq-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.qq-info .nickname {
  font-weight: bold;
  font-size: 16px;
}

.qq-info .tip {
  font-size: 12px;
  color: #999;
}

.bind-type {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
}

.bind-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  margin-bottom: 15px;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
  height: 40px;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .bind-container {
    margin: 1rem;
    padding: 15px;
  }
}
</style>