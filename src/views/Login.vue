<template>
  <div class="login-container">
    <!-- 左侧宣传图区域 -->
    <div class="left-section">
      <img src="@/assets/11063_1.jpg" alt="猫眼电影 logo" class="logo" />
      <img src="@/assets/avatar.jpg" alt="登录宣传图" class="promo-img" />
    </div>
    <!-- 右侧表单区域 -->
    <div class="right-section">
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
        <!-- 优化后的第三方登录按钮 -->
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
          <el-button
              type="primary"
              :icon="QQ"
              @click="handleWechatLogin"
              class="social-btn wechat-btn"
          >
            <img src="@/assets/wx.jpg" class="social-icon" />
            微信登录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              :icon="Wechat"
              @click="handleLogin"
              class="login-btn"
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

const loginDTO=ref({
  username: "",
  password: "",
})

// 登录逻辑
const handleLogin = () => {
  const loginData = loginDTO.value;
  login(loginData).then(res=>{
    console.info(res);
    if(res.status){
      //跳转
      ElMessage({
        message: '登录成功啦！',
        type: 'success',
        plain: true,
      })
      router.push({path: '/Home'});
    }
    else{
      ElMessage({
        message: res.message,
        type: 'warning',
        plain: true,
      })
    }
  })
};

// QQ登录逻辑
const handleQQLogin = () => {
  console.log('QQ登录请求');
  ElMessage.success('正在进行QQ登录');
};

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
}
.right-section {
  width: 400px;
  align-items: center;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.05);
  background: #fff;
}
.logo {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  &:focus {
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
  }
}

/* 第三方登录按钮优化 */
.social-login {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
}
.social-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
}
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48%;
  height: 40px;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.2s;
}
.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.qq-btn {
  background-color: #12b7f5;
}
.wechat-btn {
  background-color: #52c41a;
}
.social-btn i {
  margin-right: 6px;
  font-size: 18px;
}

/* 登录按钮样式 */
.login-btn {
  height: 40px; /* 与输入框和第三方按钮高度一致 */
  border-radius: 8px; /* 与输入框圆角一致 */
  font-size: 14px; /* 与输入框文字大小协调 */
  width: 100%; /* 宽度占满父容器 */
  margin-top: 15px; /* 与上方元素间距 */
}
</style>