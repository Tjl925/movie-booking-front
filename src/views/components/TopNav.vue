<script setup>
import {ref} from 'vue';
import {ArrowDown} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router';
import {ElMessage} from "element-plus";
import {register} from "@/api/user";

const router = useRouter();
const activeMenu = ref('1');
const searchKeyword = ref('');
const dialogVisible = ref(false);
const showRegister = () => {
  dialogVisible.value = true
}
//注册
const registerDTO = ref({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: ""
})

//添加新用户
const add = () => {
  register(registerDTO.value).then(res => {
    if (res.status) {
      ElMessage({
        message: '注册成功啦！',
        type: 'success',
        plain: true,
      })
    } else {
      ElMessage({
        message: '注册失败！',
        type: 'warning',
        plain: true,
      })
    }
  })
}

// 登录注册跳转
const handleCommand = (command) => {
  if (command == 'login') {
    router.push('/Login');
  } else if (command == 'register') {
    showRegister();
    add();
  }
}
//处理搜索
const handleSearch = () => {
  console.log('搜索关键词：', searchKeyword.value);
  // 这里可扩展实际搜索逻辑
};


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

      <!-- 菜单区域：去掉自动折叠 -->
      <el-menu
          :default-active="activeMenu"
          mode="horizontal"
          background-color="transparent"
          text-color="#000"
          active-text-color="#ff4d4f"
          style="border: none;"
          :collapse="false"
          :ellipsis="false"
          class="no-ellipsis-menu"
      >
        <el-menu-item index="1">首页</el-menu-item>
        <el-menu-item index="2">电影</el-menu-item>
        <!-- 如需添加其他菜单项，直接在这里扩展 -->
      </el-menu>

      <!-- 搜索区域 -->
      <div class="search-box">
        <el-input
            v-model="searchKeyword"
            placeholder="搜索影片"
            clearable
            style="width: 200px;"
        >
          <template #append>
            <el-button size="small" :icon="Search" round>Search</el-button>
          </template>
        </el-input>
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
              <el-dropdown-item command="login">登录</el-dropdown-item>
              <el-dropdown-item command="register">注册</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
  <!--  注册框-->

  <el-dialog
      v-model="dialogVisible"
      title="新建成员"
      width="500"
      :before-close="handleClose"
  >
    <el-form :model="registerDTO" label-width="auto" style="max-width: 600px">
      <el-form-item label="用户名">
        <el-input v-model="registerDTO.username" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="registerDTO.password" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="再次确认">
        <el-input v-model="registerDTO.confirmPassword" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="registerDTO.email" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="电话号码">
        <el-input v-model="registerDTO.phone" autocomplete="off"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="add">
          提交
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>


<style scoped>
/* 头部容器：居中布局 + 固定宽度 */
.top-nav {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.nav-container {
  width: 1200px; /* 固定容器宽度，避免菜单项换行 */
  height: 60px;
  margin: 0 auto; /* 水平居中 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

/* Logo 样式 */
.logo-box {
  display: flex;
  align-items: center;
}

.logo-img {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo-text {
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

/* 搜索框样式 */
.search-box {
  display: flex;
  align-items: center;
}

/* 头像容器：用于控制触发区域的布局 */
.avatar-box {
  position: relative; /* 为下拉菜单的绝对定位提供参考 */
  display: inline-block; /* 收缩为内容宽度，方便居中 */
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