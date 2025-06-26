<script setup>
import {ArrowDown} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router';
import {logout} from "@/api/user";
import {useUserInfoStore} from "@/stores/userInfo";
import {ElMessage} from "element-plus";

const router = useRouter();

// 登出跳转
const handleCommand = (command) => {
  if (command == 'log_out') {
    const userInfoStore = useUserInfoStore();
    const token = userInfoStore.userInfo.token;
    if (token){
      logout(token).then((res)=>{
        console.info(res);
        // 清除本地存储的用户数据
        userInfoStore.removeUserInfo();
        // 显示登出成功提示
        ElMessage.success('登出成功');
        // 跳转到首页
        router.push('/Home');
      })
    }
  }
}


</script>


<template>
  <div class="top-nav">
    <!-- 用于调试的文本 -->
    <!-- 头部容器：Logo + 菜单 + 搜索 + 头像 -->
    <div class="nav-container">
      <!-- Logo 区域 -->
      <div class="logo-box">
        <img src="@/assets/logo.png" alt="logo" class="logo-img"/>
        <span class="logo-text">猫眼电影</span>
      </div>

      <!-- 头像区域 -->
      <div class="avatar-box">
        <!-- 如需下拉菜单，可在这里扩展 -->
        <el-dropdown size="mini" @command="handleCommand">
          <!-- 触发区域：头像 + 下拉箭头 -->
          <span class="el-dropdown-trigger">
            <el-avatar icon="el-icon-user" class="avatar"></el-avatar>
            <el-icon class="dropdown-arrow">
              <ArrowDown/>
            </el-icon>
          </span>
          <!-- 下拉菜单 -->
          <template #dropdown>
            <el-dropdown-menu class="custom-dropdown-menu">
              <el-dropdown-item command="log_out">退出账号</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* 头部容器：居中布局 + 固定宽度 */
.top-nav {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.nav-container {
  width: 100%;
  height: 60px;
  margin: 0 auto; /* 居中容器 */
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-box {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.logo-img {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  color:red;
  font-size: 20px;
  font-weight: bold;
}

/* 菜单样式：强制不换行、不折叠 */
.no-ellipsis-menu {
  /* 覆盖 Element Plus 默认的省略号逻辑 */

  .el-menu--horizontal {
    flex-wrap: nowrap !important; /* 禁止菜单项换行 */
  }

  .el-menu__item {
    white-space: nowrap; /* 禁止文字换行 */
  }

  /* 隐藏自动生成的省略号按钮 */

  .el-menu__more {
    display: none !important;
  }
}


/* 头像容器：用于控制触发区域的布局 */
.avatar-box {
  position: relative; /* 为下拉菜单的绝对定位提供参考 */
  display: inline-block; /* 收缩为内容宽度，方便居中 */
  margin-right: 40px;
}

/* 触发区域样式：头像和箭头水平排列 */
.el-dropdown-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  border: none !important;
  color: red;
}

/* 头像样式 */
.avatar {
  width: 40px;
  height: 40px;
}

/* 下拉箭头样式 */
.dropdown-arrow {
  margin-left: 4px;
  font-size: 14px;
  color: #999;
}

/* 关键：下拉菜单居中 */
.custom-dropdown-menu {
  /* 相对于触发区域居中 */
  left: 50% !important;
  transform: translateX(-50%) !important;
  margin-top: 8px !important; /* 与头像保持间距 */
  /* 覆盖 Element Plus 默认的 left: 0 */
}
</style>