<template>
  <div class="find-password-container">
    <!-- 面包屑 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/Home' }">Home</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 猫眼电影 Logo 及标题区域 -->
    <div class="logo-title">
      <!-- 这里假设你有本地 Logo 图片，替换成实际路径；也可使用字体图标等 -->
      <img src="@/assets/logo.png" alt="猫眼电影Logo" class="logo" />
      <h2 class="page-title">找回密码</h2>
    </div>

    <!-- 表单区域 -->
    <el-form ref="passwordForm" :model="emailRequestDTO" label-width="120px" class="form">
      <!-- 邮箱输入 -->
      <el-form-item label="注册邮箱" prop="email">
        <el-input
            v-model="emailRequestDTO.email"
            placeholder="请输入注册邮箱"
            clearable
            :maxlength="50"
        />
      </el-form-item>

      <!-- 验证码输入 + 获取验证码按钮 -->
      <el-form-item label="6位验证码" prop="code">
        <el-input
            v-model="emailRequestDTO.code"
            placeholder="请输入验证码"
            clearable
            :maxlength="6"
            style="width: 60%"
        />
        <el-button
            type="primary"
            @click="handleGetCode"
            :disabled="countDown > 0"
            style="margin-left: 10px"
        >
          {{ countDown > 0 ? `${countDown}s后重试` : '获取验证码' }}
        </el-button>
      </el-form-item>

      <!-- 下一步按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleNext">下一步</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {sendVerificationCode,verifyCode,sendPassWordCode} from "@/api/user";
import {useRouter} from "vue-router";

// 表单数据
const emailRequestDTO = ref({
  email: '',
  code: '',
})
// 倒计时变量
const countDown = ref(0)
// 定时器
let timer = null

// 获取验证码逻辑
const handleGetCode = () => {
  // 先简单校验邮箱格式（也可走表单校验）
  const emailReg = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!emailReg.test(emailRequestDTO.value.email)) {
    ElMessage.error('请输入正确的邮箱格式')
    return
  }
  // 模拟发送验证码，实际需调接口
  console.log('邮箱: ', emailRequestDTO)
  sendVerificationCode(emailRequestDTO.value).then((res) => {
    console.log('发送验证码结果:', res);
    if (res.status) {
      ElMessage.success('验证码已发送至邮箱，请查收~')
      // 启动倒计时
      countDown.value = 60
      timer = setInterval(() => {
        countDown.value--
        if (countDown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }else{
      ElMessage.error(res.message || '发送失败，请稍后重试');
    }
  })
}

// 下一步逻辑
const router = useRouter();
const handleNext = async () => {
  try {
    // 先验证验证码
    const verifyResult = await verifyCode(emailRequestDTO.value);
    console.log('验证结果:', verifyResult);

    if (!verifyResult.status) {
      ElMessage.error(verifyResult.message || '验证码错误或已过期');
      return;
    }
    
    // 验证通过后发送密码
    const sendResult = await sendPassWordCode(emailRequestDTO.value);
    if(sendResult.status) {
      ElMessage.success(sendResult.message);
      router.push({ path: '/Login' });
    } else {
      ElMessage.error(sendResult.message);
    }
  } catch (error) {
    console.error('验证或发送密码过程中出错:', error);
    ElMessage.error('操作失败，请稍后重试');
  }
}
</script>

<style scoped>
.find-password-container {
  width: 500px;
  margin: 60px auto;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.breadcrumb {
  margin-bottom: 20px;
}

.logo-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
}

.logo {
  width: 60px;
  height: 60px;
  margin-right: 10px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.form {
  margin-top: 20px;
}

.other-way {
  color: #999;
  margin-bottom: 10px;
}

.way-item {
  margin: 5px 0;
}
</style>