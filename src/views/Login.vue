<template>
  <div class="login-container">
    <!-- 左侧宣传图区域 -->
    <div class="left-section">
    </div>
    <!-- 右侧表单区域 -->
    <div class="right-section">
      <img src="@/assets/logo.png" alt="猫眼电影 logo" class="logo" />
      <el-form ref="loginForm" :model="loginDTO" label-width="0" class="login-form">
        <el-form-item>
          <el-input
              v-model="loginDTO.username"
              placeholder="请输入用户名"
              clearable
              prefix-icon="el-icon-phone"
              class="input-style"
          />
        </el-form-item>
        <el-form-item>
          <el-input
              v-model="loginDTO.password"
              placeholder="请输入密码"
              clearable
              prefix-icon="el-icon-message"
              class="input-style"
          />
        </el-form-item>
        <!-- 优化后的QQ登录按钮（独占一行） -->
        <el-form-item class="social-login">
          <el-button
              type="primary"
              :icon="el-icon-qq"
              @click="handleQQLogin"
              class="social-btn qq-btn"
          >
            <img src="@/assets/qq.jpg" class="social-icon" />
            QQ登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              :icon="Wechat"
              class="login-btn"
              @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import {login} from'@/api/user';
import router from "@/router";
import {useUserInfoStore} from '@/stores/userInfo';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

onMounted(() => {
  if (route.query.username) {
    loginDTO.value.username = route.query.username;
  }
});
const loginDTO=ref({
  username: "",
  password: "",
})

// 获取用户信息存储
const userInfoStore = useUserInfoStore();

// 登录逻辑
const handleLogin = () => {
  const loginData = loginDTO.value;
  login(loginData).then(res=>{
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
      console.log('角色ID类型:', typeof roleId, '值:', roleId);
      
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
};

// QQ登录逻辑
const handleQQLogin = () => {
  const callbackUrl = encodeURIComponent(`${window.location.origin}/qq-auth-redirect`)
  window.location.href = `https://qq.wch666.com/api/qq.php?token=4563f8b4896152de920bf22ec0a52a05&display=pc`
}

// 微信登录逻辑
const handleWechatLogin = () => {
  console.log('微信登录请求');
  ElMessage.success('正在进行微信登录');
};
</script>

<style scoped>
/* 基础布局样式 */
.login-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
  background-image: url('../assets/login-background.jpg');
  background-size: cover;
  background-position: center;
}
.left-section, .right-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 50px;
}
.left-section {
  flex: 1;
  align-items: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}
.right-section {
  width: 400px;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  margin-right: 20px; /* 增加右侧边距 */
}
.logo {
  width: 140px;
  height: 140px;
  margin-bottom: 30px;
  animation: pulse 2s infinite; /* 添加呼吸动画 */
}
.promo-img {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
/* 表单样式优化 */
.login-form {
  width: 100%;
}
.input-style {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  height: 48px; /* 增加输入框高度 */
  font-size: 16px; /* 增大字体 */
}
.input-style:focus {
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.15);
  border-color: #ff4d4f;
}
/* 第三方登录按钮优化 */
.social-login {
  display: block; /* 改为块级元素，使QQ登录独占一行 */
  margin: 25px 0; /* 增加上下间距 */
}
.social-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%; /* 宽度占满父容器 */
  height: 50px; /* 增加按钮高度 */
  border-radius: 25px; /* 圆形按钮效果 */
  font-size: 16px; /* 增大字体 */
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}
.social-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
.qq-btn {
  background: linear-gradient(135deg, #12b7f5, #0d97d8); /* 渐变色背景 */
}
.social-btn i {
  margin-right: 8px;
  font-size: 20px;
}
/* 登录按钮样式 */
.login-btn {
  height: 50px; /* 与第三方按钮高度一致 */
  border-radius: 25px; /* 圆形按钮效果 */
  font-size: 16px; /* 增大字体 */
  width: 100%;
  margin-top: 25px; /* 增加上方间距 */
  background: linear-gradient(135deg, #ff4d4f, #ff7072); /* 渐变色背景 */
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(255, 77, 79, 0.3);
}

/* 新增动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>