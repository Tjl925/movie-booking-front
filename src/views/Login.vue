<template>
  <div class="login-container">
      <Particles
          id="tsparticles"
          :particlesInit="particlesInit"
          :particlesLoaded="particlesLoaded"
          :options="options"
          class="particles-bg"
      />
    <!-- 表单区域 -->
    <div class="login-box">
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
        <div class="forgot-password">
          <el-link type="primary" @click="handleForgotPassword">忘记密码</el-link>
        </div>
        <!-- 优化后的QQ登录按钮（独占一行） -->
        <el-form-item class="social-login">
          <el-button
              type="primary"
              :icon="el-icon-qq"
              @click="handleQQLogin"
              class="social-btn qq-btn"
              style="background: transparent; border-color: rgba(0, 0, 0, 0.1)"
          >
            <img src="../assets/qq.png" class="social-icon" />
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
import {loadSlim} from "tsparticles-slim";
//粒子效果
const options = ref({

      background: {

        color: {

          value: 'grey'
        }
      },
      // backgroundColor:'#000000',
      fpsLimit: 120,
      interactivity: {
        // 交互性
        events: {
          // 事件
          onClick: {
            // 1.点击
            enable: true,
            mode: 'push' // "push", "remove", "repulse", "bubble"
          },
          onHover: {
            // 2.悬停
            enable: true,
            mode: 'grab'  // "grab"(磁吸), "repulse"(排斥), "bubble"(气泡)
          },
          resize: true //调整大小
        },
        modes: {

          // 气泡
          bubble: {

            distance: 400,
            duration: 2, //持续时间
            opacity: 0.8,
            size: 40
          },
          // 推
          push: {

            quantity: 4 //数量
          },
          // 排斥
          repulse: {

            distance: 200,
            duration: 0.4
          }
        }
      },
      // 粒子
      particles: {

        color: {

          value: '#e64340'
        },
        // 是否用直线连接起来
        links: {

          color: '#e64340',
          distance: 150,
          enable: true,
          opacity: 0.5,
          width: 1
        },
        // 碰撞
        collisions: {

          enable: true
        },
        // 移动
        move: {

          direction: 'none',
          enable: true,
          // 输出模式
          outModes: {

            default: 'bounce' //弹跳
          },
          random: false, //是否随机
          speed: 4, // 速度
          straight: false //是否直线
        },
        number: {

          // 密度 用value值除以区域值
          density: {

            enable: true,
            area: 1000
          },
          value: 80
        },
        opacity: {

          value: 0.5
        },
        // 形状
        shape: {

          type: 'circle'
        },
        size: {

          value: {
            min: 1, max: 5 },
        }
      },
      detectRetina: true
    }
)
const particlesInit = async engine => {

  //await loadFull(engine);
  await loadSlim(engine);
};

const particlesLoaded = async container => {

  console.log("Particles container loaded", container);
}

//数据加载
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

// 忘记密码逻辑
const handleForgotPassword = () => {
  router.push('/findPassword'); // 假设你的找回密码组件路由是'/forgot-password'
};
</script>

<style scoped>
/* 基础布局样式 */
.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.particles-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.login-box {
  width: 360px;
  background: rgba(255, 255, 255, 0.85); /* 半透明白色背景 */
  border-radius: 20px; /* 更大的圆角，边缘更柔滑 */
  padding: 30px;
  box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.1), /* 柔和阴影 */
      inset 0 1px 1px rgba(255, 255, 255, 0.5); /* 内发光增强立体感 */
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(8px); /* 毛玻璃效果 */
  border: 1px solid rgba(255, 255, 255, 0.2); /* 半透明边框 */
  transition: all 0.3s ease; /* 平滑过渡动画 */
}

/* 悬停时增强效果 */
.login-box:hover {
  box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 2px 2px rgba(255, 255, 255, 0.6);
  transform: translateY(-2px); /* 轻微上浮 */
}

.logo {
  width: 140px;
  height: 140px;
  margin-bottom: 30px;
  animation: pulse 2s infinite; /* 添加呼吸动画 */
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
  background: rgb(76,162,229); /* 渐变色背景 */
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
  margin-top: 0px; /* 增加上方间距 */
  background: rgb(127,214,245); /* 渐变色背景 */
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(255, 77, 79, 0.3);
}
/* 修改或添加以下样式 */
.social-btn.qq-btn {
  color: #000 !important; /* 强制黑色文字 */
  background: transparent !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.social-btn.qq-btn:hover {
  color: #000 !important; /* 保持黑色不变 */
  background: transparent !important; /* 保持透明背景 */
  transform: none; /* 移除悬停位移效果 */
  box-shadow: none; /* 移除阴影变化 */
}

.social-icon {
  background: transparent !important; /* 确保图标区域透明 */
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border-radius: 0; /* 移除图片圆角（如果需要） */
}
/* 新增动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>